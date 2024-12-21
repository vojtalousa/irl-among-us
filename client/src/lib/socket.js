import io from 'socket.io-client';

const ENDPOINT = window.location.origin.match(/\.[a-z]+$/) ? window.location.origin : 'http://192.168.0.185:3000';

const getSocket = (forceId = false) => {
    if (forceId) {
        return io(ENDPOINT, {auth: {id: forceId}});
    } else {
        const id = sessionStorage.getItem('id');
        const socket = io(ENDPOINT, {auth: {id}});
        socket.on('store-id', (id) => sessionStorage.setItem('id', id))
        return socket;
    }
}

export default getSocket;