function isClipped(v) {
	if (frontPlane.distanceToPoint(v) < 0)
		return true;

	if (backPlane.distanceToPoint(v) < 0)
		return true;
	return false;
}

Marquee = function(model, domElement) {
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	var self = this;

	this.enabled = true

	var dragging = false;
	var isSelecting = true;
	rect = {};
	var selectedPoints = {};

	this.dom = document.createElement('div');
	this.dom.style.position = 'absolute';
	this.dom.style.borderStyle = 'dotted';
	this.dom.style.borderWidth = '1px';
	this.dom.style.borderColor = 'white';

	this.domElement.addEventListener('mousedown', onMouseDown, false);
	this.domElement.addEventListener('mouseup', onMouseUp, false);
	this.domElement.addEventListener('mousemove', onMouseMove, false);

	function onMouseDown(event) {
		if (!self.enabled) return;
		isSelecting = !event.altKey;
		dragging = true;
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
		if (isSelecting) {
			worldState.activeSelection = selectedPoints;
		} else {
			for (var i in selectedPoints) {
				delete worldState.activeSelection[i];
			}
		}
		selectedPoints = {};
		model.updateColors();

		self.dom.style.display = 'none';
		self.dom.style.left = 0;
		self.dom.style.top = 0;
		self.dom.style.width = 0;
		self.dom.style.height = 0;
	}


	function selectPoints() {
		var l = Math.min(rect.startX, rect.endX);
		var r = Math.max(rect.startX, rect.endX);
		var t = Math.min(rect.startY, rect.endY);
		var b = Math.max(rect.startY, rect.endY);

		var c = new THREE.Color(1, 1, 1);

		selectedPoints = {};

		model.forEachStrip(function(strip, i) {
			var v = model.getPosition(i);
			if (isClipped(v))
				return;

			var s = Util.screenCoords(v);

			if (s.x >= l && s.x <= r && s.y >= t && s.y <= b) {
				selectedPoints[i] = true;
				if (isSelecting) {
					model.selectPixel(i);
				} else {
					model.deselectPixel(i);
				}
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

	var p1 = undefined;


	function onMouseDown(event) {
		var mouse3D = new THREE.Vector3(
			(event.clientX / window.innerWidth) * 2 - 1,
			-(event.clientY / window.innerHeight) * 2 + 1,
			0.5);
		var raycaster = new THREE.Raycaster();
		raycaster.params.Points.threshold = 10;
		raycaster.setFromCamera(mouse3D, camera);
		var intersects = raycaster.intersectObject(particles);
		var chosen;
		for (var i = 0; i < intersects.length; i++) {
			if (!isClipped(intersects[i].point)) {
				chosen = intersects[i];
				break;
			}
		}

		if (!chosen)
			return;

		if (!p1) {
			p1 = chosen.index;
			model.selectPixel(p1);
		} else {
			var p2 = chosen.index;
			var pos1 = model.getPosition(p1);
			var pos2 = model.getPosition(p2);

			var midPoint = pos1.clone().add(pos2).divideScalar(2);

			var rad = midPoint.clone().sub(pos1).length() + 0.1;
			var points = model.pointsWithinRadius(pos1, rad);

			var line = new THREE.Line3(pos1, pos2);

			for ( var i = 0; i < points.length; i++) {
				var objData = points[i];
				var point = objData.position;

				var dist = Util.distanceToLine(point, line);
				if (dist < 5) {
					model.selectPixel(objData.index);
				}
			}
			//model.deselectPixel(p1);
			p1 = p2 = undefined;
		}
	}
	this.domElement.addEventListener('mousedown', onMouseDown, false);
}

