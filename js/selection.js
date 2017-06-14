function isClipped(v) {
	if (frontPlane.distanceToPoint(v) < 0)
		return true;

	if (backPlane.distanceToPoint(v) < 0)
		return true;
	return false;
}

SelectionTool = function(viewport, model) {
	var self = this;

	this.viewport = viewport !== undefined ? viewport : document;
	this.model = model;
	// Used by Toolbox
	this.elem = null;

	this.highlight = new THREE.Color(0xffffff);

	// Is the tool active?
	this.enabled = false;
	// Is the tool in use? (e.g. currently dragging out a marquee or in the
	// middle of a series of necessary clicks)
	this.in_progress = false;
	// Flags for tool modes, set based on keys when a selection is started.
	// Default behavior is to clear out the existing selection and to replace
	// with the new one.
	this.adding = false;
	this.subtracting = false;

	// Selection tools will add and remove points using this overlay, then call
	// finishSelection() to make it the active selection.
	this.current_selection = this.model.createOverlay(20);
	// The selection as it was when startSelection() was called.
	this.initial_selection = null;

	// Deselect all points
	this.deselectAll = function() {
		if (worldState.activeSelection.size() > 0) {
			worldState.activeSelection.clear();
			worldState.checkpoint();
		}
	}

	// Called when the tool is activated
	this.enable = function() {
		self.enabled = true;
		Mousetrap.bind('esc', self.deselectAll);
	};

	// Called when the user switches away from this tool
	this.disable = function() {
		if (self.in_progress)
			self.cancelSelection();

		self.enabled = false;
		self.in_progress = false;
		self.adding = false;
		self.subtracting = false;

		Mousetrap.unbind('esc');

		self.current_selection.clear();
	};

	// startSelection and finishSelection are called when the tool begins and ends
	// a run of actually selecting/deselecting points.

	// Takes the mouse event which began the selection.
	this.startSelection = function(event) {
		self.adding = false;
		self.subtracting = false;
		if (event.altKey) {
			self.subtracting = true;
		} else if (event.shiftKey) {
			self.adding = true;
		} else {
			// Start with an empty selection if we're not adding or subtracting
			// from an existing one.
			worldState.activeSelection.clear();
		}
		self.in_progress = true;
		self.current_selection.clear();
		self.current_selection.setAll(worldState.activeSelection);
		self.initial_selection = self.current_selection.getPixels();
		worldState.activeSelection.clear();

		Mousetrap.unbind('esc');
		Mousetrap.bind('esc', self.cancelSelection);
	}

	function endSelection() {
		self.in_progress = false;
		self.current_selection.clear();
		self.initial_selection = null;

		Mousetrap.unbind('esc');
		Mousetrap.bind('esc', self.deselectAll);
	}

	// Stop selecting and save the current selection as final.
	this.finishSelection = function() {
		worldState.activeSelection.setAll(self.current_selection);
		endSelection();
		worldState.checkpoint();
	}

	// Don't exit the tool, but stop selecting and throw out state, returning
	// to before the selection
	this.cancelSelection = function() {
		worldState.activeSelection.setAllFromSet(self.initial_selection);
		endSelection();
	}
}

