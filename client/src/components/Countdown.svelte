<script>
    import {onMount} from "svelte";

    let { time = $bindable(), endTime } = $props();
    time = Math.floor((endTime - Date.now())/1000);

    onMount(() => {
        const interval = setInterval(() => {
            time = Math.floor((endTime - Date.now())/1000);
        }, 1000);
        return () => clearInterval(interval);
    });
</script>

{Math.max(time, 0)}