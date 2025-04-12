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
    import Disconnected from "../components/Disconnected.svelte";
    import Debug from "../components/Debug.svelte";
    import meetingMp3 from "../assets/sounds/meeting.mp3";
    import sabotageMp3 from "../assets/sounds/sabotage.mp3";
    import crewmateWinMp3 from "../assets/sounds/win-crewmate.mp3";
    import impostorWinMp3 from "../assets/sounds/win-impostor.mp3";

    let socket = $state(null)
    let gameState = $state({})
    let clientState = $state({})
    let meetingResults = $state({display: false, ejected: null});
    let wrongPasswordDisplayed = $state(false);

    const meetingSound = new Audio(meetingMp3);
    const sabotageSound = new Audio(sabotageMp3);
    const crewmateWinSound = new Audio(crewmateWinMp3);
    const impostorWinSound = new Audio(impostorWinMp3);
    const sounds = [meetingSound, sabotageSound, crewmateWinSound, impostorWinSound];
    sabotageSound.loop = true;

    let setupAudio = false
    onMount(() => {
        // hack to force audio to play on safari
        window.onclick = async () => {
            if (setupAudio) return
            setupAudio = true

            for (const sound of sounds) {
                sound.play()
                sound.pause()
            }
        }

        socket = getSocket()
        socket.on('sync-game', (newState) => {
            if (newState.sabotage && !gameState.sabotage) {
                sabotageSound.currentTime = 0;
                sabotageSound.play();
            } else if (!newState.sabotage && gameState.sabotage) {
                sabotageSound.pause();
            }

            if (newState.section === 'meeting-wait' && gameState.section === 'game') {
                meetingSound.currentTime = 0;
                meetingSound.play();
            }

            if (newState.section === 'end' && gameState.section !== 'end') {
                if (newState.winners === 'impostors') {
                    impostorWinSound.currentTime = 0;
                    impostorWinSound.play();
                } else {
                    crewmateWinSound.currentTime = 0;
                    crewmateWinSound.play();
                }
            }

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

{#if clientState.debug}
    <Debug gameState={gameState}/>
{/if}
<Disconnected {socket}/>
<Background/>
<main>
    {#if gameState.section === 'end'}
        <End winners={gameState.winners} players={gameState.players}/>
    {:else}
        {#if clientState.dead === true}
            <p class="dead">DUCH <img src={dead} alt="dead"/></p>
        {/if}

        {#if clientState.id === false}
            <Login {socket} type="id"/>
        {:else if clientState.name === false}
            <Login {socket} type="name"/>
        {:else if (gameState.section === 'lobby' && !meetingResults.display) || clientState.joined === false}
            <Lobby name={clientState.name}/>
        {:else if gameState.section === 'meeting-wait'}
            <MeetingWait/>
        {:else if gameState.section === 'meeting' || meetingResults.display}
            <Meeting {...gameState} {...clientState} {meetingResults} {socket}/>
        {:else if gameState.section === 'game'}
            <Game {...gameState} {...clientState} {wrongPasswordDisplayed} {socket}/>
        {:else}
            <Panel><p>Načítání...</p></Panel>
        {/if}
    {/if}
</main>

<style>
    .dead {
        text-align: center;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        margin-bottom: 10px;
    }

    .dead img {
        width: 40px;
        height: 40px;
    }
</style>