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

    compile(c) {
        let clause = c.getInput(this, 0);
        let trueBranch = c.getInput(this, 1);
        let falseBranch = c.getInput(this, 2);

        c.setOutput(this, 0, `${clause} ? ${trueBranch} : ${falseBranch}`);
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

        compile(c) {
            let ai = c.getInput(this, 0);
            let bi = c.getInput(this, 1);

            c.setOutput(this, 0, fn(ai, bi));
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

        compile(c) {
            let inp = c.getInput(this, 0);
            c.setOutput(this, 0, fn(inp));
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

make_unary_node('logic', '!a', (a) => `!${a}`, {result: 'bool'});
make_binop_node('logic', '==', (a, b) => `${a} == ${b}`, {result: 'bool'});
make_binop_node('logic', '&&', (a, b) => `${a} && ${b}`, {result: 'bool'});
make_binop_node('logic', '||', (a, b) => `${a} || ${b}`, {result: 'bool'});

make_binop_node('logic', '<', (a, b) => `${a} < ${b}`, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'bool'
});

make_binop_node('logic', '<=', (a, b) => `${a} <= ${b}`, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'bool'
});

make_binop_node('logic', '>', (a, b) => `${a} > ${b}`, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'bool'
});

make_binop_node('logic', '>=', (a, b) => `${a} >= ${b}`, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: 'bool'
});

// math
make_binop_node('math', {symbol: '+', named: 'add'}, (a, b) => `${a}+${b}`, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '-', named: 'sub'}, (a, b) => `${a}-${b}`, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '*', named: 'mul'}, (a, b) => `${a}*${b}`, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '/', named: 'div'}, (a, b) => `${a}/${b}`, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '%', named: 'mod'}, (a, b) => `${a}%{b}`, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_unary_node('math', '|a|', (a) => `abs(${a})`, {
    a: 'float',
    result: 'float',
});

make_unary_node('math', 'sin(a)', (a) => `sin(${a})`, {
    a: 'float',
    result: 'number',
});

make_unary_node('math', 'cos(a)', (a) => `cos(${a})`, {
    a: 'float',
    result: 'float',
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

    compile(c) {
        let x = c.getInput(this, 0);
        let y = c.getInput(this, 1);
        let theta = c.getInput(this, 2);

        let sv = c.declare('float', c.variable(), `sin(${theta})`);
        let cv = c.declare('float', c.variable(), `cos(${theta})`);

        c.setOutput(this, 0, `${x} * ${cv} - ${y} * ${sv}`);
        c.setOutput(this, 1, `${x} * ${sv} + ${y} * ${cv}`);
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

