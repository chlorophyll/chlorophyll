<template>
    <div></div>
</template>
<script>
import GraphCanvas from 'chl/graphlib/canvas';
export default {
    name: 'graph-canvas',
    props: {
        graph: Object,
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
