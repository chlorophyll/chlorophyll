import GraphLib, { GraphNode } from '@/common/graphlib';
import Units from '@/common/units';

let node_types = [];

class IfNode extends GraphNode {
    constructor(options) {
        const inputs = [
            GraphNode.input('clause', 'boolean'),
            GraphNode.input('trueBranch'),
            GraphNode.input('falseBranch'),
        ];

        const outputs = [
            GraphNode.output('result')
        ];

        super(options, inputs, outputs);
    }

    onExecute() {
        let clause = this.getInputData(0);
        let trueBranch = this.getInputData(1);
        let falseBranch = this.getInputData(2);
        this.setOutputData(0, clause ? trueBranch : falseBranch);
    }
};

IfNode.title = 'if';

node_types.push(['logic/if', IfNode]);

function make_binop_node(type, sym, fn, {a, b, result}) {
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

        onExecute() {
            let ai = this.getInputData(0);
            let bi = this.getInputData(1);
            this.setOutputData(0, fn(ai, bi));
        }
    };
    BinopNode.title = title;
    node_types.push([`${type}/${named}`, BinopNode]);
};

function make_unary_node(type, title, fn, {a, result}) {

    let UnaryNode = class extends GraphNode {
        constructor(options) {
            const inputs = [GraphNode.input('a', a)];
            const outputs = [GraphNode.output(title, result)];
            super(options, inputs, outputs);
        }

        onExecute() {
            let inp = this.getInputData(0);
            this.setOutputData(0, fn(inp));
        }
    };
    UnaryNode.title = title;
    node_types.push([`${type}/${title}`, UnaryNode]);
}


// Logic

make_unary_node('logic', '!a', (a) => !a, {result: 'boolean'});
make_binop_node('logic', '==', (a, b) => a == b, {result: 'boolean'});
make_binop_node('logic', '&&', (a, b) => a && b, {result: 'boolean'});
make_binop_node('logic', '||', (a, b) => a || b, {result: 'boolean'});

make_binop_node('logic', '<', (a, b) => a < b, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'boolean'
});

make_binop_node('logic', '<=', (a, b) => a <= b, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'boolean'
});

make_binop_node('logic', '>', (a, b) => a > b, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'boolean'
});

make_binop_node('logic', '>=', (a, b) => a >= b, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'boolean'
});

// math
make_binop_node('math', {symbol: '+', named: 'add'}, (a, b) => a+b, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '-', named: 'sub'}, (a, b) => a-b, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '*', named: 'mul'}, (a, b) => a*b, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '/', named: 'div'}, (a, b) => a/b, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '%', named: 'mod'}, (a, b) => a%b, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_unary_node('math', '|a|', Math.abs, {
    a: 'number',
    result: 'number',
});

make_unary_node('math', 'sin(a)', Math.sin, {
    a: 'number',
    result: 'number',
});

make_unary_node('math', 'cos(a)', Math.cos, {
    a: 'number',
    result: 'number',
});

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

    onExecute() {
        let x = this.getInputData(0);
        let y = this.getInputData(1);
        let theta = this.getInputData(2);

        let c = Math.cos(theta);
        let s = Math.sin(theta);

        let xo = x * c - y * s;
        let yo = x * s + y * c;

        this.setOutputData(0, xo);
        this.setOutputData(1, yo);
    }
};

Rotate2D.title = '2D rotation';
node_types.push(['2d/rotate', Rotate2D]);

export default function register_pattern_nodes() {
    GraphLib.registerNodeTypes(node_types);
};

