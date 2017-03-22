/*
 * Drawing helpers
 */
function rotate(angleRad, origin) {
	return 'rotate('+[THREE.Math.radToDeg(angleRad), origin.x, origin.y].join(',')+')';
}

/*
 * Return the clickable object, so that we can add onclick callbacks later
 */
function arrow(handle, color, angleOffset, origin) {
	handle.attr('transform', rotate(-angleOffset, origin))
		.append('line')
		.attr('x1', 50).attr('y1', 50)
		.attr('x2', 99).attr('y2', 50)
		.style('stroke', color);
	return handle.append('polygon')
		.attr('class', 'handle')
		.attr('points', '91,46 99,50 91,54')
		.style('stroke', color)
		.style('fill', color)
}

/*
 * Given a container, draw & generate a 2d handle
 */
CartesianHandle = function(container) {
	// Scale for different window sizes but keep a minimum size
	var size = 50 + (container.clientHeight * 0.2);
	var center_x = size / 2;
	var center_y = size / 2;

	this.origin = new THREE.Vector2(50, 50);

	this.handleContainer = d3.select(container)
		.append('svg')
		.attr('width',  size + 'px')
		.attr('height', size + 'px')
		.attr('viewBox', '0 0 100 100');

	this.handle = this.handleContainer.append('g');

	// Show a circular outline when mousing over arrows to indicate that
	// rotation is possible
	var rotateHint = this.handle.append('circle')
		.attr('cx', 50).attr('cy', 50)
		.attr('r', 50)
		.style('stroke', '#fff')
		.style('fill', 'none')
		.style('opacity', 0.4);

	var xaxis = this.handle.append("g");
	var yaxis = this.handle.append("g");


	function showRotateHint() {
		rotateHint.style("visibility", "visible");
	}

	function hideRotateHint() {
		rotateHint.style("visibility", "hidden");
	}

	var xaxis_arrow = xaxis.call(arrow, "#f00", 0, this.origin);
	var yaxis_arrow = yaxis.call(arrow, "#0f0", Math.PI/2, this.origin);

	this.rotHandles = [xaxis_arrow, yaxis_arrow];

	hideRotateHint();
	xaxis_arrow.on('mouseover', showRotateHint);
	yaxis_arrow.on('mouseover', showRotateHint);
	xaxis_arrow.on('mouseout', hideRotateHint);
	yaxis_arrow.on('mouseout', hideRotateHint);

	this.handle.append('circle')
		.attr('cx', 50).attr('cy', 50)
		.attr('r', 1)
		.style('stroke', '#fff')
		.style('fill', '#fff');

	this.posHandle = this.handle.append('rect')
		.attr('class', 'handle')
		.attr('x', 50 - 8).attr('y', 50 - 8)
		.attr('width', 16).attr('height', 16)
		.style('stroke', '#fff')
		.style('fill', '#fff')
		.style('opacity', 0.3);

	this.setPos = function(new_x, new_y) {
		this.handleContainer.style('left', (new_x - center_x) + 'px')
		                    .style('top',  (new_y - center_y) + 'px');
	}

	this.setRot = function(angle) {
		this.handle.attr('transform', rotate(angle, this.origin));
	}

	this.refreshSize = function() {
		size = 50 + (container.clientHeight * 0.2);
		center_x = size / 2;
		center_y = size / 2;
		this.handleContainer.attr('width',  size + 'px')
		               .attr('height', size + 'px')
		               .attr('viewBox', '0 0 100 100');
	}
}

/*
 * Given a container, draw & generate a 2d handle
 */
