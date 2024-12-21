<script>
    import Panel from "./Panel.svelte";
    import logoutImg from "../assets/images/logout.svg";

    let {name} = $props()

    const logout = () => {
        sessionStorage.removeItem('id');
        window.location.reload();
    }
</script>

<Panel --padding-bottom="18px" --padding-top="28px">
    <div>
        <p>Jméno: {name}</p>
        <p>Počkejte na začátek hry</p>
        <button onclick={logout}>
            <img src={logoutImg} alt="Odhlásit se"/>
        </button>
    </div>
</Panel>

<style>
    div {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }

    button {
        all: unset;
        cursor: pointer;
        display: block;
        transition: 0.1s;
        margin-top: 10px;
    }

    button:hover {
        transform: scale(1.05);
    }
</style>