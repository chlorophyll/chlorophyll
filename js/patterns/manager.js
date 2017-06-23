var patternStages = ['precompute', 'pixel'];
var defaultStage = 'pixel';

function showNodeInspector(node) {
	var dialog = new LiteGUI.Dialog('Node Settings', {
		title: node.title + ' Settings',
		close: true,
		minimize: false,
		width: 256,
		height: 300,
		scroll: true,
		resizeable: false,
		draggable: true
	});


	var inspector = new LiteGUI.Inspector('node-settings-inspector', {
		widgets_per_row: 2,
		onchange: function() {
			if (node.visualization)
				node.visualization.update();
		}
	});

	var inputs = node.inputs || [];

	var old_values = {};
	var cur_values = node.properties;

	var show = false;

	function add(input, widget) {
		show = true;
		var disabled = (node.required_properties || []).indexOf(input.name) != -1;
		var button = inspector.addButton(null, 'clear', {
			name_width: '0',
			disabled: disabled,
			callback: function() {
				widget.setValue(0);
				cur_values[input.name] = undefined;
			}
		});
		var name = widget.querySelector(".wname");
		name.style.width = '6em';
		widget.style.width = 'calc(99% - 4em)';
		button.classList.add('material-icons');
		button.style.fontSize = '12px';
		button.style.width = '4em';
	}

	inputs.forEach(function(input, i) {
		var val = node.properties[input.name];

		if (val !== undefined) {
			old_values[input.name] = Util.clone(val);
		}

		if (!input.type)
			return;

		if (input.type.isConvertibleUnit) {
			add(input, inspector.addNumber(input.name, (val || 0).valueOf(), {
				callback: function(v) {
					cur_values[input.name] = new input.type(v);
				}
			}));
		} else if (input.type == 'number') {
			add(input, inspector.addNumber(input.name, val, {
				callback: function(v) {
					cur_values[input.name] = v;
				}
			}));
		} else if (input.type == 'frequency') {
			var f = cur_values[input.name];
			add(input, inspector.addQuantity(input.name, f.quantity(), {
				step: 0.5,
				precision: 1,
				min: 0,
				units: val.units,
				callback: function(v, oldUnits) {
					var number, units;
					if (oldUnits !== undefined) {
						number = f[v.units];
						units = v.units;
					} else {
						number = v.number;
						units = v.units;
					}
					f[units] = number;
					f.setDisplayUnits(units);
					return f.quantity();
				}
			}));
		} else if (input.type == 'range') {
			var range = cur_values[input.name];
			add(input, inspector.addDualSlider(input.name,
				{left: range.lower, right: range.upper},
				{
					min: range.min,
					max: range.max,
					callback: function(v) {
						range.lower = v.left;
						range.upper = v.right;
					}
				}
			));
		}
	});

	if (!show) {
		return;
	}

	dialog.add(inspector);

	if (node.visualization) {
		node.visualization.update();
		dialog.add(node.visualization);
	}

	function resetProperties() {
		for (var k in old_values) {
			node.properties[k] = old_values[k];
		}
		node.modified();
	}

	function applyProperties() {
		node.modified();
	}

	dialog.addButton('Ok', { close: true, callback: applyProperties});
	dialog.addButton('Cancel', { close: true, callback: resetProperties});

	dialog.show();
}

