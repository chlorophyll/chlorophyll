import Vue from 'vue';
import Util from 'chl/util';
import {cloneDeep} from 'lodash';

import { GraphLib, GraphBase } from '@/common/graphlib';
import { registerSaveField } from 'chl/savefile';
import { newgid } from 'chl/vue/store';

export const GraphConstants = {
    NODE_SLOT_HEIGHT: 15,
    DEFAULT_POSITION: [100, 100],
    NODE_TITLE_HEIGHT: 16,
    NODE_WIDTH: 140,
    NODE_MIN_WIDTH: 50,
    ANIM_TIME: 300,
};

export const NodeConfigMixin = {
    props: ['node', 'slotnum', 'parameter'],
    computed: {
        name() {
            if (this.node)
                return this.node.slot_names.inputs[this.slotnum];

            return this.parameter.name;
        },
        type() {
            if (this.node)
                return this.node.input_types[this.slotnum];

            return this.parameter.type;
        },
        value: {
            get() {
                if (this.node)
                    return this.node.defaults[this.name];

                return this.parameter.value;
            },
            set(val) {
                if (!this.node) {
                    this.parameter.value = val;
                    return;
                }
                // We emit an event when a new default is added.
                //
                // Doing the same when a default is deleted is complicated.
                // We'd be moving to an undefined state. Currently there's ways
                // to get into that state, such as starting a pattern with an
                // unconnected input driving an output, but we should
                // eventually do the work to disallow those graphs from being
                // compiled, those instead of faithfully moving to that state.
                const old_value = this.value;
                this.$set(this.node.defaults, this.name, val);

                if (old_value === undefined) {
                    this.node.graph_node.graph.emit('node-default-added');
                }
            }
        }
    }
};


export class Graph extends GraphBase {
    constructor(id=null) {
        if (id === null) {
            id = newgid();
        }
        super(id);
        Util.EventDispatcher.call(this);
    }

    emit(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail }));
    }

    connect(src, src_slot, dst, dst_slot) {
        const id = newgid();
        return super.connect(id, src, src_slot, dst, dst_slot);
    }

    addNode(path, options={}) {
        let { id } = options;
        if (id === undefined)
            id = newgid();

        if (options.pos === undefined) {
            options.pos = GraphConstants.DEFAULT_POSITION.concat();
        }

        return super.addNode(path, id, makeNodeVue, options);
    }

    static restore(snapshot) {
        const graph = new Graph(snapshot.id);
        graph.load_snapshot(snapshot);
        return graph;
    }

    copy() {
        let child = new Graph();

        for (let {name, type} of this.global_inputs.values()) {
            child.addGlobalInput(name, type);
        }
        for (let {name, type} of this.global_outputs.values()) {
            child.addGlobalOutput(name, type);
        }

        let nodemap = new Map(); // parent id => child id

        this.forEachNode((node) => {
            let cnode = child.addNode(node.path, {
                pos: [...node.vm.pos],
                title: node.vm.title,
                properties: cloneDeep(node.vm.defaults),
            });
            nodemap.set(node.id, cnode.id);
        });

        this.forEachEdge((edge) => {
            const child_edge = {
                id: newgid(),
                src_id: nodemap.get(edge.src_id),
                src_slot: edge.src_slot,
                dst_id: nodemap.get(edge.dst_id),
                dst_slot: edge.dst_slot
            };
            child._insertEdge(child_edge);
            child._notifyConnect(child_edge);
        });

        for (let [ref, id] of this.refs) {
            child.refs.set(ref, nodemap.get(id));
        }
        return child;
    }
}

function makeNodeVue(graph, node, data) {
    return new Vue({
        data,
        computed: {
            id() {
                return node.id;
            },

            graph_node() {
                return node.graph.getNodeById(node.id);
            },

            rows() {
                const inslots = this.inputs.length;
                const outslots = this.outputs.length;
                return Math.max(inslots, outslots);
            },

            width() {
                let width = Math.max(Util.textWidth(this.title), GraphConstants.NODE_WIDTH);

                for (let i = 0; i < this.rows; i++) {
                    let input_width = 0;
                    let output_width = 0;

                    if (i < this.inputs.length) {
                        input_width = Util.textWidth(this.slot_labels.inputs[i]);
                    }

                    if (i < this.outputs.length) {
                        output_width = Util.textWidth(this.slot_labels.outputs[i]);
                    }

                    const row_width = Math.min(
                        GraphConstants.NODE_MIN_WIDTH,
                        input_width + output_width + 10
                    );
                    if (row_width > width) {
                        width = row_width;
                    }
                }
                return width;
            },

            height() {
                let body_height = Math.max(this.rows, 1) * GraphConstants.NODE_SLOT_HEIGHT + 5;
                return (GraphConstants.NODE_TITLE_HEIGHT + body_height);
            },

            slot_names() {
                let inputs = node.input_info.map(({name}) => name);
                let outputs = node.output_info.map(({name}) => name);

                return { inputs, outputs };
            },

            slot_labels() {
                let inputs = this.inputs.map(({ settings }, slot) => {
                    const name = node.input_info[slot].name;
                    let text = settings.label !== null ? settings.label : name;
                    const val = this.defaults[name];
                    if (val !== undefined && val !== null) {
                        text += ` (${val.toString()})`;
                    }
                    return text;
                });

                let outputs = this.outputs.map(({ settings }, slot) =>
                    settings.label !== null ? settings.label : node.output_info[slot].name);
                return {inputs, outputs};
            },

            input_types() {
                return this.inputs.map(({ settings }, slot) => node.input_info[slot].type);
            },
        },

        methods: {
            connectionX(slot, is_input) {
                return is_input ? 0 : this.width;
            },

            connectionY(slot, is_input) {
                return (GraphConstants.NODE_TITLE_HEIGHT + 10 +
                        slot * GraphConstants.NODE_SLOT_HEIGHT);
            },

            canvasPos(pos) {
                return [this.pos[0] + pos[0], this.pos[1] + pos[1]];
            },
        },

        watch: {
            parameters: {
                deep: true,
                handler() {
                    graph.emit('node-property-changed', {node});
                    node.onPropertyChange();
                }
            },
        }
    });
}

registerSaveField('graphs', {
    save() {
        return GraphLib.save();
    },
    restore(graphset) {
        GraphLib.restore(graphset.map(Graph.restore));
    }
});
