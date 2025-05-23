import tasks from './tasks.js';
import {randSelection, log} from "./helpers.js";

const playerSeenTasks = {};

export default class Game {
    constructor(io, options) {
        this.state = {
            section: 'lobby',
            players: [],
            votes: {},
            meetingEnd: null,
            tasks: {done: 0, total: 0},
            sabotage: false,
            sabotageCooldownEnd: 0,
            badConnections: [],
        };
        this.players = {};
        this.meetingTimeout = null;
        this.sabotageTimeout = null;
        this.sabotagePushed = 0;
        this.io = io;
        this.options = options;
    }

    syncGame() {
        this.io.to('joined').emit('sync-game', this.state);
    }

    syncPlayer(id) {
        this.io.to(id).emit('sync-client', this.players[id]);
    }

    start(players) {
        if (this.state.section !== 'lobby') return;

        this.state.section = 'game';
        log('starting new game');

        const {chosen: impostors, others: crewmates} = randSelection(players, this.options.impostorCount);
        log('impostors:', impostors.map(x => x.id));
        log('crewmates:', crewmates.map(x => x.id));

        crewmates.forEach(({id, name, debug}) => {
            this.players[id] = {id, name, debug, role: 'crewmate'}
        });
        impostors.forEach(({id, name, debug}) => {
            this.players[id] = {id, name, debug, role: 'impostor', impostors};
        });
        players.forEach(({id}) => {
            if (!playerSeenTasks[id]) playerSeenTasks[id] = new Set();

            const remainingTasks = tasks.map(({id, description}) => {
                return {id, description, completed: false}
            });
            const unseenTasks = remainingTasks.filter((task) => !playerSeenTasks[id].has(task.id));
            const playerTasks = [];
            for (let i = 0; i < this.options.taskCount; i++) {
                let task
                if (unseenTasks.length > 0) {
                    const index = Math.floor(Math.random() * unseenTasks.length);
                    task = unseenTasks.splice(index, 1)[0];
                    const remainingTaskIndex = remainingTasks.findIndex(({id}) => id === task.id);
                    remainingTasks.splice(remainingTaskIndex, 1);
                } else {
                    const index = Math.floor(Math.random() * remainingTasks.length);
                    task = remainingTasks.splice(index, 1)[0];
                    if (!task) break
                }

                playerTasks.push(task);
                playerSeenTasks[id].add(task.id);
            }
            if (playerSeenTasks[id].size >= tasks.length) playerSeenTasks[id].clear()
            this.players[id].tasks = playerTasks;
            this.state.tasks.total += playerTasks.length;
            this.syncPlayer(id);
        });
        this.state.players = players.map(({id, name}) => ({id, name}));
        this.syncGame();
        log(`generated ${this.state.tasks.total} tasks`)
    }

    endGame(winners) {
        if (this.sabotageTimeout) clearTimeout(this.sabotageTimeout);
        if (this.meetingTimeout) clearTimeout(this.meetingTimeout);
        this.endSabotage();
        this.state.section = 'end';
        this.state.winners = winners;
        this.state.players = Object.values(this.players);
        this.syncGame();
        log(`game ended, ${winners} won`);
    }

    killPlayer(id) {
        if (!this.players[id] || this.players[id].dead) return;

        this.players[id].dead = true;
        this.state.players.find((player) => player.id === id).dead = true;
        log(`player ${id} killed`)

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
            this.syncGame();
        }
    }

    triggerMeeting() {
        if (this.state.section !== 'game') return;

        this.state.section = 'meeting-wait';
        this.state.votes = {};
        this.state.players.forEach(({id}) => {
            this.players[id].voteId = null
            this.syncPlayer(id);
        });
        this.syncGame();
        log('meeting triggered')
    }

    startMeeting() {
        if (this.state.section !== 'meeting-wait') return;

        this.state.section = 'meeting';
        this.state.meetingEnd = Date.now() + this.options.meetingLength * 1000;
        this.meetingTimeout = setTimeout(() => this.endMeeting(), this.options.meetingLength * 1000);
        this.syncGame();
        log('meeting started')
    }

    vote(playerId, voteId) {
        if (this.state.section !== 'meeting') return;
        if (!this.players[playerId] || this.players[playerId].dead) return;

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
        log(`player ${playerId} voted ${voteId}`);
    }

    endMeeting() {
        if (this.state.section !== 'meeting') return;

        if (this.meetingTimeout) clearTimeout(this.meetingTimeout);
        this.meetingTimeout = null;

        const votes = Object.entries(this.state.votes);
        const maxVotes = Math.max(...votes.map(([_, votes]) => votes.length));
        const mostVoted = votes.filter(([_, votes]) => votes.length === maxVotes);

        let ejectedId = mostVoted.length === 1 ? mostVoted[0][0] : null;
        log(`${ejectedId} was chosen to be ejected`);
        if (ejectedId && ejectedId !== 'skip') this.killPlayer(ejectedId);

        if (this.state.section !== 'end') this.state.section = 'game';
        this.io.to('players').emit('meeting-end', this.players[ejectedId]?.name);
        this.syncGame();
    }

    completeTask(playerId, taskId, password) {
        if (this.state.section !== 'game') return;
        if (!this.players[playerId]) return;

        const task = tasks.find((task) => task?.id === taskId);
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
                this.syncGame();
            }
            log(`player ${playerId} completed task ${taskId}`);
        }
    }

    startSabotage(sabotageId) {
        if (this.state.section !== 'game') return;
        if (this.state.sabotage || this.state.sabotageCooldownEnd > Date.now()) return;

        const sabotageLength = this.options.sabotageLengths[sabotageId] * 1000;
        if (!sabotageLength) return;
        this.state.sabotage = {id: sabotageId, end: Date.now() + sabotageLength};
        this.state.sabotageCooldownEnd = Date.now() + this.options.sabotageCooldown * 1000;
        this.sabotagePushed = 0;
        log(`sabotage ${sabotageId} started`);

        this.sabotageTimeout = setTimeout(() => {
            this.endSabotage();
            if (sabotageId === 'oxygen' || sabotageId === 'reactor') this.endGame('impostors');
        }, sabotageLength);
        this.syncGame();
    }

    endSabotage() {
        if (!this.state.sabotage) return;
        if (this.sabotageTimeout) clearTimeout(this.sabotageTimeout);
        this.sabotageTimeout = null;

        this.state.sabotage = false;
        this.syncGame();
        log('sabotage ended');
    }

    reactorButtonDown() {
        if (this.state.sabotage?.id !== 'reactor') return
        this.sabotagePushed += 1;
        if (this.sabotagePushed >= 2) this.endSabotage();
    }

    reactorButtonUp() {
        if (this.state.sabotage?.id !== 'reactor') return
        if (this.sabotagePushed <= 0) return;
        this.sabotagePushed -= 1;
    }

    oxygenButton() {
        if (this.state.sabotage?.id !== 'oxygen') return
        this.sabotagePushed += 1;
        if (this.sabotagePushed >= 2) this.endSabotage();
    }

    setBadConnections(badConnections) {
        this.state.badConnections = badConnections;
        this.syncGame();
    }
}
