<template>
    <div>
    <template v-for="node in configuring">
        <node-config :node="node" @close="endConfigure(node)" />
    </template>
    <svg ref="canvas" width="100%" height="100%" @dragover="nodeDragged" @drop="nodeDropped">
        <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="black" stroke-width="0.5" v-once />
        </pattern>
        <rect width="100%" height="100%" style="fill: none; pointer-events: all;" v-once />
        <g ref="maingroup" v-if="graph">
        <rect width="2000%" height="2000%" id="grid" v-once transform="translate(-1000, -1000)" @click="clearHighlightNode" />
        <template v-for="edge in edges">
            <graph-edge :graph="graph" :edge="edge" :highlighted="edge_highlighted(edge)"/>
        </template>
        <path class="connecting-edge" v-if="cur_src" :d="cur_src.drag_path" stroke="#aaa" fill="transparent" />
        <template v-for="node in nodes">
            <graph-node :node="node"
                        :cur-src="cur_src"
                        @node-clicked="highlightNode"
                        @dst-hover-start="onDstHover"
                        @dst-hover-end="cur_dst = null"
                        @dst-selected="onDstSelected"
                        @src-selected="onSrcSelected"
                        @node-dblclicked="configureNode"
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
import autolayout from 'chl/graphlib/layout';
import NodeConfig from '@/components/graph/node_config';

import Util from 'chl/util';
import { GraphConstants } from 'chl/graphlib';

let zoom = d3.zoom();

export default {
    name: 'graph-canvas',
    components: { GraphNode, GraphEdge, NodeConfig },
    props: {
        graph: { type: Object, default: null },
    },

    data() {
        return {
            nodeset: {},
            edgeset: {},
            nodes_configuring: [],
            cur_dst: null,
            cur_src: null,
            cur_highlight: null,
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

        d3.select(this.$refs.canvas).call(zoom);
    },

    computed: {
        nodes() {
            return Object.values(this.nodeset);
        },
        configuring() {
            return this.nodes_configuring.map((id) => this.nodeset[id]);
        },
        edges() {
            return Object.values(this.edgeset);
        },
        edge_highlighted() {
            return (
                (e) => e.src_id == this.cur_highlight || e.dst_id == this.cur_highlight
            );
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

        bounds() {
            return this.computeBounds(this.nodes.map((node) => ({
                x: node.pos[0],
                y: node.pos[1],
                width: node.width,
                height: node.height,
            })));
        }
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
                edgeset[edge.id] = edge;
            });

            this.nodeset = nodeset;
            this.edgeset = edgeset;
            this.nodes_configuring = [];
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
            this.cur_highlight = null;

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
            this.cur_highlight = null;
            this.cur_src = null;
            this.$el.removeEventListener('mousemove', this.drag);
            this.$el.removeEventListener('mouseup', this.endDrag);
        },

        coords(pageX, pageY) {
            const coords = Util.relativeCoords(this.$el, pageX, pageY);
            const cur_transform = d3.zoomTransform(this.$refs.canvas);
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
            y -= GraphConstants.NODE_TITLE_HEIGHT/2;

            node.setPosition(x, y);
        },

        onRemoveClicked(node) {
            this.graph.removeNode(node.id);
        },
        zoomToBounds(bounds, duration) {
            return new Promise((resolve, reject) => {
                const paddingPercent = 0.2;

                const fullWidth = this.$el.clientWidth,
                    fullHeight = this.$el.clientHeight;

                let { width, height, x, y } = bounds;

                let widthPad = width * paddingPercent;
                let heightPad = height * paddingPercent;

                width += widthPad;
                height += heightPad;
                x -= widthPad/2;
                y -= heightPad/2;

                const midX = x + width / 2;
                const midY = y + height / 2;

                if (width == 0 || height == 0) return; // nothing to fit

                const scale = (1 / Math.max(width / fullWidth, height / fullHeight));
                const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

                let transform = d3.zoomIdentity
                    .translate(translate[0], translate[1])
                    .scale(scale);

                d3.select(this.$refs.canvas)
                    .transition()
                    .duration(duration)
                    .call(zoom.transform, transform)
                    .on('end', resolve);
            });
        },

        animateMove(node, endpos, duration) {
            return new Promise((resolve, reject) => {
                const interpolate = d3.interpolate([...node.pos], endpos);

                let start_ts = null;

                const frame = (ts) => {
                    if (!start_ts) start_ts = ts;

                    const progress = ts - start_ts;
                    const t = progress / duration;

                    const te = d3.easeQuad(t);

                    const [x, y] = interpolate(te);

                    this.$set(node.pos, 0, x);
                    this.$set(node.pos, 1, y);

                    if (progress < duration) {
                        window.requestAnimationFrame(frame);
                    } else {
                        resolve();
                    }
                };
                window.requestAnimationFrame(frame);
            });
        },

        computeBounds(nodelist) {
            let min_x = null;
            let min_y = null;
            let max_x = null;
            let max_y = null;

            for (let node of nodelist) {
                const {x: low_x, y: low_y, width, height} = node;
                const high_x = low_x + width;
                const high_y = low_y + height;

                if (min_x === null || low_x <  min_x) min_x = low_x;
                if (min_y === null || low_y <  min_y) min_y = low_y;
                if (max_x === null || max_x < high_x) max_x = high_x;
                if (max_y === null || max_y < high_y) max_y = high_y;

            }

            return {
                x: min_x,
                y: min_y,
                width: (max_x - min_x),
                height: (max_y - min_y)
            };
        },

        autolayout() {
            autolayout(this.graph).then((kgraph) => {
                let bounds = this.computeBounds(kgraph.children);

                this.zoomToBounds(bounds, GraphConstants.ANIM_TIME).then(() => {
                    kgraph.children.map((knode) => {
                        let node_id = parseInt(knode.id.slice(4));
                        let node = this.nodeset[node_id];
                        const endpos = [knode.x, knode.y];
                        return this.animateMove(node, endpos, GraphConstants.ANIM_TIME);
                    });
                });
            });
        },

        resetZoom() {
            d3.select(this.$refs.canvas)
              .transition()
              .duration(GraphConstants.ANIM_TIME)
              .call(zoom.transform, d3.zoomIdentity);
        },

        zoomToFit() {
            return this.zoomToBounds(this.bounds, GraphConstants.ANIM_TIME);
        },

        configureNode(node) {
            this.nodes_configuring.push(node.id);
        },

        endConfigure(node) {
            this.nodes_configuring.splice(this.nodes_configuring.indexOf(node.id), 1);
        },

        highlightNode(node) {
            this.cur_highlight = node.id;
        },
        clearHighlightNode() {
            this.cur_highlight = null;
        },
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
