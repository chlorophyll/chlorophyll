Marquee = function(model, domElement) {
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	var scope = this;

	this.rect = {};
	this.model = model;
	this.enabled = true
	var dragging = false;

	this.dom = document.createElement('div');
	this.dom.style.position = 'absolute';
	this.dom.style.borderStyle = 'dotted';
	this.dom.style.borderWidth = '1px';
	this.dom.style.borderColor = 'white';

	this.domElement.addEventListener('mousedown', onMouseDown, false);
	this.domElement.addEventListener('mouseup', onMouseUp, false);
	this.domElement.addEventListener('mousemove', onMouseMove, false);


	function onMouseDown(event) {
		if (!scope.enabled) return;
		dragging = true;
		scope.rect.startX = event.clientX;
        scope.rect.startY = event.clientY;
		scope.dom.style.display = 'block';
	}

	function drawRect() {
		l = Math.min(scope.rect.startX, scope.rect.endX);
		r = Math.max(scope.rect.startX, scope.rect.endX);

		t = Math.min(scope.rect.startY, scope.rect.endY);
		b = Math.max(scope.rect.startY, scope.rect.endY);

		scope.dom.style.left = l+'px';
		scope.dom.style.top = t+'px';
		scope.dom.style.width = (r - l) + 'px';
		scope.dom.style.height = (b - t) + 'px';
	}

	function onMouseUp(event) {
		if (!dragging) return;

		dragging = false;

		scope.dom.style.display = 'none';
		scope.dom.style.width = 0;
		scope.dom.style.height = 0;
	}

	function selectPoints() {
		var l = Math.min(scope.rect.startX, scope.rect.endX);
		var r = Math.max(scope.rect.startX, scope.rect.endX);
		var t = Math.min(scope.rect.startY, scope.rect.endY);
		var b = Math.max(scope.rect.startY, scope.rect.endY);

		var c = new THREE.Color(1, 1, 1);


		model.forEachStrip(function(strip, i) {
			var v = model.getPosition(i);

			if (frontPlane.distanceToPoint(v) < 0)
				return;

			if (backPlane.distanceToPoint(v) < 0)
				return;

			var s = Util.screenCoords(v);

			if (s.x >= l && s.x <= r && s.y >= t && s.y <= b) {
				model.setColor(i, c);
			}
		});
	}


	function onMouseMove(event) {
		if (!dragging) return;
		event.preventDefault();

		scope.rect.endX = event.clientX;
		scope.rect.endY = event.clientY;

		drawRect();
		selectPoints();
	}
}
