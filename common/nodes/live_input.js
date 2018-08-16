import Enum from '@/common/util/enum';
import GraphLib, { GraphNode } from '@/common/graphlib';
import Signals from '@/common/osc/signals';
import * as glsl from '@/common/glsl';


const supportedOscTypes = [null, 'f', 'r'];

class LiveInput extends GraphNode {
    constructor(options) {
        const inputs = [];
        const outputs = [];
        /*
         * TODO(cwill):
         * X figure out how to do non-parameterized config values
         * - add string entry & type selector components to config panels
         * - re-generation of nodes from config values / cfg separate from wiring
         * - poll input from OSC
         */
        options.properties = {
            osc_path: '/',
            argument_type: new Enum(supportedOscTypes, null);
            ...options.properties
        };

        options.parameters = [
            GraphNode.parameter('osc_path', 'string');
            GraphNode.parameter('argument_type', 'Enum');
        ];

        super(options, inputs, outputs, {
            config: { color: '#7496a6', boxcolor: '#69a4bf' }
        });
    }

    compile(c) {
        this.output_info.forEach(({name, type}, i) => {
            // TODO write signal junk
            const inSignal = Signals.declareSignal(this.id, osc_path);
            const signalVal = c.uniform(/* TODO */)
            c.setOutput(this, i, signalVal)
        });
    }
}
LiveInput.title = 'Live input';

export default function register_live_input_nodes() {
    GraphLib.registerNodeType('input/OSC input', LiveInput);
};
