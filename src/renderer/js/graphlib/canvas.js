function NodeElement(canvas, node) {
	var self = this;
	var graph = canvas.graph;
	var input_elems = [];
	var output_elems = [];
	self.width = undefined;
	self.height = undefined;

	this.connectionPos = function(slot, is_input) {
		var x = is_input ? 0 : self.width;
		var y = 10 + slot * Const.Graph.NODE_SLOT_HEIGHT;
		return [x,y];
	}

	this.move = function() {
		 nodegroup.attr('transform', 'translate('+node.pos[0]+ ','+node.pos[1]+')');
	}

	this.canvasPos = function(pos) {
		return [node.pos[0] + pos[0], node.pos[1] + pos[1]];
	}

	this.updatePortColor = function(slot, is_input) {
		var portlist = is_input ? input_elems : output_elems;
		var numEdges = graph.numEdgesAtSlot(node, slot, is_input);
		var fillColor = numEdges > 0 ? '#7f7' : '#aaa';
		portlist[slot].circle.attr('fill', fillColor);
	}

	var dragConnection = d3.drag()
		.on('start', function(d) {
			path = canvas.edgeContainer.append('path')
			                           .attr('stroke', '#aaa')
			                           .attr('fill', 'transparent')
			var type = d.type;
			canvas.nodeContainer.selectAll('.node-input').filter(function(datum) {
				return !graph.validConnection(type, datum.type);
			}).attr('fill-opacity', 0.5);
		})
		.on('drag', function(d) {
			var [sx, sy] = self.canvasPos(d.pos);
			var [ex, ey] = d3.mouse(canvas.container.node());
			path.attr('d', Util.bezierByH(sx, sy, ex, ey));
		})
		.on('end', function(d) {
			if (canvas.hover !== undefined) {
				graph.connect(d.node, d.slotnum, canvas.hover.node, canvas.hover.slotnum);
			}
			path.remove();
			canvas.nodeContainer.selectAll('.node-input').attr('fill-opacity', 1);
		});

	var nodegroup = canvas.nodeContainer.append('g');

	var boxgroup = nodegroup.append('g');
	var textgroup = nodegroup.append('g');
	var edges = [];

	nodegroup.attr('id', 'node'+node.id)
	         .on('dblclick', function() {
	         	 graph.dispatchEvent(new CustomEvent('node-opened', {
					 detail: {
						 node: node
					 }
				 }));
			 }, true)
	         .call(d3.drag()
	         .on('start', function() {
				 graph.forEachEdgeToNode(node, function(edge) {
					 var edge_elem = canvas.edge_elements.get(edge.id);
					 edges.push(edge_elem);
				 });
				 graph.forEachEdgeFromNode(node, function(edge) {
					 var edge_elem = canvas.edge_elements.get(edge.id);
					 edges.push(edge_elem);
				 });
			 })
	         .on('drag', function() {
				 node.pos[0] += d3.event.dx;
				 node.pos[1] += d3.event.dy;
				 self.move();
				 for (var i = 0; i < edges.length; i++) {
					 edges[i].updatePath();
				 }
	         })
	         .on('end', function() {
				 edges = [];
				 node.setPosition(node.pos[0], node.pos[1]); // trigger node-moved
			 }));
	self.move();
	var fgcolor = node.color || Const.Graph.NODE_DEFAULT_COLOR;
	var bgcolor = node.bgcolor || Const.Graph.NODE_DEFAULT_BGCOLOR;

	var title_height = Const.Graph.NODE_TITLE_HEIGHT;

	var title_text = textgroup.append('text')
		.attr('x', 16)
		.attr('y', 12 - title_height)
		.style('cursor', 'default')
		.attr('font-family', 'Arial')
		.attr('font-size', '11px')
		.attr('font-weight', 'bold')
		.attr('fill', Const.Graph.NODE_TITLE_COLOR)
		.text(node.title)


	for (var i = 0; i < node.inputs.length; i++) {
		var slot = node.inputs[i];
		var text = slot.label != null ? slot.label : slot.name;
		var val = node.properties[slot.name];
		if (val !== undefined) {
				text += ` (${val})`;
		}
		var input_label = textgroup.append('text')
				.attr('x', 0)
				.attr('y', 0)
				.attr('fill', fgcolor)
				.style('font', '10px Arial')
				.style('cursor', 'default')
				.text(text);
		input_elems.push({
			label: input_label
		});
	}

	for (var i = 0; i < node.outputs.length; i++) {
		var slot = node.outputs[i];
		var text = slot.label != null ? slot.label : slot.name;

		var output_label = textgroup.append('text')
				.attr('x', 0)
				.attr('y', 0)
				.attr('fill', fgcolor)
				.attr('text-anchor', 'end')
				.style('font', '10px Arial')
				.text(text);

		output_elems.push({
			label: output_label
		});
	}

	var title_width = title_text.node().getBBox().width;

	self.width = Math.max(title_width, Const.Graph.NODE_WIDTH);

	var rows = Math.max(node.inputs.length, node.outputs.length);

	for (var i = 0; i < rows; i++) {
		var input_width = 0;
		var output_width = 0;
		if (i < node.inputs.length) {
			var input_width = input_elems[i].label.node().getBBox().width;
		}
		if (i < node.outputs.length) {
			var output_width = output_elems[i].label.node().getBBox().width;
		}

		var row_width = Math.min(
			Const.Graph.NODE_MIN_WIDTH,
			input_width + output_width + 10
		);
		self.width = Math.max(row_width, self.width);
	}
	self.height = Math.max(rows, 1) * Const.Graph.NODE_SLOT_HEIGHT + 5;

	// now that we have the width and height, we can place everything
	var nodebox = boxgroup.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', self.width)
		.attr('height', self.height)
		.style('stroke', fgcolor)
		.style('fill', bgcolor);

	var title_height = Const.Graph.NODE_TITLE_HEIGHT;

	var titlebar = boxgroup.append('rect')
		.attr('x', 0)
		.attr('y', -title_height)
		.attr('width', self.width)
		.attr('height', title_height)
		.attr('fill', fgcolor)
		.attr('stroke', fgcolor)


	var boxcolor = node.boxcolor || Const.Graph.NODE_DEFAULT_BOXCOLOR;
	var titlebox = boxgroup.append('rect')
		.attr('x', 3)
		.attr('y', -title_height+3)
		.attr('width', title_height-6)
		.attr('height', title_height-6)
		.attr('fill', boxcolor);

	if (node.removable != false) {
		var closebox = boxgroup.append('g')
			.attr('transform',
				'translate('+(self.width-title_height+4)+','+(-title_height+4)+')')
			.on('click', function() {
				graph.removeNode(node);
			});

		closebox.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', title_height-8)
			.attr('height', title_height-8)
			.attr('fill', fgcolor);

		closebox.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', title_height-8)
			.attr('y2', title_height-8)
			.attr('stroke-width', '2')
			.attr('stroke', bgcolor);

		closebox.append('line')
			.attr('x1', 0)
			.attr('y1', title_height-8)
			.attr('x2', title_height-8)
			.attr('y2', 0)
			.attr('stroke-width', '2')
			.attr('stroke', bgcolor);
	}

	for (var i = 0; i < node.inputs.length; i++) {
		var slot = node.inputs[i];

		var pos = self.connectionPos(i, true);
		var [x,y] = pos;

		var data = {
			node: node,
			slotnum: i,
			pos,
		}

		input_elems[i].label.attr('x', x+10)
					        .attr('y', y)
					        .attr('dy', '0.3em');
		var circle = boxgroup.append('circle')
			                 .attr('id', 'node'+node.id+'input'+i)
			                 .classed('node-input', true)
			                 .data([{'type': slot.type}])
			                 .attr('cx', x)
			                 .attr('cy', y)
			                 .attr('r', 4)
			                 .attr('fill', '#aaa')
			                 .attr('stroke', 'black');
		boxgroup.append('circle')
		        .data([data])
		        .attr('cx', x)
		        .attr('cy', y)
		        .attr('r', 8)
		        .attr('fill', 'transparent')
		        .on('mouseenter', function(d) {
		        	canvas.hover = d;
		        })
		        .on('mouseleave', function() {
		        	canvas.hover = undefined;
		        })
		        .on('click', function(d) {
					var edge = graph.getIncomingEdge(d.node, d.slotnum);
					if (edge !== undefined)
						graph.disconnect(edge);
		        });

		input_elems[i].circle = circle;
		self.updatePortColor(i, true);

	}
	for (var i = 0; i < node.outputs.length; i++) {
		var pos = self.connectionPos(i, false);
		var [x,y] = pos;
		output_elems[i].label.attr('x', x-10)
						     .attr('y', y)
						     .attr('dy', '0.3em');

		var slot = node.outputs[i];
		var data = {
			node: node,
			type: slot.type,
			slotnum: i,
			pos: pos,
		}
		var circle = boxgroup.append('circle')
		                     .data([data])
		                     .attr('id', 'node'+node.id+'output'+i)
		                     .classed('node-output', true)
		                     .attr('cx', x)
		                     .attr('cy', y)
		                     .attr('r', 4)
		                     .attr('fill', '#aaa')
		                     .attr('stroke', 'black')
		                     .call(dragConnection);
		output_elems[i].circle = circle;
		self.updatePortColor(i, false);
	}

	this.remove = function() {
		nodegroup.remove();
	}

}

