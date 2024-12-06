// import express from 'express';
// import * as http from "node:http";
// import { Server as SocketIO } from "socket.io";
// import { v4 as uuid } from 'uuid';
// import { tasks, taskCount, impostorCount, meetingLength, sabotageLength } from './options.js';
//
// const app = express();
// const server = http.createServer(app);
// const io = new SocketIO(server, {
//     pingInterval: 1000,
//     pingTimeout: 5000,
//     cors: {
//         origin: 'http://localhost:5173',
//     }
// });
// app.use(express.static('../client/build'))
//
// const state = {
//     section: 'lobby',
//     players: [],
//     votes: {},
//     meetingEnd: null,
//     tasks: { done: 0, total: null },
//     sabotage: false
// };
// const clients = {}
// let sabotageTimeout;
// let sabotagePushed = 0;
//
// const kill = (id) => {
//     clients[id].dead = true;
//     state.players.find((player) => player.id === id).dead = true;
//
//     const impostors = state.players.filter(({ id }) => clients[id].role === 'impostor');
//     const crewmates = state.players.filter(({ id }) => clients[id].role === 'crewmate');
//     console.log('Impostors', impostors);
//     console.log('Crewmates', crewmates);
//     if (impostors.every(impostor => impostor.dead)) {
//         state.section = 'end';
//         state.winners = 'crewmates';
//     } else if (impostors.length >= crewmates.length) {
//         state.section = 'end';
//         state.winners = 'impostors';
//     }
//
//     io.to(id).emit('sync-client', clients[id]);
//     io.to('game').to('admins').to('reactor').to('oxygen').emit('sync-game', state);
// }
// const triggerMeeting = () => {
//     state.section = 'meeting-wait';
//     state.votes = {};
//     state.players.forEach(({ id }) => {
//         clients[id].vote = null
//         io.to(id).emit('sync-client', clients[id]);
//     });
//     io.to('game').to('admins').emit('sync-game', state);
// }
// let meetingTimeout;
// const endMeeting = () => {
//     const votes = Object.entries(state.votes);
//     const maxVotes = Math.max(...votes.map(([id, votes]) => votes.length));
//     const mostVoted = votes.filter(([id, votes]) => votes.length === maxVotes);
//
//     let ejected = mostVoted.length === 1 ? mostVoted[0][0] : null;
//     console.log('Ejected', ejected);
//     if (ejected) kill(ejected);
//
//     if (state.section !== 'end') state.section = 'game';
//     io.to('game').emit('meeting-end', clients[ejected]?.name);
//     io.to('game').to('admins').emit('sync-game', state);
// }
// const endSabotage = () => {
//     state.sabotage = false;
//     if (sabotageTimeout) clearTimeout(sabotageTimeout);
//     io.to('game').to('admins').to('reactor').to('oxygen').emit('sync-game', state);
// }
//
// const getId = async (socket) => {
//     const id = socket.handshake.auth.id;
//     if (id) return id;
//     console.log('new connection');
//     return await socket.timeout(5000).emitWithAck('id', uuid());
// }
// const handleAdmin = (socket) => {
//     socket.join('admins');
//     socket.emit('sync-game', state);
//     socket.on('start', async () => {
//         state.section = 'game';
//         console.log('Starting game');
//         const allSockets = await io.in('lobby').fetchSockets()
//         const allSocketIds = allSockets.map((socket) => socket.data.id);
//         const players = [...new Set(allSocketIds)].map(id => {
//             return { id, name: clients[id].name }
//         });
//         const crewmates = [...players];
//         console.log(crewmates.length, 'players');
//         console.log(crewmates);
//
//         const impostors = [];
//         for (let i = 0; i < impostorCount; i++) {
//             const index = Math.floor(Math.random() * crewmates.length);
//             const impostor = crewmates.splice(index, 1)[0];
//             if (!impostor) break;
//             impostors.push(impostor);
//         }
//
//         console.log('Impostors', impostors);
//         console.log('Crewmates', crewmates);
//         crewmates.forEach(({id}) => {
//             clients[id].role = 'crewmate';
//         });
//         impostors.forEach(({id}) => {
//             clients[id].role = 'impostor';
//             clients[id].impostors = impostors;
//         });
//         players.forEach(({id}) => {
//             clients[id].playing = true;
//             const remainingTasks = tasks.map(({ description }, index) => ({ id: index, description, completed: false }));
//             const playerTasks = [];
//             for (let i = 0; i < taskCount; i++) {
//                 const index = Math.floor(Math.random() * remainingTasks.length);
//                 const task = remainingTasks.splice(index, 1)[0];
//                 if (!task) break
//                 playerTasks.push(task);
//             }
//             clients[id].tasks = playerTasks;
//             io.to(id).emit('sync-client', clients[id]);
//         });
//         state.players = players;
//         state.tasks.total = taskCount * crewmates.length;
//
//         io.in('lobby').socketsJoin('game');
//         io.socketsLeave('lobby');
//         io.to('game').to('admins').emit('sync-game', state);
//     })
//
//     socket.on('emergency-meeting', triggerMeeting);
//     socket.on('start-meeting', () => {
//         state.section = 'meeting';
//         state.meetingEnd = Date.now() + meetingLength * 1000;
//         meetingTimeout = setTimeout(endMeeting, meetingLength * 1000);
//         io.to('game').to('admins').emit('sync-game', state);
//     })
// }
//
// const handleReactor = (socket) => {
//     socket.join('reactor');
//     socket.emit('sync-game', state);
//     socket.on('reactor-down', () => {
//         if (state.section !== 'game' || state.sabotage.id !== 'reactor') return;
//         sabotagePushed += 1;
//         if (sabotagePushed >= 2) endSabotage()
//     })
//     socket.on('reactor-up', () => {
//         if (state.section !== 'game' || state.sabotage.id !== 'reactor') return;
//         sabotagePushed -= 1;
//     })
// }
//
// const handleOxygen = (socket) => {
//     socket.join('oxygen');
//     socket.emit('sync-game', state);
//     socket.on('oxygen-push', () => {
//         if (state.section !== 'game' || state.sabotage.id !== 'oxygen') return;
//         sabotagePushed += 1;
//         if (sabotagePushed >= 2) endSabotage()
//     })
// }
//
// io.on('connection', async (socket) => {
//     try {
//         const id = await getId(socket);
//         console.log(id, 'connected');
//         socket.on('disconnect', () => {
//             console.log(id, 'disconnected');
//         });
//         if (id === 'admin') handleAdmin(socket);
//         else if (id === 'reactor') handleReactor(socket);
//         else if (id === 'oxygen') handleOxygen(socket);
//         else {
//             socket.data.id = id;
//             socket.join(id)
//             if (clients[id]) {
//                 console.log('synced', id, clients[id]);
//                 if (clients[id].name) clients[id].playing ? socket.join('game') : socket.join('lobby');
//                 socket.emit('sync-client', clients[id]);
//                 socket.emit('sync-game', state);
//             } else {
//                 console.log('no name', id);
//                 clients[id] = { playing: false, name: false };
//                 socket.emit('sync-client', clients[id]);
//                 socket.emit('sync-game', state);
//             }
//
//             socket.on('set-name', (name) => {
//                 if (clients[id].name || !name) return;
//                 console.log('waiting', id);
//                 clients[id].name = name;
//                 socket.join('lobby');
//                 socket.emit('sync-client', clients[id]);
//             })
//             socket.on('vote', async (voteId) => {
//                 if (state.section !== 'meeting' || clients[id].dead) return;
//                 console.log(id, 'voted for', voteId);
//                 const previousVote = clients[id].vote;
//                 clients[id].vote = voteId;
//                 if (previousVote) state.votes[previousVote]?.splice(state.votes[previousVote].indexOf(id), 1);
//                 if (voteId) {
//                     if (!state.votes[voteId]) state.votes[voteId] = [];
//                     state.votes[voteId].push(id);
//
//                     const voted = ({ id }) => clients[id].vote || clients[id].dead;
//                     if (state.players.every(voted)) {
//                         clearTimeout(meetingTimeout);
//                         endMeeting()
//                     }
//                 }
//
//                 io.to(id).emit('sync-client', clients[id]);
//             })
//             socket.on('complete-task', async ({ password, id: taskId }) => {
//                 if (state.section !== 'game') return;
//                 const task = tasks[taskId];
//                 if (!task || task.password !== password) {
//                     io.to(id).emit('wrong-password');
//                 } else {
//                     clients[id].tasks.find((task) => task.id === taskId).completed = true;
//                     if (clients[id].role === 'crewmate') state.tasks.done += 1;
//                     if (state.tasks.done >= state.tasks.total) {
//                         state.section = 'end';
//                         state.winners = 'crewmates';
//                     }
//                     io.to(id).emit('sync-client', clients[id]);
//                     io.to('game').to('admins').emit('sync-game', state);
//                 }
//             })
//             socket.on('die', () => {
//                 if (state.section !== 'game' || clients[id].dead) return;
//                 kill(id)
//             })
//             socket.on('report-body', () => {
//                 if (state.section !== 'game' || clients[id].dead) return;
//                 endSabotage()
//                 triggerMeeting()
//             })
//             socket.on('start-sabotage', (sabotage) => {
//                 if (state.section !== 'game' || state.sabotage || clients[id].role !== 'impostor') return;
//                 state.sabotage = {
//                     id: sabotage,
//                     end: Date.now() + sabotageLength[sabotage] * 1000
//                 };
//                 sabotagePushed = 0;
//                 console.log('Sabotage', state.sabotage);
//                 sabotageTimeout = setTimeout(() => {
//                     state.sabotage = false;
//                     if (sabotage === 'oxygen' || sabotage === 'reactor') {
//                         state.section = 'end';
//                         state.winners = 'impostors';
//                     }
//                     io.to('game').to('admins').to('reactor').to('oxygen').emit('sync-game', state);
//                 }, sabotageLength[sabotage] * 1000);
//                 io.to('game').to('admins').to('reactor').to('oxygen').emit('sync-game', state);
//             })
//         }
//     } catch (e) {
//         console.error('Error', e);
//         socket.disconnect();
//     }
// });
//
// server.listen(3000, () => {
//     console.log('Server running on port 3000');
// })