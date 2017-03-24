
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

	self.curStage = 'pixel';

	Object.defineProperty(this, 'curStageGraph', {
		get: function() { return this.stages[this.curStage] }
	});

	var handle = undefined;
	var restoring = false;

	this.stages = {
		precompute: new LGraph(),
		pixel: new LGraph(),
	}

	function forEachStage(f) {
		for (var stage in self.stages) {
			f(stage, self.stages[stage]);
		}
	}

	forEachStage(function(stage, graph) {
		graph.fixedtime_lapse = 0;
	});

	function enableUndo() {
		forEachStage(function(stage, graph) {
			graph.onConnectionChange = function() {
				worldState.checkpoint();
			}

			graph.onNodeAdded = function() {
				worldState.checkpoint();
			}

			graph.onNodeRemoved = function() {
				worldState.checkpoint();
			}
		});
	}

	enableUndo();

	function disableUndo() {
		forEachStage(function(stage, graph) {
			graph.onConnectionChange = undefined;
			graph.onNodeAdded = undefined;
			graph.onNodeRemoved = undefined;
		});
	}


	var inp = LiteGraph.createNode('input/cartesian2d', 'input');
	inp.removable = false;
	inp.clonable = false;

	var outp = LiteGraph.createNode('output/color', 'output');
	outp.removable = false;
	outp.clonable = false;

	this.stages['pixel'].add(inp);
	this.stages['pixel'].add(outp);

	this.snapshot = function() {
		var stages = {};

		forEachStage(function(stage, graph) {
			stages[stage] = JSON.stringify(graph.serialize());
		});

		return {
			name: this.name,
			id: this.id,
			curStage: this.curStage,
			stages: stages
		}
	}

	this.setFromSnapshot = function(snapshot) {
		this.name = snapshot.name;
		this.id = snapshot.id;
		this.curStage = snapshot.curStage;
		disableUndo();
		forEachStage(function(stage, graph) {
			graph.configure(JSON.parse(snapshot.stages[stage]));
		});
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

		var graph = self.stages['pixel'];

		handle = setInterval(function() {
			graph.setGlobalInputData('t', self.time);
			mapping.getPositions().forEach(function([idx, pos]) {
				var dc = model.getDisplayColor(idx);
				var incolor = new CRGB(dc[0],dc[1],dc[2]);
				graph.setGlobalInputData('x', pos.x);
				graph.setGlobalInputData('y', pos.y);
				graph.setGlobalInputData('color', incolor);
				graph.runStep();
				var outcolor = graph.getGlobalOutputData('outcolor');
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
		var graph = undefined;
		nameWidget.setValue(curPattern ? curPattern.name : null);
		self.graphcanvas.setGraph(curPattern ? curPattern.curStageGraph : null);
		updatePatternList();
	}

	function updatePatternList() {
		names = [];
		var selected;
		patterns.forEach(function(pattern,id) {
			var ob = {title:pattern.name, id:id};
			if (pattern == curPattern)
				selected = ob;
			names.push(ob);
		});

		names.sort(function(a,b) {
			return a.title.localeCompare(b.title);
		});

		patternList.setOptionValues(names, selected);
	}

	var init = function() {
		self.root = document.createElement('div');
		self.root.style.width = '100%';
		self.top_widgets = new LiteGUI.Inspector( null, { one_line: true});

		var runningPattern = false;

		self.top_widgets.addButton(null,"Run", {
			width: 50,
			callback: function() {
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

		self.top_widgets.addButton(null,"New", {width: 50, callback: newPattern });
		self.top_widgets.addButton(null,"Copy", {width: 50, callback: copyPattern });

		patternList = self.top_widgets.addCombo('Choose pattern',"Open", {
			width: '15em',
			callback: function(val) {
				var pattern = patterns.get(val.id);
				setCurrentPattern(pattern);
			}
		});

		self.top_widgets.addSeparator();

		nameWidget = self.top_widgets.addStringButton('name', '', {
			button: 'rename',
			button_width: '5em',
			callback_button: function(v) {
				if (curPattern)
					curPattern.name = v;
				updatePatternList();
			}
		});

		stageWidget = self.top_widgets.addComboButtons('stage: ', 'pixel', {
			values: ['precompute', 'pixel'],
			callback: function(val) {
				if (!curPattern)
					return;
				curPattern.curStage = val;
				self.graphcanvas.setGraph(curPattern.curStageGraph);
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

	var newPattern = function() {
		var id = newgid();
		var name = 'pattern-'+id;
		var pattern = new PatternGraph(id, name);

		patterns = patterns.set(id, pattern);
		setCurrentPattern(pattern);

		worldState.checkpoint();

		console.log(pattern);
	}

	function copyName(name) {
		var re = / \(copy (\d+)\)$/;
		var result = re.exec(name);
		if (!result) {
			return name + ' (copy 1)';
		}
		var copydigits = parseInt(result[1]);
		var prefix = name.substring(0, result.index);
		return prefix + ' (copy '+(copydigits+1)+')';
	}

	var copyPattern = function() {
		if (!curPattern)
			return;

		var id = newgid();
		var name = copyName(curPattern.name);
		var snap = curPattern.snapshot();

		var pattern = new PatternGraph();

		pattern.setFromSnapshot(snap);
		pattern.id = id;
		pattern.name = name;

		patterns = patterns.set(id, pattern);
		setCurrentPattern(pattern);
		worldState.checkpoint();
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
