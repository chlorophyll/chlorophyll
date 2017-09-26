import GraphLib, { Graph } from 'chl/graphlib';
import register_nodes from 'chl/patterns/registry';
import 'chl/testing';

beforeAll(() => register_nodes());

describe('GraphLib', () => {
    test('every registered node type meets the schema', () => {
        let nodeTypes = GraphLib.getNodeTypes();

        let graph = new Graph();

        nodeTypes.forEach((ctor, path) => {
            let node = graph.addNode(path);
            expect(node.save()).toMatchSchema('chlorophyll#/definitions/objects/node');
        });
    });
});
