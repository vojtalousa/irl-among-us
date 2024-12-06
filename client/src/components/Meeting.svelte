<script>
    import Countdown from "./Countdown.svelte";
    import Panel from "./Panel.svelte";
    import Display from "./Display.svelte";

    let {players = [], socket, voteId, endTime, votes, dead, meetingResults} = $props();

    const vote = (id) => {
        if (id === voteId) socket.emit('vote', null);
        else socket.emit('vote', id);
    }
</script>

<main>
    <Panel>
        {#if meetingResults.display}
            <p>{meetingResults.ejected ? `${meetingResults.ejected} byl vyhozen` : 'Nikdo nebyl vyhozen'}</p>
        {:else}
            <p>Hlasování: <Countdown {endTime}/>s</p>
        {/if}
    </Panel>
    <Panel>
        <Display>
            <div class="player-list">
                {#each players as player}
                    <div class="player" class:disabled={dead || player.dead}>
                        {#if meetingResults.display !== true}
                            <button class="checkbox" id={player.id}
                                    onclick={() => vote(player.id)}
                                    disabled={dead || player.dead}
                                    aria-labelledby="{player.id}"
                                    class:checked={player.id === voteId}
                            ></button>
                            <label for={player.id}>{player.name}</label>
                        {/if}
                        {#if meetingResults.display === true}
                            <p>{player.name} ({votes[player.id]?.length || 0})</p>
                        {/if}
                    </div>
                {/each}
            </div>
        </Display>
    </Panel>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .player-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .player {
        display: flex;
        align-items: center;
        cursor: pointer;
    }
    .player.disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
    .player.disabled label, .player.disabled p {
        text-decoration: line-through;
    }

    .checkbox {
        all: unset;
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 1px solid black;
        border-radius: 2px;
        background-color: transparent;
    }
    .checkbox.checked {
        background-color: #DB2400;
    }

    label {
        all: unset;
        padding-left: 7px;
    }

</style>