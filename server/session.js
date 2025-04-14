import Game from "./game.js";

export default class Session {
    constructor(io) {
        this.io = io;
        this.clients = {};
        this.game = null;
    }

    joinPlayer(socket, id) {
        socket.data.id = id;
        socket.join(id);
        socket.emit('store-id', id);
        if (this.clients[id]?.joined) {
            socket.join('game')
            this.game?.syncPlayer(id)
            console.log(`player ${id} joined`)
        } else if (this.clients[id]?.name) {
            socket.join('waiting')
            socket.emit('sync-client', this.clients[id]);
            console.log(`player ${id} waiting`)
        } else {
            this.clients[id] = {id, name: false, joined: false};
            socket.emit('sync-client', this.clients[id]);
            console.log(`player ${id} setting name`)
            socket.once('set-name', (name) => {
                this.clients[id].name = name;
                this.io.in(id).socketsJoin('waiting');
                this.io.to(id).emit('sync-client', this.clients[id]);
                console.log(`player ${id} set name`)
            })
        }

        socket.on('vote', (voteId) => this.game?.vote(id, voteId))
        socket.on('die', () => this.game?.killPlayer(id))
        socket.on('start-sabotage', (sabotageId) => this.game?.startSabotage(sabotageId))
        socket.on('complete-task', (task) => this.game?.completeTask(id, task.id, task.password))
        socket.on('report-body', () => {
            this.game?.endSabotage()
            this.game?.triggerMeeting()
        })
    }

    joinAdmin(socket) {
        socket.join('game');
        socket.on('emergency-meeting', () => this.game?.triggerMeeting());
        socket.on('start-meeting', () => this.game?.startMeeting());
        socket.on('start-game', async (options) => {
            const waitingSockets = await this.io.in('waiting').fetchSockets()
            const waitingSocketIds = waitingSockets.map((socket) => socket.data.id);
            const players = [...new Set(waitingSocketIds)].map(id => {
                this.clients[id].joined = true;
                this.io.in(id).socketsJoin('game');
                this.io.in(id).socketsLeave('waiting');
                return {id, name: this.clients[id].name}
            });

            this.game = new Game(this.io, options);
            this.game.start(players);
        });
        socket.on('end-game', () => {
            if (!this.game) return

            this.game.endGame('forced game end');
            this.io.to('game').emit('sync-game', {section: 'lobby'});
            this.game.state.players.forEach(({id}) => {
                this.io.to(id).socketsLeave('game');
                this.io.to(id).socketsJoin('waiting');
                this.clients[id].joined = false;
                this.io.to(id).emit('sync-client', this.clients[id]);
            });
            this.game = null;
        })
    }

    joinReactor(socket) {
        socket.join('game')
        socket.on('reactor-up', () => this.game?.reactorButtonUp())
        socket.on('reactor-down', () => this.game?.reactorButtonDown())
    }

    joinOxygen(socket) {
        socket.join('game')
        socket.on('oxygen-push', () => this.game?.oxygenButton())
    }
}