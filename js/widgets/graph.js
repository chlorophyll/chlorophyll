function GraphWidget() {
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
