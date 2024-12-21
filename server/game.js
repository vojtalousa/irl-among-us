import tasks from './tasks.js';
import {randSelection} from "./helpers.js";

export default class Game {
    constructor(io, options) {
        this.state = {
            section: 'lobby',
            players: [],
            votes: {},
            meetingEnd: null,
            tasks: {done: 0, total: null},
            sabotage: false,
            sabotageCooldownEnd: 0,
        };
        this.players = {};
        this.meetingTimeout = null;
        this.sabotageTimeout = null;
        this.sabotagePushed = 0;
        this.io = io;
        this.options = options;
    }

    syncPlayer(id) {
        this.io.to(id).emit('sync-client', this.players[id]);
    }

    start(players) {
        this.state.section = 'game';
        console.log('starting new game');

        const {chosen: impostors, others: crewmates} = randSelection(players, this.options.impostorCount);
        console.log('impostors:', impostors.map(x => x.id));
        console.log('crewmates:', crewmates.map(x => x.id));

        crewmates.forEach(({id, name}) => {
            this.players[id] = {id, name, role: 'crewmate'}
        });
        impostors.forEach(({id, name}) => {
            this.players[id] = {id, name, role: 'impostor', impostors};
        });
        players.forEach(({id}) => {
            const remainingTasks = tasks.map(({description}, index) => {
                return {id: index, description, completed: false}
            });
            const playerTasks = [];
            for (let i = 0; i < this.options.taskCount; i++) {
                const index = Math.floor(Math.random() * remainingTasks.length);
                const task = remainingTasks.splice(index, 1)[0];
                if (!task) break
                playerTasks.push(task);
            }
            this.players[id].tasks = playerTasks;
            this.syncPlayer(id);
        });
        this.state.players = players.map(({id, name}) => ({id, name}));
        this.state.tasks.total = this.options.taskCount * crewmates.length;
        console.log(`generated ${this.state.tasks.total} tasks`)

        this.io.to('joined').emit('sync-game', this.state);
    }

    endGame(winners) {
        if (this.sabotageTimeout) clearTimeout(this.sabotageTimeout);
        if (this.meetingTimeout) clearTimeout(this.meetingTimeout);
        this.state.section = 'end';
        this.state.winners = winners;
        this.io.to('joined').emit('sync-game', this.state);
        console.log(`game ended, ${winners} won`);
    }

    killPlayer(id) {
        this.players[id].dead = true;
        this.state.players.find((player) => player.id === id).dead = true;
        console.log(`player ${id} killed`)

        const impostors = [];
        const crewmates = [];
        for (const [id, {role, dead}] of Object.entries(this.players)) {
            if (dead) continue;
            if (role === 'impostor') impostors.push(id);
            else crewmates.push(id);
        }
        if (impostors.length === 0) this.endGame('crewmates');
        else if (impostors.length >= crewmates.length) this.endGame('impostors');
        else {
            this.syncPlayer(id);
            this.io.to('joined').emit('sync-game', this.state);
        }
    }

    triggerMeeting() {
        this.state.section = 'meeting-wait';
        this.state.votes = {};
        this.state.players.forEach(({id}) => {
            this.players[id].voteId = null
            this.syncPlayer(id);
        });
        this.io.to('joined').emit('sync-game', this.state);
        console.log('meeting triggered')
    }

    startMeeting() {
        this.state.section = 'meeting';
        this.state.meetingEnd = Date.now() + this.options.meetingLength * 1000;
        this.meetingTimeout = setTimeout(() => this.endMeeting(), this.options.meetingLength * 1000);
        this.io.to('joined').emit('sync-game', this.state);
        console.log('meeting started')
    }

    vote(playerId, voteId) {
        const previousVote = this.players[playerId].voteId;
        this.players[playerId].voteId = voteId;
        if (previousVote) {
            const previousVoteIndex = this.state.votes[previousVote].indexOf(playerId);
            this.state.votes[previousVote]?.splice(previousVoteIndex, 1);
        }
        if (voteId) {
            if (!this.state.votes[voteId]) this.state.votes[voteId] = [];
            this.state.votes[voteId].push(playerId);

            const voted = ({id}) => this.players[id].voteId || this.players[id].dead;
            if (this.state.players.every(voted)) {
                clearTimeout(this.meetingTimeout);
                this.endMeeting()
            }
        }

        this.syncPlayer(playerId);
        console.log(`player ${playerId} voted ${voteId}`);
    }

    endMeeting() {
        const votes = Object.entries(this.state.votes);
        const maxVotes = Math.max(...votes.map(([_, votes]) => votes.length));
        const mostVoted = votes.filter(([_, votes]) => votes.length === maxVotes);

        let ejectedId = mostVoted.length === 1 ? mostVoted[0][0] : null;
        console.log(`${ejectedId} was chosen to be ejected`);
        if (ejectedId && ejectedId !== 'skip') this.killPlayer(ejectedId);

        if (this.state.section !== 'end') this.state.section = 'game';
        this.io.to('players').emit('meeting-end', this.players[ejectedId]?.name);
        this.io.to('joined').emit('sync-game', this.state);
    }

    completeTask(playerId, taskId, password) {
        const task = tasks[taskId];
        const playerTask = this.players[playerId].tasks.find((task) => task?.id === taskId);
        if (!task || !playerTask || playerTask.completed) return;
        if (task.password !== password) {
            this.io.to(playerId).emit('wrong-password');
        } else {
            playerTask.completed = true;
            if (this.players[playerId].role === 'crewmate') this.state.tasks.done += 1;
            if (this.state.tasks.done >= this.state.tasks.total) this.endGame('crewmates');
            else {
                this.syncPlayer(playerId);
                this.io.to('joined').emit('sync-game', this.state);
            }
            console.log(`player ${playerId} completed task ${taskId}`);
        }
    }

    startSabotage(sabotageId) {
        if (this.state.sabotage || this.state.sabotageCooldownEnd > Date.now()) return;
        const sabotageLength = this.options.sabotageLengths[sabotageId] * 1000;
        if (!sabotageLength) return;
        this.state.sabotage = {id: sabotageId, end: Date.now() + sabotageLength};
        this.state.sabotageCooldownEnd = Date.now() + this.options.sabotageCooldown * 1000;
        this.sabotagePushed = 0;
        console.log(`sabotage ${sabotageId} started`);
        this.sabotageTimeout = setTimeout(() => {
            this.endSabotage();
            if (sabotageId === 'oxygen' || sabotageId === 'reactor') this.endGame('impostors');
        }, sabotageLength);
        this.io.to('joined').emit('sync-game', this.state);
    }

    endSabotage() {
        this.state.sabotage = false;
        if (this.sabotageTimeout) clearTimeout(this.sabotageTimeout);
        this.io.to('joined').emit('sync-game', this.state);
        console.log('sabotage ended');
    }

    reactorButtonDown() {
        if (this.state.sabotage.id !== 'reactor') return
        this.sabotagePushed += 1;
        if (this.sabotagePushed >= 2) this.endSabotage();
    }

    reactorButtonUp() {
        if (this.state.sabotage.id !== 'reactor') return
        if (this.sabotagePushed <= 0) return;
        this.sabotagePushed -= 1;
    }

    oxygenButton() {
        if (this.state.sabotage.id !== 'oxygen') return
        this.sabotagePushed += 1;
        if (this.sabotagePushed >= 2) this.endSabotage();
    }
}
