import GraphLib, { GraphNode } from '@/common/graphlib';
import Signal from '@/common/osc/signal';
import OT from '@/common/osc/osc_types';
import Enum from '@/common/util/enum';

const supportedOscTypes = [null, 'f', 'r'];
const oscTypeDescs = ['', 'Float', 'Color'];

class LiveInput extends GraphNode {
    constructor(options) {
        const default_arg_type = new Enum(supportedOscTypes, null, oscTypeDescs);
        options.parameters = [
            GraphNode.parameter('osc_address', 'string', ''),
            GraphNode.parameter('argument_type', 'Enum', default_arg_type),
        ];

        // Generate outputs based on the current argument configuration.
        const outputs = [];
        const argType = default_arg_type.valueOf();
        if (argType !== null)
            outputs.push(OT.toGraphUnit(argType));

        super(options, [], outputs, {
            config: { color: '#7496a6', boxcolor: '#69a4bf' }
        });
    }

    onPropertyChange() {
        const [oscAddress, argEnum] = this.vm.parameters.map(p => p.value);
        const argType = argEnum.valueOf();
        // We may need to update the OSC listener
        this._updateSignal(oscAddress, argType);

        // Reconfigure outputs to match any argument type changes
        const outputType = OT.toGraphUnit(argType);
        if (!outputType)
            return;

        // TODO(cwill) will need to modify this when there are multiple args
        if (this.output_info.length > 0 && outputType === this.output_info[0].type)
            return;

        const newOutputs = [GraphNode.output('value', outputType)];
        this.updateIOConfig(null, newOutputs);
    }

    _updateSignal(oscAddress, argType) {
        if (!oscAddress) {
            this.signal = null;
            this.vm.title = 'Live input';
            return;
        }

        if (this.signal)
            this.signal.update(oscAddress, [argType]);
        else if (argType !== null) {
            this.signal = new Signal(this, oscAddress, [argType]);
            this.signal.enable();
        }

        // Mark the node with part of the OSC address to distinguish it
        if (this.signal)
            this.vm.title = `Live input (${this.signal.shortName})`;
    }

    compile(c) {
        if (this.signal !== null) {
            this.output_info.forEach(({name, type}, i) => {
                const signalName = this.signal.ident;
                c.uniform(type, signalName, () => this.signal.getValue());
                c.setOutput(this, i, c.getGlobalInput(signalName));
            });
        }
    }
}
LiveInput.title = 'Live input';

export default function register_input_nodes() {
    GraphLib.registerNodeType('input/OSC input', LiveInput);
};
