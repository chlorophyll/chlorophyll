import GraphLib, { Graph, GraphNode } from 'chl/graphlib';

import 'chl/testing';

class InputNode extends GraphNode {
    constructor(options) {
        const inputs = [GraphNode.input('input', 'string')];
        const outputs = [];

        super(options, inputs, outputs);
    }
}

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

beforeAll(() => {
    GraphLib.registerNodeType('/output', OutputNode);
    GraphLib.registerNodeType('/input', InputNode);
    GraphLib.registerNodeType('/input-output', InputOutputNode);

});

describe('GraphLib', () => {
    it('should register nodes in order', () => {
        let nodeTypes = GraphLib.getNodeTypes().keySeq().toJS();
        expect(nodeTypes).toHaveLength(3);
        expect(nodeTypes).toEqual(
            expect.arrayContaining(['/input', '/output', '/input-output'])
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

    it('should have node snapshots that conform to the node schema', () => {
        let graph = new Graph();
        let node = graph.addNode('/input-output');
        expect(node.save()).toMatchSchema('chlorophyll#/definitions/objects/node');
    });

    it('should have snapshots that conform to the graph schema for simple graphs', () => {
        let graph = new Graph();
        let a = graph.addNode('/input-output');
        let b = graph.addNode('/input-output');
        graph.connect(a, 0, b, 0);

        expect(graph.save()).toMatchSchema('chlorophyll#/definitions/objects/graph');

    });
});
