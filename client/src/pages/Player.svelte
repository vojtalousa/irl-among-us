<script>
    import {onMount} from "svelte";
    import getSocket from '../lib/socket.js'
    import Lobby from "../components/Lobby.svelte";
    import Game from "../components/Game.svelte";
    import Meeting from "../components/Meeting.svelte";
    import MeetingWait from "../components/MeetingWait.svelte";
    import End from "../components/End.svelte";
    import Background from "../components/Background.svelte";
    import Login from "../components/Login.svelte";
    import Panel from "../components/Panel.svelte";
    import dead from "../assets/images/dead.svg";

    let socket = $state(null)
    let gameState = $state({})
    let clientState = $state({})
    let meetingResults = $state({display: false, ejected: null});
    let wrongPasswordDisplayed = $state(false);

    onMount(() => {
        socket = getSocket()
        socket.on('sync-game', (newState) => {
            gameState = newState
        });
        socket.on('sync-client', (newState) => {
            clientState = newState
        });
        $inspect(gameState, clientState)

        socket.on('meeting-end', (ejected) => {
            meetingResults = {display: true, ejected}
            setTimeout(() => {
                meetingResults = {display: false, ejected: null}
            }, 15000)
        });

        socket.on('wrong-password', () => {
            wrongPasswordDisplayed = true;
            setTimeout(() => {
                wrongPasswordDisplayed = false;
            }, 3000);
        });
    });
</script>

<Background/>
<main>
    {#if gameState.section === 'end'}
        <End winners={gameState.winners}/>
    {:else}
        {#if clientState.dead === true}
            <p class="dead">DUCH <img src={dead} alt="dead" /></p>
        {/if}

        {#if clientState.name === false}
            <Login {socket}/>
        {:else if (gameState.section === 'lobby' && !meetingResults.display) || clientState.joined === false}
            <Lobby/>
        {:else if gameState.section === 'meeting-wait'}
            <MeetingWait/>
        {:else if gameState.section === 'meeting' || meetingResults.display}
            <Meeting players={gameState.players} voteId={clientState.vote} endTime={gameState.meetingEnd}
                     votes={gameState.votes} {meetingResults} dead={clientState.dead} {socket}/>
        {:else if gameState.section === 'game'}
            <Game role={clientState.role} tasks={clientState.tasks} dead={clientState.dead} {wrongPasswordDisplayed}
                  sabotage={gameState.sabotage} impostors={clientState.impostors} {socket} sabotageCooldownEnd={gameState.sabotageCooldownEnd}/>
        {:else}
            <Panel><p>Načítání...</p></Panel>
        {/if}
    {/if}
</main>

<style>
    .dead {
        position: fixed;
        top: 15px;
        width: 100vw;
        left: 0;
        text-align: center;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
    }

    .dead img {
        width: 40px;
        height: 40px;
    }
</style>