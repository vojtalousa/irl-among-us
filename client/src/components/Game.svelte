<script>
    import Countdown from "./Countdown.svelte";
    import Panel from "./Panel.svelte";
    import Display from "./Display.svelte";
    import die from "../assets/images/die.svg";
    import report from "../assets/images/report.svg";
    import menu from "../assets/images/menu.svg";
    import {slide, fade} from "svelte/transition";

    let {impostors, role, tasks = [], dead, wrongPasswordDisplayed, sabotage, socket, sabotageCooldownEnd} = $props();

    let menuOpen = $state(false);
    let sabotageCooldownRemaining = $state(0);
    $inspect(sabotageCooldownRemaining);
    $effect(() => {
        sabotageCooldownRemaining = Math.floor((sabotageCooldownEnd - Date.now())/1000);
    })
    const killPlayer = () => {
        const confirm = window.confirm('Určitě chcete zemřít?');
        if (confirm) socket.emit('die');
    }
    const reportBody = () => {
        const confirm = window.confirm('Opravdu jste na dosah ruky od těla?');
        if (confirm) socket.emit('report-body');
    }
    const completeTask = (id) => {
        const password = window.prompt('Enter the password');
        if (password) socket.emit('complete-task', {id, password});
    }
</script>

<main>
    {#if menuOpen}
        <button aria-label="Close Menu" onclick={() => menuOpen = !menuOpen} class="cover" transition:fade></button>
    {/if}
    {#if sabotage}
        <Panel>
            <p class="flash-text">Sabotáž: {sabotage.id} (<Countdown endTime={sabotage.end} />s)</p>
        </Panel>
    {/if}
    <Panel>
        <Display>
            <div class="display-list">
                {#if wrongPasswordDisplayed}
                    <p class="wrong-password">[ŠPATNÉ HESLO]</p>
                {/if}
                <p>Tasky:</p>
                {#each tasks as task}
                    <button class="task"
                            onclick={() => completeTask(task.id)}
                            disabled={task.completed}
                            class:completed={task.completed}
                    >
                        {sabotage?.id === 'comms' && role !== 'impostor' ? '[COMMS SABOTAGED]' : task.description}
                    </button>
                {/each}
            </div>
        </Display>
    </Panel>
    <Panel --padding-top="20px" --padding-bottom="20px">
        <div class="button-panel">
            {#if !dead}
                <button onclick={killPlayer}>
                    <img src={die} alt="Die"/>
                </button>
            {/if}
            <button onclick={() => menuOpen = !menuOpen}>
                <img src={menu} alt="Menu"/>
            </button>
            {#if !dead}
                <button onclick={reportBody}>
                    <img src={report} alt="Report"/>
                </button>
            {/if}
        </div>
    </Panel>
    {#if menuOpen}
        <div class="menu-container" transition:slide>
            <Panel>
                <div class="menu-container-inner">
                    <p>Role: {role}</p>
                    {#if role === 'impostor'}
                        <Display>
                            <div class="display-list">
                                <p>Impostoři:</p>
                                {#each impostors as impostor}
                                    <p class="impostor-name">{impostor.name}</p>
                                {/each}
                            </div>
                        </Display>
                        <Display>
                            <div class="display-list">
                                {#if sabotageCooldownRemaining <= 0}
                                    <p>Sabotáže:</p>
                                {:else}
                                    <p>Sabotáže: (<Countdown bind:time={sabotageCooldownRemaining} endTime={sabotageCooldownEnd} />s)</p>
                                {/if}
                                <button onclick={() => socket.emit('start-sabotage', 'oxygen')}
                                        disabled={sabotageCooldownRemaining > 0}
                                >
                                    O2
                                </button>
                                <button onclick={() => socket.emit('start-sabotage', 'reactor')}
                                        disabled={sabotageCooldownRemaining > 0}
                                >
                                    Reactor
                                </button>
                                <button onclick={() => socket.emit('start-sabotage', 'comms')}
                                        disabled={sabotageCooldownRemaining > 0}
                                >
                                    Comms
                                </button>
                            </div>
                        </Display>
                    {/if}
                    <button class="close-menu" onclick={() => menuOpen = !menuOpen}>
                        <img src={menu} alt="Menu"/>
                    </button>
                </div>
            </Panel>
        </div>
    {/if}
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .display-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .display-list p {
        text-align: start;
    }

    .display-list button {
        all: unset;
        cursor: pointer;
        transition: 0.1s;
        color: black;
        text-decoration: underline;
    }
    .display-list button:disabled {
        text-decoration: line-through;
        cursor: default;
    }

    .display-list button:not(:disabled):hover {
        transform: scale(1.01);
    }

    .task.completed {
        color: #0EA920;
    }
    p.wrong-password {
        color: #DB2400;
        text-align: center;
    }

    .button-panel {
        display: flex;
        gap: 16px;
        justify-content: center;
    }

    .button-panel button, .close-menu {
        all: unset;
        cursor: pointer;
        transition: 0.1s;
        display: grid;
        place-items: center;
        height: 70px;
    }

    .close-menu {
        height: 50px;
    }

    .button-panel img, .close-menu img {
        height: 100%;
    }

    .button-panel button:hover, .close-menu:hover {
        transform: scale(1.05);
    }

    .cover {
        all: unset;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 2;
    }

    .menu-container {
        position: absolute;
        bottom: 10px;
        left: 10px;
        width: calc(100vw - 20px);
        z-index: 3;
    }

    .menu-container-inner {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .impostor-name {
        color: #DB2400;
    }
</style>