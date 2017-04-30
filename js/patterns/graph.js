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

	var request_id;

	self.curStage = defaultStage;

	Object.defineProperty(this, 'curStageGraph', {
		get: function() { return this.stages[this.curStage] }
	});

	var running = false;

	this.stages = {};
	this.time = 0;

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

	function checkpoint() {
		worldState.checkpoint();
	}

	function enableUndo() {
		forEachStage(function(stage, graph) {
			graph.addEventListener('connection-change', checkpoint);
			graph.addEventListener('node-added', checkpoint);
			graph.addEventListener('node-removed', checkpoint);
		});
	}

	enableUndo();

	function disableUndo() {
		forEachStage(function(stage, graph) {
			graph.removeEventListener('connection-change', checkpoint);
			graph.removeEventListener('node-added', checkpoint);
			graph.removeEventListener('node-removed', checkpoint);
		});
	}

	var inp = LiteGraph.createNode('input/cartesian2d', 'input');
	inp.removable = false;
	inp.clonable = false;
	inp.color = '#7496a6';
	inp.boxcolor = '#69a4bf';

	var outp = LiteGraph.createNode('output/color', 'output');
	outp.removable = false;
	outp.clonable = false;
	outp.color = '#e5a88a';
	outp.boxcolor = '#cc8866';
	outp.pos = [300,100];

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

	this.restore = function(snapshot) {
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
		running = false;
		window.cancelAnimationFrame(requestid);
		model.displayOnly = false;
	}

	this.reset = function() {
		self.time = 0;
		model.updateColors();
	}

	this.run = function(mapping) {
		if (running)
			return;

		running = true;

		var model = mapping.model;
		model.displayOnly = true;

		var graph = self.stages['pixel'];

		var positions = mapping.getPositions();

		var computePatternStep = function() {
			graph.setGlobalInputData('t', self.time);
			positions.forEach(function([idx, pos]) {
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

			if (running)
				requestid = window.requestAnimationFrame(computePatternStep);
		}

		requestid = window.requestAnimationFrame(computePatternStep);
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
		self.root.style.position = 'relative';
		self.root.style.height = '100%';
		self.top_widgets = new LiteGUI.Inspector( null, { one_line: true});

		var runningPattern = false;

		/* these are from Google's material icons; the text matters */
		var play = 'play_arrow';
		var pause = 'pause';
		var stop = 'stop';

		var playButton = self.top_widgets.addButton(null,play, {
			width: 50,
			callback: function() {
			if (!curPattern)
				return;
			if (runningPattern) {
				curPattern.stop();
				this.setValue(play);
			} else {
				var mapping = groupManager.currentMapping;
				if (!mapping)
					return;
				curPattern.run(mapping);
				this.setValue(pause);
			}
			runningPattern = !runningPattern;
		}});
		playButton.classList.add('material-icons');

		var stopButton = self.top_widgets.addButton(null, stop, {
			width: 50,
			callback: function() {
				if (!curPattern)
					return;
				curPattern.stop();
				curPattern.reset();
			}
		});
		stopButton.classList.add('material-icons');

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
		var canvasContainer = document.createElement('div');
		UI.tabs.addTab('Pattern Builder', {
			content: self.root,
			width: '100%',
			size: 'full',
		});
		area.split('horizontal', [210, null], true);
		area.getSection(1).add(canvasContainer);

		self.graphcanvas = new GraphCanvas(canvasContainer);



		var nodes = {id: "Nodes", children: []};

		var nodeTree = new LiteGUI.Tree('node-list-tree', nodes, {
			height: '100%',
		});

		for (var category of LiteGraph.getNodeTypesCategories()) {
			var nodesInCategory = LiteGraph.getNodeTypesInCategory(category);

			if (nodesInCategory.length == 0)
				continue;
			nodeTree.insertItem({id: category, skipdrag: true});

			nodesInCategory.forEach(function(node) {
				var elem = nodeTree.insertItem({
					id: node.title,
					skipdrag: true,
					content: node.type.split('/')[1],
					dataset: {nodetype: node.type}
				}, category);

				elem.draggable = true;
				elem.addEventListener('dragstart', function(ev) {
					ev.dataTransfer.setData('text/plain', node.title);
					ev.dataTransfer.dragEffect = 'link';
				});
			});
		}

		canvasContainer.addEventListener('dragover', function(ev) {
			if (self.graphcanvas.graph != null)
				ev.preventDefault();
		});

		canvasContainer.addEventListener('drop', function(ev) {
			if (self.graphcanvas.graph == null)
				return;
			ev.preventDefault();
			var nodeId = ev.dataTransfer.getData('text');
			var item = nodeTree.getItem(nodeId);
			var nodetype = item.data.dataset.nodetype;
			self.graphcanvas.addNode(nodetype, ev.clientX, ev.clientY);
		});

		var curNodeType = null;
		var curSelection = null;

		nodeTree.root.addEventListener('item_selected', function(ev) {
			var dataset = ev.detail.data.dataset;
			if (dataset && dataset.nodetype) {
				curNodeType = dataset.nodetype;
				curSelection = ev.detail.item;
			} else {
				if (curSelection)
					nodeTree.markAsSelected(curSelection);
			}
		});

		canvasContainer.addEventListener('contextmenu', function(ev) {
			ev.preventDefault();
			if (curNodeType) {
				self.graphcanvas.addNode(curNodeType, ev.clientX, ev.clientY);
			}
		});



		var nodeTreePanel = new LiteGUI.Panel('node-list', {scroll: true});
		nodeTreePanel.content.style.height = '100%';
		nodeTreePanel.add(nodeTree);
		area.getSection(0).add(nodeTreePanel);


		self.graphcanvas.onShowNodePanel = function(node) {
			if (node.onDblClick)
				return;

			var dialog = new LiteGUI.Dialog('Node Settings', {
				title: node.title + ' defaults',
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

			var values = [];

			var widgets = 0;

			inputs.forEach(function(input, i) {
				var val = node.properties.default_inputs[i];

				values[i] = val;

				var callback = function(v) {
					console.log(v);
					values[i] = v;
				}

				if (input.type == 'string') {
					widgets[i] = inspector.addString(input.name, val, { callback: callback });
					widgets++;
				} else if (input.type == 'number') {
					widgets[i] = inspector.addNumber(input.name, val, {
						step: 1,
						precision: 0,
						callback: callback
					});
					widgets++;
				}
			});

			if (widgets == 0) {
				return;
			}

			function applyProperties() {
				for (var i = 0; i < inputs.length; i++) {
					var val = values[i];
					node.properties.default_inputs[i] = val;
					if (val !== undefined) {
						node.inputs[i].label = `${node.inputs[i].name} (${val})`;
					} else {
						node.inputs[i].label = null;
					}
					self.graphcanvas.redrawNode(node);
				}
			}

			dialog.add(inspector);

			dialog.addButton('Ok', { close: true, callback: applyProperties});
			dialog.addButton('Cancel', { close: true});

			dialog.show();
		}
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

		pattern.restore(snap);
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

	this.restore = function(snapshot) {
		var newpatterns = snapshot.get('patterns').map(function(psnap, id) {
			var pattern = patterns.get(id);
			if (!pattern) {
				pattern = new PatternGraph();
			}
			pattern.restore(psnap);
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