function EdgeElement(canvas, edge) {
	var self = this;
	var graph = canvas.graph;
	var path = canvas.edgeContainer.append('path')
	                               .attr('stroke', '#aaa')
	                               .attr('fill', 'transparent');

	var src_elem = canvas.node_elements.get(edge.src_id);
	var dst_elem = canvas.node_elements.get(edge.dst_id);

	src_elem.updatePortColor(edge.src_slot, false);
	dst_elem.updatePortColor(edge.dst_slot, true);

	this.updatePath = function() {

		var src_pos = src_elem.canvasPos(src_elem.connectionPos(edge.src_slot, false));
		var dst_pos = dst_elem.canvasPos(dst_elem.connectionPos(edge.dst_slot, true));

		path.attr('d', Util.bezierByH(src_pos[0], src_pos[1], dst_pos[0], dst_pos[1]));
	}
	self.updatePath();

	this.remove = function() {
		path.remove();
		src_elem.updatePortColor(edge.src_slot, false);
		dst_elem.updatePortColor(edge.dst_slot, true);
	}
}

function GraphCanvas(divNode) {
	var self = this;

	var div = d3.select(divNode);

	div.style('width', '100%')
	   .style('height', '100%');

	var curTransform = d3.zoomIdentity;

	function setTransform(transform) {
		curTransform = transform;
		container.attr('transform', transform);
	}

	//preamble
	var canvas = div.append('svg')
	                .attr('width', '100%')
		            .attr('height', '100%')
					.call(d3.zoom()
					.scaleExtent([0.25, 10])
					.filter(function() {
						if (d3.event.type == 'dblclick')
							return d3.event.target.id == 'grid';
						return !d3.event.button;
					})
					.on('zoom', function() {
						if (self.graph == null)
							return;
						setTransform(d3.event.transform);
					}));
	var pattern = canvas.append('pattern')
	                    .attr('id', 'grid')
	                    .attr('width', 10)
	                    .attr('height', 10)
	                    .attr('patternUnits', 'userSpaceOnUse');
	pattern.append('path')
	       .attr('d', 'M 10 0 L 0 0 0 10')
	       .attr('fill', 'none')
	       .attr('stroke', 'black')
	       .attr('stroke-width', '0.5');

	var rect = canvas.append("rect")
    .attr("width", '100%')
    .attr("height", '100%')
    .style("fill", "none")
    .style("pointer-events", "all");

	var container = self.container = canvas.append('g');

	var grid = container.append('rect')
             .attr("width", '2000%')
             .attr("height", '2000%')
	         .attr('id', 'grid')
	         .style('transform', 'translate(-50%, -50%)')
	         .style('fill', 'url(#grid)');

	self.edgeContainer = container.append('g');
	self.nodeContainer = container.append('g');

	// graph observations
	self.node_elements = new Map();
	self.edge_elements = new Map();

	this.getNodeElement = function(node) {
		return self.node_elements.get(node.id);
	}

	function addNodeToCanvas(node) {
		self.node_elements.set(node.id, new NodeElement(self, node));
	}

	function removeNodeFromCanvas(node) {
		self.node_elements.get(node.id).remove();
		self.node_elements.delete(node.id);
	}

	function addEdgeToCanvas(edge) {
		self.edge_elements.set(edge.id, new EdgeElement(self, edge));
	}

	function removeEdgeFromCanvas(edge) {
		self.edge_elements.get(edge.id).remove();
		self.edge_elements.delete(edge.id);
	}

	function onNodeAdded(ev) {
		addNodeToCanvas(ev.detail.node);
	}
	function onNodeRemoved(ev) {
		removeNodeFromCanvas(ev.detail.node);
	}

	function onEdgeAdded(ev) {
		addEdgeToCanvas(ev.detail.edge);
	}
	function onEdgeRemoved(ev) {
		removeEdgeFromCanvas(ev.detail.edge);
	}

	function onNodeMoved(ev) {
		self.node_elements.get(ev.detail.node.id).move();
	}

	function onNodeModified(ev) {
		removeNodeFromCanvas(ev.detail.node);
		addNodeToCanvas(ev.detail.node);
	}

	function onGraphRestored(ev) {
		self.setGraph(self.graph);
	}

	// graph utilities
	this.clearGraph = function() {
		if (self.graph) {
			self.graph.removeEventListener('node-added', onNodeAdded);
			self.graph.removeEventListener('node-removed', onNodeRemoved);
			self.graph.removeEventListener('node-moved', onNodeMoved);
			self.graph.removeEventListener('node-modified', onNodeModified);
			self.graph.removeEventListener('edge-added', onEdgeAdded);
			self.graph.removeEventListener('edge-removed', onEdgeRemoved);
			self.graph.removeEventListener('graph-restored', onGraphRestored);

			self.nodeContainer.selectAll('*').remove();
			self.edgeContainer.selectAll('*').remove();

			self.node_elements.clear();
			self.edge_elements.clear();

		}
		self.graph = null;
		setTransform(d3.zoomIdentity);
		grid.style('display', 'none');
	}

	this.setGraph = function(graph) {
		self.clearGraph();
		self.graph = graph;
		self.graph.addEventListener('node-added', onNodeAdded);
		self.graph.addEventListener('node-removed', onNodeRemoved);
		self.graph.addEventListener('node-moved', onNodeMoved);
		self.graph.addEventListener('node-modified', onNodeModified);
		self.graph.addEventListener('edge-added', onEdgeAdded);
		self.graph.addEventListener('edge-removed', onEdgeRemoved);
		self.graph.addEventListener('graph-restored', onGraphRestored);
		grid.style('display', '');

		self.graph.forEachNode(addNodeToCanvas);
		self.graph.forEachEdge(addEdgeToCanvas);
	}

	this.coords = function(x, y) {
		var coords = Util.relativeCoords(divNode, x, y);

		var [x1, y1] = curTransform.invert([coords.x, coords.y]);

		return {x: x1, y: y1};
	}

	this.dropNodeAt = function(nodetype, clientX, clientY) {

		if (!self.graph)
			return;

		var node = self.graph.addNode(nodetype);

		var coords = self.coords(clientX, clientY);
		coords.x -= self.node_elements.get(node.id).width / 2;
        coords.y += Const.Graph.NODE_TITLE_HEIGHT / 2;

		node.setPosition(coords.x, coords.y);

	}
	this.clearGraph();

	var layoutEngine = new GraphLib.AutoLayout();

	this.autolayout = function() {
		layoutEngine.layout(self, function(kgraph) {
			kgraph.children.forEach(function(knode) {
				var node_id = parseInt(knode.id.slice(4));
				self.graph.getNodeById(node_id).pos[0] = knode.x;
				self.graph.getNodeById(node_id).pos[1] = knode.y;
			});
		});
		self.setGraph(self.graph); //xxx
	}
}