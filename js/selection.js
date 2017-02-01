function isClipped(v) {
	if (frontPlane.distanceToPoint(v) < 0)
		return true;

	if (backPlane.distanceToPoint(v) < 0)
		return true;
	return false;
}

function getPointAt(model,x,y) {
	var mouse3D = new THREE.Vector3(
		 (x /  window.innerWidth) * 2 - 1,
		-(y / window.innerHeight) * 2 + 1,
		0.5);
	var raycaster = new THREE.Raycaster();
	raycaster.params.Points.threshold = 10;
	raycaster.setFromCamera(mouse3D, camera);
	var intersects = raycaster.intersectObject(particles);
	var chosen = undefined;
	for (var i = 0; i < intersects.length; i++) {
		if (!isClipped(intersects[i].point)) {
			chosen = intersects[i];
			break;
		}
	}
	return chosen;
}

MarqueeSelection = function(model, domElement) {
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	var self = this;

	this.enabled = true

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

	function onMouseDown(event) {
		if (!self.enabled) return;
		isSelecting = !event.altKey;
		dragging = true;
		selectedPoints = model.createOverlay(20);
		rect.startX = event.clientX;
		rect.startY = event.clientY;
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

		dragging = false;

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

		model.removeOverlay(selectedPoints);

		self.dom.style.display = 'none';
		self.dom.style.left = 0;
		self.dom.style.top = 0;
		self.dom.style.width = 0;
		self.dom.style.height = 0;

		self.manager.endCommand();
	}


	function selectPoints() {
		var l = Math.min(rect.startX, rect.endX);
		var r = Math.max(rect.startX, rect.endX);
		var t = Math.min(rect.startY, rect.endY);
		var b = Math.max(rect.startY, rect.endY);

		var c = new THREE.Color(1, 1, 1);

		selectedPoints.clear();

		model.forEachStrip(function(strip, i) {
			var v = model.getPosition(i);
			if (isClipped(v))
				return;

			var s = Util.screenCoords(v);

			if (s.x >= l && s.x <= r && s.y >= t && s.y <= b) {
				if (!isSelecting) {
					c = model.defaultColor(strip);
				}
				selectedPoints.set(i,c);
			}
		});
	}

	function onMouseMove(event) {
		if (!dragging) return;
		event.preventDefault();

		rect.endX = event.clientX;
		rect.endY = event.clientY;

		drawRect();
		selectPoints();
	}
}

LineSelection = function(model, domElement) {
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	var self = this;

	this.enabled = false;

	var p1 = undefined;

	var selectedPoints = model.createOverlay(20);

	var highlight = new THREE.Color(0xffffff);

	function onMouseDown(event) {
		if (!self.enabled)
			return;

		var chosen = getPointAt(model, event.clientX, event.clientY);
		if (!chosen)
			return;

		if (!p1) {
			p1 = chosen.index;
			selectedPoints.set(p1, highlight);
		} else {
			var p2 = chosen.index;
			selectedPoints.set(p2, highlight);
			var pos1 = model.getPosition(p1);
			var pos2 = model.getPosition(p2);

			var midPoint = pos1.clone().add(pos2).divideScalar(2);

			var rad = midPoint.clone().sub(pos1).length() + 0.1;
			var points = model.pointsWithinRadius(midPoint, rad);

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
			selectedPoints.clear();
			p1 = p2 = undefined;
			self.manager.endCommand();
		}
	}
	this.domElement.addEventListener('mousedown', onMouseDown, false);
}

PlaneSelection = function(model, domElement) {
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	var self = this;
	var highlight = new THREE.Color(0xffffff);

	this.enabled = true;
	var points = [];
	var selectedPoints = model.createOverlay();
	function onMouseDown(event) {
		if (!self.enabled)
			return;
		var chosen = getPointAt(model, event.clientX, event.clientY);
		if (!chosen)
			return;

		if (points.length < 3) {
			points.push(model.getPosition(chosen.index));
			selectedPoints.set(chosen.index, highlight);
		}

		if (points.length == 3) {
			var plane = new THREE.Plane().setFromCoplanarPoints(points[0], points[1], points[2]);

			model.forEachStrip(function(strip, i) {
				if (Math.abs(plane.distanceToPoint(model.getPosition(i))) < selectionThreshold) {
					selectedPoints.set(i, highlight);
				}
			});
			worldState.activeSelection.setAll(selectedPoints);
			worldState.checkpoint();
			selectedPoints.clear();
			points = [];
			self.manager.endCommand();
		}
	}
	this.domElement.addEventListener('mousedown', onMouseDown, false);
}
