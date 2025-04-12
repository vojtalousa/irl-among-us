<script>
    import getSocket from '../lib/socket.js'
    import {onMount} from "svelte";
    import Countdown from "../components/Countdown.svelte";
    import End from "../components/End.svelte";
    import Background from "../components/Background.svelte";
    import Panel from "../components/Panel.svelte";
    import GameOptions from "../components/GameOptions.svelte";
    import Disconnected from "../components/Disconnected.svelte";
    import List from "../components/List.svelte";

    let socket = $state(null)
    let gameState = $state({})
    let lobbyPlayers = $state([])
    $inspect(gameState)

    onMount(() => {
        socket = getSocket('admin')
        socket.on('sync-game', (newState) => {
            gameState = newState
        });
        socket.on('player-list', (players) => {
            lobbyPlayers = players
        })
    })
</script>

<Disconnected {socket}/>
<Background/>
<main>
    {#if gameState.section === 'end'}
        <End winners={gameState.winners} players={gameState.players}/>
    {:else if gameState.section === 'lobby'}
        <div class="lobby-grid">
            <GameOptions socket={socket}/>
            <List label={`Hráči (${lobbyPlayers.length})`}>
                {#each lobbyPlayers as player}
                    <p>{player.name}</p>
                {/each}
            </List>
        </div>
    {:else}
        {#if gameState.sabotage?.id !== 'comms'}
            <Panel --padding-bottom="25px" --padding-top="18px"
                   --padding-left="37px" --padding-right="37px">
                <div class="task-progress">
                    <p>{gameState.tasks?.done || 0}/{gameState.tasks?.total || 0} Tasků Hotovo</p>
                    <progress max={gameState.tasks?.total || 0} value={gameState.tasks?.done || 0}></progress>
                </div>
            </Panel>
        {/if}
        <Panel>
            {#if gameState.sabotage}
                <p class="flash-text">
                    Sabotáž: {gameState.sabotage.id} (<Countdown endTime={gameState.sabotage.end}/>s)
                </p>
            {:else if gameState.section === 'meeting-wait'}
                <p class="meeting-call-title flash-text">Emergency Meeting</p>
                <button onclick={() => socket.emit('start-meeting')}>Všichni jsou tady</button>
            {:else if gameState.section === 'meeting'}
                <p>Probíhá hlasování...</p>
            {:else if gameState.section === 'game'}
                <div class="meeting-button-container">
                    <button onclick={() => socket.emit('emergency-meeting')}>Emergency Meeting</button>
                </div>
            {:else}
                <p>Načítání...</p>
            {/if}
        </Panel>
    {/if}
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .lobby-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }

    .lobby-grid :global(div:not(.list)) {
        height: 100%;
    }

    .task-progress {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .task-progress p {
        text-align: start;
    }

    .task-progress progress {
        appearance: none;
        width: 100%;
        height: 25px;
    }

    .task-progress progress::-webkit-progress-bar {
        background-color: #E0E0E0;
        border-radius: 999px;
        height: 25px;
        box-shadow: inset 7px 7px 12px 2px rgba(255, 255, 255, 0.25),
        inset -7px -7px 12px 2px rgba(0, 0, 0, 0.25),
        inset 0 0 82px 33px rgba(0, 0, 0, 0.4),
        inset 0 0 0 4px #000000;
        outline: none;
    }

    .task-progress progress::-webkit-progress-value {
        background-color: #3D73FB;
        border-radius: 999px;
        height: 25px;
        box-shadow: inset 7px 7px 12px 2px rgba(255, 255, 255, 0.25),
        inset -7px -7px 12px 2px rgba(0, 0, 0, 0.25),
        inset 0 0 82px 33px rgba(0, 0, 0, 0.4);
        outline: none;
    }

    .meeting-call-title {
        font-size: 35px;
        margin-bottom: 5px;
    }

    .meeting-button-container {
        display: grid;
        place-items: center;
        width: 100%;
    }

    button {
        all: unset;
        box-sizing: border-box;
        cursor: pointer;
        background-color: #FF4F4F;
        padding: 10px;
        width: 100%;
        color: white;
        border-radius: 99999px;
        display: grid;
        place-items: center;
        text-align: center;
        box-shadow: inset 7px 7px 12px 2px rgba(255, 255, 255, 0.25),
        inset -7px -7px 12px 2px rgba(0, 0, 0, 0.25),
        inset 0 0 82px 33px rgba(0, 0, 0, 0.4);
        transition: 0.1s;
    }

    button:hover {
        transform: scale(1.01);
    }

    .meeting-button-container button {
        width: 100%;
        height: 100%;
        aspect-ratio: 1;
        padding: 20px;
        font-size: 45px;
    }

    .meeting-button-container button:active {
        transform: scale(0.95);
    }
</style>