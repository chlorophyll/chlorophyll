// The built-in context menu is not really sensible for what we want here.
(function() {
	oldMenuOptions = LGraphCanvas.prototype.getNodeMenuOptions;

	LGraphCanvas.prototype.getNodeMenuOptions = function(node) {
		var options = oldMenuOptions(node);

		whitelist = [
			"Collapse",
			"Shapes",
			"Clone",
			"Remove"
		]

		out = [];

		for (option of options) {
			if (!option || whitelist.indexOf(option.content) != -1) {
				out.push(option);
			}
		}

		return out;
	}
})();

function OutputColor() {
	this.addInput('outcolor');
}

OutputColor.prototype.onAdded = function() {
	this.graph.addGlobalOutput('outcolor');
}

OutputColor.prototype.onExecute = function() {
	this.graph.setGlobalOutputData('outcolor', this.getInputData(0));
}

OutputColor.title = 'Output Color';

LiteGraph.registerNodeType("output/color", OutputColor);

function Cartesian2DInput() {
	this.addOutput('x', 'number');
	this.addOutput('y', 'number');
	this.addOutput('t', 'number');
	this.addOutput('color');
}

Cartesian2DInput.prototype.onAdded = function() {
	this.graph.addGlobalInput('x');
	this.graph.addGlobalInput('y');
	this.graph.addGlobalInput('t');
	this.graph.addGlobalInput('color');
}

Cartesian2DInput.prototype.onExecute = function() {
	var x = this.graph.global_inputs['x'].value;
	var y = this.graph.global_inputs['y'].value;
	var t = this.graph.global_inputs['t'].value;
	var color = this.graph.global_inputs['color'].value;

	this.setOutputData(0, x);
	this.setOutputData(1, y);
	this.setOutputData(2, t);
	this.setOutputData(3, color);
}

Cartesian2DInput.title = 'Cartesian2DInput';
LiteGraph.registerNodeType('input/cartesian2d', Cartesian2DInput);

function PatternGraph(id, name) {
	var self = this;
	self.name = name;
	self.id = id;

	var handle = undefined;
	var restoring = false;

	this.graph = new LGraph();
	this.graph.fixedtime_lapse = 0;

	function enableUndo() {
		self.graph.onConnectionChange = function() {
			worldState.checkpoint();
		}

		self.graph.onNodeAdded = function() {
			worldState.checkpoint();
		}

		self.graph.onNodeRemoved = function() {
			worldState.checkpoint();
		}
	}

	enableUndo();

	function disableUndo() {
		self.graph.onConnectionChange = undefined;
		self.graph.onNodeAdded = undefined;
		self.graph.onNodeRemoved = undefined;
	}


	var inp = LiteGraph.createNode('input/cartesian2d', 'input');
	inp.removable = false;
	inp.clonable = false;

	var outp = LiteGraph.createNode('output/color', 'output');
	outp.removable = false;
	outp.clonable = false;

	this.graph.add(inp);
	this.graph.add(outp);

	this.snapshot = function() {
		return {
			name: this.name,
			id: this.id,
			graph: JSON.stringify(this.graph.serialize())
		}
	}

	this.setFromSnapshot = function(snapshot) {
		this.name = snapshot.name;
		this.id = snapshot.id;
		disableUndo();
		this.graph.configure(JSON.parse(snapshot.graph));
		enableUndo();
	}

	this.stop = function() {
		if (handle) {
			clearInterval(handle);
			handle = undefined;
		}
	}

	this.run = function(mapping) {
		if (handle)
			return;
		self.time = 0;
		var model = mapping.model;
		model.displayOnly = true;

		var incolor = new CRGB(0,0,0);

		handle = setInterval(function() {
			self.graph.setGlobalInputData('t', self.time);
			mapping.getPositions().forEach(function([idx, pos]) {
				var dc = model.getDisplayColor(idx);
				var incolor = new CRGB(dc[0],dc[1],dc[2]);
				self.graph.setGlobalInputData('x', pos.x);
				self.graph.setGlobalInputData('y', pos.y);
				self.graph.setGlobalInputData('color', incolor);
				self.graph.runStep();
				var outcolor = self.graph.getGlobalOutputData('outcolor');
				model.setDisplayColor(idx, outcolor.r, outcolor.g, outcolor.b);
			});
			self.time += 1;
			model.updateColors();
		}, 1000/60);
	}

	this.cleanup = function() { }
}
