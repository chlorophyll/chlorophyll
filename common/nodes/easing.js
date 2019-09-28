import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';
import Units from '@/common/units';

const easingFunctions = [
    'back-in-out',
    'back-in',
    'back-out',
    'bounce-in-out',
    'bounce-in',
    'bounce-out',
    'circular-in-out',
    'circular-in',
    'circular-out',
    'cubic-in-out',
    'cubic-in',
    'cubic-out',
    'elastic-in-out',
    'elastic-in',
    'elastic-out',
    'exponential-in-out',
    'exponential-in',
    'exponential-out',
    'linear',
    'quadratic-in-out',
    'quadratic-in',
    'quadratic-out',
    'quartic-in-out',
    'quartic-in',
    'quartic-out',
    'quintic-in-out',
    'quintic-in',
    'quintic-out',
    'sine-in-out',
    'sine-in',
    'sine-out',
];

function makeEasingNode(name) {
    const EasingNode = class extends GraphNode {
        static getInputs() {
            return [
                GraphNode.input('t', Units.Numeric)
            ];
        }
        static getOutputs() {
            return [
                GraphNode.output('eased', Units.Numeric)
            ];
        }

        compile(c) {
            const t = c.getInput(this, 0);
            const func = c.import(`glsl-easings/${name}`);
            c.setOutput(this, 0, glsl.FunctionCall(func, [t]));
        }
    };

    EasingNode.title = name;
    return [`easing/${name}`, EasingNode];
}

const nodeTypes = easingFunctions.map(makeEasingNode);

export default function register_easing_nodes() {
    GraphLib.registerNodeTypes(nodeTypes);
}
