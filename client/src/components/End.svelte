<script>
    import Panel from "./Panel.svelte";

    let {winners, players} = $props()

    let impostors = $derived(players.filter(player => {
        return player.role === 'impostor'
    }).map(impostor => impostor.name).join(', '))
</script>

<Panel>
    <p>Konec Hry</p>
    <p style="margin-top: 5px">Vyhráli: {winners}</p>
    <p style="color: #CE1D1D">{impostors}</p>
</Panel>