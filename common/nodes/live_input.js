import GraphLib, { GraphNode } from '@/common/graphlib';
import Signal from '@/common/osc/signal';
import Enum from '@/common/util/enum';

const supportedOscTypes = [null, 'f', 'r'];
const oscTypeDescs = ['', 'Float', 'Color'];

class LiveInput extends GraphNode {
    constructor(options) {
        options.parameters = [
            GraphNode.parameter('osc_address', 'string'),
            GraphNode.parameter('argument_type', 'Enum'),
        ];

        options.properties = {
            osc_address: '',
            argument_type: new Enum(supportedOscTypes, null, oscTypeDescs),
            ...options.properties
        };

        super(options, [], [], {
            config: { color: '#7496a6', boxcolor: '#69a4bf' }
        });

        // Will be filled in when node properties are set the first time.
        this.signal = null;
    }

    onPropertyChange() {
        const [oscAddress, argType] = this.vm.parameters.map(p => p.value);

        if (oscAddress) {
            if (this.signal) {
                this.signal.address = oscAddress;
            } else {
                const args = [argType.valueOf()];
                this.signal = new Signal(this, oscAddress, args);
            }
        }

        this.vm.title = `Live input (${this.signal.shortName})`;

        const outputType = Signal.oscToGraphType(argType.valueOf());
        if (!outputType)
            return;

        if (this.output_info.length > 0 && outputType === this.output_info[0].type)
            return;

        const newOutputs = [GraphNode.output('value', outputType)];

        this.updateIOConfig(null, newOutputs);
    }

    compile(c) {
        this.output_info.forEach(({name, type}, i) => {
            const signalVal = c.uniform(type, this.signal.ident, () => this.signal.getValue());
            c.setOutput(this, i, signalVal);
        });
    }
}
LiveInput.title = 'Live input';

export default function register_input_nodes() {
    console.log('registered live input!');
    GraphLib.registerNodeType('input/OSC input', LiveInput);
};
