<script>
    import Panel from "./Panel.svelte";
    import Display from "./Display.svelte";

    let { socket } = $props();

    let impostorCount = $state(2)
    let meetingLength = $state(4.5 * 60)
    let taskCount = $state(6)
    let oxygenSabotageLength = $state(2.5 * 60)
    let reactorSabotageLength = $state(2.5 * 60)
    let commsSabotageLength = $state(60)
    let sabotageCooldown = $state(2 * 60)

    const startGame = () => {
        if (!impostorCount || !meetingLength || !taskCount || !oxygenSabotageLength ||
            !reactorSabotageLength || !commsSabotageLength || !sabotageCooldown) {
            alert('Vyplňte všechny hodnoty')
        } else if (impostorCount < 1 || meetingLength < 1 || taskCount < 1 || oxygenSabotageLength < 1 ||
            reactorSabotageLength < 1 || commsSabotageLength < 1 || sabotageCooldown < 1) {
            alert('Hodnoty musí být větší než 0')
        } else {
            socket.emit('start-game', {
                impostorCount,
                meetingLength,
                taskCount,
                sabotageCooldown,
                sabotageLengths: {
                    oxygen: oxygenSabotageLength,
                    reactor: reactorSabotageLength,
                    comms: commsSabotageLength
                }
            })
        }
    }
</script>

<main>
    <Panel>
        <div class="options">
            <label>
                Počet impostorů:
                <Display --padding-top="5px" --padding-bottom="5px">
                    <input type="number" min="1" bind:value={impostorCount} />
                </Display>
            </label>
            <label>
                Délka meetingu:
                <Display --padding-top="5px" --padding-bottom="5px">
                    <input type="number" min="1" bind:value={meetingLength} />
                </Display>
            </label>
            <label>
                Počet tasků:
                <Display --padding-top="5px" --padding-bottom="5px">
                    <input type="number" min="1" bind:value={taskCount} />
                </Display>
            </label>
            <label>
                Délka oxygen sabotáže:
                <Display --padding-top="5px" --padding-bottom="5px">
                    <input type="number" min="1" bind:value={oxygenSabotageLength} />
                </Display>
            </label>
            <label>
                Délka reaktor sabotáže:
                <Display --padding-top="5px" --padding-bottom="5px">
                    <input type="number" min="1" bind:value={reactorSabotageLength} />
                </Display>
            </label>
            <label>
                Délka comms sabotáže:
                <Display --padding-top="5px" --padding-bottom="5px">
                    <input type="number" min="1" bind:value={commsSabotageLength} />
                </Display>
            </label>
            <label>
                Cooldown sabotáže:
                <Display --padding-top="5px" --padding-bottom="5px">
                    <input type="number" min="1" bind:value={sabotageCooldown} />
                </Display>
            </label>
        </div>
    </Panel>
    <Panel>
        <button class="start-game" onclick={startGame}>Spustit Hru</button>
    </Panel>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .options {
        display: flex;
        flex-direction: column;
        gap: 10px;
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

    .start-game {
        padding: 10px 75px;
    }

    input {
        all: unset;
        box-sizing: border-box;
        width: 100%;
        font-size: 25px;
        margin: -5px 0;
        text-align: start;
        cursor: text;
        text-overflow: ellipsis;
    }

    label {
        display: flex;
        white-space: nowrap;
        align-items: center;
        gap: 15px;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield;
    }
</style>