import express from 'express';
import * as http from "node:http";
import {Server as SocketIO} from "socket.io";
import Game from './game.js';
import {logHistory, log} from "./helpers.js";

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
    pingInterval: 1000,
    pingTimeout: 5000,
    cors: {
        origin: true,
    }
});

let game
const clients = {}

const setPlayerId = async (socket, id) => {
    if (['admin', 'reactor', 'oxygen', 'medical'].includes(id)) return
    socket.data.id = id;
    socket.join(id);
    socket.emit('store-id', id);

    if (clients[id]?.joined) {
        socket.join('joined')
        socket.join('players')
        game?.syncPlayer(id)
        log(`player ${id} joined`)
    } else if (clients[id]?.name) {
        socket.join('lobby')
        socket.emit('sync-client', clients[id]);
        await syncReadyPlayers()
        log(`player ${id} waiting`)
    } else {
        clients[id] = { id, name: false, joined: false };
        socket.emit('sync-client', clients[id]);
        log(`player ${id} setting name`)
        socket.once('set-name', async (name) => {
            clients[id].name = name;
            io.in(id).socketsJoin('lobby');
            io.to(id).emit('sync-client', clients[id]);
            log(`player ${id} set name ${name}`)
            await syncReadyPlayers()
        })
    }

    socket.on('vote', (voteId) => game?.vote(id, voteId))
    socket.on('die', () => game?.killPlayer(id))
    socket.on('start-sabotage', (sabotageId) => game?.startSabotage(sabotageId))
    socket.on('complete-task', (task) => game?.completeTask(id, task.id, task.password))
    socket.on('report-body', () => {
        game?.endSabotage()
        game?.triggerMeeting()
    })
}

const getReadyPlayers = async () => {
    const waitingSockets = await io.in('lobby').fetchSockets()
    const waitingSocketIds = waitingSockets.map((socket) => socket.data.id);
    return [...new Set(waitingSocketIds)].map(id => {
        return {id, name: clients[id].name, debug: id.includes('debug')};
    });
}

const syncReadyPlayers = async () => {
    const players = await getReadyPlayers();
    io.to('admin').emit('player-list', players);
    log('updated player list', players);
}

const ensureNeededConnections = async () => {
    const admins = await io.in('admin').fetchSockets()
    const reactors = await io.in('reactor').fetchSockets()
    const oxygens = await io.in('oxygen').fetchSockets()
    const medicals = await io.in('medical').fetchSockets()

    const errors = []
    if (admins.length !== 1) errors.push(`${admins.length} admin(s) connected`)
    if (medicals.length !== 1) errors.push(`${medicals.length} medical(s) connected`)
    if (reactors.length !== 2) errors.push(`${reactors.length} reactor(s) connected`)
    if (oxygens.length !== 2) errors.push(`${oxygens.length} oxygen(s) connected`)

    game?.setBadConnections(errors)
}

const handleAdminJoin = async (socket) => {
    socket.join(['joined', 'admin']);
    socket.on('emergency-meeting', () => game?.triggerMeeting());
    socket.on('start-meeting', () => game?.startMeeting());
    socket.on('start-game', async (options) => {
        if (game) return
        const players = await getReadyPlayers();
        players.forEach(player => {
            clients[player.id].joined = true;
            io.in(player.id).socketsJoin(['joined', 'players']);
            io.in(player.id).socketsLeave('lobby');
        })
        await syncReadyPlayers()

        game = new Game(io, options);
        game.start(players);
        await ensureNeededConnections()
    });
    socket.on('end-game', async () => {
        game?.endGame('forced game end');
        io.to('joined').emit('sync-game', {section: 'lobby'});
        if (game?.state?.players) game.state.players.forEach(({id}) => {
            io.to(id).socketsLeave(['joined', 'players']);
            io.to(id).socketsJoin('lobby');
            clients[id].joined = false;
            io.to(id).emit('sync-client', clients[id]);
        });
        await syncReadyPlayers()

        game = null;
    })

    await syncReadyPlayers()
}

io.on('connection', async (socket) => {
    try {
        const id = socket.handshake.auth.id;
        socket.data.id = id;
        log(`connection from ${id}`);

        socket.on('disconnect', async () => {
            log(`${id} was disconnected`)
            await syncReadyPlayers()
            await ensureNeededConnections()
        })

        socket.emit('sync-game', game?.state || {section: 'lobby'});
        if (id === 'admin') handleAdminJoin(socket);
        else if (id === 'reactor') {
            socket.join(['joined', 'reactor']);
            socket.on('reactor-up', () => game?.reactorButtonUp())
            socket.on('reactor-down', () => game?.reactorButtonDown())
        } else if (id === 'oxygen') {
            socket.join(['joined', 'oxygen']);
            socket.on('oxygen-push', () => game?.oxygenButton())
        } else if (id === 'medical') {
            socket.join(['joined', 'medical']);
        } else {
            if (!id || !clients[id]) {
                if (id && !clients[id]) log(`unknown id ${id}, resetting`);
                socket.emit('sync-client', { id: false, name: false, joined: false });
                socket.once('set-id', (newId) => setPlayerId(socket, newId));
            } else {
                await setPlayerId(socket, id);
            }
        }

        await ensureNeededConnections()
    } catch (e) {
        console.error(`error in socket ${socket.data.id}`, e);
        socket.disconnect();
    }
});

app.get('/', async (req, res) => {
    const clientsStr = Object.values(clients).map(client => {
        return `ID: ${client.id} NAME: ${client.name} ${client.joined ? 'joined' : 'waiting'} ${client.debug ? 'debug' : ''}`
    }).join('<br>');

    const socketsStr = (await io.fetchSockets()).map(socket => {
        return `ID: ${socket.data.id} ROOMS: ${[...socket.rooms].join(', ')}`
    }).join('<br>');

    const gameStr = game ? `game ${game.state.section} with ${Object.keys(game.players).length} players` : 'no game';

    const logStr = logHistory.join('<br>');

    const result = `<h3>clients:</h3><br>
    ${clientsStr}<br>
    <h3>sockets:</h3><br>
    ${socketsStr}<br>
    <h3>game:</h3><br>
    ${gameStr}<br>
    <h3>logs:</h3><br>
    ${logStr}<br>`;

    res.send(result);
})

const port = process.env.PORT || 3000
server.listen(port, () => {
    log(`server running on port ${port}`);
})
