import Immutable from 'immutable';
import Util from 'chl/util';
import Const from 'chl/const';

import { newgid } from 'chl/vue/store';

function GraphLib_() {
    let self = this;

    this.node_types = Immutable.OrderedMap();

    this.registerNodeType = function(path, constructor) {
        if (Object.getPrototypeOf(constructor) != GraphNode)
            throw new Error('All registered node types must inherit from GraphNode');

        self.node_types = self.node_types.set(path, constructor);
        constructor.type = path;
    };

    this.registerNodeTypes = function(node_types) {
        for (let [path, constructor] of node_types) {
            this.registerNodeType(path, constructor);
        }
    };

    this.getNodeTypes = function() {
        return self.node_types;
    };
};
export let GraphLib = new GraphLib_();
export default GraphLib;


export function Graph() {
    Util.EventDispatcher.call(this);
    let self = this;

    let global_inputs = Immutable.Map();
    let global_outputs = Immutable.Map();

    let nodes = Immutable.OrderedMap(); // key: id, val: node
    let edges_by_src = Immutable.Map(); // key: id, val: edge list
    let edges_by_dst = Immutable.Map(); // key: id, slot; val: edge

    let GREY = 1;
    let BLACK = 2;

    function toposort() {
        let ordered = [];
        let stack = [];

        let visited = new Map();

        nodes.forEach(function(source, source_id) {
            if (visited.has(source_id))
                return;

            stack.push([source_id, false]);

            while (stack.length > 0) {
                let [id, processed] = stack.pop();
                let node = nodes.get(id);
                if (!processed) {
                    let marked = visited.get(id);

                    if (marked == GREY)
                        throw Error('cycle detected');

                    if (marked == BLACK)
                        continue;
                    stack.push([id, true]);
                    visited.set(id, GREY);
                    self.forEachEdgeFromNode(node, function(edge) {
                        stack.push([edge.dst_id, false]);
                    });
                } else {
                    visited.set(id, BLACK);
                    ordered.unshift([id, node]);
                }
            }
        });
        nodes = Immutable.OrderedMap(ordered);
    }
    this.dispatchChange = function(ev) {
        self.dispatchEvent(ev);
        self.dispatchEvent(new CustomEvent('graph-changed'));
    };

    this.validConnection = function(src_type, dst_type) {
        if (!src_type || !dst_type)
            return true;

        if (typeof(src_type) === 'string' && typeof(dst_type) === 'string') {
            return (src_type == dst_type);
        }

        if (src_type == 'number' && dst_type.isUnit) {
            return true;
        }

        return dst_type.isUnit && src_type.isUnit;
    };

    this.addNode = function(path, options = {}) {
        let Ctor = GraphLib.node_types.get(path);

        if (!Ctor) {
            throw Error('unknown node type' + path);
        }

        const id = newgid();
        const graph = this;
        const title = options.title || Ctor.title || path;
        const pos = options.pos || Const.Graph.DEFAULT_POSITION.concat();
        const type = path;

        let node = new Ctor({graph, id, title, pos, type});

        nodes = nodes.set(node.id, node);

        self.dispatchChange(new CustomEvent('node-added', {
            detail: {
                node: node
            }
        }));

        return node;
    };

    this.removeNode = function(node) {
        self.forEachEdgeToNode(node, function(edge) {
            self.disconnect(edge);
        });

        self.forEachEdgeFromNode(node, function(edge) {
            self.disconnect(edge);
        });

        nodes = nodes.delete(node.id);

        self.dispatchChange(new CustomEvent('node-removed', {
            detail: {
                node: node
            }
        }));
    };

    this.connect = function(src, src_slot, dst, dst_slot) {

        let src_type = src.outputs[src_slot].type;
        let dst_type = dst.inputs[dst_slot].type;

        if (!this.validConnection(src_type, dst_type))
            return false;

        let edge = {
            id: newgid(),
            src_id: src.id,
            src_slot, src_slot,
            dst_id: dst.id,
            dst_slot: dst_slot,
        };

        let old_src = edges_by_src;
        let old_dst = edges_by_dst;

        edges_by_src = edges_by_src.updateIn([src.id, src_slot],
            Immutable.Set(), (edgelist) => edgelist.add(edge));

        let prev_edge = edges_by_dst.getIn([dst.id, dst_slot]);

        if (prev_edge)
            self.disconnect(prev_edge);

        edges_by_dst = edges_by_dst.setIn([dst.id, dst_slot], edge);
        try {
            toposort();
            self.dispatchChange(new CustomEvent('edge-added', {
                detail: {
                    edge: edge
                }
            }));
            return edge;
        } catch (e) {
            // a cycle was created
            edges_by_src = old_src;
            edges_by_dst = old_dst;
            return false;
        }
    };

    this.disconnect = function(edge) {
        edges_by_src = edges_by_src.updateIn([edge.src_id, edge.src_slot],
            Immutable.Set(), (edgelist) => edgelist.delete(edge));

        edges_by_dst = edges_by_dst.deleteIn([edge.dst_id, edge.dst_slot]);
        self.dispatchChange(new CustomEvent('edge-removed', {
            detail: {
                edge: edge
            }
        }));
    };

    this.getNodeByInput = function(dst, dst_slot) {
        let edge = edges_by_dst.getIn([dst.id, dst_slot]);

        if (!edge)
            return null;

        let node = nodes.get(edge.src_id);

        return {
            node: node,
            slot: edge.src_slot
        };
    };

    this.getNodeById = function(node_id) {
        return nodes.get(node_id);
    };

    this.runStep = function() {
        nodes.forEach(function(node, id) {
            node.clearOutgoingData();
            node.onExecute();
        });
    };

    this.addGlobalInput = function(name, type) {
        global_inputs = global_inputs.set(name, {
            name: name,
            type: type,
            data: null,
        });
    };
    this.removeGlobalInput = function(name) {
        global_inputs = global_inputs.delete(name);
    };

    this.getGlobalInputData = function(name) {
        return global_inputs.get(name).data;
    };

    this.setGlobalInputData = function(name, data) {
        let input = global_inputs.get(name);
        input.data = data;
    };

    this.addGlobalOutput = function(name, type) {
        global_outputs = global_outputs.set(name, {
            name: name,
            type: type,
            data: null,
        });
    };
    this.removeGlobalOutput = function(name) {
        global_outputs = global_inputs.delete(name);
    };


    this.setGlobalOutputData = function(name, data) {
        let output = global_outputs.get(name);
        output.data = data;
    };

    this.getGlobalOutputData = function(name, data) {
        return global_outputs.get(name).data;
    };

    this.forEachNode = function(f) {
        return nodes.forEach(f);
    };

    this.forEachEdgeToNode = function(node, f) {
        let edges_by_slot = edges_by_dst.get(node.id);

        if (edges_by_slot !== undefined)
            edges_by_slot.forEach(f);
    };

    this.numEdgesToNode = function(node) {
        let edges_by_slot = edges_by_dst.get(node.id);
        if (edges_by_slot !== undefined) {
            return edges_by_slot.count();
        } else {
            return 0;
        }
    };

    this.forEachEdgeFromNode = function(node, f) {
        let edges_by_slot = edges_by_src.get(node.id);

        if (edges_by_slot)
            edges_by_slot.forEach((slot) => slot.forEach(f));
    };

    this.numEdgesFromNode = function(node) {
        let total = 0;
        let edges_by_slot = edges_by_src.get(node.id);

        if (edges_by_slot)
            edges_by_slot.forEach((slot) => total += slot.count());
        return total;
    };

    this.forEachEdgeFromSlot = function(node, slot, f) {
        edges_by_src.getIn([node.id, slot], Immutable.List()).forEach(f);
    };

    this.numEdgesAtSlot = function(node, slot, is_input) {
        if (is_input)
            return self.hasIncomingEdge(node, slot) ? 1 : 0;

        let edgelist = edges_by_src.getIn([node.id, slot]);
        return edgelist ? edgelist.count() : 0;
    };

    this.hasIncomingEdge = function(node, slot) {
        return self.getIncomingEdge(node, slot) !== undefined;
    };

    this.getIncomingEdge = function(node, slot) {
        return edges_by_dst.getIn([node.id, slot]);
    };

    this.forEachEdge = function(f) {
        return self.forEachNode((node) => self.forEachEdgeFromNode(node, f));
    };

    this.snapshot = function() {
        let edges = [];
        self.forEachEdge((edge) => edges.push(Util.clone(edge)));

        let extractInfo = function(slot) {
            return {
                name: slot.name,
                type: slot.type
            };
        };

        return Immutable.fromJS({
            nodes: Array.from(nodes.map((node) => node.snapshot()).values()),
            edges: edges,
            global_inputs: Array.from(global_inputs.map(extractInfo).values()),
            global_outputs: Array.from(global_outputs.map(extractInfo).values()),
        });
    };

    this.restore = function(snapshot) {
        nodes = Immutable.Map(snapshot.get('nodes').map(function(nodesnap) {
            let id = nodesnap.get('id');
            let existingNode = nodes.get(id);
            if (existingNode) {
                existingNode.restore(nodesnap);
                return [id, existingNode];
            } else {
                let type = nodesnap.get('type');
                let constructor = GraphLib.node_types.get(type);

                let node = Object.create(constructor.prototype);
                GraphNode.call(node);
                constructor.call(node);
                node.restore(nodesnap);

                node.graph = self;
                return [id, node];
            }
        }));

        edges_by_src = edges_by_src.clear();
        edges_by_dst = edges_by_dst.clear();

        let edges = snapshot.get('edges').toJS();

        edges_by_src = edges_by_src.withMutations(function(mutable) {
            edges.forEach(function(edge) {
                mutable.updateIn([edge.src_id, edge.src_slot],
                    Immutable.Set(), (edgelist) => edgelist.add(edge));
            });
        });

        edges_by_dst = edges_by_dst.withMutations(function(mutable) {
            edges.forEach(function(edge) {
                mutable.setIn([edge.dst_id, edge.dst_slot], edge);
            });
        });

        let entry = function(slot) {
            let val = {
                name: slot.name,
                type: slot.type,
                data: null
            };
            return [slot.name, val];
        };

        global_inputs = Immutable.Map(snapshot.get('global_inputs').map(entry));

        global_outputs = Immutable.Map(snapshot.get('global_outputs').map(entry));

        self.dispatchEvent(new CustomEvent('graph-restored'));
    };
};

