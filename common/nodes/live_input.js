import Enum from '@/common/util/enum';
import GraphLib, { GraphNode } from '@/common/graphlib';
import Signal from '@/common/osc/signal';
import * as glsl from '@/common/glsl';

/*
 * TODO(cwill):
 * - add string entry & type selector components to config panels
 * - poll input from OSC
*/
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
            argument_type: new Enum(supportedOscTypes, null, oscTypeDescs);
            ...options.properties
        };

        // Will be filled in when node properties are set the first time.
        this.signal = null;

        super(options, [], [], {
            config: { color: '#7496a6', boxcolor: '#69a4bf' }
        });
    }

    onPropertyChange() {
        const params = this.vm.parameters;

        if (params.osc_address) {
            if (this.signal)
                this.signal.address = params.osc_address;
            else
                this.signal = new Signal(this, params.osc_address, [params.argument_type.valueOf()]);
        }

        this.vm.title = `Live input (${this.signal.shortName})`;

        const argType = params.argument_type.valueOf();
        if (!argType)
            return;

        const outputType = Signal.oscToGraphType(argType);
        if (this.output_info.length > 0 && outputType === this.output_info[0].type)
            return;

        const newOutputs = [GraphNode.output('value', outputType)];

        this.updateIOConfig(null, newOutputs);
    }

    compile(c) {
        this.output_info.forEach(({outputName, type}, i) => {
            const uniformName = this.signal.ident;
            const signalVal = c.uniform(type, this.signal.ident, () => this.signal.getValue());
            c.setOutput(this, i, signalVal)
        });
    }
}
LiveInput.title = 'Live input';

export default function register_live_input_nodes() {
    GraphLib.registerNodeType('input/OSC input', LiveInput);
};
