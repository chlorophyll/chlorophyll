import GraphLib, { Graph } from 'chl/graphlib';
import { SchemaDefs } from 'chl/schemas';
import register_nodes from '@/common/nodes/registry';
import 'chl/testing';

beforeAll(() => register_nodes());

describe('GraphLib', () => {
    test('every registered node type meets the schema', () => {
        let nodeTypes = GraphLib.getNodeTypes();

        let graph = new Graph();

        nodeTypes.forEach((ctor, path) => {
            let node = graph.addNode(path);
            expect(node.save()).toMatchSchema(SchemaDefs.object('node'));
        });
    });
});
