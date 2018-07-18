import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';
import Units from '@/common/units';

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
        let {v: trueBranch, type} = c.getInputAndInferType(this, 1);
        let falseBranch = c.getInput(this, 2);

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
            const inputs = args.map(([name, argtype]) => GraphNode(name, argtype));
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

make_function_node('math', 'a % b', 'mod',
    [['a', Units.Numeric], ['b', Units.Numeric]],
    Units.Numeric,
);

make_function_node('math', '|a|', 'abs',
    [['a', 'float']],
    'float',
);

make_function_node('math', 'sin(a)', 'sin',
    [['a', 'float']],
    'float',
);

make_function_node('math', 'cos(a)', 'cos',
    [['a', 'float']],
    'float',
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
        let x = c.getInput(this, 0);
        let y = c.getInput(this, 1);
        let theta = c.getInput(this, 2);

        let sv = c.declare('float', c.variable(), glsl.FunctionCall('sin', [theta]));
        let cv = c.declare('float', c.variable(), glsl.FunctionCall('cos', [theta]));

        c.setOutput(this, 0, glsl.BinOp(glsl.BinOp(x, '*', cv), '-', glsl.BinOp(y, '*', sv)));
        c.setOutput(this, 1, glsl.BinOp(glsl.BinOp(x, '*', sv), '+', glsl.BinOp(y, '*', cv)));
    }
};

Rotate2D.title = '2D rotation';
node_types.push(['2d/rotate', Rotate2D]);

export default function register_pattern_nodes() {
    GraphLib.registerNodeTypes(node_types);
};

