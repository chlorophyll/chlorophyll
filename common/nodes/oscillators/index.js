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

            let expr = `${t} + ${cycles} * 1.0/${frequency}`;

            let phased_t = c.declare('float', c.variable(), expr);

            let w = waveform(c, frequency, amplitude, phased_t);
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

make_oscillator('triangle', function(c, frequency, amplitude, t) {

    let lower = c.declare('float', c.variable(), `${amplitude}[0]`);
    let upper = c.declare('float', c.variable(), `${amplitude}[1]`);

    let a = c.declare('float', c.variable(), `${upper} - ${lower}`);

    let p = c.declare('float', c.variable(), `1.0/(2.0*${frequency})`);

    return `${lower} + ${a}/${p} * (${p}-abs(mod(${t}, 2.0*${p})-${p}))`;
});

make_oscillator('square', function(c, frequency, amplitude, t) {
    let lower = c.declare('float', c.variable(), `${amplitude}[0]`);
    let upper = c.declare('float', c.variable(), `${amplitude}[1]`);

    let p = c.declare('float', c.variable(), `1.0/(2.0*${frequency})`);

    let cyc = c.declare('float', c.variable(), `mod(${t}, 2.0*${p})`);

    return `${cyc} < ${p} ? ${lower} : ${upper}`;

});

make_oscillator('saw', function(c, frequency, amplitude, t) {
    let lower = c.declare('float', c.variable(), `${amplitude}[0]`);
    let upper = c.declare('float', c.variable(), `${amplitude}[1]`);

    let p = c.declare('float', c.variable(), `1.0 / ${frequency}`);

    let cyc = c.declare('float', c.variable(), `mod(${t}, ${p})`);

    return `${lower} + (${upper} - ${lower})*(${cyc} / ${p})`;
});

make_oscillator('sine', function(frequency, amplitude, t) {
    let lower = c.declare('float', c.variable(), `${amplitude}[0]`);
    let upper = c.declare('float', c.variable(), `${amplitude}[1]`);

    let a = c.declare('float', c.variable(), `(${upper} - ${lower}) / 2.0`);

    let p = c.declare('float', c.variable(), `1.0 / ${frequency}`);

    return `${lower} + ${a} * sin(${t}*2*${Math.PI}/${p})+1`;
});

make_oscillator('cos', function(frequency, amplitude, t) {
    let lower = c.declare('float', c.variable(), `${amplitude}[0]`);
    let upper = c.declare('float', c.variable(), `${amplitude}[1]`);

    let a = c.declare('float', c.variable(), `(${upper} - ${lower}) / 2.0`);

    let p = c.declare('float', c.variable(), `1.0 / ${frequency}`);

    return `${lower} + ${a} * cos(${t}*2*${Math.PI}/${p})+1`;
});

export default function register_oscillator_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
