import 'chl/testing';

import GraphLib from '@/common/graphlib';
import * as registry from '@/common/nodes/registry';

import { Graph } from 'chl/graphlib';
import { SchemaDefs } from 'chl/schemas';


beforeAll(() => registry.refreshFromSavedState({}));

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
