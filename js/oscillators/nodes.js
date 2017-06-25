function Oscillator() {
	var self = this;
	this.addOutput('result', Units.Percentage);
	this.addInput('frequency', 'frequency');
	this.addInput('amplitude', 'range');
	this.addInput('phase', Units.Numeric);

	this.properties.frequency = new Frequency();
	this.properties.frequency.hz = 1;
	this.properties.amplitude = new Util.Range(0, 100, 0, 100);
	this.properties.phase = 0;

	var width = 250;
	var height = 200;

	var container = document.createElement('div');
	container.style.width = width+'px';
	container.style.height = height+'px';
	container.style.backgroundColor = '#222';

	var plotter = new OscillatorPlotter(container, {
		width: width,
		height: height,
	});

	this.visualization = {
		enabled: function() { return self.graph.numEdgesToNode(self) == 0 },
		root: container,
		update: function() { plotter.plot(self) }
	}
}

Oscillator.prototype.onExecute = function() {
	var t = this.graph.getGlobalInputData('t') / 60;
	var out = this.value(t);
	this.setOutputData(0, new Units.Percentage(out / 100));
}

function TriangleWaveOscillator() {
	Oscillator.call(this);
}
TriangleWaveOscillator.title = 'Triangle wave';

TriangleWaveOscillator.prototype = Object.create(Oscillator.prototype);

TriangleWaveOscillator.prototype.value = function(t) {
	var frequency = this.getInputData(0);
	var amplitude = this.getInputData(1);
	var phase = this.getInputData(2);
	t = t + phase;
	var lower = amplitude.lower;
	var upper = amplitude.upper;

	var a = upper - lower;

	var freq = frequency.hz;
	var p = 1/(2*freq);

	return lower + (a/p) * (p - Math.abs(t % (2*p) - p) );
}

GraphLib.registerNodeType('oscillators/triangle', TriangleWaveOscillator);

///

function SquareWaveOscillator() {
	Oscillator.call(this);
}
SquareWaveOscillator.title = 'Square wave';

SquareWaveOscillator.prototype = Object.create(Oscillator.prototype);

SquareWaveOscillator.prototype.value = function(t) {
	var frequency = this.getInputData(0);
	var amplitude = this.getInputData(1);
	var phase = this.getInputData(2);
	t = t + phase;
	var lower = amplitude.lower;
	var upper = amplitude.upper;

	var freq = frequency.hz;
	var p = 1/(2*freq);

	var c = t % (2*p);

	if (c < 0)
		c += 2*p;

	if (c < p) {
		return lower;
	} else {
		return upper;
	}
}

GraphLib.registerNodeType('oscillators/square', SquareWaveOscillator);

function SawWaveOscillator() {
	Oscillator.call(this);
}
SawWaveOscillator.title = 'Saw wave';
SawWaveOscillator.prototype = Object.create(Oscillator.prototype);
SawWaveOscillator.prototype.value = function(t) {
	var frequency = this.getInputData(0);
	var amplitude = this.getInputData(1);
	var phase = this.getInputData(2);
	t = t + phase;
	var lower = amplitude.lower;
	var upper = amplitude.upper;

	var p = frequency.sec;

	var cyc = (t % p);
	if (cyc < 0)
		cyc += p;

	return lower + (upper - lower)*(cyc / p);
}
GraphLib.registerNodeType('oscillators/saw', SawWaveOscillator);

function SineWaveOscillator() {
	Oscillator.call(this);
}

SineWaveOscillator.title = 'Sine wave';
SineWaveOscillator.prototype = Object.create(Oscillator.prototype);
SineWaveOscillator.prototype.value = function(t) {
	var frequency = this.getInputData(0);
	var amplitude = this.getInputData(1);
	var phase = this.getInputData(2);

	t = t + phase;
	var lower = amplitude.lower;
	var upper = amplitude.upper;

	var a = (upper - lower) / 2;

	var p = frequency.sec;

	return lower + a * (Math.sin(t*2*Math.PI/p)+1);
}
GraphLib.registerNodeType('oscillators/sine', SineWaveOscillator);

function CosWaveOscillator() {
	Oscillator.call(this);
}

CosWaveOscillator.title = 'Cos wave';
CosWaveOscillator.prototype = Object.create(Oscillator.prototype);
CosWaveOscillator.prototype.value = function(t) {
	var frequency = this.getInputData(0);
	var amplitude = this.getInputData(1);
	var phase = this.getInputData(2);

	t = t + phase;
	var lower = amplitude.lower;
	var upper = amplitude.upper;

	var a = (upper - lower) / 2;

	var p = frequency.sec;

	return lower + a * (Math.cos(t*2*Math.PI/p)+1);
}
GraphLib.registerNodeType('oscillators/cos', CosWaveOscillator);
