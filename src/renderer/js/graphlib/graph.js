import Util from 'chl/util';

export default const GraphLib = (function() {
	this.node_types = Immutable.OrderedMap();

	this.registerNodeType = function(path, constructor) {
		node_types = node_types.set(path, constructor);

		constructor.type = path;

		for (var key in GraphNode.prototype) {
			if (!constructor.prototype[key])
				constructor.prototype[key] = GraphNode.prototype[key];
		}
	}

	this.getNodeTypes = function() {
		return this.node_types;
	}

	return this;
})();

export Graph = function() {
	Util.EventDispatcher.call(this);
	var self = this;

	var global_inputs = Immutable.Map();
	var global_outputs = Immutable.Map();

	var nodes = Immutable.OrderedMap(); // key: id, val: node
	var edges_by_src = Immutable.Map(); // key: id, val: edge list
	var edges_by_dst = Immutable.Map(); // key: id, slot; val: edge

	var last_id = 0;

	let GREY = 1;
	let BLACK = 2;

	function toposort() {
		var ordered = [];
		var stack = [];

		var visited = new Map();

		nodes.forEach(function(source, source_id) {
			if (visited.has(source_id))
				return;

			stack.push([source_id, false]);

			while (stack.length > 0) {
				var [id, processed] = stack.pop();
				var node = nodes.get(id);
				if (!processed) {
					var marked = visited.get(id);

					if (marked == GREY)
						throw 'cycle detected';

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
	}

	this.validConnection = function(src_type, dst_type) {
		if (!src_type || !dst_type)
			return true;

		if (typeof(src_type) === 'string' || typeof(dst_type) === 'string') {
			return (src_type == dst_type);
		}

		if (dst_type == Units.Numeric) {
			return src_type.isConvertibleUnit !== undefined;
		}

		if (src_type.isConvertibleUnit) {
			return src_type.prototype.isConvertibleTo(dst_type);
		}

		return false;
	}

	this.addNode = function(path, options) {
		var constructor = GraphLib.node_types.get(path);

		if (!constructor) {
			throw "unknown node type"+path;
		}

		var options = options || {};

		if (!options.title)
			options.title = constructor.title || path;

		if (!options.id)
			options.id = last_id++;
		var node = Object.create(constructor.prototype);
		GraphNode.call(node);
		constructor.call(node);

		for (var o in options) {
			node[o] = options[o];
		}

		nodes = nodes.set(node.id, node);

		node.graph = self;
		node.type = path;

		if (!node.properties) node.properties = {};
		if (!node.pos) node.pos = Const.Graph.DEFAULT_POSITION.concat();

		self.dispatchChange(new CustomEvent('node-added', {
			detail: {
				node: node
			}
		}));

		return node;
	}

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
	}

	this.connect = function(src, src_slot, dst, dst_slot) {

		var src_type = src.outputs[src_slot].type;
		var dst_type = dst.inputs[dst_slot].type;

		if (!this.validConnection(src_type, dst_type))
			return false;

		var edge = {
			id: last_id++,
			src_id: src.id,
			src_slot, src_slot,
			dst_id: dst.id,
			dst_slot: dst_slot,
		};

		var old_src = edges_by_src;
		var old_dst = edges_by_dst;

		edges_by_src = edges_by_src.updateIn([src.id, src_slot],
			Immutable.Set(), edgelist => edgelist.add(edge));

		prev_edge = edges_by_dst.getIn([dst.id, dst_slot]);

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
			return true;
		} catch (e) {
			// a cycle was created
			edges_by_src = old_src;
			edges_by_dst = old_dst;
			return false;
		}
	}

	this.disconnect = function(edge) {
		edges_by_src = edges_by_src.updateIn([edge.src_id, edge.src_slot],
			Immutable.Set(), edgelist => edgelist.delete(edge));

		edges_by_dst = edges_by_dst.deleteIn([edge.dst_id, edge.dst_slot]);
		self.dispatchChange(new CustomEvent('edge-removed', {
			detail: {
				edge: edge
			}
		}));
	}

	this.getNodeByInput = function(dst, dst_slot) {
		var edge = edges_by_dst.getIn([dst.id, dst_slot]);

		if (!edge)
			return null;

		var node = nodes.get(edge.src_id);

		return {
			node: node,
			slot: edge.src_slot
		}
	}

	this.getNodeById = function(node_id) {
		return nodes.get(node_id);
	}

	this.runStep = function() {
		nodes.forEach(function(node, id) {
			node.clearOutgoingData();
			node.onExecute();
		});
	}

	this.addGlobalInput = function(name, type) {
		global_inputs = global_inputs.set(name, {
			name: name,
			type: type,
			data: null,
		});
	}
	this.removeGlobalInput = function(name) {
		global_inputs = global_inputs.delete(name);
	}

	this.getGlobalInputData = function(name) {
		return global_inputs.get(name).data;
	}

	this.setGlobalInputData = function(name, data) {
		var input = global_inputs.get(name);
		input.data = data;
	}

	this.addGlobalOutput = function(name, type) {
		global_outputs = global_outputs.set(name, {
			name: name,
			type: type,
			data: null,
		});
	}
	this.removeGlobalOutput = function(name) {
		global_outputs = global_inputs.delete(name);
	}


	this.setGlobalOutputData = function(name, data) {
		var output = global_outputs.get(name);
		output.data = data;
	}

	this.getGlobalOutputData = function(name, data) {
		return global_outputs.get(name).data;
	}

	this.forEachNode = function(f) {
		return nodes.forEach(f);
	}

	this.forEachEdgeToNode = function(node, f) {
		var edges_by_slot = edges_by_dst.get(node.id);

		if (edges_by_slot !== undefined)
			edges_by_slot.forEach(f);
	}

	this.numEdgesToNode = function(node) {
		var edges_by_slot = edges_by_dst.get(node.id);
		if (edges_by_slot !== undefined) {
			return edges_by_slot.count();
		} else {
			return 0;
		}
	}

	this.forEachEdgeFromNode = function(node, f) {
		var edges_by_slot = edges_by_src.get(node.id);

		if (edges_by_slot)
			edges_by_slot.forEach(slot => slot.forEach(f));
	}

	this.forEachEdgeFromSlot = function(node, slot, f) {
		edges_by_src.getIn([node.id, slot], Immutable.List()).forEach(f);
	}

	this.numEdgesAtSlot = function(node, slot, is_input) {
		if (is_input)
			return self.hasIncomingEdge(node, slot) ? 1 : 0;

		edgelist = edges_by_src.getIn([node.id, slot]);
		return edgelist ? edgelist.count() : 0;
	}

	this.hasIncomingEdge = function(node, slot) {
		return self.getIncomingEdge(node, slot) !== undefined;
	}

	this.getIncomingEdge = function(node, slot) {
		return edges_by_dst.getIn([node.id, slot]);
	}

	this.forEachEdge = function(f) {
		return self.forEachNode(node => self.forEachEdgeFromNode(node, f));
	}

	this.snapshot = function() {
		var edges = [];
		self.forEachEdge(edge => edges.push(Util.clone(edge)));

		return Immutable.fromJS({
			nodes: nodes.map(node => node.snapshot()),
			edges: edges,
			global_inputs: global_inputs.map(function(input) {
				return {
					name: input.name,
					type: input.type
				}
			}),
			global_outputs: global_outputs.map(function(output) {
				return {
					name: output.name,
					type: output.type
				}
			}),
			last_id: last_id,
		});
	}

	this.restore = function(snapshot) {
		nodes = snapshot.get('nodes').map(function(nodesnap, id) {
			var existingNode = nodes.get(id);
			if (existingNode) {
				existingNode.restore(nodesnap);
				return existingNode;
			} else {
				var type = nodesnap.get('type');
				var constructor = GraphLib.node_types.get(type);

				var node = Object.create(constructor.prototype);
				GraphNode.call(node);
				constructor.call(node);
				node.restore(nodesnap);

				node.graph = self;
				return node;
			}
		});

		edges_by_src = edges_by_src.clear();
		edges_by_dst = edges_by_dst.clear();

		var edges = snapshot.get('edges').toJS();

		edges_by_src = edges_by_src.withMutations(function(mutable) {
			edges.forEach(function(edge) {
				mutable.updateIn([edge.src_id, edge.src_slot],
					Immutable.Set(), edgelist => edgelist.add(edge));
			});
		});

		edges_by_dst = edges_by_dst.withMutations(function(mutable) {
			edges.forEach(function(edge) {
				mutable.setIn([edge.dst_id, edge.dst_slot], edge);
			});
		});

		last_id = snapshot.get('last_id');

		global_inputs = snapshot.get('global_inputs').map(function(input) {
			return {
				name: input.name,
				type: input.type,
				data: null,
			}
		});

		global_outputs = snapshot.get('global_outputs').map(function(output) {
			return {
				name: output.name,
				type: output.type,
				data: null,
			}
		});

		self.dispatchEvent(new CustomEvent('graph-restored'));
	}

	//hax below

	this.serialize = function() {
		return {};
	}

	this.configure = function() {
		return {};
	}
}


export function GraphNode() {
	this.inputs = [];
	this.outputs = [];
	this.properties = {};

	this.outgoing_data = [];
}

GraphNode.prototype.addInput = function(name, type) {
	this.inputs.push({
		name: name,
		type: type,
	});
}

GraphNode.prototype.addOutput = function(name, type) {
	this.outputs.push({
		name: name,
		type: type
	});
	this.outgoing_data.push(null);
}

GraphNode.prototype.getOutgoingData = function(slot) {
	var output = this.outputs[slot];

	var outgoing = this.outgoing_data[slot];

	if (outgoing && output.type && output.type.isConvertibleUnit)
		outgoing = new output.type(outgoing.valueOf());

	return outgoing;
}

GraphNode.prototype.getInputData = function(slot) {
	var src = this.graph.getNodeByInput(this, slot);

	var input = this.inputs[slot];

	var data = undefined;
	if (src) {
		data = src.node.getOutgoingData(src.slot);
	}

	if (data == undefined) {
		data = this.properties[input.name];
	}

	if (data !== undefined
		&& data.isConvertibleTo !== undefined
		&& input.type
		&& input.type != Units.Numeric) {
		data = data.convertTo(input.type);
	}

	return data;
}

GraphNode.prototype.setOutputData = function(slot, data) {
	this.outgoing_data[slot] = data;
}

GraphNode.prototype.setPosition = function(x,y) {
	this.pos = [x,y];
	this.graph.dispatchChange(new CustomEvent('node-moved', {
		detail: {
			node: this,
			position: this.pos
		}
	}));
}

GraphNode.prototype.clearOutgoingData = function() {
	for (var i = 0; i < this.outgoing_data.length; i++)
		this.outgoing_data[i] = null;
}

GraphNode.prototype.modified = function() {
	this.graph.dispatchChange(new CustomEvent('node-modified', {
		detail: {
			node: this
		}
	}));
}

GraphNode.prototype.snapshot = function() {
	return Immutable.fromJS({
		pos: this.pos,
		properties: Util.JSON.dump(this.properties),
		type: this.type,
		id: this.id,
		title: this.title,
	});
}

GraphNode.prototype.restore = function(snapshot) {
	this.pos = snapshot.get('pos').toJS();
	this.properties = Util.JSON.load(snapshot.get('properties'));
	this.type = snapshot.get('type');
	this.id = snapshot.get('id');
	this.title = snapshot.get('title');
}
