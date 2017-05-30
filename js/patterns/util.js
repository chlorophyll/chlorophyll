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

var MappingInputs = {
	cartesian2d: {
		name: "Cartesian2D",
		coords: [
			{name: 'x', unit: Units.Distance},
			{name: 'y', unit: Units.Distance}
		]
	},
	polar2d: {
		name: "Polar2D",
		coords: [
			{name: 'r', unit: Units.Distance},
			{name: 'theta', unit: Units.Angle}
		]
	},
	cartesian3d: {
		name: "Cartesian3D",
		coords: [
			{name: 'x', unit: Units.Distance},
			{name: 'y', unit: Units.Distance},
			{name: 'z', unit: Units.Distance}
		]
	},
	cylinder3d: {
		name: "Cylindrical3D",
		coords: [
			{name: 'r', unit: Units.Distance},
			{name: 'theta', unit: Units.Angle},
			{name: 'z', unit: Units.Distance}
		]
	},
	sphere3d: {
		name: "Spherical3D",
		coords: [
			{name: 'r', unit: Units.Distance},
			{name: 'theta', unit: Units.Angle},
			{name: 'phi', unit: Units.Angle}
		]
	}
}

/*
 * Generate input nodes for each mapping type
 */
for (type in MappingInputs) {
	let info = MappingInputs[type];

	let map_input_node = function() {
		for (var i = 0; i < info.coords.length; i++) {
			this.addOutput(info.coords[i].name, info.coords[i].unit);
		}
		this.addOutput('color', 'CRGB');
	}

	map_input_node.prototype.onExecute = function() {
		var coord_ginputs = ['c0', 'c1', 'c2'];

		for (var i = 0; i < info.coords.length; i++) {
			var in_val = this.graph.global_inputs[coord_ginputs[i]].value;
			var unitConstructor = info.coords[i].unit;

			this.setOutputData(i, new unitConstructor(in_val));
		}
		var color = this.graph.global_inputs['color'].value;
		this.setOutputData(info.coords.length, color);
	}

	map_input_node.title = info.name + "Input";
	map_input_node.visible_stages = [];
	LiteGraph.registerNodeType('lowlevel/input/' + type, map_input_node);
}


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
