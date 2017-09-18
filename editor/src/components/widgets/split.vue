<template>
    <div class="split" :class="[direction]" @mousemove="dragMove" @mouseup="dragEnd">
        <div class="split-item" :style="firstStyle" :class="[direction]">
            <slot name="first" />
        </div>
        <div class="gutter" @mousedown="dragStart"
             :style="gutterStyle" :class="[direction, {dragging: dragging}]"/>
            <div class="split-item" :style="secondStyle" :class="[direction]">
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
            gutter: 2,
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
        splitKey() {
            return this.direction == 'horizontal' ? 'width' : 'height';
        },
        gutterStyle() {
            let out = {};
            out[this.splitKey] = `${this.gutter}px`;
            return out;
        },
        firstStyle() {
            let val;
            if (this.initialSplit[0] === null) {
                val = `calc(100% - ${this.split}px - ${this.gutter}px)`;
            } else {
                val = `${this.split}px`;
            }
            let out = {};
            out[this.splitKey] = val;
            return out;
        },
        secondStyle() {
            let val;
            if (this.initialSplit[1] === null) {
                val = `calc(100% - ${this.split}px - ${this.gutter}px)`;
            } else {
                val = `${this.split}px`;
            }
            let out = {};
            out[this.splitKey] = val;
            return out;
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
            const delta = cur - this.start;
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
<style scoped>
div {
    box-sizing: border-box;
}

.split {
    display: flex;
    width: 100%;
    height: 100%;
}

.split.horizontal {
    flex-direction: row;
}

.split-item.horizontal {
    height: 100%;
}

.split-item {
    position: relative;
    overflow: auto;
}

.split.vertical {
    flex-direction: column;
}

.split-item.vertical {
    width: 100%;
}

.gutter {
    background-color: #222;
}

.gutter.horizontal {
    cursor: col-resize;
}

.gutter.vertical {
    cursor: row-resize;
}

.gutter.dragging, .gutter:hover {
    background-color: #888;
}

</style>
