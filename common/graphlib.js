import Immutable from 'immutable';

import * as Serialization from 'common/util/serialization';

let node_types = new Map();
let graphs = new Map();

export const GraphLib = {
    registerNodeType(path, constructor) {
        if (!GraphNodeBase.isPrototypeOf(constructor))
            throw new Error('All registered node types must inherit from GraphNode');

        node_types.set(path, constructor);
        constructor.type = path;
    },
    registerNodeTypes(node_list) {
        for (let [path, constructor] of node_list) {
            this.registerNodeType(path, constructor);
        }
    },
    getNodeTypes() {
        return node_types;
    },

    graphById(id) {
        return graphs.get(id);
    },

    save() {
        return Array.from(graphs.values()).map((graph) => graph.save());
    },
    restore(newgraphs) {
        let oldgraphs = graphs;

        graphs = new Map();

        for (let graph of newgraphs) {
            graphs.set(graph.id, graph);
        }

        for (let graph of oldgraphs.values()) {
            graph.emit('restore');
        }

    }
};

export default GraphLib;

export class GraphBase {
    constructor(id) {
        this.id = id;
        graphs.set(this.id, this);

        this.global_inputs = new Map();
        this.global_outputs = new Map();

        this.refs = new Map();

        this.nodes = new Immutable.Map();

        this.edges_by_src = new Immutable.Map();
        this.edges_by_dst = new Immutable.Map();
    }

    emit(name, detail) {
    }

    getNodeByRef(name) {
        const id = this.refs.get(name);
        if (id === undefined)
            return undefined;

        return this.getNodeById(id);
    }

    addGlobalInput(name, type) {
        this.global_inputs.set(name, { name, type, data: null });
        this.emit('global-input-added', { name, type });
    }

    removeGlobalInput(name) {
        this.global_inputs.delete(name);
        this.emit('global-input-removed', { name });
    }

    setGlobalInputData(name, data) {
        this.global_inputs.get(name).data = data;
    }

    getGlobalInputData(name) {
        return this.global_inputs.get(name).data;
    }

    addGlobalOutput(name, type) {
        this.global_outputs.set(name, { name, type, data: null });
        this.emit('global-output-added', { name, type });
    }

    removeGlobalInput(name) {
        this.global_outputs.delete(name);
        this.emit('global-output-removed', { name });
    }
    setGlobalOutputData(name, data) {
        this.global_outputs.get(name).data = data;
    }
    getGlobalOutputData(name) {
        return this.global_outputs.get(name).data;
    }

    addNode(path, options = {}) {
        let Ctor = node_types.get(path);

        if (!Ctor) {
            throw Error('unknown node type' + path);
        }

        const { id, pos, ref } = options;

        const graph = this;
        const title = options.title || Ctor.title || path;

        if (id === undefined) {
            throw new Error('nodes require an id');
        }

        let node = new Ctor({graph, id, title, pos, path});

        this.nodes = this.nodes.set(node.id, node);

        if (ref !== undefined) {
            this.refs.set(ref, id);
        }

        this.emit('node-added', { node });

        return node;
    }

    removeNode(node_or_id) {
        let node;
        if (typeof(node_or_id) == 'number') {
            node = this.getNodeById(node_or_id);
        } else {
            node = node_or_id;
        }

        this.forEachEdgeToNode(node, (edge) => this.disconnect(edge));
        this.forEachEdgeFromNode(node, (edge) => this.disconnect(edge));

        this.nodes = this.nodes.delete(node.id);
        this.refs.delete(node.id);

        this.emit('node-removed', { node });
    }


    validConnection(src_type, dst_type) {
        if (!src_type || !dst_type)
            return true;

        if (typeof(src_type) === 'string' && typeof(dst_type) === 'string') {
            return (src_type == dst_type);
        }

        if (src_type == 'number' && dst_type.isUnit) {
            return true;
        }

        return dst_type.isUnit && src_type.isUnit;
    }

    toposort() {
        const GREY = 1;
        const BLACK = 2;

        let ordered = [];
        let stack = [];

        let visited = new Map();

        this.forEachNode((source, source_id) => {
            if (visited.has(source_id))
                return;

            stack.push([source_id, false]);

            while (stack.length > 0) {
                let [id, processed] = stack.pop();
                let node = this.getNodeById(id);
                if (!processed) {
                    let marked = visited.get(id);

                    if (marked == GREY)
                        throw Error('cycle detected');

                    if (marked == BLACK)
                        continue;
                    stack.push([id, true]);
                    visited.set(id, GREY);
                    this.forEachEdgeFromNode(node, function(edge) {
                        stack.push([edge.dst_id, false]);
                    });
                } else {
                    visited.set(id, BLACK);
                    ordered.unshift([id, node]);
                }
            }
        });
        this.nodes = Immutable.OrderedMap(ordered);
    }

