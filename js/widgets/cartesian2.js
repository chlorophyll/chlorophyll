Cartesian2Widget = function(container) {
	var pw = container.clientWidth, ph = container.clientHeight;

	var origin = new THREE.Vector2(50,50);

	var axesContainer = d3.select(container)
		.append('svg')
		.attr('width',  0.3*ph + 'px')
		.attr('height', 0.3*ph + 'px')
		.attr('viewBox', '0 0 100 100');
	var center_x = 0.3 * ph / 2;
	var center_y = 0.3 * ph / 2;
	var self = this;

	angle = 0;
	var x = parseInt(axesContainer.node().style.left || 0) + center_x;
	var y = parseInt(axesContainer.node().style.top  || 0) + center_y;

	var axes = axesContainer.append('g');
	var xhandle = axes.append("g");
	var yhandle = axes.append("g");

	var snap_angles = false;
	Mousetrap.bind('shift', function() { snap_angles = true; }, 'keydown');
	Mousetrap.bind('shift', function() { snap_angles = false; }, 'keyup');

	function rotate(angleRad) {
		return 'rotate('+[THREE.Math.radToDeg(angleRad), origin.x, origin.y].join(',')+')';
	}

	var rotateBehavior = d3.drag().on('drag', function() {
		var clk = new THREE.Vector2(d3.event.x, d3.event.y).sub(origin);
		angle += clk.angle();
		/* shift-snap to 15 degree angle increments */
		if (snap_angles) {
			angle = angle - (angle % (Math.PI / 12));
		}
		axes.attr('transform', rotate(angle));
	});

	var resetAxes = function() {
		angle = 0;
		axes.attr('transform', rotate(angle));
	}

	function arrow(handle, color, angleOffset) {
		handle.attr('transform', rotate(-angleOffset))
			.append('line')
			.attr('x1', 50).attr('y1', 50)
			.attr('x2', 99).attr('y2', 50)
			.style('stroke', color);
		handle.append('polygon')
			.attr('class', 'handle')
			.attr('points', '91,46 99,50 91,54')
			.style('stroke', color)
			.style('fill', color)
			.on('dblclick', resetAxes)
			.call(rotateBehavior);
	}

	xhandle.call(arrow, "#f00", 0);
	yhandle.call(arrow, "#0f0", Math.PI/2);

	axes.append('circle')
		.attr('class', 'handle')
		.attr('cx', 50).attr('cy', 50)
		.attr('r', '4')
		.style('stroke', '#fff')
		.style('fill', '#fff')
		.on('mousedown', function() {
			container.addEventListener("mousemove", _drag);
			container.addEventListener("mouseup", _endDrag);
			d3.event.preventDefault();
		});

	function _drag(event) {
		event.preventDefault();
		coords = Util.relativeCoords(event.pageX, event.pageY);
		self.setPos(coords.x, coords.y);
	}

	function _endDrag(event) {
		event.preventDefault();
		container.removeEventListener("mousemove", _drag);
		container.removeEventListener("mouseup", _endDrag);
	}

	this.data = function() {
		// Normalize angle and position
		angle = angle % (Math.PI * 2);
		var x_norm = ( x / pw ) * 2 - 1;
		var y_norm = - ( y / ph ) * 2 + 1;
		return {x: x, y: y, x_norm: x_norm, y_norm: y_norm,  angle: angle};
	}

	this.hide = function() {
		axesContainer.style('display', 'none');
	}

	this.show = function() {
		axesContainer.style('display', '');
	}

	this.showAt = function(vx, vy) {
		this.setPos(vx, vy);
		this.show();
	}

	this.setPos = function(vx, vy) {
		x = vx; y = vy;
		axesContainer.style('left', (x - center_x) + 'px')
			         .style('top',  (y - center_y) + 'px');
	}

	function onWindowResize() {
		var pctx = x / pw;
		var pcty = y / ph;

		pw = container.clientWidth;
		ph = container.clientHeight;

		axesContainer.attr('width',  0.3*ph + 'px')
		             .attr('height', 0.3*ph + 'px')
		             .attr('viewBox', '0 0 100 100');
		center_x = 0.3 * ph / 2;
		center_y = 0.3 * ph / 2;
		x = pctx * pw;
		y = pcty * ph;
		self.setPos(x,y);
	}

	window.addEventListener('resize', onWindowResize, false);
	this.hide();
}
