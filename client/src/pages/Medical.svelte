<script>
    import getSocket from '../lib/socket.js'
    import {onMount} from "svelte";
    import Background from "../components/Background.svelte";
    import Panel from "../components/Panel.svelte";
    import Display from "../components/Display.svelte";
    import End from "../components/End.svelte";
    import Countdown from "../components/Countdown.svelte";
    import Lobby from "../components/Lobby.svelte";

    let socket = $state(null)
    let gameState = $state({})
    $inspect(gameState)

    onMount(() => {
        socket = getSocket('admin')
        socket.on('sync-game', (newState) => {
            gameState = newState
        });
    })
</script>

<Background/>
<main>
    {#if !gameState.section || gameState.section === 'lobby'}
        <Lobby/>
    {:else if gameState.section === 'end'}
        <End winners={gameState.winners}/>
    {:else}
        {#if gameState.sabotage?.id !== 'comms'}
            <div class="player-list-container">
                <Panel>
                    <Display>
                        <div class="display-list">
                            <p>Status Hráčů:</p>
                            {#each gameState.players as player}
                                <p class="player-status">{player.name} <span
                                        class:dead={player.dead}>{player.dead ? 'DEAD' : 'OK'}</span></p>
                            {/each}
                        </div>
                    </Display>
                </Panel>
            </div>
        {:else}
            <Panel>
                <p class="flash-text">
                    Sabotáž: {gameState.sabotage.id} (<Countdown endTime={gameState.sabotage.end}/>s)
                </p>
            </Panel>
        {/if}
    {/if}
</main>

<style>
    .player-list-container {
        grid-row: 1 / 3;
    }

    .player-list-container :global(div) {
        height: 100%;
    }

    .display-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
        max-height: 500px;
        max-width: 220px;
        width: 200px;
        overflow-x: hidden;
        overflow-y: auto;
        text-overflow: ellipsis;
    }

    .display-list p {
        text-align: start;
    }

    .player-status span {
        color: #0EA920;
    }

    .player-status span.dead {
        color: #D70C0C;
    }
</style>