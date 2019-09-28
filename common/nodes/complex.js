import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';
import Units from '@/common/units';

const node_types = [];

function complex(re, im) {
    return glsl.FunctionCall('vec2', [re, im]);
}

function cconj(c) {
    return complex(
        glsl.Dot(c, 'x'),
        glsl.UnOp('-', glsl.Dot(c, 'y')),
    );
}

function cmul(c1, c2) {
    const c1x = glsl.Dot(c1, 'x');
    const c1y = glsl.Dot(c1, 'y');
    const c2x = glsl.Dot(c2, 'x');
    const c2y = glsl.Dot(c2, 'y');

    const xx = glsl.BinOp(c1x, '*', c2x);
    const yy = glsl.BinOp(c1y, '*', c2y);

    const xy = glsl.BinOp(c1x, '*', c2y);
    const yx = glsl.BinOp(c1y, '*', c2x);

    return complex(
        glsl.BinOp(xx, '-', yy),
        glsl.BinOp(xy, '+', yx),
    );
}

function cosh(x) {
    const ex = glsl.FunctionCall('exp', [x]);
    const enx = glsl.FunctionCall('exp', [glsl.UnOp('-', x)]);

    return glsl.BinOp(glsl.BinOp(ex, '+', enx), '/', glsl.Const(2));
}

function sinh(x) {
    const ex = glsl.FunctionCall('exp', [x]);
    const enx = glsl.FunctionCall('exp', [glsl.UnOp('-', x)]);

    return glsl.BinOp(glsl.BinOp(ex, '-', enx), '/', glsl.Const(2));
}

class ComplexValue extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('a', Units.Distance),
            GraphNode.input('b', Units.Distance),
        ];
    }

    static getOutputs() {
        return [
            GraphNode.output('a + bi', 'vec2'),
        ];
    }

    compile(c) {
        const a = c.getInput(this, 0);
        const b = c.getInput(this, 1);

        c.setOutput(this, 0, complex(a, b));
    }
}
ComplexValue.title = 'a + bi';
node_types.push(['complex/value', ComplexValue]);

class ComplexMultiply extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('x', 'vec2'),
            GraphNode.input('y', 'vec2'),
        ];
    }

    static getOutputs() {
        return [
            GraphNode.output('x * y', 'vec2'),
        ];
    }

    compile(c) {
        const c1 = c.getInput(this, 0);
        const c2 = c.getInput(this, 1);

        c.setOutput(this, 0, cmul(c1, c2));
    }
}

ComplexMultiply.title = 'complex multiply';
node_types.push(['complex/multiply', ComplexMultiply]);

class ComplexDivide extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('x', 'vec2'),
            GraphNode.input('y', 'vec2'),
        ];
    }

    static getOutputs() {
        return [
            GraphNode.output('x / y', 'vec2'),
        ];
    }

    compile(c) {
        const c1 = c.getInput(this, 0);
        const c2 = c.getInput(this, 1);

        const d = glsl.FunctionCall('dot', [c2, c2]);

        const val = glsl.BinOp(cmul(c1, cconj(c2)), '/', d);
        c.setOutput(this, 0, val);
    }
}

ComplexDivide.title = 'complex divide';
node_types.push(['complex/divide', ComplexDivide]);

class ComplexDomain extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('c', 'vec2'),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('domain(c)', Units.Distance)
        ];
    }

    compile(c) {
        const v = c.getInput(this, 0);

        const x = glsl.Dot(v, 'x');
        const y = glsl.Dot(v, 'y');

        const a = glsl.FunctionCall('atan', [y, x]);

        c.setOutput(this, 0, glsl.BinOp(a, '/', glsl.Const(Math.PI)));
    }
}


ComplexDomain.title = 'domain(complex)';
node_types.push(['complex/domain', ComplexDomain]);

class ComplexAdd extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('x', 'vec2'),
            GraphNode.input('y', 'vec2'),
        ];
    }

    static getOutputs() {
        return [
            GraphNode.output('x + y', 'vec2'),
        ];
    }

    compile(c) {
        const c1 = c.getInput(this, 0);
        const c2 = c.getInput(this, 1);
        c.setOutput(this, 0, glsl.BinOp(c1, '+', c2));
    }
}

