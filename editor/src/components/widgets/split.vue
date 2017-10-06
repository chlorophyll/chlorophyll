<template>
    <div class="split" :class="[direction]" @mousemove="dragMove" @mouseup="dragEnd">
        <div class="split-item" :style="splitStyles[0]" :class="[direction]">
            <slot name="first" />
        </div>
        <div class="split-gutter" @mousedown="dragStart"
             :class="[direction, {dragging: dragging}]"/>
        <div class="split-item" :style="splitStyles[1]" :class="[direction]">
            <slot name="second" />
        </div>
    </div>
</template>
<script>
export default {
    name: 'split-pane',
    props: {
        direction: String,
        initialSplit: Array,
        immediateResize: Boolean,
    },
    data() {
        return {
            split: 50,
            dragging: false
        };
    },
    mounted() {
        let [first, second] = this.initialSplit;

        if (first !== null) {
            this.split = first;
        } else {
            this.split = second;
        }
        this.$nextTick(() => this.resize());
    },
    computed: {
        splitStyles() {
            return this.initialSplit.map((init) => {
                if (init === null)
                    return { flex: 'auto' };

                const style = { flex: 'initial' };
                const size = `${this.split}px`;
                if (this.direction === 'horizontal')
                    style.width = size;
                else
                    style.height = size;
                return style;
            });
        },
    },
    methods: {
        resize() {
            window.dispatchEvent(new CustomEvent('resize'));
        },
        dragStart(e) {
            this.dragging = true;
            this.start = this.direction == 'horizontal' ? e.pageX : e.pageY;
            this.startSplit = this.split;
        },
        dragMove(e) {
            if (!this.dragging)
                return;
            let cur = this.direction == 'horizontal' ? e.pageX : e.pageY;
            let delta = cur - this.start;
            if (this.initialSplit[0] === null) {
                delta *= -1;
            }
            this.split = this.startSplit + delta;
            this.resize();
        },
        dragEnd() {
            if (!this.dragging)
                return;
            this.dragging = false;
            this.resize();
        }
    }
};
</script>
<style lang="scss">
@import "~@/style/aesthetic.scss";

.split {
    position: absolute;
    display: flex;
    align-items: stretch;
    width: 100%;
    height: 100%;
    &.horizontal {
        flex-direction: row;
    }

    &.vertical {
        flex-direction: column;
    }
}

.split-gutter {
    flex: initial;
    background-color: #333;
    &.horizontal {
        cursor: col-resize;
        width: $split-gutter-size;
    }
    &.vertical {
        cursor: row-resize;
        height: $split-gutter-size;
    }
    &.dragging, &:hover {
        background-color: #888;
    }
}

.split-item {
    position: relative;
    overflow: auto;
}
</style>
