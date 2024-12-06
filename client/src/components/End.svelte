<script>
    import Panel from "./Panel.svelte";

    let {winners} = $props()
</script>

<Panel>
    <p>Konec Hry</p>
    <p style="margin-top: 5px">Vyhráli: {winners}</p>
</Panel>