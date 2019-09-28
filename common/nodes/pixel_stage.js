import GraphLib, { GraphNode } from '@/common/graphlib';

let node_types = [];

// Structural node types for the pattern graph

class OutputColor extends GraphNode {
    static getInputs() {
        return [GraphNode.input('outcolor', 'CRGB')];
    }
    constructor(options) {
        super(options, {
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
