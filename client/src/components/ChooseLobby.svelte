<script>
    import start from "../assets/images/start.svg";
    import Panel from "./Panel.svelte";
    import Display from "./Display.svelte";

    let value = $state('');
    const { onchoose } = $props();

    const checkLobby = async () => {
        const res = await fetch('/validate', {
            method: 'POST',
            body: JSON.stringify({ id: parseInt(value) }),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const status = res.status
        if (status === 404) alert('ne')
        else onchoose(value)
    }
</script>

<Panel --padding-bottom="15px">
    <div>
        <Display --padding-top="5px" --padding-bottom="5px">
            <input type="number" bind:value={value} placeholder="PIN hry" step="1" min="1000" max="9999"/>
        </Display>
        <button onclick={checkLobby}>
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