PolarHandle = function(container) {
	// Scale for different window sizes but keep a minimum size
	var size = 50 + (container.clientHeight * 0.2);
	var center_x = size / 2;
	var center_y = size / 2;

	this.origin = new THREE.Vector2(50, 50);

	this.handleContainer = d3.select(container)
		.append('svg')
		.attr('width',  size + 'px')
		.attr('height', size + 'px')
		.attr('viewBox', '0 0 100 100');

	this.handle = this.handleContainer.append('g');

	// Show a circular outline when mousing over arrows to indicate that
	// rotation is possible
	var rotateHint = this.handle.append('circle')
		.attr('cx', 50).attr('cy', 50)
		.attr('r', 50)
		.style('stroke', '#fff')
		.style('fill', 'none')
		.style('opacity', 0.4);

	var axis = this.handle.append("g");

	function showRotateHint() {
		rotateHint.style("visibility", "visible");
	}

	function hideRotateHint() {
		rotateHint.style("visibility", "hidden");
	}

	axis.call(arrow, "#f00", 0, this.origin);

	this.rotHandles = [axis];

	hideRotateHint();
	axis.on('mouseover', showRotateHint);
	axis.on('mouseout', hideRotateHint);

	this.handle.append('circle')
		.attr('cx', 50).attr('cy', 50)
		.attr('r', 1)
		.style('stroke', '#fff')
		.style('fill', '#fff');

	this.posHandle = this.handle.append('circle')
		.attr('class', 'handle')
		.attr('cx', 50).attr('cy', 50)
		.attr('r', 8)
		.style('stroke', '#fff')
		.style('fill', '#fff')
		.style('opacity', 0.3);

	this.setPos = function(new_x, new_y) {
		this.handleContainer.style('left', (new_x - center_x) + 'px')
		                    .style('top',  (new_y - center_y) + 'px');
	}

	this.setRot = function(angle) {
		this.handle.attr('transform', rotate(angle, this.origin));
	}

	this.refreshSize = function() {
		size = 50 + (container.clientHeight * 0.2);
		center_x = size / 2;
		center_y = size / 2;
		this.handleContainer.attr('width',  size + 'px')
		               .attr('height', size + 'px')
		               .attr('viewBox', '0 0 100 100');
	}
}

Widget2D = function(container, widgetType) {
	var self = this;

	var widget = new widgetType(container);
	var width = container.clientWidth, height = container.clientHeight;
	var x = width / 2;
	var y = height / 2;

	var angle = 0;
	var snap_angles = false;
	/*
	 * Control bindings: modifier keys and draggable areas
	 */
	Mousetrap.bind('shift', function() { snap_angles = true; }, 'keydown');
	Mousetrap.bind('shift', function() { snap_angles = false; }, 'keyup');

	function resetAxes() {
		angle = 0;
		widget.setRot(angle);
	}

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

	/*
	 * Bind click events for the handle
	 */
	widget.posHandle.on('mousedown', function() {
		container.addEventListener("mousemove", _drag);
		container.addEventListener("mouseup", _endDrag);
		d3.event.preventDefault();
	});
	for (var i = 0; i < widget.rotHandles.length; i++) {
		widget.rotHandles[i].on('dblclick', resetAxes);
		widget.rotHandles[i].call(d3.drag().on('drag', function() {
			var clk = new THREE.Vector2(d3.event.x, d3.event.y);
			angle += clk.sub(widget.origin).angle();
			/* shift-snap to 15 degree angle increments */
			if (snap_angles) {
				angle = angle - (angle % (Math.PI / 12));
			}
			widget.setRot(angle);
		}));
	}

	this.data = function() {
		// Normalize angle and position
		angle = angle % (Math.PI * 2);
		var x_norm = ( x / width ) * 2 - 1;
		var y_norm = - ( y / height ) * 2 + 1;
		return {x: x, y: y, x_norm: x_norm, y_norm: y_norm, angle: angle};
	}

	this.hide = function() {
		widget.handleContainer.style('display', 'none');
	}

	this.show = function() {
		widget.handleContainer.style('display', '');
	}

	this.destroy = function() {
		Mousetrap.unbind('shift');
		widget.handle.remove();
	}

	this.showAt = function(vx, vy) {
		this.setPos(vx, vy);
		this.show();
	}

	this.setPos = function(vx, vy) {
		x = vx; y = vy;
		widget.setPos(vx, vy);
	}

	function onWindowResize() {
		// Keep the widget in the same position proportional to the window
		var pctx = x / width;
		var pcty = y / height;

		width = container.clientWidth;
		height = container.clientHeight;

		widget.refreshSize();

		x = pctx * width;
		y = pcty * height;
		self.setPos(x,y);
	}

	window.addEventListener('resize', onWindowResize, false);
	this.hide();
}
