import Util from 'chl/util';
import GraphLib, { GraphNode } from 'chl/graphlib';
import Units from '@/common/units';

import OscillatorPlotter from './plotter';
import Frequency from './util';

let node_types = [];

function make_oscillator(name, waveform) {
    let Oscillator = class extends GraphNode {
        constructor(options) {
            const outputs = [GraphNode.output('result', Units.Percentage)];
            const inputs = [
                GraphNode.input('frequency', 'frequency'),
                GraphNode.input('amplitude', 'range'),
                GraphNode.input('phase', Units.Percentage),
            ];
            let frequency = new Frequency(1);

            const properties = {
                frequency,
                amplitude: new Util.Range(0, 1, 0, 1),
                phase: new Units.Percentage(0),
            };
            super(options, inputs, outputs, { properties });

            // rewrite this to use Vue...
            const width = 325;
            const height = 200;
            let oscElement = document.createElement('div');
            oscElement.style.width = width+'px';
            oscElement.style.height = height+'px';
            oscElement.style.backgroundColor = '#222';
            oscElement.style.clear = 'both';
            oscElement.style.marginBottom = '2em';

            let plotter = new OscillatorPlotter(oscElement, this, {
                width: width,
                height: height,
            });

            this.visualization = {
                enabled: () => this.numEdgesToNode() == 0,
                root: oscElement,
                update: plotter.plot
            };
        }

        value(t) {
            let frequency = this.getInputData(0);
            let amplitude = this.getInputData(1);
            let cycles = this.getInputData(2);
            let phased_t = t + Units.Operations.mul(cycles, frequency.sec);

            return waveform(frequency, amplitude, phased_t);
        }

        onExecute() {
            let t = this.graph.getGlobalInputData('t') / 60;
            let out = this.value(t);
            this.setOutputData(0, new Units.Percentage(out));
        }
    };

    Oscillator.title = `${name} wave`;
    node_types.push([`oscillators/${name}`, Oscillator]);
}

make_oscillator('triangle', function(frequency, amplitude, t) {
    let lower = amplitude.lower;
    let upper = amplitude.upper;

    let a = upper - lower;

    let freq = frequency.hz;
    let p = 1/(2*freq);

    function mod(n, m) {
        return ((n % m) + m) % m;
    };

    return lower + (a/p) * (p - Math.abs(mod(t, 2*p) - p) );
});

make_oscillator('square', function(frequency, amplitude, t) {
    let lower = amplitude.lower;
    let upper = amplitude.upper;

    let freq = frequency.hz;
    let p = 1/(2*freq);

    let c = t % (2*p);

    if (c < 0)
        c += 2*p;

    if (c < p) {
        return lower;
    } else {
        return upper;
    }
});

make_oscillator('saw', function(frequency, amplitude, t) {
    let lower = amplitude.lower;
    let upper = amplitude.upper;

    let p = frequency.sec;

    let cyc = (t % p);
    if (cyc < 0)
        cyc += p;

    return lower + (upper - lower)*(cyc / p);
});

make_oscillator('sine', function(frequency, amplitude, t) {
    let lower = amplitude.lower;
    let upper = amplitude.upper;

    let a = (upper - lower) / 2;

    let p = frequency.sec;

    return lower + a * (Math.sin(t*2*Math.PI/p)+1);
});

make_oscillator('cos', function(frequency, amplitude, t) {
    let lower = amplitude.lower;
    let upper = amplitude.upper;

    let a = (upper - lower) / 2;

    let p = frequency.sec;

    return lower + a * (Math.cos(t*2*Math.PI/p)+1);
});

export default function register_oscillator_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
