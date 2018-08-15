import Units from '@/common/units';
import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';


const supportedOscTypes = ['f', 'r'];

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
            argument_type: new Enum(supportedOscTypes, 'f');
            ...options.properties
        };

        super(options, inputs, outputs, {
            config: { color: '#7496a6', boxcolor: '#69a4bf' }
        });
    }

    compile(c) {
        // TODO(cwill)
    }
}
LiveInput.title = 'Live input';

export default function register_live_input_nodes() {
    GraphLib.registerNodeType('input/OSC input', LiveInput);
};