const DEFAULT_CONFIG = {
    color: '#999',
    bgcolor: '#444',
    boxcolor: '#aef',
    removable: false,
};

export class GraphNode {
    static input(name, type) {
        return {name, type, autoconvert: true};
    }

    static output(name, type) {
        return {name, type};
    }

    constructor({graph, id, title, pos, type},
                inputs, outputs,
                {config = {}, properties = {}} = {}) {

        this.graph = graph;
        this.id = id;
        this.title = title;
        this.pos = pos;
        this.type = type;

        this.inputs = inputs;
        this.outputs = outputs;
        this.properties = properties;
        this.config = {...DEFAULT_CONFIG, ...config};
        this.outgoing_data = [];
    }

    getOutgoingData(slot) {
        let output = this.outputs[slot];

        let outgoing = this.outgoing_data[slot];

        if (outgoing && output.type && output.type.isUnit) {
            let Ctor = output.type;
            outgoing = new Ctor(outgoing.valueOf());
        }
        return outgoing;
    }
    getInputData(slot) {
        let src = this.graph.getNodeByInput(this, slot);

        let input = this.inputs[slot];

        let data = undefined;
        if (src) {
            data = src.node.getOutgoingData(src.slot);
        }

        if (data == undefined) {
            data = this.properties[input.name];
        }

        if (data !== undefined && input.type && input.type.isUnit) {
            if (data.isUnit && input.autoconvert) {
                data = data.convertTo(input.type);
            } else {
                let Ctor = input.type;
                data = new Ctor(data);
            }
        }
        return data;
    }

