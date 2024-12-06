<script>
    import screw from '../assets/images/screw.svg';

    let { children } = $props();
</script>

<div>
    <img src={screw} class="screw topleft" alt="Screw" />
    <img src={screw} class="screw topright" alt="Screw" />
    <img src={screw} class="screw bottomleft" alt="Screw" />
    <img src={screw} class="screw bottomright" alt="Screw" />
    {@render children?.()}
</div>

<style>
    div {
        position: relative;
        background-color: #D9D9D9;
        padding: var(--padding-top, 35px)
                 var(--padding-right, 30px)
                 var(--padding-bottom, 35px)
                 var(--padding-left, 30px);
        border-radius: 15px;
        border: 4px solid #353535;
        box-shadow: inset 7px 7px 12px 2px rgba(255, 255, 255, 0.25),
                    inset -7px -7px 12px 2px rgba(0, 0, 0, 0.25),
                    inset 0 0 82px 33px rgba(0, 0, 0, 0.4);
        display: grid;
        align-items: center;
    }

    .screw {
        position: absolute;
        width: 15px;
        height: 15px;
    }

    .topleft {
        top: 10px;
        left: 10px;
    }
    .topright {
        top: 10px;
        right: 10px;
    }
    .bottomleft {
        bottom: 10px;
        left: 10px;
    }
    .bottomright {
        bottom: 10px;
        right: 10px;
    }

</style>