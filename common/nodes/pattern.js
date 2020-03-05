import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';
import _ from 'lodash';
import Units from '@/common/units';
import Range from '@/common/util/range';

let node_types = [];

function glslNot(x) {
    return glsl.BinOp(glsl.Const(1), '-', x);
}

function glslWhenNeq(x, y) {
    const diff = glsl.BinOp(x, '-', y);
    return glsl.FunctionCall('abs', [glsl.FunctionCall('sign', [diff])]);
}

function glslWhenEq(x, y) {
    return glslNot(glslWhenNeq(x, y));
}

function glslWhenGt(x, y) {
    const diff = glsl.BinOp(x, '-', y);
    const sgn = glsl.FunctionCall('sign', [diff]);
    return glsl.FunctionCall('max', [sgn, glsl.Const(0)]);
}

function glslWhenLt(x, y) {
    return glslWhenGt(y, x);
}

function glslWhenGte(x, y) {
    return glslNot(glslWhenLt(x, y));
}

function glslWhenLte(x, y) {
    return glslNot(glslWhenGt(x, y));
}

class IfNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('clause', Units.Numeric),
            GraphNode.input('trueBranch', Units.Numeric),
            GraphNode.input('falseBranch', Units.Numeric),
        ];
    }

    static getOutputs() {
        return [
            GraphNode.output('result', Units.Numeric),
        ];
    }

    compile(c) {
        const cond = c.getInput(this, 0);
        const t = c.getInput(this, 1);
        const f = c.getInput(this, 1);

        c.setOutput(this, 0, glsl.FunctionCall('mix', [f, t, glslWhenEq(cond, glsl.Const(1))]));
    }
}

IfNode.title = 'if';
node_types.push(['logic/if', IfNode]);

function make_conditional_node(title, fn, n) {

    const node = class extends GraphNode {
        static getInputs() {
            const nodes = [
                GraphNode.input('a', Units.Numeric),
                GraphNode.input('b', Units.Numeric),
            ];
            return nodes.slice(0, n);
        }
        static getOutputs() {
            return [GraphNode.output(title, Units.Numeric)];
        }

        compile(c) {
            const inps = _.range(n).map(i => c.getInput(this, i));
            c.setOutput(this, 0, fn(...inps));
        }
    };
    node.title = title;
    node_types.push([`logic/${title}`, node]);
}


function make_binop_node(type, sym, {a, b, result}) {
    let symbol, named;
    if (typeof(sym) == 'string') {
        symbol = sym;
        named = sym;
    } else {
        symbol = sym.symbol;
        named = sym.named;
    }

    let title = `a ${symbol} b`;
    let BinopNode = class extends GraphNode {
        static getInputs() {
            return [
                GraphNode.input('a', a),
                GraphNode.input('b', b)
            ];
        }

        static getOutputs() {
            return [GraphNode.output(title, result)];
        }

        compile(c) {
            let ai = c.getInput(this, 0);
            let bi = c.getInput(this, 1);

            c.setOutput(this, 0, glsl.BinOp(ai, symbol, bi));
        }
    };

    BinopNode.title = title;
    node_types.push([`${type}/${named}`, BinopNode]);
};

function make_function_node(type, title, fname, args, result) {
    let FuncNode = class extends GraphNode {
        static getInputs() {
            return args.map(([name, argtype]) => GraphNode.input(name, argtype));
        }

        static getOutputs() {
            return [GraphNode.output(title, result)];
        }

        compile(c) {
            let inputs = [];
            for (let i = 0; i < args.length; i++) {
                inputs.push(c.getInput(this, i));
            }

            c.setOutput(this, 0, glsl.FunctionCall(fname, inputs));
        }
    };

    FuncNode.title = title;
    node_types.push([`${type}/${title}`, FuncNode]);
}


// Logic
make_conditional_node('!', glslNot, 1);
make_conditional_node('==', glslWhenEq, 2);
make_conditional_node('!=', glslWhenNeq, 2);
make_conditional_node('&&', (x, y) => {
    return glsl.BinOp(x, '*', y);
}, 2);
make_conditional_node('||', (x, y) => {
    return glsl.FunctionCall('clamp', [glsl.BinOp(x, '+', y), glsl.Const(0), glsl.Const(1)]);
}, 2);
make_conditional_node('<', glslWhenLt, 2);
make_conditional_node('>', glslWhenGt, 2);
make_conditional_node('<=', glslWhenLte, 2);
make_conditional_node('>=', glslWhenGte, 2);

// math
make_binop_node('math', {symbol: '+', named: 'add'}, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '-', named: 'sub'}, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '*', named: 'mul'}, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '/', named: 'div'}, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_function_node('math', 'fract(a)', 'fract',
    [['a', Units.Numeric]],
    Units.Numeric
);

make_function_node('math', 'a % b', 'mod',

    [['a', Units.Numeric], ['b', Units.Numeric]],
    Units.Numeric,
);

make_function_node('math', '|a|', 'abs',
    [['a', Units.Numeric]],
    Units.Numeric,
);

make_function_node('math', 'sqrt(a)', 'sqrt',
    [['a', Units.Numeric]],
    Units.Numeric,
);

