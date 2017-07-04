import GraphLib from './graph';

GraphLib.AutoLayout = function() {
	var defaultOptions = {
		"intCoordinates": true,
		"algorithm": "de.cau.cs.kieler.klay.layered",
		"layoutHierarchy": true,
		"spacing": 20,
		"borderSpacing": 20,
		"edgeSpacingFactor": 0.2,
		"inLayerSpacingFactor": 2.0,
		"nodePlace": "BRANDES_KOEPF",
		"nodeLayering": "NETWORK_SIMPLEX",
		"edgeRouting": "POLYLINE",
		"crossMin": "LAYER_SWEEP",
		"direction": "RIGHT"
	};

	this.layout = function(canvas, callback) {
		callback = callback || console.log;

		var graph = canvas.graph;
		var kgraph = encodeAsKGraph(canvas);

		$klay.layout({
			graph: kgraph,
			options: defaultOptions,
			success: callback
		});
	}

	function encodeAsKGraph(canvas) {
		var graph = canvas.graph;

		var direction = 'RIGHT';
		var portConstraints = 'FIXED_POS';

		var portProperties = {
			inportSide: 'WEST',
			outportSide: 'EAST',
			width: 8,
			height: 8
		};

		var knodes = [];

		graph.forEachNode(function(node, id) {
			var elem = canvas.getNodeElement(node);
			function make_port(is_input) {
				return function(port, slot) {
					var [x,y] = elem.connectionPos(slot, true);
					var porttype = is_input ? 'input' : 'output';
					var label = `node${id}-${porttype}${slot}`
					return {
						id: label,
						width: portProperties.width,
						height: portProperties.height,
						x: x,
						y: y
					}
				}
			}
			var inports = node.inputs.map(make_port(true));
			var outports = node.outputs.map(make_port(false));

			var knode = {
				id: `node${id}`,
				width: elem.width,
				height: elem.height,
				ports: inports.concat(outports),
				properties: {
					'portConstraints': portConstraints
				}
			}
			knodes.push(knode);
		});

		var kedges = [];

		graph.forEachEdge(function(edge, id) {
			kedges.push({
				id: `edge${id}`,
				source: `node${edge.src_id}`,
				sourcePort: `node${edge.src_id}-output${edge.src_slot}`,
				target: `node${edge.dst_id}`,
				targetPort: `node${edge.dst_id}-input${edge.dst_slot}`
			});
		});

		return {
			id: 'graph',
			children: knodes,
			edges: kedges
		}

	}
}
