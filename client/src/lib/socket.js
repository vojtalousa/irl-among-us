import io from 'socket.io-client';
const ENDPOINT = 'http://192.168.0.185:3000';

const getSocket = (forceId = false) => {
    if (forceId) {
        return io(ENDPOINT, {
            auth: { id: forceId },
        });
    } else {
        const id = localStorage.getItem('id');
        const socket = io(ENDPOINT, {
            auth: { id },
        });
        socket.on('id', (id, callback) => {
            localStorage.setItem('id', id);
            callback(id);
        })
        return socket;
    }
}

export default getSocket;