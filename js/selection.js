function isClipped(v) {
	if (frontPlane.distanceToPoint(v) < 0)
		return true;

	if (backPlane.distanceToPoint(v) < 0)
		return true;
	return false;
}

MarqueeSelection = function(domElement) {
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	var self = this;

	this.enabled = false;

	var dragging = false;
	var isSelecting = true;
	var rect = {};

	this.dom = document.createElement('div');
	this.dom.style.position = 'absolute';
	this.dom.style.borderStyle = 'dotted';
	this.dom.style.borderWidth = '1px';
	this.dom.style.borderColor = 'white';

	this.domElement.appendChild(this.dom);

	this.domElement.addEventListener('mousedown', onMouseDown, false);
	this.domElement.addEventListener('mouseup', onMouseUp, false);
	this.domElement.addEventListener('mousemove', onMouseMove, false);

	this.start = function() {
		self.enabled = true;
		screenManager.activeScreen.controlsEnabled = false;
		selectedPoints = self.model.createOverlay(20);

		Mousetrap.bind('esc', end);
	}

	function end() {
		Mousetrap.unbind('esc');
		dragging = false;
		self.model.removeOverlay(selectedPoints);
		self.dom.style.display = 'none';
		self.dom.style.left = 0;
		self.dom.style.top = 0;
		self.dom.style.width = 0;
		self.dom.style.height = 0;
		screenManager.activeScreen.controlsEnabled = true;
		self.enabled = false;
		self.manager.endCommand();
	}

	function isEnabled() {
		return self.enabled && self.model;
	}

	function onMouseDown(event) {
		if (!isEnabled()) return;
		isSelecting = !event.altKey;
		dragging = true;
		var coords = Util.relativeCoords(container, event.pageX, event.pageY);
		rect.startX = coords.x;
		rect.startY = coords.y;
		self.dom.style.display = 'block';
	}

	function drawRect() {
		l = Math.min(rect.startX, rect.endX);
		r = Math.max(rect.startX, rect.endX);

		t = Math.min(rect.startY, rect.endY);
		b = Math.max(rect.startY, rect.endY);

		self.dom.style.left = l+'px';
		self.dom.style.top = t+'px';
		self.dom.style.width = (r - l) + 'px';
		self.dom.style.height = (b - t) + 'px';
	}

	function onMouseUp(event) {
		if (!dragging) return;


		/*
		 * Set the current selection of points to the global state and clear it.
		 */
		if (selectedPoints.size() > 0) {
			if (isSelecting) {
				worldState.activeSelection.setAll(selectedPoints);
			} else {
				worldState.activeSelection.unsetAll(selectedPoints);
			}
			worldState.checkpoint();
		}

		end();
	}


	function selectPoints() {
		var l = Math.min(rect.startX, rect.endX);
		var r = Math.max(rect.startX, rect.endX);
		var t = Math.min(rect.startY, rect.endY);
		var b = Math.max(rect.startY, rect.endY);

		var c = new THREE.Color(1, 1, 1);

		selectedPoints.clear();

		self.model.forEach(function(strip, i) {
			var v = self.model.getPosition(i);
			if (isClipped(v))
				return;

			var s = screenManager.activeScreen.screenCoords(v);

			if (s.x >= l && s.x <= r && s.y >= t && s.y <= b) {
				if (!isSelecting) {
					c = self.model.defaultColor(strip);
				}
				selectedPoints.set(i,c);
			}
		});
	}

	function onMouseMove(event) {
		if (!dragging) return;
		event.preventDefault();

		var coords = Util.relativeCoords(container, event.pageX, event.pageY);
		rect.endX = coords.x;
		rect.endY = coords.y;

		drawRect();
		selectPoints();
	}
}

LineSelection = function(domElement) {
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	var self = this;

	this.enabled = false;

	var p1 = undefined;

	var selectedPoints = undefined;

	var highlight = new THREE.Color(0xffffff);


	function isEnabled() {
		return self.enabled && self.model;
	}

	function end() {
		Mousetrap.unbind('esc');
		self.enabled = false;
		screenManager.activeScreen.controlsEnabled = true;
		p1 = p2 = undefined;
		self.model.removeOverlay(selectedPoints);
		self.manager.endCommand();
	}

	this.start = function() {
		Mousetrap.bind('esc', end);
		self.enabled = true;
		screenManager.activeScreen.controlsEnabled = false;
	}

	function onMouseDown(event) {
		if (!isEnabled())
			return;

		selectedPoints = self.model.createOverlay(20);

		var coords = Util.relativeCoords(container, event.pageX, event.pageY);

		var chosen = screenManager.activeScreen.getPointAt(self.model, coords.x, coords.y);
		if (!chosen)
			return;

		if (!p1) {
			p1 = chosen.index;
			selectedPoints.set(p1, highlight);
		} else {
			var p2 = chosen.index;
			selectedPoints.set(p2, highlight);
			var pos1 = self.model.getPosition(p1);
			var pos2 = self.model.getPosition(p2);

			var midPoint = pos1.clone().add(pos2).divideScalar(2);

			var rad = midPoint.clone().sub(pos1).length() + 0.1;
			var points = self.model.pointsWithinRadius(midPoint, rad);

			var line = new THREE.Line3(pos1, pos2);

			for ( var i = 0; i < points.length; i++) {
				var objData = points[i];
				var point = objData.position;

				var dist = Util.distanceToLine(point, line);
				if (dist < selectionThreshold) {
					selectedPoints.set(objData.index, highlight);
				}
			}
			worldState.activeSelection.setAll(selectedPoints);
			worldState.checkpoint();
			end();
		}
	}
	this.domElement.addEventListener('mousedown', onMouseDown, false);
}

PlaneSelection = function(domElement) {
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	var self = this;
	var highlight = new THREE.Color(0xffffff);

	this.enabled = false;
	var points = [];
	var selectedPoints;


	function end() {
		Mousetrap.unbind('esc');
		points = [];
		self.enabled = false;
		screenManager.activeScreen.controlsEnabled = true;
		self.model.removeOverlay(selectedPoints);
		self.manager.endCommand();
	}

	function isEnabled() {
		return self.enabled && self.model;
	}

	this.start = function() {
		Mousetrap.bind('esc', end);
		this.enabled = true;
		screenManager.activeScreen.controlsEnabled = false;
		selectedPoints = this.model.createOverlay();
	}

	function onMouseDown(event) {
		if (!isEnabled())
			return;
		var coords = Util.relativeCoords(container, event.pageX, event.pageY);
		var chosen = screenManager.activeScreen.getPointAt(self.model, coords.x, coords.y);
		if (!chosen)
			return;

		if (points.length < 3) {
			points.push(self.model.getPosition(chosen.index));
			selectedPoints.set(chosen.index, highlight);
		}

		if (points.length == 3) {
			var line = new THREE.Line3(points[0], points[1]);
			var dist = Util.distanceToLine(points[2], line, false);

			if (dist < selectionThreshold) {
				LiteGUI.showMessage("Points must not be collinear");
				end();
				return;
			}
			var plane = new THREE.Plane().setFromCoplanarPoints(points[0], points[1], points[2]);

			self.model.forEach(function(strip, i) {
				if (Math.abs(plane.distanceToPoint(self.model.getPosition(i))) < selectionThreshold) {
					selectedPoints.set(i, highlight);
				}
			});
			worldState.activeSelection.setAll(selectedPoints);
			worldState.checkpoint();
			end();
		}
	}
	this.domElement.addEventListener('mousedown', onMouseDown, false);
}
