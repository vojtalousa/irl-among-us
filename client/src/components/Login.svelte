<script>
    import start from "../assets/images/start.svg";
    import Panel from "./Panel.svelte";
    import Display from "./Display.svelte";

    let {socket, type} = $props();
    let value = $state('');
    let placeholder = $derived(type === 'name' ? 'Jméno' : 'Heslo');
</script>

<Panel --padding-bottom="15px">
    <div>
        <Display --padding-top="5px" --padding-bottom="5px">
            <input type="text" bind:value={value} {placeholder} />
        </Display>
        <button onclick={() => socket.emit(`set-${type}`, value)}>
            <img src={start} alt="Start"/>
        </button>
    </div>
</Panel>

<style>
    div {
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: center;
    }

    input {
        all: unset;
        box-sizing: border-box;
        width: 100%;
        font-size: 30px;
        margin: -5px 0;
        text-align: center;
    }

    button {
        all: unset;
        cursor: pointer;
        display: block;
        transition: 0.1s;
    }

    button:hover {
        transform: scale(1.05);
    }
</style>