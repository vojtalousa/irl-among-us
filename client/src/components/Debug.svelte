<script>
    let { gameState } = $props();
</script>

<main>
    {#each gameState.badConnections as badConnections}
        <p>{badConnections}</p>
    {/each}
</main>

<style>
    main {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 999;
    }

    p {
        color: #CE1D1D;
    }
</style>