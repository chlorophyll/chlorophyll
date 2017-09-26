import GraphLib, { Graph, GraphNode } from 'chl/graphlib';

import { SchemaDefs } from 'chl/schemas';

import Units from 'chl/units';

import 'chl/testing';

let node_types = [];

class InputNode extends GraphNode {
    constructor(options) {
        const inputs = [GraphNode.input('input', 'string')];
        const outputs = [];

        super(options, inputs, outputs);
    }
}
node_types.push(['/input', InputNode]);

class TypedNode extends GraphNode {
    constructor(options) {
        const inputs = [GraphNode.input('input', Units.Percentage)];
        const outputs = [GraphNode.output('output', Units.Percentage)];
        super(options, inputs, outputs);
    }

    onExecute() {
        this.setOutputData(0, this.getInputData(0));
    }
}
node_types.push(['/typed', TypedNode]);

class OutputNode extends GraphNode {
    constructor(options) {
        const inputs = [];
        const outputs = [GraphNode.output('output', 'string')];

        super(options, inputs, outputs);
    }

    onExecute() {
        this.setOutputData(0, 'beep');
    }
}
node_types.push(['/output', OutputNode]);

class InputOutputNode extends GraphNode {
    constructor(options) {
        const inputs = [GraphNode.input('input', 'string')];
        const outputs = [GraphNode.output('output', 'string')];

        super(options, inputs, outputs);
    }

    onExecute() {
        this.setOutputData(0, this.getInputData(0));
    }
}
node_types.push(['/input-output', InputOutputNode]);

beforeAll(() => {
    GraphLib.registerNodeTypes(node_types);

});

describe('GraphLib', () => {
    it('should register nodes in order', () => {
        let nodeTypes = GraphLib.getNodeTypes().keySeq().toJS();
        expect(nodeTypes).toHaveLength(node_types.length);
        expect(nodeTypes).toEqual(
            expect.arrayContaining(node_types.map(([path, ctor]) => path))
        );
    });
});

