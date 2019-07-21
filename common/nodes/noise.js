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

function fbm(c, func, args) {
    const dim = args.length;
    const vectype = `vec${dim}`;
    const octaves = 4;
    const gain = 0.5;
    let amplitude = 0.5;
    const lac = 2;

    const p = c.declare(vectype, c.variable(), glsl.FunctionCall(vectype, args));

    const f = c.declare('float', c.variable(), glsl.Const(0));

    for (let i = 0; i < octaves; i++) {
        c.assign(f, glsl.BinOp(
            f,
            '+',
            glsl.BinOp(
                glsl.Const(amplitude), '*', glsl.FunctionCall(func, [p])
            )
        ));
        c.assign(p, glsl.BinOp(p, '*', glsl.Const(lac)));
        amplitude *= gain;
    }
    return f;
}

function makeFractalNoise(dimension) {
    const type = 'simplex';
    const node = class extends GraphNode {
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
            const f = fbm(c, func, args);
            c.setOutput(this, 0, f);
        }
    };
    node.title = `${dimension}d fractal noise`;

    return [`noise/fractal${dimension}d`, node];
}

function makeTimeFractalNoise(fullDimension) {
    const type = 'simplex';
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
            const f = fbm(c, func, args);
            c.setOutput(this, 0, f);
        }
    };
    node.title = `${dimension}d time fractal noise`;
    return [`noise/time/fractal${dimension}d`, node];
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
for (const dimension of noiseDimensions) {
    node_types.push(makeFractalNoise(dimension));
    node_types.push(makeTimeFractalNoise(dimension));
}

export default function register_noise_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
