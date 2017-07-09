import Util from 'chl/util';
import GraphLib from 'chl/graphlib/graph';
import Units from 'chl/units';

import OscillatorPlotter from './plotter';
import Frequency from './util';

function Oscillator() {
    let self = this;
    this.addOutput('result', Units.Percentage);
    this.addInput('frequency', 'frequency');
    this.addInput('amplitude', 'range');
    this.addInput('phase', Units.Percentage);

    this.properties.frequency = new Frequency();
    this.properties.frequency.hz = 1;
    this.properties.amplitude = new Util.Range(0, 1, 0, 1);
    this.properties.phase = 0;

    let width = 325;
    let height = 200;

    let oscElement = document.createElement('div');
    oscElement.style.width = width+'px';
    oscElement.style.height = height+'px';
    oscElement.style.backgroundColor = '#222';
    oscElement.style.clear = 'both';
    oscElement.style.marginBottom = '2em';

    let plotter = new OscillatorPlotter(oscElement, self, {
        width: width,
        height: height,
    });

    this.visualization = {
        enabled: function() { return self.graph.numEdgesToNode(self) == 0; },
        root: oscElement,
        update: plotter.plot
    };
}

Oscillator.prototype.onExecute = function() {
    let t = this.graph.getGlobalInputData('t') / 60;
    let out = this.value(t);
    this.setOutputData(0, new Units.Percentage(out));
};

Oscillator.prototype.phasedTime = function(t) {
    let frequency = this.getInputData(0);
    let cycles = this.getInputData(2);
    return t + Units.Operations.mul(cycles, frequency.sec);
};

export function TriangleWaveOscillator() {
    Oscillator.call(this);
}
TriangleWaveOscillator.title = 'Triangle wave';

TriangleWaveOscillator.prototype = Object.create(Oscillator.prototype);

TriangleWaveOscillator.prototype.value = function(t) {
    let frequency = this.getInputData(0);
    let amplitude = this.getInputData(1);
    let phase = this.getInputData(2);
    t = this.phasedTime(t);
    let lower = amplitude.lower;
    let upper = amplitude.upper;

    let a = upper - lower;

    let freq = frequency.hz;
    let p = 1/(2*freq);

    return lower + (a/p) * (p - Math.abs(t % (2*p) - p) );
    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    return lower + (a/p) * (p - Math.abs(mod(t, 2*p) - p) );
};

GraphLib.registerNodeType('oscillators/triangle', TriangleWaveOscillator);

///

export function SquareWaveOscillator() {
    Oscillator.call(this);
}
SquareWaveOscillator.title = 'Square wave';

SquareWaveOscillator.prototype = Object.create(Oscillator.prototype);

SquareWaveOscillator.prototype.value = function(t) {
    let frequency = this.getInputData(0);
    let amplitude = this.getInputData(1);
    t = this.phasedTime(t);
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
};

GraphLib.registerNodeType('oscillators/square', SquareWaveOscillator);

export function SawWaveOscillator() {
    Oscillator.call(this);
}
SawWaveOscillator.title = 'Saw wave';
SawWaveOscillator.prototype = Object.create(Oscillator.prototype);
SawWaveOscillator.prototype.value = function(t) {
    let frequency = this.getInputData(0);
    let amplitude = this.getInputData(1);
    t = this.phasedTime(t);
    let lower = amplitude.lower;
    let upper = amplitude.upper;

    let p = frequency.sec;

    let cyc = (t % p);
    if (cyc < 0)
        cyc += p;

    return lower + (upper - lower)*(cyc / p);
};
GraphLib.registerNodeType('oscillators/saw', SawWaveOscillator);

export function SineWaveOscillator() {
    Oscillator.call(this);
}

SineWaveOscillator.title = 'Sine wave';
SineWaveOscillator.prototype = Object.create(Oscillator.prototype);
SineWaveOscillator.prototype.value = function(t) {
    let frequency = this.getInputData(0);
    let amplitude = this.getInputData(1);
    t = this.phasedTime(t);
    let lower = amplitude.lower;
    let upper = amplitude.upper;

    let a = (upper - lower) / 2;

    let p = frequency.sec;

    return lower + a * (Math.sin(t*2*Math.PI/p)+1);
};
GraphLib.registerNodeType('oscillators/sine', SineWaveOscillator);

export function CosWaveOscillator() {
    Oscillator.call(this);
}

CosWaveOscillator.title = 'Cos wave';
CosWaveOscillator.prototype = Object.create(Oscillator.prototype);
CosWaveOscillator.prototype.value = function(t) {
    let frequency = this.getInputData(0);
    let amplitude = this.getInputData(1);
    t = this.phasedTime(t);
    let lower = amplitude.lower;
    let upper = amplitude.upper;

    let a = (upper - lower) / 2;

    let p = frequency.sec;

    return lower + a * (Math.cos(t*2*Math.PI/p)+1);
};
GraphLib.registerNodeType('oscillators/cos', CosWaveOscillator);
