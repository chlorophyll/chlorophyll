import { GraphLib, GraphNode } from 'chl/graphlib/graph';
import Units from 'chl/units';

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
make_binop_node('math', {symbol: '+', named: 'add'}, Units.Operations.add, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '-', named: 'sub'}, Units.Operations.sub, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '*', named: 'mul'}, Units.Operations.mul, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '/', named: 'div'}, Units.Operations.div, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_binop_node('math', {symbol: '%', named: 'mod'}, Units.Operations.mod, {
    a: Units.Numeric,
    b: Units.Numeric,
    result: Units.Numeric,
});

make_unary_node('math', '|a|', Math.abs, {
    a: Units.Numeric,
    result: Units.Numeric
});

make_unary_node('math', 'sin(a)', Math.sin, {
    a: Units.Numeric,
    result: Units.Numeric
});

make_unary_node('math', 'cos(a)', Math.cos, {
    a: Units.Numeric,
    result: Units.Numeric
});

class MapNode extends GraphNode {
    constructor(options) {
        const inputs = [
            GraphNode.input('value', Units.Numeric),
            GraphNode.input('fromLow', Units.Numeric),
            GraphNode.input('fromHigh', Units.Numeric),
            GraphNode.input('toLow', Units.Numeric),
            GraphNode.input('toHigh', Units.Numeric),
        ];

        const outputs = [GraphNode.output('result', Units.Numeric)];

        super(options, inputs, outputs);
    }

    onExecute() {
        let value = this.getInputData(0);
        let fromLow = this.getInputData(1);
        let fromHigh = this.getInputData(2);
        let toLow = this.getInputData(3);
        let toHigh = this.getInputData(4);

        let fromVal = Units.Operations.sub(value, fromLow);
        let toRange = Units.Operations.sub(toHigh, toLow);
        let fromRange = Units.Operations.sub(fromHigh, fromLow);

        let toVal = Units.Operations.mul(fromVal, Units.Operations.div(toRange, fromRange));
        let output = Units.Operations.add(toVal, toLow);
        this.setOutputData(0, output);
    }
};
MapNode.title = 'map';
node_types.push(['math/map', MapNode]);

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
        let x = this.getInputData(0).valueOf();
        let y = this.getInputData(1).valueOf();
        let theta = this.getInputData(2).valueOf();

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

