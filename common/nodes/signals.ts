import GraphLib, { GraphNode } from '@/common/graphlib';
import Signal from '@/common/osc/signal';

class LiveInput extends GraphNode {
    public title: string = 'OSC Signal';

    constructor(options) {
        super(options, [], [], {
            config: { color: '#7496a6', boxcolor: '#69a4bf' }
        });
    }

    onPropertyChange() {
    }

    compile(c) {
    }
}

export default function register_input_nodes() {
    GraphLib.registerNodeType('input/OSC Address', LiveInput);
};

