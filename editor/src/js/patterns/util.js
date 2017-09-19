import { GraphLib, GraphNode } from 'chl/graphlib/graph';
import Units from 'chl/units';

import * as Transform from 'chl/mapping/transform';
import * as Projection from 'chl/mapping/projection';


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

    onExecute() {
        this.graph.setGlobalOutputData('outcolor', this.getInputData(0));
    }
}

OutputColor.title = 'Output Color';

node_types.push(['lowlevel/output/color', OutputColor]);

class TimeInput extends GraphNode {
    constructor(options) {
        const outputs = [GraphNode.output('t', Units.Numeric)];
        const inputs = [];
        super(options, inputs, outputs);
    }

    onExecute() {
        this.setOutputData(0, this.graph.getGlobalInputData('t'));
    }
};

TimeInput.title = 'TimeInput';

export default function register_util_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
