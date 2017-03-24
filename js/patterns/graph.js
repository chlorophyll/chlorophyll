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

// Structural node types for the pattern graph
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

function PatternManager() {
	var self = this;

	var _nextid = 0;
	function newgid() {
		return _nextid++;
	}

	var nameWidget;
	var patternList;

	var patterns = Immutable.Map();

	var curPattern = undefined;

	var setCurrentPattern = function(pattern) {
		curPattern = pattern;
		self.graphcanvas.setGraph(curPattern ? curPattern.graph : null);
		updatePatternList();
	}

	function updatePatternList() {
		names = [];
		patterns.forEach(function(pattern,id) {
			names.push(pattern.name);
		});

		names.sort();

		var selected = curPattern ? curPattern.name : null;
		patternList.setOptionValues(names, selected);
	}

	var init = function() {
		self.root = document.createElement('div');
		self.root.style.width = '100%';
		self.top_widgets = new LiteGUI.Inspector( null, { one_line: true });

		var runningPattern = false;

		self.top_widgets.addButton(null,"New", {width: 50, callback: function() { newGraph() }});
		patternList = self.top_widgets.addCombo(null,"Open");
		self.top_widgets.addButton(null,"Run", { callback: function() {
			if (!curPattern)
				return;
			if (runningPattern) {
				curPattern.stop();
				this.setValue('Run');
			} else {
				curPattern.run(global_test_mapping);
				this.setValue('Stop');
			}
			runningPattern = !runningPattern;
		}});
		nameWidget = self.top_widgets.addString('name', '', {
			callback: function(v) {
				if (curPattern)
					curPattern.name = v;
				updatePatternList();
			}
		});

		self.root.appendChild( self.top_widgets.root );
		var area = self.area = new LiteGUI.Area(null,{ className: "grapharea", height: -30});
		self.root.appendChild( area.root );

		self.canvas = document.createElement('canvas');
		area.add(self.canvas);
		area.content.style.backgroundColor = "#222";
		self.graphcanvas = new LGraphCanvas( self.canvas, null, { autoresize: true } );
		self.graphcanvas.background_image = 'img/litegraph_grid.png'
	}

	var newGraph = function() {
		var id = newgid();
		var name = 'pattern-'+id;
		var pattern = new PatternGraph(id, name);

		patterns = patterns.set(id, pattern);
		setCurrentPattern(pattern);
		updatePatternList();

		worldState.checkpoint();

		console.log(pattern);
	}

	this.snapshot = function() {
		var curPatternId = curPattern ? curPattern.id : null;
		return Immutable.Map({
			patterns: patterns.map(function(pattern, id) {
				return pattern.snapshot();
			}),
			curPattern: curPatternId
		});
	}

	this.setFromSnapshot = function(snapshot) {
		var newpatterns = snapshot.get('patterns').map(function(psnap, id) {
			var pattern = patterns.get(id);
			if (!pattern) {
				pattern = new PatternGraph();
			}
			pattern.setFromSnapshot(psnap);
			return pattern;
		});

		patterns.forEach(function(pattern, id) {
			if (!newpatterns.get(id)) {
				pattern.cleanup();
			}
		});
		patterns = newpatterns;
		setCurrentPattern(patterns.get(snapshot.get('curPattern')));
		updatePatternList();
	}

	init();
}
