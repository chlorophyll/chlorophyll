import Range from '@/common/util/range';
import Units from '@/common/units';
import GraphLib, { GraphNode } from '@/common/graphlib';

import Frequency from './util';

let node_types = [];

function make_oscillator(name, waveform) {
    let Oscillator = class extends GraphNode {
        constructor(options) {
            const outputs = [GraphNode.output('result', Units.Percentage)];
            const inputs = [
                GraphNode.input('frequency', 'Frequency'),
                GraphNode.input('amplitude', 'Range'),
                GraphNode.input('phase', Units.Percentage),
            ];
            let frequency = new Frequency(1);

            const properties = {
                frequency,
                amplitude: new Range(0, 1, 0, 1),
                phase: 0,
            };

            const config = {
                visualization: 'oscillator-plotter',
            };

            super(options, inputs, outputs, { properties, config });

            // TODO: rewrite waveform plotter as vue component
        }

        waveform(frequency, amplitude, cycles, t) {
            let phased_t = t + cycles * frequency.sec;
            return waveform(frequency, amplitude, phased_t);
        }

        value(t) {
            let frequency = this.getInputData(0);
            let amplitude = this.getInputData(1);
            let cycles = this.getInputData(2);
            return this.waveform(frequency, amplitude, cycles, t);
        }

        compile(c) {
            let frequency = c.getInput(this, 0);
            let amplitude = c.getInput(this, 1);
            let cycles = c.getInput(this, 2);

            let t = c.getGlobalInput('t');

            let sec = glsl.BinOp(glsl.Const(1.0), '/', frequency);
            let expr = glsl.BinOp(t, '+', glsl.BinOp(cycles, '*', sec));

            let phased_t = c.declare('float', c.variable(), expr);

            let w = waveform(frequency, amplitude, phased_t);
            c.setOutput(this, 0, w);
        }

        onExecute() {
            let t = this.graph.getGlobalInputData('t') / 60;
            let out = this.value(t);
            this.setOutputData(0, out);
        }
    };

    Oscillator.title = `${name} wave`;
    node_types.push([`oscillators/${name}`, Oscillator]);
}

make_oscillator('triangle', function(frequency, amplitude, t) {

    let lower = glsl.Dot(amplitude, 'x');
    let upper = glsl.Dot(amplitude, 'y');

    let a = glsl.BinOp(upper, '-', lower);

    let p = glsl.BinOp(glsl.Const(1.0), '/', glsl.BinOp(glsl.Const(2.0), '*', frequency));

    //p - Math.abs(mod(t, 2*p) - p)

    let triangle = glsl.BinOp(
        glsl.BinOp(a, '/', p),
        '*',
        glsl.BinOp(p, '-',
            glsl.FunctionCall('abs', [
                glsl.BinOp(
                    glsl.FunctionCall('mod', [t, glsl.BinOp(glsl.Const(2), '*', p)]),
                    '-',
                    p
                )
            ])
        ));

    return glsl.BinOp(lower, '+', triangle);
});

make_oscillator('square', function(frequency, amplitude, t) {
    let lower = glsl.Dot(amplitude, 'x');
    let upper = glsl.Dot(amplitude, 'y');

    let p = glsl.BinOp(glsl.Const(1.0), '/', glsl.BinOp(glsl.Const(2.0), '*', frequency));
    let cyc = glsl.FunctionCall('mod', [t, glsl.BinOp(glsl.Const(2), '*', p)]);

    return glsl.TernaryOp(
        glsl.BinOp(cyc, '<', p),
        lower,
        upper
    );
});

make_oscillator('saw', function(frequency, amplitude, t) {
    let lower = glsl.Dot(amplitude, 'x');
    let upper = glsl.Dot(amplitude, 'y');

    let a = glsl.BinOp(upper, '-', lower);

    let p = glsl.BinOp(glsl.Const(1.0), '/', frequency);
    let cyc = glsl.FunctionCall('mod', [t, p]);
    let ratio = glsl.BinOp(cyc, '/', p);

    return glsl.BinOp(lower, '+', glsl.BinOp(a, '*', ratio));
});

make_oscillator('sine', function(frequency, amplitude, t) {
    let lower = glsl.Dot(amplitude, 'x');
    let upper = glsl.Dot(amplitude, 'y');
    let a = glsl.BinOp(glsl.BinOp(upper, '-', lower), '/', glsl.Const(2.0));
    let p = glsl.BinOp(glsl.Const(1.0), '/', frequency);

    let ratio = glsl.BinOp(t, '/', p);

    let waveform = glsl.FunctionCall('sin', [glsl.BinOp(ratio, '*', glsl.Const(2*Math.PI))]);

    return glsl.BinOp(lower, '+', glsl.BinOp(a, '*', glsl.BinOp(waveform, '+', glsl.Const(1))));
});

make_oscillator('cos', function(frequency, amplitude, t) {
    let lower = glsl.Dot(amplitude, 'x');
    let upper = glsl.Dot(amplitude, 'y');
    let a = glsl.BinOp(glsl.BinOp(upper, '-', lower), '/', glsl.Const(2.0));
    let p = glsl.BinOp(glsl.Const(1.0), '/', frequency);

    let ratio = glsl.BinOp(t, '/', p);

    let waveform = glsl.FunctionCall('cos', [glsl.BinOp(ratio, '*', glsl.Const(2*Math.PI))]);

    return glsl.BinOp(lower, '+', glsl.BinOp(a, '*', glsl.BinOp(waveform, '+', glsl.Const(1))));
});

export default function register_oscillator_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
