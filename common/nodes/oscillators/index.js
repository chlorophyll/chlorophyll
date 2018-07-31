import Range from '@/common/util/range';
import Units from '@/common/units';
import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';

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

            options.properties = { ...properties, ...options.properties };

            super(options, inputs, outputs, { config });
        }

        waveform(frequency, amplitude, time) {
            return waveform(frequency, amplitude, time);
        }

        compile(c) {
            let frequency = c.getInput(this, 0);
            let amplitude = c.getInput(this, 1);
            let cycles = c.getInput(this, 2);

            let t = glsl.BinOp(c.getGlobalInput('t'), '/', glsl.Const(60));

            let sec = glsl.BinOp(glsl.Const(1.0), '/', frequency);
            let expr = glsl.BinOp(t, '+', glsl.BinOp(cycles, '*', sec));

            let phased_t = c.declare('float', c.variable(), expr);

            let w = waveform(frequency, amplitude, phased_t);
            c.setOutput(this, 0, w);
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
