import GraphLib, { Graph } from 'chl/graphlib';
import register_nodes from 'chl/patterns/registry';
import schemas from 'chl/schemas';

beforeAll(() => register_nodes());

let validateNode = schemas.getSchema('chlorophyll#/definitions/objects/node');

describe('GraphLib', () => {
    test('every registered node type meets the schema', () => {
        let nodeTypes = GraphLib.getNodeTypes();

        let graph = new Graph();

        nodeTypes.forEach((ctor, path) => {
            let node = graph.addNode(path);
            validateNode(node.save());
            expect(validateNode.errors).toBe(null);
        });
    });
});
