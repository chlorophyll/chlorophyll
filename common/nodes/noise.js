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
        static getInputs() {
            return getInputs(dimension);
        }
        static getOutputs() {
            return [
                GraphNode.output('noise', Units.Numeric),
            ];
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
        static getInputs() {
            return [
                ...getInputs(dimension),
                GraphNode.input('speed', Units.Percentage),
            ];
        }
        static getOutputs() {
            return [
                GraphNode.output('noise', Units.Numeric),
            ];
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

function makeWorleyNoise(dimension) {
    const node = class extends GraphNode {
        static getInputs() {
            return [
                ...getInputs(dimension),
                GraphNode.input('jitter', Units.Percentage),
            ];
        }
        static getOutputs() {
            return [
                GraphNode.output('F1', Units.Numeric),
                GraphNode.output('F2', Units.Numeric),
            ];
        }
        compile(c) {
            const args = _.range(dimension).map(i => c.getInput(this, i));
            const jitter = c.getInput(this, dimension);
            const func = c.import(`glsl-worley/worley${dimension}D`);
            const vec = glsl.FunctionCall(`vec${dimension}`, args);
            const F = c.declare('vec2', c.variable(), glsl.FunctionCall(func, [vec, jitter, glsl.Bool(false)]));
            c.setOutput(this, 0, glsl.Dot(F, 'x'));
            c.setOutput(this, 1, glsl.Dot(F, 'y'));
        }
    };
    node.title = `${dimension}d worley noise`;
    return [`noise/worley${dimension}d`, node];
};
function makeTimeWorleyNoise(fullDimension) {
    const dimension = fullDimension-1;
    const node = class extends GraphNode {
        static getInputs() {
            return [
                ...getInputs(dimension),
                GraphNode.input('jitter', Units.Percentage),
                GraphNode.input('speed', Units.Percentage),
            ];
        }
        static getOutputs() {
            return [
                GraphNode.output('F1', Units.Numeric),
                GraphNode.output('F2', Units.Numeric),
            ];
        }
        compile(c) {
            const args = _.range(dimension).map(i => c.getInput(this, i));
            const jitter = c.getInput(this, dimension);
            const speed = c.getInput(this, dimension+1);
            args.push(glsl.BinOp(speed, '*', c.getGlobalInput('time')));
            const func = c.import(`glsl-worley/worley${fullDimension}D`);
            const vec = glsl.FunctionCall(`vec${fullDimension}`, args);
            const F = c.declare('vec2', c.variable(), glsl.FunctionCall(func, [vec, jitter, glsl.Bool(false)]));
            c.setOutput(this, 0, glsl.Dot(F, 'x'));
            c.setOutput(this, 1, glsl.Dot(F, 'y'));
        }
    };
    node.title = `${dimension}d time worley noise`;
    return [`noise/time/worley${dimension}d`, node];
};

function makeNoiseNode(type, dimension) {
    const staticNode = class extends GraphNode {
        static getInputs() {
            return getInputs(dimension);
        }

        static getOutputs() {
            return [
                GraphNode.output('noise', Units.Numeric),
            ];
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
        static getInputs() {
            return [
                ...getInputs(dimension),
                GraphNode.input('speed', Units.Percentage),
            ];
        }
        static getOutputs() {
            return [
                GraphNode.output('noise', Units.Numeric),
            ];
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

const worleyDimensions = [2, 3];
for (const dimension of worleyDimensions) {
    node_types.push(makeWorleyNoise(dimension));
    node_types.push(makeTimeWorleyNoise(dimension));
}

export default function register_noise_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
