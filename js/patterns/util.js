// Structural node types for the pattern graph
function OutputColor() {
	this.addInput('outcolor', 'CRGB');
}

OutputColor.prototype.onAdded = function() {
	this.graph.addGlobalOutput('outcolor');
}

OutputColor.prototype.onExecute = function() {
	this.graph.setGlobalOutputData('outcolor', this.getInputData(0));
}

OutputColor.title = 'Output Color';
OutputColor.visible_stages = [];

LiteGraph.registerNodeType("lowlevel/output/color", OutputColor);

function Cartesian2DInput() {
	this.addOutput('x', Units.Distance);
	this.addOutput('y', Units.Distance);
	this.addOutput('color', 'CRGB');
}

Cartesian2DInput.prototype.onExecute = function() {
	var x = new Units.Distance(this.graph.global_inputs['c0'].value);
	var y = new Units.Distance(this.graph.global_inputs['c1'].value);
	var color = this.graph.global_inputs['color'].value;

	this.setOutputData(0, x);
	this.setOutputData(1, y);
	this.setOutputData(2, color);
}

Cartesian2DInput.title = 'Cartesian2DInput';
Cartesian2DInput.visible_stages = [];

LiteGraph.registerNodeType('lowlevel/input/cartesian2d', Cartesian2DInput);

// TODO refactor inputs to a common class, they're going to share everything
// except the number/names of coordinates.
function Polar2DInput() {
	this.addOutput('r', Units.Distance);
	this.addOutput('theta', Units.Angle);
	this.addOutput('color', 'CRGB');
}

Polar2DInput.prototype.onExecute = function() {
	var r = new Units.Distance(this.graph.global_inputs['c0'].value);
	var theta = new Units.Angle(this.graph.global_inputs['c1'].value);
	var color = this.graph.global_inputs['color'].value;

	this.setOutputData(0, r);
	this.setOutputData(1, theta);
	this.setOutputData(2, color);
}

Polar2DInput.title = 'Polar2DInput';
Polar2DInput.visible_stages = [];

LiteGraph.registerNodeType('lowlevel/input/polar2d', Polar2DInput);

function TimeInput() {
	this.addOutput('t', 'number');
}
TimeInput.prototype.onExecute = function() {
	this.setOutputData(0, this.graph.global_inputs['t'].value);
}
TimeInput.title = 'TimeInput';
LiteGraph.registerNodeType('lowlevel/input/time', TimeInput);

function PrecomputeOutput() {
	this.addProperty("name", null);
}

PrecomputeOutput.prototype.onAdded = function() {
	var self = this;
	LiteGUI.prompt('name', function(v) {
		self.addInput(v);
		self.properties["name"] = v;
		self.graph.addGlobalOutput(v);
	});
}

PrecomputeOutput.prototype.onExecute = function() {
	this.graph.setGlobalOutputData(this.properties['name'], this.getInputData(0));
}

PrecomputeOutput.visible_stages = ['precompute'];
PrecomputeOutput.title = 'Precompute Output';

LiteGraph.registerNodeType('lowlevel/output/value', PrecomputeOutput);