function PatternGraph(id, name, manager) {
	var self = this;
	self.name = name;
	self.id = id;
	self.tree_id = 'pattern-'+id;


	self.model = null;
	var request_id;

	self.curStage = defaultStage;

	Object.defineProperty(this, 'curStageGraph', {
		get: function() { return this.stages[this.curStage] }
	});

	var running = false;

	this.stages = {};
	this.time = 0;

	for (var stage of patternStages) {
		let graph = new Graph();
		this.stages[stage] = graph;
		graph.addEventListener('node-opened', function(ev) {
			showNodeInspector(ev.detail.node);
		});
	}

	var _mapping_type = Const.default_map_type;
	var map_input;

	function createMapInput() {
		if (map_input)
			self.stages.pixel.removeNode(map_input);
		map_input = self.stages.pixel.addNode('lowlevel/input/' + self.mapping_type, {title: 'input'});
	}

	Object.defineProperty(this, 'mapping_type', {
		get: function() { return _mapping_type; },
		set: function(v) {
			if (v == _mapping_type)
				return;
			_mapping_type = v;
			createMapInput();
			mapTypeDisplay.innerText = MappingInputs[_mapping_type].name;
		}
	});

	var elem = manager.pattern_browser.insertItem({
		id: self.tree_id,
		content: name,
		dataset: {pattern: self}},
		'root'
	);
	var mapTypeDisplay = document.createElement('span');
	mapTypeDisplay.classList.add('map-type');
	mapTypeDisplay.innerText = MappingInputs[_mapping_type].name;

	elem.querySelector('.postcontent').appendChild(mapTypeDisplay);

	function forEachStage(f) {
		for (var stage in self.stages) {
			f(stage, self.stages[stage]);
		}
	}

	forEachStage(function(stage, graph) {
		graph.fixedtime_lapse = 0;
	});

	this.stages['pixel'].addGlobalInput('coords');
	this.stages['pixel'].addGlobalInput('t');
	this.stages['pixel'].addGlobalInput('color');
	this.stages['pixel'].addGlobalOutput('outcolor');

	createMapInput();

	var outp = self.stages.pixel.addNode('lowlevel/output/color', {title: 'output'});
	outp.pos = [300,100];

	forEachStage(function(stage, graph) {
		graph.addEventListener('graph-changed', function() {
			worldState.checkpoint();
		});
	});

	this.snapshot = function() {
		var stages = {};

		forEachStage(function(stage, graph) {
			stages[stage] = graph.snapshot();
		});

		return Immutable.fromJS({
			name: self.name,
			id: self.id,
			curStage: self.curStage,
			stages: stages
		});
	}

	this.restore = function(snapshot) {
		self.name = snapshot.get('name');
		self.id = snapshot.get('id');
		forEachStage(function(stage, graph) {
			self.stages[stage].restore(snapshot.getIn(['stages', stage]));
		});
	}

		this.stop = function() {
			if (!running)
				return;

			running = false;
			window.cancelAnimationFrame(requestid);
			self.model.displayOnly = false;
		}

		this.reset = function() {
			self.time = 0;
			self.model.updateColors();
		}

		this.run = function(mapping) {
			if (running)
				return;

			running = true;

			self.model = mapping.model;
			self.model.displayOnly = true;

			var graph = self.stages['pixel'];

			var positions = mapping.getPositions(self.mapping_type);

			var computePatternStep = function() {
				graph.setGlobalInputData('t', self.time);
				positions.forEach(function([idx, pos]) {
					var dc = self.model.getDisplayColor(idx);
					var incolor = new CRGB(dc[0],dc[1],dc[2]);
					graph.setGlobalInputData('coords', pos.toArray());
					graph.setGlobalInputData('color', incolor);
					graph.runStep();
					var outcolor = graph.getGlobalOutputData('outcolor');
					self.model.setDisplayColor(idx, outcolor.r, outcolor.g, outcolor.b);
				});
				self.time += 1;
				self.model.updateColors();

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
	var mappingTypeList;
	var selectedMappingType = Const.default_map_type;
	var previewMappingList;

	var patterns = Immutable.Map();

	var curPattern = undefined;

	var setCurrentPattern = function(pattern) {
		curPattern = pattern;

		if (!curPattern)
			return;

		self.graphcanvas.setGraph(curPattern.curStageGraph);
		self.pattern_browser.setSelectedItem(curPattern.tree_id);
		setCurrentStage(curPattern.curStage);
	}

	function setCurrentStage(stage) {
		if (!curPattern)
			return;
		curPattern.curStage = stage;
		self.graphcanvas.setGraph(curPattern.curStageGraph);
		stageWidget.setValue(stage);
	}

	var init = function() {
		self.root = document.createElement('div');
		self.root.style.width = '100%';
		self.root.style.position = 'relative';
		self.root.style.height = '100%';
		self.top_widgets = new LiteGUI.Inspector(null, {
			one_line: true
		});

		self.sidebar_widgets = new LiteGUI.Inspector(null, {
			name_width: '4em'
		});
		self.pattern_browser = new LiteGUI.Tree('pattern-tree',
			{id: 'pattern-root', children: [], visible: false},
			{height: '100%', allow_rename: true}
		);

		self.pattern_browser.root.addEventListener('item_selected', function(e) {
			var dataset = e.detail.data.dataset;
			setCurrentPattern(dataset.pattern);
		});

		self.pattern_browser.onBackgroundClicked = function() {
			setCurrentPattern(null);
		}
		var side_tree_panel = new LiteGUI.Panel('pattern-tree-panel', {
			title: 'Pattern Browser',
			scroll: true
		});
		var side_settings_panel = new LiteGUI.Panel('pattern-settings', {
			scroll: true
		});

		side_tree_panel.add(self.pattern_browser);
		side_settings_panel.add(self.sidebar_widgets);
		UI.sidebar_bottom.split('vertical', ['30%', null], true);
		UI.sidebar_bottom.getSection(0).add(side_tree_panel);
		UI.sidebar_bottom.getSection(1).add(side_settings_panel);

		var runningPattern = false;
		var previewMapping = null;

		/* these are from Google's material icons; the text matters */
		var play = 'play_arrow';
		var pause = 'pause';
		var stop = 'stop';

		/*
		 * Pattern editor top toolbar: Preview & editing options
		 */
		var playButton = self.top_widgets.addButton(null, play, {
			width: 50,
			callback: function() {
			if (!curPattern)
				return;
			if (runningPattern) {
				curPattern.stop();
				this.setValue(play);
			} else {
				if (!previewMapping)
					return;
				curPattern.run(previewMapping);
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
				runningPattern = false;
				playButton.setValue(play);
			}
		});
		stopButton.classList.add('material-icons');

		var mapmenu_values = {};
		for (type in MappingInputs) {
			mapmenu_values[MappingInputs[type].name] = type;
		}
		mappingTypeList = self.top_widgets.addCombo('Projection type',
			Const.default_map_type,
			{
				values: mapmenu_values,
				callback: function(val) {
					selectedMappingType = val;

					if (curPattern) {
						curPattern.mapping_type = val;
						worldState.checkpoint();
					}
				}
			});

		function updatePreviewMapping(val) {
			previewMapping = val;
		}
		var preview_list_values = groupManager.listMappings();
		preview_list_values[""] = null;
		previewMappingList = self.top_widgets.addCombo('Preview map', null, {
			values: preview_list_values,
			callback: updatePreviewMapping,
			width: '20em'
		});
		groupManager.addEventListener('maplist_changed', function() {
			var vals = groupManager.listMappings();
			vals[""] = null;
			previewMappingList = self.top_widgets.addCombo('Preview map', null,
				{
					replace: previewMappingList,
					values: vals,
					callback: updatePreviewMapping,
					width: '20em'
				});
		});

		stageWidget = self.top_widgets.addComboButtons('stage: ', defaultStage, {
			values: patternStages,
			callback: setCurrentStage
		});

		self.root.appendChild(self.top_widgets.root);
		self.top_widgets.root.style.paddingTop = '4px';
		self.top_widgets.root.style.paddingBottom = '4px';

		/*
		 * Sidebar: browsing, creation, copying, and 'meta' settings
		 */
		self.sidebar_widgets.widgets_per_row = 2;
		self.sidebar_widgets.addButton(null, "New", { callback: newPattern });
		self.sidebar_widgets.addButton(null, "Copy", { callback: copyPattern });
		self.sidebar_widgets.widgets_per_row = 1;

		self.sidebar_widgets.addSeparator();

		nameWidget = self.sidebar_widgets.addStringButton('name', '', {
			button: 'rename',
			button_width: '5em',
			callback_button: function(v) {
				if (curPattern)
					curPattern.name = v;
				updatePatternList();
			}
		});

		var area = self.area = new LiteGUI.Area(null, {
			className: "grapharea",
			height: -38
		});
		self.root.appendChild(area.root);

		var canvasContainer = document.createElement('div');
		UI.tabs.addTab('Pattern Builder', {
			content: self.root,
			width: '100%',
			size: 'full',
		});
		area.split('horizontal', [210, null], true);
		area.getSection(1).add(canvasContainer);

		self.graphcanvas = new GraphCanvas(canvasContainer);

		var node_types = GraphLib.getNodeTypes();
		var nodes = {id: "Nodes", children: []};

		node_types.forEach(function(node_type, path) {
			var ptr = nodes;
			let components = path.split('/');
			components.pop();
			components.forEach(function(component) {
				let idx = ptr.children.findIndex(el => el.id == component);
				if (idx == -1) {
					let n = {id: component, skipdrag: true, children: []};
					ptr.children.push(n);
					ptr = n;
				} else {
					ptr = ptr.children[idx];
				}
			});
		});
		var nodeTree = new LiteGUI.Tree('node-list-tree', nodes, {
			height: '100%',
		});

		node_types.forEach(function(node_type, path) {
			let components = path.split('/');
			let elem = nodeTree.insertItem({
				id: path,
				skipdrag: true,
				content: components[components.length-1],
				dataset: {nodetype: path},
			}, components[components.length-2]);

			elem.draggable = true;
			elem.addEventListener('dragstart', function(ev) {
				ev.dataTransfer.setData('text/plain', path);
				ev.dataTransfer.dragEffect = 'link';
			});

			nodeTree.collapseItem(components[0]);
		});

		canvasContainer.addEventListener('dragover', function(ev) {
			if (self.graphcanvas.graph != null)
				ev.preventDefault();
		});

		canvasContainer.addEventListener('drop', function(ev) {
			var graph = self.graphcanvas.graph;
			if (graph == null)
				return;
			ev.preventDefault();
			var nodetype = ev.dataTransfer.getData('text');
			self.graphcanvas.dropNodeAt(nodetype, ev.clientX, ev.clientY);

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
				self.graphcanvas.dropNodeAt(nodetype, ev.clientX, ev.clientY);
			}
		});



		var nodeTreePanel = new LiteGUI.Panel('node-list', {scroll: true});
		nodeTreePanel.content.style.height = '100%';
		nodeTreePanel.add(nodeTree);
		area.getSection(0).add(nodeTreePanel);


	}

	var newPattern = function() {
		var id = newgid();
		var name = 'pattern-'+id;
		var pattern = new PatternGraph(id, name, self);


		patterns = patterns.set(id, pattern);
		setCurrentPattern(pattern);
		pattern.mapping_type = selectedMappingType;

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
	}

	init();
}
