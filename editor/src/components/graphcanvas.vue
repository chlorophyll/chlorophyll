<template>
    <div @dragover="dragOver" @drop="drop" />
</template>
<script>
import GraphCanvas from 'chl/graphlib/canvas';

export default {
    name: 'graph-canvas',
    props: {
        graph: { type: Object, default: null },
    },
    data() {
        return {
            canvas: null,
        };
    },
    mounted() {
        if (this.canvas === null) {
            this.canvas = new GraphCanvas(this.$el);
        }
        this.canvas.setGraph(this.graph);
    },
    watch: {
        graph(newval, oldval) {
            if (!this.canvas)
                return;
            this.canvas.setGraph(this.graph);
        }
    },
    methods: {
        dragOver(event) {
            if (this.graph !== null)
                event.preventDefault();
        },
        drop(event) {
            if (this.graph === null)
                return;

            let path = event.dataTransfer.getData('text');
            this.canvas.dropNodeAt(path, event.clientX, event.clientY);
        }
    }
};
</script>
<style scoped>
div {
    position: relative;
    height: 100%;
    width: 100%;
}
</style>
