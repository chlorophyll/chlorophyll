import Vue from 'vue';
import Util from 'chl/util';
import Const from 'chl/const';

import { GraphLib, GraphBase, GraphNodeBase } from '@/common/graphlib';
import { registerSaveField } from 'chl/savefile';
import { newgid } from 'chl/vue/store';

export default GraphLib;


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
        if (options.id === undefined)
            options.id = newgid();
        return super.addNode(path, options);
    }

    static restore(snapshot) {
        const graph = new Graph(snapshot.id);
        graph.load_snapshot(snapshot);
        return graph;
    }
}

function makeNodeVue(graph, node, data) {
    return new Vue({
        data,
        computed: {
            id() {
                return node.id;
            },
            rows() {
                const inslots = this.inputs.length;
                const outslots = this.outputs.length;
                return Math.max(inslots, outslots);
            },
            width() {
                let width = Math.max(Util.textWidth(this.title), Const.Graph.NODE_WIDTH);

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
                        Const.Graph.NODE_MIN_WIDTH,
                        input_width + output_width + 10
                    );
                    if (row_width > width) {
                        width = row_width;
                    }
                }
                return width;
            },

            height() {
                let body_height = Math.max(this.rows, 1) * Const.Graph.NODE_SLOT_HEIGHT + 5;
                return (Const.Graph.NODE_TITLE_HEIGHT + body_height);
            },

            slot_labels() {
                let inputs = this.inputs.map(({ settings }, slot) => {
                    const name = node.input_info[slot].name;
                    let text = settings.label !== null ? settings.label : name;
                    const val = this.defaults[name];
                    if (val !== null) {
                        text += ` (${val})`;
                    }
                    return text;
                });

                let outputs = this.outputs.map(({ settings }, slot) =>
                    settings.label !== null ? settings.label : node.output_info[slot].name);
                return {inputs, outputs};
            },
        },
        methods: {
            connectionX(slot, is_input) {
                return is_input ? 0 : this.width;
            },
            connectionY(slot, is_input) {
                 return Const.Graph.NODE_TITLE_HEIGHT + 10 + slot * Const.Graph.NODE_SLOT_HEIGHT;
            },

            canvasPos(pos) {
                return [this.pos[0] + pos[0], this.pos[1] + pos[1]];
            },
        }
    });
}

export class GraphNode extends GraphNodeBase {
    constructor(graph_info, inputs, outputs, options) {
        super(graph_info, makeNodeVue, inputs, outputs, options);
    }
}

registerSaveField('graphs', {
    save() {
        return GraphLib.save();
    },
    restore(graphset) {
        GraphLib.restore(graphset.map(Graph.restore));
    }
});
