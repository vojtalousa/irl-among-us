<script>
    let { children } = $props();
</script>

<div>
    {@render children?.()}
</div>

<style>
    div {
        width: 100%;
        background-image: linear-gradient(165deg, #BBC9CC 49.5%, #F0F3F4 69.5%, #BBC9CC 90%, #BBC9CC 100%);
        padding: var(--padding-top, 15px)
        var(--padding-right, 15px)
        var(--padding-bottom, 15px)
        var(--padding-left, 15px);
        border-radius: 15px;
        border: 4px solid #323242;
        box-shadow: inset 0 0 20px 0 rgba(0, 0, 0, 0.25),
                    0 0 0 2px white,
                    0 0 0 4px black;
    }
</style>