<script>
    import disconnected from '../assets/images/disconnected.svg';

    let { socket } = $props();
    let connected = $state(true);

    $effect(() => {
        if (!socket) {
            connected = true;
        } else {
            socket.on('disconnect', () => {
                connected = socket.connected;
            });
            socket.on('connect', () => {
                connected = socket.connected;
            });
        }
    });
</script>

<main style:display={connected ? 'none' : 'grid'}>
    <img src={disconnected} alt="Disconnected"/>
    <div class="background"></div>
</main>

<style>
    main {
        position: fixed;
        top: 0;
        left: 0;
        width: 100dvw;
        height: 100dvh;
        z-index: 1000;
        display: none;
        place-items: center;
        padding: 20px;
    }

    img {
        width: 100%;
        max-width: 300px;
        z-index: 1000;
    }

    .background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    }
</style>