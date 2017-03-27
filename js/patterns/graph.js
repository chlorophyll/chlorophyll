var patternStages = ['precompute', 'pixel'];
var defaultStage = 'pixel';

(function() {
	var oldGetInput = LGraphNode.prototype.getInputData;

	LiteGraph.addNodeMethod('getInputData', function(slot, force_update) {
		var data = oldGetInput.call(this, slot, force_update);

		if (data) return data;

		if (this.properties.default_inputs)
			return this.properties.default_inputs[slot];

		return null;
	});
})();

function PatternGraph(id, name) {
	var self = this;
	self.name = name;
	self.id = id;

	self.curStage = defaultStage;

	Object.defineProperty(this, 'curStageGraph', {
		get: function() { return this.stages[this.curStage] }
	});

	var handle = undefined;
	var restoring = false;

	this.stages = {};

	for (var stage of patternStages) {
		this.stages[stage] = new LGraph();
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
	var stageWidget;
	var patternList;

	var patterns = Immutable.Map();

	var curPattern = undefined;

	var setCurrentPattern = function(pattern) {
		curPattern = pattern;

		if (!curPattern)
			return;

		self.graphcanvas.setGraph(curPattern.curStageGraph);
		nameWidget.setValue(curPattern.name);
		setCurrentStage(curPattern.curStage);
		updatePatternList();
	}

	function setCurrentStage(stage) {
		if (!curPattern)
			return;
		curPattern.curStage = stage;

		for (var type in LiteGraph.registered_node_types) {
			var cls = LiteGraph.registered_node_types[type];
			var visible_stages = cls.visible_stages || patternStages;
			cls.skip_list = (visible_stages.indexOf(stage) == -1);
		}
		self.graphcanvas.setGraph(curPattern.curStageGraph);
		stageWidget.setValue(stage);
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
				curPattern.run(groupManager.currentMapping);
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

		stageWidget = self.top_widgets.addComboButtons('stage: ', defaultStage, {
			values: patternStages,
			callback: setCurrentStage
		});


		self.root.appendChild( self.top_widgets.root );
		var area = self.area = new LiteGUI.Area(null,{ className: "grapharea", height: -30});
		self.root.appendChild( area.root );

		self.canvas = document.createElement('canvas');
		area.add(self.canvas);
		area.content.style.backgroundColor = "#222";
		self.graphcanvas = new LGraphCanvas( self.canvas, null, { autoresize: true } );

		self.graphcanvas.onShowNodePanel = function(node) {
			console.log('beep boop');
			var dialog = new LiteGUI.Dialog('Node Settings', {
				title: 'Node Settings',
				close: true,
				minimize: false,
				width: 256,
				scroll: true,
				resizeable: false,
				draggable: true
			});

			var inspector = new LiteGUI.Inspector();

			var inputs = node.inputs || [];

			var widgets = [];
			if (!node.properties.default_inputs) {
				node.properties.default_inputs = [];
			}

			for (var i = 0; i < inputs.length; i++) {
				var val;
				val = node.properties.default_inputs[i];

				if (inputs[i].type == 'string') {
					widgets[i] = inspector.addString(inputs[i].name, val);
				} else if (inputs[i].type == 'number') {
					widgets[i] = inspector.addNumber(inputs[i].name, val, {
						step: 1,
						precision: 0,
					});
				}
			}

			function applyProperties() {
				for (var i = 0; i < inputs.length; i++) {
					var val = widgets[i].getValue();
					node.properties.default_inputs[i] = val;
					if (val) {
						node.inputs[i].label = `${node.inputs[i].name} (${val})`;
					} else {
						node.inputs[i].label = null;
					}
					self.graphcanvas.setDirty(true,true);
				}
			}

			dialog.add(inspector);

			dialog.addButton('Ok', { close: true, callback: applyProperties});
			dialog.addButton('Cancel', { close: true});

			dialog.show();
		}

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
