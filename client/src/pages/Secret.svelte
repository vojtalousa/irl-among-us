<script>
    import getSocket from '../lib/socket.js'
    import {onMount} from "svelte";

    let socket = $state(null)
    let lobbyId = $state('')

    const createLobby = async () => {
        const res = await fetch('/create', {
            method: 'POST',
            body: JSON.stringify({ id: parseInt(lobbyId) }),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const status = res.status
        if (status === 404) alert('ne')
        else {
            alert('yup')
            socket = getSocket(lobbyId, 'admin')
        }
    }
</script>

<button onclick={() => socket.emit('end-game')}>End Game</button>
<input bind:value={lobbyId} type="number" />
<button onclick={createLobby}>Create Lobby</button>
