<script>
    import getSocket from '../lib/socket.js'
    import {onMount} from "svelte";

    let socket = $state(null)

    onMount(() => {
        socket = getSocket('admin')
    })
</script>

<button onclick={() => socket.emit('end-game')}>End Game</button>
