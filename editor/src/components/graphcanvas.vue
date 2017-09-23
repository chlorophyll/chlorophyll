<template>
    <div>
    <svg ref="canvas" width="100%" height="100%" @dragover="nodeDragged" @drop="nodeDropped">
        <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="black" stroke-width="0.5" v-once />
        </pattern>
        <rect width="100%" height="100%" style="fill: none; pointer-events: all;" v-once />
        <g ref="maingroup" v-if="graph">
        <rect width="2000%" height="2000%" id="grid" v-once transform="translate(-1000, -1000)"/>
        <template v-for="edge in edges">
            <graph-edge :graph="graph" :edge="edge" />
        </template>
        <path class="connecting-edge" v-if="cur_src" :d="cur_src.drag_path" stroke="#aaa" fill="transparent" />
        <template v-for="node in nodes">
            <graph-node :node="node"
                        :cur-src="cur_src"
                        @dst-hover-start="onDstHover"
                        @dst-hover-end="cur_dst = null"
                        @dst-selected="onDstSelected"
                        @src-selected="onSrcSelected"
                        @remove-clicked="onRemoveClicked" />
        </template>
        </g>
    </svg>
    </div>
</template>
<script>

import * as d3 from 'd3';
import GraphNode from '@/components/graphnode';
import GraphEdge from '@/components/graphedge';
import GraphAutoLayout from 'chl/graphlib/layout';

import Util from 'chl/util';
import Const from 'chl/const';

let zoom = d3.zoom();


const autolayout = new GraphAutoLayout();

