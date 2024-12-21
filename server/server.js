import express from 'express';
import * as http from "node:http";
import {Server as SocketIO} from "socket.io";
import Game from './game.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
    pingInterval: 1000,
    pingTimeout: 5000,
    cors: {
        origin: true,
    }
});
app.use(express.static('../client/build', { extensions: ['html'] }));

let game
let clients = {}
io.on('connection', async (socket) => {
    try {
        const id = socket.handshake.auth.id;
        socket.data.id = id;
        console.log(`connection from ${id}`);

        const setPlayerId = (id) => {
            if (['admin', 'reactor', 'oxygen'].includes(id)) return
            socket.data.id = id;
            socket.join(id);
            socket.emit('store-id', id);
            if (clients[id]?.joined) {
                socket.join('joined')
                socket.join('players')
                game?.syncPlayer(id)
                console.log(`player ${id} joined`)
            } else if (clients[id]?.name) {
                socket.join('lobby')
                socket.emit('sync-client', clients[id]);
                console.log(`player ${id} waiting`)
            } else {
                clients[id] = { id, name: false, joined: false };
                socket.emit('sync-client', clients[id]);
                console.log(`player ${id} setting name`)
                socket.once('set-name', (name) => {
                    clients[id].name = name;
                    io.in(id).socketsJoin('lobby');
                    io.to(id).emit('sync-client', clients[id]);
                    console.log(`player ${id} set name`)
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

        socket.emit('sync-game', game?.state || {section: 'lobby'});
        if (!id) {
            socket.emit('sync-client', { id: false, name: false, joined: false });
            socket.once('set-id', setPlayerId)
        } else if (id === 'admin') {
            socket.join('joined');
            socket.on('emergency-meeting', () => game?.triggerMeeting());
            socket.on('start-meeting', () => game?.startMeeting());
            socket.on('start-game', async (options) => {
                const waitingSockets = await io.in('lobby').fetchSockets()
                const waitingSocketIds = waitingSockets.map((socket) => socket.data.id);
                const players = [...new Set(waitingSocketIds)].map(id => {
                    clients[id].joined = true;
                    io.in(id).socketsJoin(['joined', 'players']);
                    io.in(id).socketsLeave('lobby');
                    return {id, name: clients[id].name}
                });

                game = new Game(io, options);
                game.start(players);
            });
            socket.on('end-game', () => {
                game?.endGame('forced game end');
                io.to('joined').emit('sync-game', {section: 'lobby'});
                if (game?.state?.players) game.state.players.forEach(({id}) => {
                    io.to(id).socketsLeave(['joined', 'players']);
                    io.to(id).socketsJoin('lobby');
                    clients[id].joined = false;
                    io.to(id).emit('sync-client', clients[id]);
                });
                game = null;
            })
        } else if (id === 'reactor') {
            socket.join('joined')
            socket.on('reactor-up', () => game?.reactorButtonUp())
            socket.on('reactor-down', () => game?.reactorButtonDown())
        } else if (id === 'oxygen') {
            socket.join('joined')
            socket.on('oxygen-push', () => game?.oxygenButton())
        } else {
            setPlayerId(id);
        }

        socket.on('disconnect', () => console.log(`${id} was disconnected`))
    } catch (e) {
        console.error(`error in socket ${socket.data.id}`, e);
        socket.disconnect();
    }
});

const port = process.env.PORT || 3000
server.listen(port, () => {
    console.log(`server running on port ${port}`);
})
