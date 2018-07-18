import GraphLib, { GraphNode } from '@/common/graphlib';
import Units from '@/common/units';

let node_types = [];

// Structural node types for the pattern graph

class OutputColor extends GraphNode {
    constructor(options) {
        const inputs = [GraphNode.input('outcolor', 'CRGB')];
        const outputs = [];
        super(options, inputs, outputs, {
            config: {
                color: '#e5a88a',
                boxcolor: '#cc8866',
                removable: false,
            }
        });
    }

    compile(c) {
        c.setGlobalOutput('outcolor', c.getInput(this, 0));
    }
}

OutputColor.title = 'Output Color';

node_types.push(['lowlevel/output/color', OutputColor]);

export default function register_pixel_stage_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
