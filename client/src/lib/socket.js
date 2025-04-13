import io from 'socket.io-client';

const ENDPOINT = import.meta.env.VITE_HOST

const getSocket = (forceId = false) => {
    if (forceId) {
        return io(ENDPOINT, {auth: {id: forceId}});
    } else {
        const socket = io(ENDPOINT, {
            auth: (cb) => cb({
                id: sessionStorage.getItem('id')
            })
        });
        socket.on('store-id', (id) => {
            if (id) sessionStorage.setItem('id', id);
            else sessionStorage.removeItem('id');
        })
        return socket;
    }
}

export default getSocket;