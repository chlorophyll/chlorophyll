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

	var canvas = div.append('svg')
	                .attr('width', '100%')
		            .attr('height', '100%')
					.call(d3.zoom()
					.scaleExtent([0.25, 10])
					.filter(function() {
						if (event.type == 'dblclick')
							return event.target.id == grid;
						return !event.button;
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

	var container = canvas.append('g');

	var grid = container.append('rect')
             .attr("width", '2000%')
             .attr("height", '2000%')
	         .attr('id', 'grid')
	         .style('transform', 'translate(-50%, -50%)')
	         .style('fill', 'url(#grid)');

	var connectionContainer = container.append('g');
	var nodeContainer = container.append('g');
	var curInput;

	var path;
	var dragConnection = d3.drag()
		.on('start', function(d) {
			path = connectionContainer.append('path')
			                          .attr('stroke', '#aaa')
			                          .attr('fill', 'transparent')
			var type = d.type;
			nodeContainer.selectAll('.node-input').filter(function(datum) {
				return datum.type != type;
			}).attr('fill-opacity', 0.5);
		})
		.on('drag', function(d) {
			var sx = d.node.pos[0] + d.x;
			var sy = d.node.pos[1] + d.y;
			var [ex, ey] = d3.mouse(container.node());
			path.attr('d', Util.bezierByH(sx, sy, ex, ey));
		})
		.on('end', function(d) {
			if (curInput !== undefined) {
				makeConnection(d, curInput, path);
			} else {
				path.remove();
			}
			nodeContainer.selectAll('.node-input').attr('fill-opacity', 1);
		});

	function updatePathForLink(path, link) {
		var start_node = self.graph.getNodeById(link.origin_id);
		var start_slot = link.origin_slot;
		var end_node = self.graph.getNodeById(link.target_id);
		var end_slot = link.target_slot;

		var start_pos = start_node.getConnectionPos(false, start_slot);
		var startx = start_pos[0];
		var starty = start_pos[1];

		var end_pos = end_node.getConnectionPos(true, end_slot);
		var endx = end_pos[0];
		var endy = end_pos[1];
		path.attr('d', Util.bezierByH(startx, starty, endx, endy));
	}

	function getInputPort(node, slotnum) {
		return canvas.select('#node'+node.id+'input'+slotnum);
	}

	function getOutputPort(node, slotnum) {
		return canvas.select('#node'+node.id+'output'+slotnum);
	}

	function getConnection(link_id) {
		return canvas.select('#link'+link_id);
	}

	function getNode(node) {
		return canvas.select('#node'+node.id);
	}

	function drawLink(link) {
		var path = connectionContainer.append('path')
			                          .attr('stroke', '#aaa')
			                          .attr('fill', 'transparent')
		                              .attr('id', 'link'+link.id);

		updatePathForLink(path, link);
	}

	function makeConnection(start, end, path) {
		var startport = getOutputPort(start.node, start.slotnum);
		var endport = getInputPort(end.node, end.slotnum);

		var old_link_id = end.node.inputs[end.slotnum].link;

		var valid = start.node.connect(start.slotnum, end.node, end.slotnum);
		var link_id = end.node.inputs[end.slotnum].link;

		if (valid && link_id !== null) {

			if (old_link_id !== null) {
				var old_link = self.graph.links[old_link_id];
				removeLink(old_link, false);
			}

			startport.attr('fill', '#7f7');
			endport.attr('fill', '#7f7');
			var link = self.graph.links[link_id];
			path.attr('id', 'link'+link_id);
			updatePathForLink(path, link);

			var evt = new CustomEvent('connection-change', {
				detail: {
					link: link,
				}
			});

			self.graph.dispatchEvent(evt);
		} else {
			path.remove();
		}
	}

	function removeLink(link, disconnect) {
		var connection = getConnection(link.id);

		var start = self.graph.getNodeById(link.origin_id);
		var start_slot = link.origin_slot;

		var end = self.graph.getNodeById(link.target_id);
		var end_slot = link.target_slot;

		if (disconnect) {
			start.disconnectOutput(start_slot, end);
		}

		connection.remove();

		var links = start.outputs[start_slot].links;

		var num_links = links ? links.length : 0;

		if (num_links == 0) {
			getOutputPort(start, start_slot).attr('fill', '#aaa');
		}
		getInputPort(end, end_slot).attr('fill', '#aaa');
	}

	var removeNode = function(node) {
		for (var i = 0; i < (node.inputs ? node.inputs.length : 0); i++) {
			var link_id = node.inputs[i].link;

			if (link_id != null) {
				var link = self.graph.links[link_id];
				var path = getConnection(link_id);
				path.remove();

				var start_node = self.graph.getNodeById(link.origin_id);
				var start_slot = link.origin_slot;
				var links = start_node.outputs[start_slot].links;
				var num_links = links ? links.length : 0;

				if (num_links == 0)
					getOutputPort(start_node, start_slot).attr('fill', '#aaa');

			}
		}

		for (var i = 0; i < (node.outputs ? node.outputs.length : 0); i++) {
			var output = node.outputs[i];
			for (var l = 0; l < (output.links ? output.links.length : 0); l++) {
				var link_id = output.links[l];
				var path = getConnection(link_id);
				path.remove();

				var link = self.graph.links[link_id];
				var end_node = self.graph.getNodeById(link.target_id);
				var end_slot = link.target_slot;
				getInputPort(end_node, end_slot).attr('fill', '#aaa');
			}
		}
		var nodegroup = getNode(node);
		nodegroup.remove();
	}

	var drawNode = function(node) {
		var nodegroup = nodeContainer.append('g');
		nodegroup.attr('transform', 'translate('+node.pos[0]+','+node.pos[1]+')')
			.attr('id', 'node'+node.id)
			.on('dblclick', function() {
				d3.event.preventDefault();
				if (self.onShowNodePanel)
					self.onShowNodePanel(node);
			}, true)
			.call(d3.drag()
				.on('start', function() { })
					.on('drag', function() {
						node.pos[0] += d3.event.dx;
						node.pos[1] += d3.event.dy;
						nodegroup.attr('transform', 'translate('+node.pos[0]+ ','+node.pos[1]+')');

						for (var i = 0; i < (node.inputs ? node.inputs.length : 0); i++) {
							var link_id = node.inputs[i].link;

							if (link_id != null) {
								var link = self.graph.links[link_id];
								var path = getConnection(link_id);
								updatePathForLink(path, link);
							}
						}

						for (var i = 0; i < (node.outputs ? node.outputs.length : 0); i++) {
							var output = node.outputs[i];
							for (var l = 0; l < (output.links ? output.links.length : 0); l++) {
								var link_id = output.links[l];
								var path = getConnection(link_id);
								var link = self.graph.links[link_id];
								updatePathForLink(path, link);
							}
						}

					}));

		var fgcolor = node.color || LiteGraph.NODE_DEFAULT_COLOR;
		var bgcolor = node.bgcolor || LiteGraph.NODE_DEFAULT_BGCOLOR;
		var nodebox = nodegroup.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', node.size[0])
			.attr('height', node.size[1])
			.style('stroke', fgcolor)
			.style('fill', bgcolor);

		var title_height = LiteGraph.NODE_TITLE_HEIGHT;

		var titlebar = nodegroup.append('rect')
			.data([{x: node.pos[0], y: node.pos[1]}])
			.attr('x', 0)
			.attr('y', -title_height)
			.attr('width', node.size[0])
			.attr('height', title_height)
			.attr('fill', fgcolor)
			.attr('stroke', fgcolor)


		var boxcolor = node.boxcolor || LiteGraph.NODE_DEFAULT_BOXCOLOR;
		var titlebox = nodegroup.append('rect')
			.attr('x', 3)
			.attr('y', -title_height+3)
			.attr('width', title_height-6)
			.attr('height', title_height-6)
			.attr('fill', boxcolor);

		nodegroup.append('text')
			.attr('x', 16)
			.attr('y', 12 - title_height)
			.style('cursor', 'default')
			.attr('font-family', 'Arial')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.attr('fill', LiteGraph.NODE_TITLE_COLOR)
			.text(node.getTitle())

		if (node.removable != false) {
			var closebox = nodegroup.append('g')
				.attr('transform',
					'translate('+(node.size[0]-title_height+4)+','+(-title_height+4)+')')
				.on('click', function() {
					self.graph.remove(node);
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


		if (node.inputs) {
			for (var i = 0; i < node.inputs.length; i++) {
				var slot = node.inputs[i];

				var pos = node.getConnectionPos(true, i);
				var x = pos[0] - node.pos[0];
				var y = pos[1] - node.pos[1];

				var data = {
					node: node,
					slotnum: i,
					x: x,
					y: y
				}
				nodegroup.append('circle')
					.attr('id', 'node'+node.id+'input'+i)
					.classed('node-input', true)
					.data([{'type': slot.type}])
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 4)
					.attr('fill', slot.link != null ? '#7f7' : '#aaa')
					.attr('stroke', 'black');

				nodegroup.append('circle')
					.data([data])
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 8)
					.attr('fill', 'transparent')
					.on('mouseenter', function(d) {
						curInput = d;
					})
					.on('mouseleave', function() {
						curInput = undefined;
					})
					.on('click', function(d) {
						var slot = d.node.inputs[d.slotnum];
						if (slot.link != null) {
							removeLink(self.graph.links[slot.link], true);
						}
					});


				var text = slot.label != null ? slot.label : slot.name;

				nodegroup.append('text')
					.attr('x', x + 10)
					.attr('y', y + 4)
					.attr('fill', fgcolor)
					.style('font', '10px Arial')
					.style('cursor', 'default')
					.text(text);
			}
		}

		if (node.outputs) {
			for (var i = 0; i < node.outputs.length; i++) {
				var slot = node.outputs[i];

				var pos = node.getConnectionPos(false, i);
				var x = pos[0] - node.pos[0];
				var y = pos[1] - node.pos[1];

				var data = {
					node: node,
					type: slot.type,
					slotnum: i,
					x: x,
					y: y
				}
				var fillColor = slot.links && slot.links.length ? "#7F7" : "#AAA";
				nodegroup.append('circle')
					.data([data])
					.attr('id', 'node'+node.id+'output'+i)
					.classed('node-output', true)
					.attr('cx', x-1)
					.attr('cy', y)
					.attr('r', 4)
					.attr('fill', fillColor)
					.attr('stroke', 'black')
					.call(dragConnection);

				var text = slot.label != null ? slot.label : slot.name;

				nodegroup.append('text')
					.attr('x', x - 10)
					.attr('y', y + 4)
					.attr('fill', fgcolor)
					.attr('text-anchor', 'end')
					.style('font', '10px Arial')
					.text(text);
			}
		}
	}

	this.coords = function(x, y) {
		return Util.relativeCoords(divNode, x, y);
	}

	var onNodeAdded = function(evt) {
		drawNode(evt.detail.node);
	}
	var onNodeRemoved = function(evt) {
		removeNode(evt.detail.node);
	}

	this.clearGraph = function() {
		if (this.graph) {
			this.graph.removeEventListener('node-added', onNodeAdded);
			this.graph.removeEventListener('node-removed', onNodeRemoved);
		}
		this.graph = null;
		nodeContainer.selectAll('*').remove();
		connectionContainer.selectAll('*').remove();
		setTransform(d3.zoomIdentity);
		grid.style('display', 'none');
	}

	this.setGraph = function(graph) {
		this.clearGraph();
		this.graph = graph;
		this.graph.addEventListener('node-added', onNodeAdded);
		this.graph.addEventListener('node-removed', onNodeRemoved);
		grid.style('display', '');

		for (var id in this.graph.links) {
			var link = this.graph.links[id];
			drawLink(link);
		}

		for (var i = 0; i < this.graph._nodes.length; i++) {
			var node = this.graph._nodes[i];
			drawNode(node);
		}
	}

		this.redrawNode = function(node) {
			nodeContainer.select('#node'+node.id).remove();
			drawNode(node);
		}

		this.clearGraph();
	}