describe('Graph', () => {
    it('should let you add nodes', () => {
        let graph = new Graph();
        let added = graph.addNode('/input');

        let nodes = [];

        graph.forEachNode((node) => nodes.push(node));

        expect(nodes).toHaveLength(1);
        expect(nodes).toEqual(expect.arrayContaining([added]));
    });

    it('should emit events when nodes are added', () => {
        let graph = new Graph();
        const nodeEvent = jest.fn();
        graph.addEventListener('node-added', nodeEvent);
        let added = graph.addNode('/input');
        expect(nodeEvent).toHaveBeenCalled();
    });

    it('should let you remove nodes', () => {
        let graph = new Graph();
        let added = graph.addNode('/input');

        graph.removeNode(added);

        let nodes = [];
        graph.forEachNode((node) => nodes.push(node));
        expect(nodes).toHaveLength(0);
    });

    it('should emit events when nodes are removed', () => {
        let graph = new Graph();
        const nodeEvent = jest.fn();
        graph.addEventListener('node-removed', nodeEvent);
        let added = graph.addNode('/input');
        expect(nodeEvent).not.toHaveBeenCalled();

        graph.removeNode(added);
        expect(nodeEvent).toHaveBeenCalled();
    });

    it('should let you connect nodes', () => {
        let graph = new Graph();
        let connectEvent = jest.fn();
        graph.addEventListener('edge-added', connectEvent);
        let a = graph.addNode('/input-output');
        let b = graph.addNode('/input-output');

        graph.connect(a, 0, b, 0);

        expect(graph.numEdgesFromNode(a)).toEqual(1);
        expect(graph.numEdgesToNode(a)).toEqual(0);

        expect(graph.numEdgesFromNode(b)).toEqual(0);
        expect(graph.numEdgesToNode(b)).toEqual(1);

        expect(connectEvent).toHaveBeenCalled();
    });

    it('should let you disconnect nodes', () => {
        let graph = new Graph();
        let disconnectEvent = jest.fn();
        graph.addEventListener('edge-removed', disconnectEvent);
        let a = graph.addNode('/input-output');
        let b = graph.addNode('/input-output');

        let edge = graph.connect(a, 0, b, 0);

        graph.disconnect(edge);
        expect(graph.numEdgesFromNode(a)).toEqual(0);
        expect(graph.numEdgesToNode(a)).toEqual(0);

        expect(graph.numEdgesFromNode(b)).toEqual(0);
        expect(graph.numEdgesToNode(b)).toEqual(0);

        expect(disconnectEvent).toHaveBeenCalled();
    });

    it('should not allow cycles', () => {
        let graph = new Graph();

        let a = graph.addNode('/input-output');
        let b = graph.addNode('/input-output');

        let edge = graph.connect(a, 0, b, 0);

        expect(graph.connect(b, 0, a, 0)).toEqual(false);
    });

    it('should correctly track node refs', () => {
        let graph = new Graph();

        let a = graph.addNode('/input-output', {ref: 'a'});
        let b = graph.addNode('/input-output');

        expect(graph.getNodeByRef('a')).toBe(a);
    });

    it('should have node snapshots that conform to the node schema', () => {
        let graph = new Graph();
        let node = graph.addNode('/input-output');
        expect(node.save()).toMatchSchema(SchemaDefs.object('node'));
    });

    it('should have snapshots that conform to the graph schema for simple graphs', () => {
        let graph = new Graph();
        let a = graph.addNode('/input-output', {ref: 'a'});
        let b = graph.addNode('/input-output');
        graph.connect(a, 0, b, 0);
        expect(graph.save()).toMatchSchema(SchemaDefs.object('graph'));
    });

    it('should properly serialize nodes with units', () => {
        let graph = new Graph();
        let node = graph.addNode('/typed');

        expect(node.save()).toMatchSchema(SchemaDefs.object('node'));

        node.vm.defaults['input'] = new Units.Percentage(0.5);

        expect(node.save()).toMatchSchema(SchemaDefs.object('node'));
    });

    it('should correctly restore saved snapshots', () => {
        let graph = new Graph();
        let a = graph.addNode('/input-output');
        let b = graph.addNode('/input-output');
        let c = graph.addNode('/typed');
        graph.connect(a, 0, b, 0);

        a.vm.defaults['input'] = 'foo';
        c.vm.defaults['input'] = new Units.Percentage(0.5);

        let saved = graph.save();
        let newgraph = Graph.restore(saved);

        expect(newgraph.id).toEqual(graph.id);
        let newa = newgraph.getNodeById(a.id);
        let newb = newgraph.getNodeById(b.id);
        let newc = newgraph.getNodeById(c.id);

        expect(newgraph.numEdgesFromNode(newa)).toEqual(1);
        expect(newgraph.numEdgesToNode(newb)).toEqual(1);
        expect(newa.vm.defaults['input']).toEqual('foo');
        expect(newc.vm.defaults['input']).toEqual(new Units.Percentage(0.5));

        newgraph.forEachEdgeFromNode(newa, (edge) => {
            expect(edge.src_id).toEqual(newa.id);
            expect(edge.src_slot).toEqual(0);
            expect(edge.dst_id).toEqual(newb.id);
            expect(edge.dst_slot).toEqual(0);
        });
    });

    it('should fail to restore snapshots that have cycles', () => {
        let graph = new Graph();
        let a = graph.addNode('/input-output');
        let b = graph.addNode('/input-output');
        graph.connect(a, 0, b, 0);

        let saved = graph.save();

        // tamper with the graph c.c
        let id = saved.edges[0].id+1;
        saved.edges.push({
            id,
            src_id: b.id,
            src_slot: 0,
            dst_id: a.id,
            dst_slot: 0,
        });

        expect(() => Graph.restore(saved)).toThrow();
    });

});
