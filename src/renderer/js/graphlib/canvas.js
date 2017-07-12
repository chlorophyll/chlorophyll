import * as d3 from 'd3';
import Const from 'chl/const';
import Util from 'chl/util';
import GraphAutoLayout from './layout';

function NodeElement(canvas, node) {
    let self = this;
    let graph = canvas.graph;
    let input_elems = [];
    let output_elems = [];
    self.width = undefined;
    self.height = undefined;

    this.connectionPos = function(slot, is_input) {
        let x = is_input ? 0 : self.width;
        let y = 10 + slot * Const.Graph.NODE_SLOT_HEIGHT;
        return [x, y];
    };

    this.move = function() {
         nodegroup.attr('transform', 'translate('+node.pos[0]+ ','+node.pos[1]+')');
    };

    this.transitionMove = function(newx, newy, duration) {
        let edges = [];
        graph.forEachEdgeToNode(node, function(edge) {
            let edge_elem = canvas.edge_elements.get(edge.id);
            edges.push(edge_elem);
        });
        graph.forEachEdgeFromNode(node, function(edge) {
            let edge_elem = canvas.edge_elements.get(edge.id);
            edges.push(edge_elem);
        });
        nodegroup.transition()
            .duration(duration)
            .tween('node.move', function() {
                let x = d3.interpolateNumber(node.pos[0], newx);
                let y = d3.interpolateNumber(node.pos[1], newy);
                return function(t) {
                    let xpos = x(t);
                    let ypos = y(t);
                    node.pos[0] = xpos;
                    node.pos[1] = ypos;
                    self.move();
                    edges.forEach((e) => e.updatePath());
                };
            });
    };

    this.canvasPos = function(pos) {
        return [node.pos[0] + pos[0], node.pos[1] + pos[1]];
    };

    this.updatePortColor = function(slot, is_input) {
        let portlist = is_input ? input_elems : output_elems;
        let numEdges = graph.numEdgesAtSlot(node, slot, is_input);
        let fillColor = numEdges > 0 ? '#7f7' : '#aaa';
        portlist[slot].circle.attr('fill', fillColor);
    };

    let path = null;
    let dragConnection = d3.drag()
        .on('start', function(d) {
            path = canvas.edgeContainer.append('path')
                                       .attr('stroke', '#aaa')
                                       .attr('fill', 'transparent');
            let type = d.type;
            canvas.nodeContainer.selectAll('.node-input').filter(function(datum) {
                return !graph.validConnection(type, datum.type);
            }).attr('fill-opacity', 0.5);
        })
        .on('drag', function(d) {
            let [sx, sy] = self.canvasPos(d.pos);
            let [ex, ey] = d3.mouse(canvas.container.node());
            path.attr('d', Util.bezierByH(sx, sy, ex, ey));
        })
        .on('end', function(d) {
            if (canvas.hover !== undefined) {
                graph.connect(d.node, d.slotnum, canvas.hover.node, canvas.hover.slotnum);
            }
            path.remove();
            canvas.nodeContainer.selectAll('.node-input').attr('fill-opacity', 1);
        });

    let nodegroup = canvas.nodeContainer.append('g');

    let boxgroup = nodegroup.append('g');
    let textgroup = nodegroup.append('g');
    let edges = [];

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
                     let edge_elem = canvas.edge_elements.get(edge.id);
                     edges.push(edge_elem);
                 });
                 graph.forEachEdgeFromNode(node, function(edge) {
                     let edge_elem = canvas.edge_elements.get(edge.id);
                     edges.push(edge_elem);
                 });
             })
             .on('drag', function() {
                 node.pos[0] += d3.event.dx;
                 node.pos[1] += d3.event.dy;
                 self.move();
                 for (let i = 0; i < edges.length; i++) {
                     edges[i].updatePath();
                 }
             })
             .on('end', function() {
                 edges = [];
                 node.setPosition(node.pos[0], node.pos[1]); // trigger node-moved
             }));
    self.move();
    let fgcolor = node.color || Const.Graph.NODE_DEFAULT_COLOR;
    let bgcolor = node.bgcolor || Const.Graph.NODE_DEFAULT_BGCOLOR;

    const title_height = Const.Graph.NODE_TITLE_HEIGHT;

    let title_text = textgroup.append('text')
        .attr('x', 16)
        .attr('y', 12 - title_height)
        .style('cursor', 'default')
        .attr('font-family', 'Arial')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', Const.Graph.NODE_TITLE_COLOR)
        .text(node.title);


    for (let i = 0; i < node.inputs.length; i++) {
        let slot = node.inputs[i];
        let text = slot.label != null ? slot.label : slot.name;
        let val = node.properties[slot.name];
        if (val !== undefined) {
                text += ` (${val})`;
        }
        let input_label = textgroup.append('text')
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

    for (let i = 0; i < node.outputs.length; i++) {
        let slot = node.outputs[i];
        let text = slot.label != null ? slot.label : slot.name;

        let output_label = textgroup.append('text')
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

    const title_width = title_text.node().getBBox().width + 20 + (title_height+4);

    self.width = Math.max(title_width, Const.Graph.NODE_WIDTH);

    let rows = Math.max(node.inputs.length, node.outputs.length);

    for (let i = 0; i < rows; i++) {
        let input_width = 0;
        let output_width = 0;
        if (i < node.inputs.length) {
            input_width = input_elems[i].label.node().getBBox().width;
        }
        if (i < node.outputs.length) {
            output_width = output_elems[i].label.node().getBBox().width;
        }

        let row_width = Math.min(
            Const.Graph.NODE_MIN_WIDTH,
            input_width + output_width + 10
        );
        self.width = Math.max(row_width, self.width);
    }
    self.height = Math.max(rows, 1) * Const.Graph.NODE_SLOT_HEIGHT + 5;

    // now that we have the width and height, we can place everything
    // Node box
    boxgroup.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', self.width)
        .attr('height', self.height)
        .style('stroke', fgcolor)
        .style('fill', bgcolor);

    // Title bar
    boxgroup.append('rect')
        .attr('x', 0)
        .attr('y', -title_height)
        .attr('width', self.width)
        .attr('height', title_height)
        .attr('fill', fgcolor)
        .attr('stroke', fgcolor);


    let boxcolor = node.boxcolor || Const.Graph.NODE_DEFAULT_BOXCOLOR;
    // Title box
    boxgroup.append('rect')
        .attr('x', 3)
        .attr('y', -title_height+3)
        .attr('width', title_height-6)
        .attr('height', title_height-6)
        .attr('fill', boxcolor);

    if (node.removable != false) {
        let closebox = boxgroup.append('g')
            .attr('transform',
                'translate('+(self.width-title_height+4)+','+(-title_height+4)+')')
            .on('click', function() {
                graph.removeNode(node);
            });

        closebox.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', title_height-4)
            .attr('height', title_height-4)
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

    for (let i = 0; i < node.inputs.length; i++) {
        let slot = node.inputs[i];

        let pos = self.connectionPos(i, true);
        let [x, y] = pos;

        let data = {
            node: node,
            slotnum: i,
            pos,
        };

        input_elems[i].label.attr('x', x+10)
                            .attr('y', y)
                            .attr('dy', '0.3em');
        let circle = boxgroup.append('circle')
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
                    let edge = graph.getIncomingEdge(d.node, d.slotnum);
                    if (edge !== undefined)
                        graph.disconnect(edge);
                });

        input_elems[i].circle = circle;
        self.updatePortColor(i, true);

    }
    for (let i = 0; i < node.outputs.length; i++) {
        let pos = self.connectionPos(i, false);
        let [x, y] = pos;
        output_elems[i].label.attr('x', x-10)
                             .attr('y', y)
                             .attr('dy', '0.3em');

        let slot = node.outputs[i];
        let data = {
            node: node,
            type: slot.type,
            slotnum: i,
            pos: pos,
        };
        let circle = boxgroup.append('circle')
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
    };

}

