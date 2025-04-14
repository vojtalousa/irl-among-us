import express from 'express';
import * as http from "node:http";
import {Server as SocketIO} from "socket.io";
import {instrument} from "@socket.io/admin-ui";
import Session from "./session.js";

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
    pingInterval: 1000,
    pingTimeout: 5000,
    cors: {
        origin: true,
    }
});
instrument(io, { auth: false })
app.use(express.json())
app.use(express.static('../client/build', { extensions: ['html'] }));

const lobbies = new Map()

app.post('/validate', (req, res) => {
    const lobbyId = req.body.id;
    if (lobbies.has(lobbyId)) res.status(201).end()
    else res.status(404).end()
})

app.post('/create', (req, res) => {
    const lobbyId = req.body.id
    if (lobbies.has(lobbyId)) return res.status(403).send('Lobby already exists.')

    const namespace = io.of(`/${lobbyId}`)
    const lobby = new Session(namespace)
    lobbies.set(lobbyId, lobby)

    namespace.on('connection', (socket) => {
        try {
            const id = socket.handshake.auth.id;
            socket.data.id = id;
            console.log(`connection from ${id}`);

            socket.emit('sync-game', lobby.game?.state || {section: 'lobby'});
            if (!id) {
                socket.emit('sync-client', {id: false, name: false, joined: false});
                socket.once('set-id', (id) => lobby.joinPlayer(socket, id))
            } else if (id === 'admin') {
                lobby.joinAdmin(socket)
            } else if (id === 'reactor') {
                lobby.joinReactor(socket)
            } else if (id === 'oxygen') {
                lobby.joinOxygen(socket)
            } else {
                lobby.joinPlayer(socket, id)
            }

            socket.on('disconnect', () => {
                const connected = namespace.sockets.size
                console.log(`${id} was disconnected, ${connected} remaining`)
                if (connected === 0) {
                    console.log('closing down')
                    namespace.removeAllListeners()
                    lobbies.delete(lobbyId)
                }
            })
        } catch (e) {
            console.error(`error in socket ${socket.data.id}`, e);
            socket.disconnect();
        }
    });

    res.status(201).end()
})

const port = process.env.PORT || 3000
server.listen(port, () => {
    console.log(`server running on port ${port}`);
})
