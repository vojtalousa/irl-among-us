<script>
    import getSocket from '../lib/socket.js'
    import {onMount} from "svelte";
    import Background from "../components/Background.svelte";
    import Panel from "../components/Panel.svelte";
    import End from "../components/End.svelte";
    import Countdown from "../components/Countdown.svelte";
    import List from "../components/List.svelte";

    let socket = $state(null)
    let gameState = $state({})
    $inspect(gameState)

    onMount(() => {
        socket = getSocket('medical')
        socket.on('sync-game', (newState) => {
            gameState = newState
        });
    })
</script>

<Background/>
<main>
    {#if gameState.section && gameState.section !== 'lobby'}
        {#if gameState.section === 'end'}
            <End winners={gameState.winners} players={gameState.players}/>
        {:else}
            {#if gameState.sabotage?.id !== 'comms'}
                <List label="Status Hráčů">
                    {#each gameState.players as player}
                        <p class="player-status">{player.name}<span
                                class:dead={player.dead}>{player.dead ? 'DEAD' : 'OK'}</span></p>
                    {/each}
                </List>
            {:else}
                <Panel>
                    <p class="flash-text">
                        Sabotáž: {gameState.sabotage.id} (<Countdown endTime={gameState.sabotage.end}/>s)
                    </p>
                </Panel>
            {/if}
        {/if}
    {/if}
</main>

<style>
    main {
        grid-column: 1 / 3;
    }

    .player-status span {
        color: #0EA920;
        margin-left: 5px;
    }

    .player-status span.dead {
        color: #D70C0C;
    }
</style>