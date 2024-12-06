<script>
    import getSocket from '../lib/socket.js'
    import {onMount} from "svelte";
    import Countdown from "../components/Countdown.svelte";
    import Background from "../components/Background.svelte";
    import Panel from "../components/Panel.svelte";

    let socket = $state(null)
    let gameState = $state({})
    $inspect(gameState)

    let pushed = $state(false)

    const up = () => {
        if (!pushed) return
        pushed = false
        socket.emit('reactor-up')
    }
    const down = () => {
        if (pushed) return
        pushed = true
        socket.emit('reactor-down')
    }

    onMount(() => {
        socket = getSocket('reactor')
        socket.on('sync-game', (newState) => {
            if (newState.sabotage?.id !== 'reactor') pushed = false
            gameState = newState
        });
    })
</script>

<Background />
<main>
    {#if gameState.sabotage?.id === 'reactor'}
        <Panel>
            <p class="title flash-text">REACTOR MELTDOWN</p>
            <p><Countdown endTime={gameState.sabotage.end}/>s</p>
        </Panel>
        <Panel>
            <button onmousedown={down} ontouchstart={down} class:pushed={pushed}>Fix</button>
        </Panel>
    {/if}
</main>
<svelte:window onmouseup={up} ontouchend={up}/>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .title {
        font-size: 45px;
    }

    button {
        cursor: pointer;
        font-family: "Amatic SC", serif;
        font-weight: 700;
        padding: 10px;
        width: 100%;
        font-size: 35px;
        background-color: white;
        color: white;
        border-radius: 15px;
        border: 4px solid #353535;
        box-shadow: inset 7px 7px 12px 2px rgba(255, 255, 255, 0.25),
        inset -7px -7px 12px 2px rgba(0, 0, 0, 0.25),
        inset 0 0 82px 33px rgba(0, 0, 0, 0.4);
        transition: 0.05s;
    }

    .pushed {
        background-color: #FF6C6C;
    }
</style>