function EdgeElement(canvas, edge) {
    let self = this;
    let path = canvas.edgeContainer.append('path')
                                   .attr('stroke', '#aaa')
                                   .attr('fill', 'transparent');

    let src_elem = canvas.node_elements.get(edge.src_id);
    let dst_elem = canvas.node_elements.get(edge.dst_id);

    src_elem.updatePortColor(edge.src_slot, false);
    dst_elem.updatePortColor(edge.dst_slot, true);

    this.updatePath = function() {

        let src_pos = src_elem.canvasPos(src_elem.connectionPos(edge.src_slot, false));
        let dst_pos = dst_elem.canvasPos(dst_elem.connectionPos(edge.dst_slot, true));

        path.attr('d', Util.bezierByH(src_pos[0], src_pos[1], dst_pos[0], dst_pos[1]));
    };
    self.updatePath();

    this.remove = function() {
        path.remove();
        src_elem.updatePortColor(edge.src_slot, false);
        dst_elem.updatePortColor(edge.dst_slot, true);
    };
}

export default function GraphCanvas(divNode) {
    let self = this;

    let div = d3.select(divNode);

    div.style('width', '100%')
       .style('height', '100%');

    let curTransform = d3.zoomIdentity;

    function setTransform(transform) {
        curTransform = transform;
        self.container.attr('transform', transform);
    }

    // preamble
    //
    let zoom = d3.zoom()
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
                    });

    let canvas = div.append('svg')
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .call(zoom);

    let pattern = canvas.append('pattern')
                        .attr('id', 'grid')
                        .attr('width', 10)
                        .attr('height', 10)
                        .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('path')
           .attr('d', 'M 10 0 L 0 0 0 10')
           .attr('fill', 'none')
           .attr('stroke', 'black')
           .attr('stroke-width', '0.5');

    canvas.append('rect')
    .attr('width', '100%')
    .attr('height', '100%')
    .style('fill', 'none')
    .style('pointer-events', 'all');

    self.container = canvas.append('g');

    let grid = self.container.append('rect')
             .attr('width', '2000%')
             .attr('height', '2000%')
             .attr('id', 'grid')
             .style('transform', 'translate(-50%, -50%)')
             .style('fill', 'url(#grid)');

    self.edgeContainer = self.container.append('g');
    self.nodeContainer = self.container.append('g');

    // graph observations
    self.node_elements = new Map();
    self.edge_elements = new Map();

    this.getNodeElement = function(node) {
        return self.node_elements.get(node.id);
    };

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

        canvas.call(zoom.transform, d3.zoomIdentity);
        grid.style('display', 'none');
    };

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
    };

    this.coords = function(x, y) {
        let coords = Util.relativeCoords(divNode, x, y);

        let [x1, y1] = curTransform.invert([coords.x, coords.y]);

        return {x: x1, y: y1};
    };

    this.dropNodeAt = function(nodetype, clientX, clientY) {

        if (!self.graph)
            return;

        let node = self.graph.addNode(nodetype);

        let coords = self.coords(clientX, clientY);
        coords.x -= self.node_elements.get(node.id).width / 2;
        coords.y += Const.Graph.NODE_TITLE_HEIGHT / 2;

        node.setPosition(coords.x, coords.y);

    };
    this.clearGraph();

    let layoutEngine = new GraphAutoLayout();

    function zoomFit(bounds, options) {
        let paddingPercent = options.paddingPercent || 0.75;
        let transitionDuration = options.duration || 0;
        let parent = divNode;
        let fullWidth = parent.clientWidth,
            fullHeight = parent.clientHeight;
        let width = bounds.width,
            height = bounds.height;

        let midX = bounds.x + width / 2;

        if (width == 0 || height == 0) return; // nothing to fit
        let scale = ((paddingPercent || 0.75) / Math.max(width / fullWidth, height / fullHeight));

        let transform = d3.zoomIdentity
                          .translate(fullWidth / 2 - scale * midX, 0)
                          .scale(scale);
        canvas.transition()
              .duration(transitionDuration || 0) // milliseconds
              .call(zoom.transform, transform)
              .on('end', options.after);
    }


    this.autolayout = function() {
        layoutEngine.layout(self, function(kgraph) {
            kgraph.children.forEach(function(knode) {
                let node_id = parseInt(knode.id.slice(4));
                self.node_elements.get(node_id).transitionMove(knode.x, knode.y, 250);
            });
            let bounds = {
                width: kgraph.width,
                height: kgraph.height,
                x: 0,
                y: 0
            };
            zoomFit(bounds, {
                paddingPercent: 0.95,
                duration: 250 /* ms */,
            });
        });
    };
}
