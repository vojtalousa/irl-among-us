<main>
    <sky>
        {#each Array(70) as _}
            <star></star>
        {/each}
    </sky>

    <svg xmlns="http://www.w3.org/2000/svg">
        <filter id="inset" x="-50%" y="-50%" width="200%" height="200%">
            <feFlood flood-color="black" result="outside-color"/>
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.5"/>
            <feComposite in="outside-color" operator="in" result="outside-stroke"/>
            <feFlood flood-color="#0c9fc4" result="inside-color"/>
            <feComposite in2="SourceAlpha" operator="in" result="inside-stroke"/>
            <feMerge>
                <feMergeNode in="outside-stroke"/>
                <feMergeNode in="inside-stroke"/>
            </feMerge>
        </filter>
    </svg>
</main>

<style lang="scss">
    @use "sass:math";
    main {
      position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
      z-index: -1;
    }

    sky {
        display: block;
        background: black;
        width: 100vw;
        height: 100vh;
    }
    star {
        border-radius: 50%;
        background: white;
        position: absolute;
        animation: star linear infinite;
        @for $i from 1 through 70 {
            &:nth-child(#{$i}) {
                $size: math.div(math.random(7), 15) + 0.1vmin;
                width: $size;
                height: $size;
                animation-duration: math.random(30) + 15s;
                animation-delay: math.random(40) - 40s;
                top: math.random(101) - 1vh;
            }
        }
    }
    @keyframes star {
        from { transform: translate3d(-5vw, 0, 1px); }
        to { transform: translate3d(105vw, 0, 1px); }
    }
</style>