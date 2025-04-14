import io from 'socket.io-client';

const ENDPOINT = window.location.origin.match(/\.[a-z]+$/) ? window.location.origin : 'http://192.168.0.122:3000';

const getSocket = (lobbyId, forceId = false) => {
    const path = `${ENDPOINT}/${lobbyId}`
    if (forceId) {
        return io(path, {auth: {id: forceId}});
    } else {
        const id = sessionStorage.getItem('id');
        const socket = io(path, {auth: {id}});
        socket.on('store-id', (id) => sessionStorage.setItem('id', id))
        return socket;
    }
}

export default getSocket;