ComplexAdd.title = 'a + b';
node_types.push(['complex/add', ComplexAdd]);

class ComplexSubtract extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('x', 'vec2'),
            GraphNode.input('y', 'vec2'),
        ];
    }

    static getOutputs() {
        return [
            GraphNode.output('x - y', 'vec2'),
        ];
    }
    compile(c) {
        const c1 = c.getInput(this, 0);
        const c2 = c.getInput(this, 1);
        c.setOutput(this, 0, glsl.BinOp(c1, '-', c2));
    }
}
ComplexSubtract.title = 'a - b';
node_types.push(['complex/sub', ComplexSubtract]);

class ExpNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('c', 'vec2'),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('exp(c)', 'vec2')
        ];
    }

    compile(c) {
        const c1 = c.getInput(this, 0);

        const x = glsl.Dot(c1, 'x');
        const y = glsl.Dot(c1, 'y');

        const k = glsl.FunctionCall('exp', [x]);

        const cos = glsl.FunctionCall('cos', [y]);
        const sin = glsl.FunctionCall('sin', [y]);

        const re = glsl.BinOp(k, '*', cos);
        const im = glsl.BinOp(k, '*', sin);

        c.setOutput(this, 0, complex(re, im));
    }
}

ExpNode.title = 'exp(c)';
node_types.push(['complex/exp', ExpNode]);

class ComplexSine extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('c', 'vec2'),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('sin(c)', 'vec2')
        ];
    }

    compile(c) {
        const z = c.getInput(this, 0);
        const x = glsl.Dot(z, 'x');
        const y = glsl.Dot(z, 'y');

        const re = glsl.BinOp(glsl.FunctionCall('sin', [x]), '*', cosh(y));
        const im = glsl.BinOp(glsl.FunctionCall('cos', [x]), '*', sinh(y));

        c.setOutput(this, 0, complex(re, im));
    }
}
ComplexSine.title = 'sin(c)';
node_types.push(['complex/sin', ComplexSine]);

class ComplexCosine extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('c', 'vec2'),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('cos(c)', 'vec2')
        ];
    }
    compile(c) {
        const z = c.getInput(this, 0);
        const x = glsl.Dot(z, 'x');
        const y = glsl.Dot(z, 'y');

        const re = glsl.BinOp(glsl.FunctionCall('cos', [x]), '*', cosh(y));
        const im = glsl.UnOp('-', glsl.BinOp(glsl.FunctionCall('sin', [x]), '*', sinh(y)));

        c.setOutput(this, 0, complex(re, im));
    }
}
ComplexCosine.title = 'cos(c)';
node_types.push(['complex/cos', ComplexCosine]);

class ComplexMagnitude extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('c', 'vec2'),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('|c|', Units.Numeric)
        ];
    }
    compile(c) {
        const z = c.getInput(this, 0);
        c.setOutput(this, 0, glsl.FunctionCall('length', [z]));
    }
}
ComplexMagnitude.title = '|c|';
node_types.push(['complex/magnitude', ComplexMagnitude]);

class ReNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('c', 'vec2'),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('Re(c)', Units.Numeric)
        ];
    }
    compile(c) {
        c.setOutput(this, 0, glsl.Dot(c.getInput(this, 0), 'x'));
    }
}
ReNode.title = 'Re(c)';
node_types.push(['complex/re', ReNode]);

class ImNode extends GraphNode {
    static getInputs() {
        return [
            GraphNode.input('c', 'vec2'),
        ];
    }
    static getOutputs() {
        return [
            GraphNode.output('Im(c)', Units.Numeric)
        ];
    }
    compile(c) {
        c.setOutput(this, 0, glsl.Dot(c.getInput(this, 0), 'y'));
    }
}
ImNode.title = 'Im(c)';
node_types.push(['complex/im', ImNode]);


export default function register_complex_nodes() {
    GraphLib.registerNodeTypes(node_types);
}