    _insertEdge(edge) {
        const {src_id, src_slot, dst_id, dst_slot} = edge;

        this.edges_by_src = this.edges_by_src.updateIn(
            [src_id, src_slot],
            Immutable.Set(),
            (edgelist) => edgelist.add(edge));
        let prev_edge = this.edges_by_dst.getIn([dst_id, dst_slot]);

        this.edges_by_dst = this.edges_by_dst.setIn([dst_id, dst_slot], edge);

        if (prev_edge) {
            this.edges_by_src = this.edges_by_src.updateIn(
                [prev_edge.src_id, prev_edge.src_slot],
                Immutable.Set(), (edgelist) => edgelist.delete(prev_edge)
            );
        }

        return prev_edge;
    }

    _notifyConnect(edge) {
        let src = this.getNodeById(edge.src_id);
        let dst = this.getNodeById(edge.dst_id);

        src.vm.outputs[edge.src_slot].state.num_edges += 1;
        dst.vm.inputs[edge.dst_slot].state.num_edges += 1;
        this.emit('edge-added', { edge });
    }

    connect(id, src, src_slot, dst, dst_slot, no_toposort=false) {
        let src_type = src.output_info[src_slot].type;
        let dst_type = dst.input_info[dst_slot].type;

        if (!this.validConnection(src_type, dst_type))
            return false;

        let edge = {
            id,
            src_id: src.id,
            dst_id: dst.id,
            src_slot,
            dst_slot,
        };

        let old_src = this.edges_by_src;
        let old_dst = this.edges_by_dst;

        let prev_edge = this._insertEdge(edge);

        try {
            this.toposort();
            this._notifyConnect(edge);
            if (prev_edge)
                this._notifyDisconnect(prev_edge);
            return edge;
        } catch (e) {
            // a cycle was created
            this.edges_by_src = old_src;
            this.edges_by_dst = old_dst;
            return false;
        }
    }

    _notifyDisconnect(edge) {
        let src = this.getNodeById(edge.src_id);
        let dst = this.getNodeById(edge.dst_id);
        src.vm.outputs[edge.src_slot].state.num_edges -= 1;
        dst.vm.inputs[edge.dst_slot].state.num_edges -= 1;
        this.emit('edge-removed', { edge });
    }

    disconnect(edge) {
        this.edges_by_src = this.edges_by_src.updateIn(
            [edge.src_id, edge.src_slot],
            Immutable.Set(), (edgelist) => edgelist.delete(edge)
        );
        this.edges_by_dst = this.edges_by_dst.deleteIn([edge.dst_id, edge.dst_slot]);
        this._notifyDisconnect(edge);
    }

    getNodeByInput(dst, dst_slot) {
        let edge = this.edges_by_dst.getIn([dst.id, dst_slot]);

        if (!edge)
            return null;

        let node = this.nodes.get(edge.src_id);

        return {
            node: node,
            slot: edge.src_slot
        };
    }

    getNodeById(node_id) {
        return this.nodes.get(node_id);
    }

    runStep() {
        this.nodes.forEach(function(node, id) {
            node.clearOutgoingData();
            node.onExecute();
        });
    }

    forEachNode(f) {
        return this.nodes.forEach(f);
    }

    forEachEdgeToNode(node, f) {
        let edges_by_slot = this.edges_by_dst.get(node.id);

        if (edges_by_slot !== undefined)
            edges_by_slot.forEach(f);
    }

    numEdgesToNode(node) {
        let edges_by_slot = this.edges_by_dst.get(node.id);
        if (edges_by_slot !== undefined) {
            return edges_by_slot.count();
        } else {
            return 0;
        }
    }

    forEachEdgeFromNode(node, f) {
        let edges_by_slot = this.edges_by_src.get(node.id);

        if (edges_by_slot)
            edges_by_slot.forEach((slot) => slot.forEach(f));
    }

    numEdgesFromNode(node) {
        let total = 0;
        let edges_by_slot = this.edges_by_src.get(node.id);

        if (edges_by_slot)
            edges_by_slot.forEach((slot) => total += slot.count());
        return total;
    }

    forEachEdgeFromSlot(node, slot, f) {
        this.edges_by_src.getIn([node.id, slot], Immutable.List()).forEach(f);
    }

    numEdgesAtSlot(node, slot, is_input) {
        if (is_input)
            return this.hasIncomingEdge(node, slot) ? 1 : 0;

        let edgelist = this.edges_by_src.getIn([node.id, slot]);
        return edgelist ? edgelist.count() : 0;
    }

    hasIncomingEdge(node, slot) {
        return this.getIncomingEdge(node, slot) !== undefined;
    }

    getIncomingEdge(node, slot) {
        return this.edges_by_dst.getIn([node.id, slot]);
    }

    forEachEdge(f) {
        return this.forEachNode((node) => this.forEachEdgeFromNode(node, f));
    }