MarqueeSelection = function(viewport, model) {
	SelectionTool.call(this, viewport, model);
	var self = this;

	var rect = {};

	this.box = document.createElement('div');
	this.box.style.position = 'absolute';
	this.box.style.borderStyle = 'dotted';
	this.box.style.borderWidth = '1px';
	this.box.style.borderColor = 'white';
	this.box.style.display = 'none';

	this.viewport.appendChild(this.box);
	console.log(this.viewport);

	this.viewport.addEventListener('mousedown', onMouseDown, false);
	this.viewport.addEventListener('mouseup', onMouseUp, false);
	this.viewport.addEventListener('mousemove', onMouseMove, false);

	function onMouseDown(event) {
		if (!self.enabled)
			return;

		self.startSelection(event);

		var coords = Util.relativeCoords(container, event.pageX, event.pageY);
		rect.startX = coords.x;
		rect.startY = coords.y;
		self.box.style.display = 'block';
	}

	function drawRect() {
		l = Math.min(rect.startX, rect.endX);
		r = Math.max(rect.startX, rect.endX);

		t = Math.min(rect.startY, rect.endY);
		b = Math.max(rect.startY, rect.endY);

		self.box.style.left = l+'px';
		self.box.style.top = t+'px';
		self.box.style.width = (r - l) + 'px';
		self.box.style.height = (b - t) + 'px';
	}

	function onMouseUp(event) {
		if (!self.in_progress)
			return;

		self.box.style.display = 'none';
		self.box.style.left = 0;
		self.box.style.top = 0;
		self.box.style.width = 0;
		self.box.style.height = 0;

		self.finishSelection();
	}

	function selectPoints() {
		var l = Math.min(rect.startX, rect.endX);
		var r = Math.max(rect.startX, rect.endX);
		var t = Math.min(rect.startY, rect.endY);
		var b = Math.max(rect.startY, rect.endY);

		self.current_selection.clear();
		self.current_selection.setAllFromSet(self.initial_selection,
		                                     self.highlight);

		self.model.forEach(function(strip, i) {
			var v = self.model.getPosition(i);
			if (isClipped(v))
				return;

			var s = screenManager.activeScreen.screenCoords(v);

			if (s.x >= l && s.x <= r && s.y >= t && s.y <= b) {
				if (self.subtracting) {
					self.current_selection.unset(i);
				} else {
					self.current_selection.set(i, self.highlight);
				}
			}
		});
	}

	function onMouseMove(event) {
		if (!self.in_progress)
			return;

		event.preventDefault();

		var coords = Util.relativeCoords(container, event.pageX, event.pageY);
		rect.endX = coords.x;
		rect.endY = coords.y;

		drawRect();
		selectPoints();
	}
}

LineSelection = function(viewport, model) {
	SelectionTool.call(this, viewport, model);
	var self = this;

	var p1 = undefined;

	this.viewport.addEventListener('mousedown', onMouseDown, false);

	function onMouseDown(event) {
		if (!self.enabled)
			return;

		var coords = Util.relativeCoords(container, event.pageX, event.pageY);
		var chosen = screenManager.activeScreen.getPointAt(self.model, coords.x, coords.y);
		if (!chosen)
			return;

		if (!p1) {
			self.startSelection(event);
			p1 = chosen.index;
			self.current_selection.set(p1, self.highlight);
		} else {
			var p2 = chosen.index;
			self.current_selection.set(p2, self.highlight);
			var pos1 = self.model.getPosition(p1);
			var pos2 = self.model.getPosition(p2);
			var line = new THREE.Line3(pos1, pos2);

			// Reduce search to points within a sphere containing the line
			var midPoint = pos1.clone().add(pos2).divideScalar(2);
			var rad = midPoint.clone().sub(pos1).length() + 0.1;
			var points = self.model.pointsWithinRadius(midPoint, rad);

			for (var i = 0; i < points.length; i++) {
				var dist = Util.distanceToLine(points[i].position, line);
				if (dist < selectionThreshold) {
					self.current_selection.set(points[i].index, self.highlight);
				}
			}
			p1 = p2 = undefined;

			self.finishSelection();
		}
	}
}

PlaneSelection = function(viewport, model) {
	SelectionTool.call(this, viewport, model);
	var self = this;

	var points = [];

	this.viewport.addEventListener('mousedown', onMouseDown, false);

	function onMouseDown(event) {
		if (!self.enabled)
			return;

		var coords = Util.relativeCoords(container, event.pageX, event.pageY);
		var chosen = screenManager.activeScreen.getPointAt(self.model, coords.x, coords.y);
		if (!chosen)
			return;

		if (points.length < 3) {
			if (points.length == 0)
				self.startSelection(event);

			points.push(self.model.getPosition(chosen.index));
			// TODO needs actively selecting points to be distinct from
			// already selected points or unselected points
			if (self.subtrating) {
				self.current_selection.unset(chosen.index, self.highlight);
			} else {
				self.current_selection.set(chosen.index, self.highlight);
			}
		}

		if (points.length == 3) {
			var line = new THREE.Line3(points[0], points[1]);
			var dist = Util.distanceToLine(points[2], line, false);

			if (dist < selectionThreshold) {
				LiteGUI.showMessage("Points must not be collinear");
				points = [];
				self.cancelSelection();
				return;
			}
			var plane = new THREE.Plane().setFromCoplanarPoints(points[0], points[1], points[2]);

			self.model.forEach(function(strip, i) {
				if (Math.abs(plane.distanceToPoint(self.model.getPosition(i))) < selectionThreshold) {
					if (self.subtracting) {
						self.current_selection.unset(i);
					} else {
						self.current_selection.set(i, self.highlight);
					}
				}
			});
			self.finishSelection();
		}
	}
}
