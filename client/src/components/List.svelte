<script>
    import Panel from "./Panel.svelte";
    import Display from "./Display.svelte";

    let { children, label } = $props();
</script>

<main>
    <Panel>
        <Display>
            <div class="list">
                <p class="list-label">{label}:</p>
                {@render children?.()}
            </div>
        </Display>
    </Panel>
</main>

<style>
    .list {
        display: grid;
        column-gap: 10px;
        grid-template-columns: 1fr 1fr;
        max-height: 600px;
        min-width: 300px;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .list-label {
        grid-column: 1 / 3;
    }

    .list :global(p) {
        text-align: start;
    }
</style>