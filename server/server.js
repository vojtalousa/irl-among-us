import express from 'express';
import * as http from "node:http";
import {Server as SocketIO} from "socket.io";
import {v4 as uuid} from 'uuid';
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
        console.log('connection from', socket.handshake.auth.id);
        let id = socket.handshake.auth.id;
        if (!id) {
            console.log('new connection, assigning id');
            id = await socket.timeout(5000).emitWithAck('id', uuid());
        }

        socket.data.id = id;

        socket.emit('sync-game', game?.state || {section: 'lobby'});
        if (id === 'admin') {
            socket.join('joined');
            socket.on('emergency-meeting', () => game?.triggerMeeting());
            socket.on('start-meeting', () => game?.startMeeting());
            socket.on('start-game', async () => {
                const waitingSockets = await io.in('lobby').fetchSockets()
                const waitingSocketIds = waitingSockets.map((socket) => socket.data.id);
                const players = [...new Set(waitingSocketIds)].map(id => {
                    clients[id].joined = true;
                    io.in(id).socketsJoin(['joined', 'players']);
                    io.in(id).socketsLeave('lobby');
                    return {id, name: clients[id].name}
                });

                game = new Game(io);
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
            socket.join(id);
            console.log('client connection', id, clients[id]);
            if (clients[id]?.name) {
                if (clients[id].joined) {
                    socket.join('joined')
                    socket.join('players')
                    game?.syncPlayer(id)
                } else {
                    socket.join('lobby')
                    io.to(id).emit('sync-client', clients[id]);
                }
            } else {
                clients[id] = {name: false, joined: false};
                socket.emit('sync-client', clients[id]);
                socket.on('set-name', (name) => {
                    clients[id].name = name;
                    io.in(id).socketsJoin('lobby');
                    io.to(id).emit('sync-client', clients[id]);
                });
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
    } catch (e) {
        console.error('Error', e);
        socket.disconnect();
    }
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
})