make_function_node('math', 'sin(a)', 'sin',
    [['a', Units.Angle]],
    Units.SignedNumeric,
);

make_function_node('math', 'cos(a)', 'cos',
    [['a', Units.Angle]],
    Units.SignedNumeric,
);

make_function_node('math', 'floor(a)', 'floor',
    [['a', Units.Numeric]],
    Units.Numeric,
);

make_function_node('math', 'xʸ', 'pow',
    [['x', Units.Numeric], ['y', Units.Numeric]],
    Units.Numeric,
);

make_function_node('math', 'log₂(x)', 'log2',
    [['x', Units.Numeric]],
    Units.Numeric
);

make_function_node('math', '2ˣ', 'exp2',
    [['x', Units.Numeric]],
    Units.Numeric,
);


make_function_node('math', 'ln(x)', 'ln',
    [['x', Units.Numeric]],
    Units.Numeric
);

make_function_node('math', 'eˣ', 'exp',
    [['x', Units.Numeric]],
    Units.Numeric,
);


class Rotate2D extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('x', Units.Distance),
            GraphNode.input('y', Units.Distance),
            GraphNode.input('theta', Units.Angle),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('x\'', Units.Distance),
            GraphNode.output('y\'', Units.Distance),
        ];
    }
    compile(c) {
        const x = c.getInput(this, 0);
        const y = c.getInput(this, 1);
        const theta = c.getInput(this, 2);

        const sv = c.declare('float', c.variable(), glsl.FunctionCall('sin', [theta]));
        const cv = c.declare('float', c.variable(), glsl.FunctionCall('cos', [theta]));

        const origin = glsl.FunctionCall('vec2', [glsl.Const(0.5)]);

        const vec = glsl.BinOp(glsl.FunctionCall('vec2', [x, y]), '-', origin);

        const mat = c.declare('mat2', c.variable(), glsl.FunctionCall('mat2', [
            cv, glsl.UnOp('-', sv),
            sv, cv
        ]));

        const rotated = glsl.BinOp(mat, '*', vec);
        const final = c.declare('vec2', c.variable(), glsl.BinOp(rotated, '+', origin));

        c.setOutput(this, 0, glsl.Dot(final, 'x'));
        c.setOutput(this, 1, glsl.Dot(final, 'y'));
    }
};

Rotate2D.title = '2D rotation';
node_types.push(['2d/rotate', Rotate2D]);

class Scale2D extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('x', Units.Distance),
            GraphNode.input('y', Units.Distance),
            GraphNode.input('scale', Units.Numeric),
        ];
    }

    static getOutputs() {
        return [
            GraphNode.output('x\'', Units.Distance),
            GraphNode.output('y\'', Units.Distance),
        ];
    }

    compile(c) {
        let x = c.getInput(this, 0);
        let y = c.getInput(this, 1);
        let k = c.getInput(this, 2);

        const vec = glsl.BinOp(k, '*', glsl.FunctionCall('vec2', [x, y]));
        c.setOutput(this, 0, glsl.Dot(vec, 'x'));
        c.setOutput(this, 1, glsl.Dot(vec, 'y'));
    }
}
Scale2D.title = '2D scale';
node_types.push(['2d/scale', Scale2D]);

class Polar2D extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('x', Units.Distance),
            GraphNode.input('y', Units.Distance),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('r', Units.Numeric),
            GraphNode.output('theta', Units.Angle),
        ];
    }
    compile(c) {
        const x = c.getInput(this, 0);
        const y = c.getInput(this, 1);

        const vec = c.declare('vec2', c.variable(), glsl.BinOp(
            glsl.FunctionCall('vec2', [x, y]),
            '-',
            glsl.FunctionCall('vec2', [glsl.Const(0.5)])
        ));
        const vx = glsl.Dot(vec, 'x');
        const vy = glsl.Dot(vec, 'y');
        const r = glsl.BinOp(glsl.Const(2), '*', glsl.FunctionCall('length', [vec]));
        const theta = glsl.BinOp(glsl.FunctionCall('atan', [vy, vx]), '+', glsl.Const(3.1415962));

        c.setOutput(this, 0, r);
        c.setOutput(this, 1, theta);
    }
}
Polar2D.title = '2D polar';
node_types.push(['2d/polar', Polar2D]);

class Scale3D extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('x', Units.Distance),
            GraphNode.input('y', Units.Distance),
            GraphNode.input('z', Units.Distance),
            GraphNode.input('scale', Units.Numeric),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('x\'', Units.Distance),
            GraphNode.output('y\'', Units.Distance),
            GraphNode.output('z\'', Units.Distance),
        ];
    }
    compile(c) {
        let x = c.getInput(this, 0);
        let y = c.getInput(this, 1);
        let z = c.getInput(this, 2);
        let k = c.getInput(this, 3);

        const vec = glsl.BinOp(k, '*', glsl.FunctionCall('vec3', [x, y, z]));
        c.setOutput(this, 0, glsl.Dot(vec, 'x'));
        c.setOutput(this, 1, glsl.Dot(vec, 'y'));
        c.setOutput(this, 2, glsl.Dot(vec, 'z'));
    }
}
Scale3D.title = '3D scale';
node_types.push(['3d/scale', Scale3D]);


class RangeNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('min', Units.Numeric),
            GraphNode.input('max', Units.Numeric),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('range', 'Range'),
        ];
    }
    compile(c) {
        const min = c.getInput(this, 0);
        const max = c.getInput(this, 1);

        c.setOutput(this, 0, glsl.FunctionCall('vec2', [min, max]));
    }
}

RangeNode.title = 'Range';
node_types.push(['util/range', RangeNode]);

class ConstNode extends GraphNode {
    static getInputs() {
        const inp = GraphNode.input('constant', Units.Numeric);
        inp.settings.read_only = true;
        return [inp];
    }
    static getOutputs() {
        return [GraphNode.output('', Units.Numeric)];
    }
    constructor(options) {
        options.properties = {constant: 0, ...options.properties};
        super(options);
    }

    compile(c) {
        c.setOutput(this, 0, c.getInput(this, 0));
    }
};

ConstNode.title = 'Constant';
node_types.push(['util/constant', ConstNode]);

class ClampNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('value', Units.Numeric),
            GraphNode.input('range', 'Range'),
        ];
    }
    static getOutputs() {
        return [GraphNode.output('clamped', Units.Numeric)];
    }
    constructor(options) {

        options.properties = {
            range: new Range(0, 1, 0, 1),
            ...options.properties,
        };

        super(options);
    }

    compile(c) {
        const val = c.getInput(this, 0);
        const range = c.getInput(this, 1);
        const low = glsl.Dot(range, 'x');
        const high = glsl.Dot(range, 'y');
        c.setOutput(this, 0, glsl.FunctionCall('clamp', [val, low, high]));
    }
}
ClampNode.title = 'Clamp';
node_types.push(['util/clamp', ClampNode]);

make_function_node('util', 'step', 'step',
    [
        ['edge', Units.Numeric],
        ['x', Units.Numeric],
    ],
    Units.Numeric
);

make_function_node('util', 'smoothstep', 'smoothstep',
    [
        ['startEdge', Units.Numeric],
        ['endEdge', Units.Numeric],
        ['x', Units.Numeric],
    ],
    Units.Numeric
);

export default function register_pattern_nodes() {
    GraphLib.registerNodeTypes(node_types);
};

class LerpNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('from', Units.Numeric),
            GraphNode.input('to', Units.Numeric),
            GraphNode.input('pct', Units.Percentage),
        ];
    }

    static getOutputs() {
        return [
            GraphNode.output('result', Units.Numeric)
        ];
    }

    compile(c) {
        const a = c.getInput(this, 0);
        const b = c.getInput(this, 1);
        const x = c.getInput(this, 2);

        c.setOutput(this, 0, glsl.FunctionCall('mix', [a, b, x]));
    }
}
LerpNode.title = 'Lerp';
node_types.push(['util/lerp', LerpNode]);
class MirrorNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('t', Units.Numeric)
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('mirrored', Units.Numeric),
        ];
    }

    compile(c) {
        const t = c.getInput(this, 0);
        const mirrored = glsl.BinOp(
            glsl.Const(2),
            '*',
            glsl.FunctionCall('abs', [
            glsl.BinOp(
                t,
                '-',
                glsl.FunctionCall('floor', [glsl.BinOp(t, '+', glsl.Const(0.5))])
            )
        ]));
        c.setOutput(this, 0, mirrored);
    }
}
MirrorNode.title = 'Mirror';
node_types.push(['util/mirror', MirrorNode]);

class RemapNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('value', Units.Numeric),
            GraphNode.input('fromLow', Units.Numeric),
            GraphNode.input('fromHigh', Units.Numeric),
            GraphNode.input('toLow', Units.Numeric),
            GraphNode.input('toHigh', Units.Numeric),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('remapped', Units.Numeric),
        ];
    }
    compile(c) {
        const numInputs = this.input_info.length;

        const args = _.range(numInputs).map(i => c.getInput(this, i));

        c.setOutput(this, 0, glsl.FunctionCall('mapValue', args));
    }
}

RemapNode.title = 'Remap';
node_types.push(['util/remap', RemapNode]);

class MaxNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('a', Units.Numeric),
            GraphNode.input('b', Units.Numeric),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('max', Units.Numeric),
        ];
    }
    compile(c) {
        const a = c.getInput(this, 0);
        const b = c.getInput(this, 1);

        c.setOutput(this, 0, glsl.FunctionCall('max', [a, b]));
    }
}

MaxNode.title = 'max';
node_types.push(['util/max', MaxNode]);

class MinNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('a', Units.Numeric),
            GraphNode.input('b', Units.Numeric),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('min', Units.Numeric),
        ];
    }
    compile(c) {
        const a = c.getInput(this, 0);
        const b = c.getInput(this, 1);

        c.setOutput(this, 0, glsl.FunctionCall('min', [a, b]));
    }
}

MinNode.title = 'min';
node_types.push(['util/min', MinNode]);