    setOutputData(slot, data) {
        this.outgoing_data[slot] = data;
    }

    setPosition(x, y) {
        this.pos = [x, y];
        this.graph.dispatchChange(new CustomEvent('node-moved', {
            detail: {
                node: this,
                position: this.pos
            }
        }));
    }
    clearOutgoingData() {
        for (let i = 0; i < this.outgoing_data.length; i++)
            this.outgoing_data[i] = null;
    }

    numEdgesToNode() {
        return this.graph.numEdgesToNode(this);
    }

    modified() {
        this.graph.dispatchChange(new CustomEvent('node-modified', {
            detail: {
                node: this
            }
        }));
    }
    snapshot() {
        let input_settings = this.inputs.map(function(input) {
            return {autoconvert: input.autoconvert};
        });
        let data = {
            pos: this.pos,
            defaults: Util.JSON.normalized(this.properties),
            input_settings: input_settings,
            type: this.type,
            id: this.id,
            title: this.title,
        };
        return Immutable.fromJS(data);
    }

    restore(snapshot) {
        let self = this;
        this.pos = snapshot.get('pos').toJS();
        this.properties = Util.JSON.denormalized(snapshot.get('defaults').toJS());
        snapshot.get('input_settings').forEach(function(val, i) {
            self.inputs[i].autoconvert = val.autoconvert;
        });
        this.type = snapshot.get('type');
        this.id = snapshot.get('id');
        this.title = snapshot.get('title');
    }
}
