import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';
import _ from 'lodash';
import Units from '@/common/units';
import Range from '@/common/util/range';

let node_types = [];

class IfNode extends GraphNode {
    constructor(options) {
        const inputs = [
            GraphNode.input('clause', 'bool'),
            GraphNode.input('trueBranch'),
            GraphNode.input('falseBranch'),
        ];

        const outputs = [
            GraphNode.output('result')
        ];

        super(options, inputs, outputs);
    }

    compile(c) {
        let clause = c.getInput(this, 0);
        let {v: trueBranch, type} = c.getInputAndInferType(this, 1, 'number');
        let falseBranch = c.getInput(this, 2);

        if (!type) {
            type = 'number';
        }

        c.setOutput(this, 0, glsl.TernaryOp(clause, trueBranch, falseBranch), type);
    }
};

IfNode.title = 'if';

node_types.push(['logic/if', IfNode]);

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
        constructor(options) {
            const inputs = [
                GraphNode.input('a', a),
                GraphNode.input('b', b)
            ];

            const outputs = [GraphNode.output(title, result)];

            super(options, inputs, outputs);
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

function make_unary_node(type, sym, {a, result}) {
    let title = `${sym}a`;

    let UnaryNode = class extends GraphNode {
        constructor(options) {
            const inputs = [GraphNode.input('a', a)];
            const outputs = [GraphNode.output(title, result)];
            super(options, inputs, outputs);
        }

        compile(c) {
            let inp = c.getInput(this, 0);
            c.setOutput(this, 0, glsl.UnOp(sym, inp));
        }
    };
    UnaryNode.title = title;
    node_types.push([`${type}/${title}`, UnaryNode]);
}

function make_function_node(type, title, fname, args, result) {
    let FuncNode = class extends GraphNode {
        constructor(options) {
            const inputs = args.map(([name, argtype]) => GraphNode.input(name, argtype));
            const outputs = [GraphNode.output(title, result)];
            super(options, inputs, outputs);
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

make_unary_node('logic', '!', {result: 'bool'});
make_binop_node('logic', '==', {result: 'bool'});
make_binop_node('logic', '&&', {result: 'bool'});
make_binop_node('logic', '||', {result: 'bool'});

make_binop_node('logic', '<', {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'bool'
});

make_binop_node('logic', '<=', {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'bool'
});

make_binop_node('logic', '>', {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'bool'
});

make_binop_node('logic', '>=', {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'bool'
});

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
    constructor(options) {
        const inputs = [
            GraphNode.input('x', Units.Distance),
            GraphNode.input('y', Units.Distance),
            GraphNode.input('theta', Units.Angle),
        ];
        const outputs = [
            GraphNode.output('x\'', Units.Distance),
            GraphNode.output('y\'', Units.Distance),
        ];
        super(options, inputs, outputs);
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
    constructor(options) {
        const inputs = [
            GraphNode.input('x', Units.Distance),
            GraphNode.input('y', Units.Distance),
            GraphNode.input('scale', Units.Numeric),
        ];
        const outputs = [
            GraphNode.output('x\'', Units.Distance),
            GraphNode.output('y\'', Units.Distance),
        ];
        super(options, inputs, outputs);
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
    constructor(options) {
        const inputs = [
            GraphNode.input('x', Units.Distance),
            GraphNode.input('y', Units.Distance),
        ];

        const outputs = [
            GraphNode.output('r', Units.Numeric),
            GraphNode.output('theta', Units.Angle),
        ];
        super(options, inputs, outputs);
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
    constructor(options) {
        const inputs = [
            GraphNode.input('x', Units.Distance),
            GraphNode.input('y', Units.Distance),
            GraphNode.input('z', Units.Distance),
            GraphNode.input('scale', Units.Numeric),
        ];
        const outputs = [
            GraphNode.output('x\'', Units.Distance),
            GraphNode.output('y\'', Units.Distance),
            GraphNode.output('z\'', Units.Distance),
        ];
        super(options, inputs, outputs);
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
    constructor(options) {
        let inputs = [
            GraphNode.input('min', Units.Numeric),
            GraphNode.input('max', Units.Numeric),
        ];

        let outputs = [
            GraphNode.output('range', 'Range'),
        ];

        super(options, inputs, outputs);
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
    constructor(options) {
        const inp = GraphNode.input('constant', Units.Numeric);
        inp.settings.read_only = true;
        const inputs = [inp];
        const outputs = [
            GraphNode.output('', Units.Numeric),
        ];
        options.properties = {constant: 0, ...options.properties};
        super(options, inputs, outputs);
    }

    compile(c) {
        c.setOutput(this, 0, c.getInput(this, 0));
    }
};

ConstNode.title = 'Constant';
node_types.push(['util/constant', ConstNode]);

class ClampNode extends GraphNode {
    constructor(options) {
        const inputs = [
            GraphNode.input('value', Units.Numeric),
            GraphNode.input('range', 'Range'),
        ];

        options.properties = {
            range: new Range(0, 1, 0, 1),
            ...options.properties,
        };

        const outputs = [GraphNode.output('clamped', Units.Numeric)];

        super(options, inputs, outputs);
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

export default function register_pattern_nodes() {
    GraphLib.registerNodeTypes(node_types);
};

class LerpNode extends GraphNode {
    constructor(options) {
        const inputs = [
            GraphNode.input('from', Units.Numeric),
            GraphNode.input('to', Units.Numeric),
            GraphNode.input('pct', Units.Percentage),
        ];

        const outputs = [
            GraphNode.output('result', Units.Numeric)
        ];
        super(options, inputs, outputs);
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
    constructor(options) {
        const inputs = [
            GraphNode.input('t', Units.Numeric)
        ];

        const outputs = [
            GraphNode.output('mirrored', Units.Numeric),
        ];
        super(options, inputs, outputs);
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
    constructor(options) {
        const inputs = [
            GraphNode.input('value', Units.Numeric),
            GraphNode.input('fromLow', Units.Numeric),
            GraphNode.input('fromHigh', Units.Numeric),
            GraphNode.input('toLow', Units.Numeric),
            GraphNode.input('toHigh', Units.Numeric),
        ];

        const outputs = [
            GraphNode.output('remapped', Units.Numeric),
        ];

        super(options, inputs, outputs);
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
    constructor(options) {
        const inputs = [
            GraphNode.input('a', Units.Numeric),
            GraphNode.input('b', Units.Numeric),
        ];

        const outputs = [
            GraphNode.output('max', Units.Numeric),
        ];

        super(options, inputs, outputs);
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
    constructor(options) {
        const inputs = [
            GraphNode.input('a', Units.Numeric),
            GraphNode.input('b', Units.Numeric),
        ];

        const outputs = [
            GraphNode.output('min', Units.Numeric),
        ];

        super(options, inputs, outputs);

    }

    compile(c) {
        const a = c.getInput(this, 0);
        const b = c.getInput(this, 1);

        c.setOutput(this, 0, glsl.FunctionCall('min', [a, b]));
    }
}

MinNode.title = 'min';
node_types.push(['util/min', MinNode]);