    save() {
        const extract = ({name, type}) => ({name, type});
        const global_inputs = Array.from(this.global_inputs.values()).map(extract);
        const global_outputs = Array.from(this.global_outputs.values()).map(extract);

        let edges = [];
        this.forEachEdge((edge) => edges.push({...edge}));

        let nodes = [];
        this.forEachNode((node) => nodes.push(node.save()));

        let refs = Array.from(this.refs.entries());

        const data = {
            id: this.id,
            global_inputs,
            global_outputs,
            refs,
            edges,
            nodes,
        };

        return Object.freeze(data);
    }

    load_snapshot(snapshot) {
        for (let {name, type} of snapshot.global_inputs) {
            this.addGlobalInput(name, type);
        }

        for (let {name, type} of snapshot.global_outputs) {
            this.addGlobalOutput(name, type);
        }

        for (let [name, id] of snapshot.refs) {
            this.refs.set(name, id);
        }

        for (let nodesnap of snapshot.nodes) {
            const { id, title, pos, type } = nodesnap;
            let node = this.addNode(type, {
                id,
                title,
                pos,
                type,
            });
            node.restore_settings(nodesnap);
        }

        for (let edge of snapshot.edges) {
            this._insertEdge(edge);
            this._notifyConnect(edge);
        }
        this.toposort();

        return this;
    }
}


const DEFAULT_CONFIG = {
    color: '#999',
    bgcolor: '#444',
    boxcolor: '#aef',
    removable: true,
};

export class GraphNodeBase {
    // `state` is programmatically set stuff that should be reactive
    // `settings` is user-controllable stuff that should be reactive
    // other fields are not reactive
    static input(name, type) {
        return {
            name,
            type,
            state: {num_edges: 0},
            settings: {label: null, autoconvert: true}
        };
    }

    static output(name, type) {
        return {
            name,
            type,
            state: {num_edges: 0},
            settings: {label: null}
        };
    }

    constructor({graph, id, title, pos, path},
                vm_factory, inputs, outputs,
                {config = {}, properties = {}} = {}) {

        this.graph = graph;
        this.id = id;
        this.path = path;

        let input_vm = inputs.map(({ state, settings }) => ({state, settings}));
        let output_vm = outputs.map(({ state, settings }) => ({state, settings}));

        this.input_info = inputs.map(({name, type}) => ({name, type}));
        this.output_info = outputs.map(({name, type}) => ({name, type}));

        let defaults = {};

        for (const { name } of inputs) {
            defaults[name] = properties[name] || null;
        }

        let cfg = {...DEFAULT_CONFIG, ...config};

        this.vm = vm_factory(graph, this, {
            title,
            pos,
            inputs: input_vm,
            outputs: output_vm,
            defaults,
            config: cfg
        });

        this.outgoing_data = [];
    }

    defaultForSlot(slot) {
        const { name } = this.input_info[slot];
        let out = this.vm.defaults[name];
        if (out === null)
            out = undefined;
        return out;
    }

    getOutgoingData(slot) {
        const { type } = this.output_info[slot];

        let outgoing = this.outgoing_data[slot];

        if (outgoing && type && type.isUnit) {
            let Ctor = type;
            outgoing = new Ctor(outgoing.valueOf());
        }
        return outgoing;
    }
    getInputData(slot) {
        let src = this.graph.getNodeByInput(this, slot);

        const { autoconvert } = this.vm.inputs[slot].settings;
        const { type } = this.input_info[slot];

        let data = undefined;
        if (src) {
            data = src.node.getOutgoingData(src.slot);
        }

        if (data == undefined) {
            data = this.defaultForSlot(slot);
        }

        if (data !== undefined && type && type.isUnit) {
            if (data.isUnit && autoconvert) {
                data = data.convertTo(type);
            } else {
                let Ctor = type;
                data = new Ctor(data);
            }
        }
        return data;
    }

    setOutputData(slot, data) {
        this.outgoing_data[slot] = data;
    }

    setPosition(x, y) {
        this.vm.pos = [x, y];
    }

    clearOutgoingData() {
        for (let i = 0; i < this.outgoing_data.length; i++)
            this.outgoing_data[i] = null;
    }

    save() {
        const data = {
            id: this.id,
            pos: [...this.vm.pos],
            title: this.vm.title,
            type: this.path,
            input_settings: this.vm.inputs.map(({settings}) => ({...settings})),
            output_settings: this.vm.outputs.map(({settings})=> ({...settings})),
            defaults: Serialization.save(this.vm.defaults),
        };

        return Object.freeze(data);
    }

    restore_settings(nodesnap) {
        for (let i = 0; i < this.vm.inputs.length; i++) {
            this.vm.inputs[i].settings = nodesnap.input_settings[i];
        }
        for (let i = 0; i < this.vm.outputs.length; i++) {
            this.vm.outputs[i].settings = nodesnap.output_settings[i];
        }
        this.vm.defaults = Serialization.restore(nodesnap.defaults);
    }
}