export default {
    name: 'graph-canvas',
    components: { GraphNode, GraphEdge },
    props: {
        graph: { type: Object, default: null },
    },

    data() {
        return {
            nodeset: {},
            edgeset: {},
            cur_dst: null,
            cur_src: null,
        };
    },

    mounted() {

        zoom.scaleExtent([0.25, 10])
            .filter(() => {
                if (d3.event.type == 'dblclick')
                    return d3.event.target.id == 'grid';
                return !d3.event.button;
            })
            .on('zoom', () => {
                if (this.graph == null)
                    return;
                d3.select(this.$refs.maingroup).attr('transform', d3.event.transform);
            });

        d3.select(this.$el).call(zoom);
    },

    computed: {
        nodes() {
            return Object.values(this.nodeset);
        },
        edges() {
            return Object.values(this.edgeset);
        },

        cur_src_pos() {
            if (!this.cur_src)
                return null;
            let slot_pos = [
                this.cur_src.node.connectionX(this.cur_src.slot, false),
                this.cur_src.node.connectionY(this.cur_src.slot, false),
            ];
            return this.cur_src.node.canvasPos(slot_pos);
        },

        cur_dst_pos() {
            if (!this.cur_dst)
                return null;
            let slot_pos = [
                this.cur_dst.node.connectionX(this.cur_dst.slot, true),
                this.cur_dst.node.connectionY(this.cur_dst.slot, true),
            ];
            return this.cur_dst.node.canvasPos(slot_pos);
        },
    },

    watch: {
        graph(newgraph, oldgraph) {
            this.cur_dst = null;
            this.endDrag();

            if (oldgraph !== null)
                this.removeListeners(oldgraph);

            if (newgraph === null)
                return;

            this.addListeners(newgraph);
            let nodeset = {};
            let edgeset = {};
            newgraph.forEachNode((node) => {
                nodeset[node.id] = node.vm;
            });
            newgraph.forEachEdge((edge) => {
                nodeset[edge.id] = edge;
            });

            this.nodeset = nodeset;
            this.edgeset = edgeset;
        }
    },

    methods: {
        onNodeAdded({ detail: { node }}) {
            this.$set(this.nodeset, node.id, node.vm);
        },
        onNodeRemoved({ detail: { node }}) {
            this.$delete(this.nodeset, node.id);
        },

        onEdgeAdded({ detail: { edge }}) {
            this.$set(this.edgeset, edge.id, edge);
        },
        onEdgeRemoved({ detail: { edge }}) {
            this.$delete(this.edgeset, edge.id);
        },

        addListeners(graph) {
            graph.addEventListener('node-added', this.onNodeAdded);
            graph.addEventListener('node-removed', this.onNodeRemoved);
            graph.addEventListener('edge-added', this.onEdgeAdded);
            graph.addEventListener('edge-removed', this.onEdgeRemoved);
        },

        removeListeners(graph) {
            graph.removeEventListener('node-added', this.onNodeAdded);
            graph.removeEventListener('node-removed', this.onNodeRemoved);
            graph.removeEventListener('edge-added', this.onEdgeAdded);
            graph.removeEventListener('edge-removed', this.onEdgeRemoved);
        },

        onDstHover(node, slot) {
            this.cur_dst = { node, slot };
        },

        onSrcSelected(node, slot) {
            this.cur_src = { node, slot, drag_path: ''};

            this.$el.addEventListener('mousemove', this.drag);
            this.$el.addEventListener('mouseup', this.endDrag);
        },

        onDstSelected(node, slot) {
            const edge = this.graph.getIncomingEdge(node, slot);
            if (edge !== undefined) {
                this.graph.disconnect(edge);
            }
        },

        drag(event) {
            const {x, y} = this.coords(event.pageX, event.pageY);
            let [cx, cy] = this.cur_src_pos;
            this.cur_src.drag_path = Util.bezierByH(cx, cy, x, y);
        },

        endDrag(event) {
            if (this.cur_dst !== null) {
                let src = this.graph.getNodeById(this.cur_src.node.id);
                let dst = this.graph.getNodeById(this.cur_dst.node.id);
                this.graph.connect(src, this.cur_src.slot, dst, this.cur_dst.slot);
            }
            this.cur_src = null;
            this.$el.removeEventListener('mousemove', this.drag);
            this.$el.removeEventListener('mouseup', this.endDrag);
        },

        coords(pageX, pageY) {
            const coords = Util.relativeCoords(this.$el, pageX, pageY);
            const cur_transform = d3.zoomTransform(this.$el);
            const [x, y] = cur_transform.invert([coords.x, coords.y]);
            return {x, y};
        },

        nodeDragged(event) {
            if (this.graph !== null)
                event.preventDefault();
        },
        nodeDropped(event) {
            if (this.graph === null)
                return;

            let path = event.dataTransfer.getData('text');

            let node = this.graph.addNode(path);

            let {x, y} = this.coords(event.pageX, event.pageY);

            x -= node.vm.width / 2;
            y += Const.Graph.NODE_TITLE_HEIGHT/2;

            node.setPosition(x, y);
        },

        onRemoveClicked(node) {
            this.graph.removeNode(node.id);
        },
        zoomToFit(bounds, duration) {
            const paddingPercent = 1.2;

            const fullWidth = this.$el.clientWidth,
                  fullHeight = this.$el.clientHeight;

            let { width, height } = bounds;
            width *= paddingPercent;
            height *= paddingPercent;

            const midX = bounds.x + width / 2;
            const midY = bounds.y + height / 2;

            if (width == 0 || height == 0) return; // nothing to fit

            const scale = 1 / Math.max(width / fullWidth, height / fullHeight);
            const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

            let transform = d3.zoomIdentity
                .translate(translate[0], translate[1])
                .scale(scale);

            d3.select(this.$el)
              .transition()
              .duration(duration)
              .call(zoom.transform, transform);
        },

        animateMove(node, endpos, duration) {
            const interpolate = d3.interpolate(node.pos, endpos);

            let start_ts = null;

            const frame = (ts) => {
                if (!start_ts) start_ts = ts;

                const progress = ts - start_ts;
                const t = progress / duration;

                const te = d3.easeCubic(t);

                const [x, y] = interpolate(te);

                this.$set(node.pos, 0, x);
                this.$set(node.pos, 1, y);

                if (progress < duration) {
                    window.requestAnimationFrame(frame);
                }
            };
            window.requestAnimationFrame(frame);
        },

        autolayout() {
            autolayout.layout(this.graph, (kgraph) => {
                for (let knode of kgraph.children) {
                    let node_id = parseInt(knode.id.slice(4));
                    let node = this.nodeset[node_id];
                    const endpos = [knode.x, knode.y];
                    this.animateMove(node, endpos, 250);
                }
                const bounds = {
                    width: kgraph.width,
                    height: kgraph.height,
                    x: 0,
                    y: 0
                };
                window.setTimeout(() => this.zoomToFit(bounds, 250), 125);
            });
        },

        resetZoom() {
            d3.select(this.$el)
              .transition()
              .duration(250)
              .call(zoom.transform, d3.zoomIdentity);
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

#grid {
    fill: url("#grid-pattern")
}

svg {
    cursor: default;
}

.connecting-edge {
    pointer-events: none;
}
</style>
