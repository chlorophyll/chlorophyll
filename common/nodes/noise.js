import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';
import Units from '@/common/units';
import _ from 'lodash';

const noiseTypes = [
    'simplex',
    'classic',
    'periodic',
];

const noiseDimensions = [2, 3, 4];

const dimensionNames = 'xyzw';

function getInputs(dimension) {
    const inputs = [];
    for (let i = 0; i < dimension; i++) {
        const inputName = dimensionNames[i];
        inputs.push(GraphNode.input(inputName, Units.Numeric));
    }
    return inputs;
}

function makeNoiseNode(type, dimension) {
    const staticNode = class extends GraphNode {
        constructor(options) {
            const inputs = getInputs(dimension);
            const outputs = [
                GraphNode.output('noise', Units.Numeric),
            ];
            super(options, inputs, outputs);
        }

        compile(c) {
            const args = _.range(dimension).map(i => c.getInput(this, i));
            const func = c.import(`glsl-noise/${type}/${dimension}d`);
            const vec = glsl.FunctionCall(`vec${dimension}`, args);
            c.setOutput(this, 0, glsl.FunctionCall(func, [vec]));
        }
    };
    staticNode.title = `${dimension}d ${type} noise`;
    return [`noise/${type}${dimension}d`, staticNode];
}

function makeTimeNoiseNode(type, fullDimension) {
    const dimension = fullDimension-1;

    const node = class extends GraphNode {
        constructor(options) {
            const inputs = [
                ...getInputs(dimension),
                GraphNode.input('speed', Units.Percentage),
            ];

            const outputs = [
                GraphNode.output('noise', Units.Numeric),
            ];
            super(options, inputs, outputs);
        }

        compile(c) {
            const args = _.range(dimension).map(i => c.getInput(this, i));
            const speed = c.getInput(this, dimension);
            args.push(glsl.BinOp(speed, '*', c.getGlobalInput('time')));
            const func = c.import(`glsl-noise/${type}/${fullDimension}d`);
            const vec = glsl.FunctionCall(`vec${fullDimension}`, args);
            c.setOutput(this, 0, glsl.FunctionCall(func, [vec]));
        }
    };
    node.title = `${dimension}d ${type} time noise`;
    return [`noise/time/${type}${dimension}d`, node];
}
const node_types = [];
for (const type of noiseTypes) {
    for (const dimension of noiseDimensions) {
        node_types.push(makeTimeNoiseNode(type, dimension));
        node_types.push(makeNoiseNode(type, dimension));
    }
}

export default function register_noise_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
