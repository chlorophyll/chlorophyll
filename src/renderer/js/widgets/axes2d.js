import THREE from 'three';
import d3 from 'd3';
import Widget2D from './widgets2d';

/*
 * Return the clickable object, so that we can add onclick callbacks later
 */
function arrow(handle, opts) {
	var color = opts.color, angleOffset = opts.angle, origin = opts.origin;

	handle.attr('transform', Util.rotateTransform(-angleOffset, origin))
		.append('line')
		.attr('x1', 50).attr('y1', 50)
		.attr('x2', 99).attr('y2', 50)
		.style('stroke', color);
	handle.append('polygon')
		.attr('class', 'handle')
		.attr('points', '91,46 99,50 91,54')
		.style('stroke', color)
		.style('fill', color);
	return handle;
}

/* This describes a particular type of widget: 2d axes widgets. These exist in
 * 100-unit svg viewboxes and have some arrows which describe the direction of
 * a 2d axis system, positioned by the embedded Coordinates2D.
 */
function AxesWidget(container) {
	var self = this;

	Widget2D.call(this, container);

	this.origin = new THREE.Vector2(50, 50);

	var size = 50 + (container.clientHeight * 0.2);

	var center_x = size / 2;
	var center_y = size / 2;

	this.axesContainer = d3.select(container)
		.append('svg')
		.attr('width',  size + 'px')
		.attr('height', size + 'px')
		.attr('viewBox', '0 0 100 100');

	this.axes = this.axesContainer.append('g');

	this.onPosChange = function(new_x, new_y) {
		var x = container.clientWidth * (new_x + 1)/2;
		var y = -container.clientHeight * (new_y - 1)/2;
		self.axesContainer.style('left', (x - center_x) + 'px')
		                  .style('top',  (y - center_y) + 'px');
	}

	this.onAngleChange = function(angle) {
		self.axes.attr('transform', Util.rotateTransform(angle, self.origin));
	}

	function onWindowResize() {
		size = 50 + container.clientHeight * 0.2;
		center_x = size / 2;
		center_y = size / 2;
		self.onPosChange(self.x, self.y);
		self.axesContainer.attr('width', size+'px')
	}

	this.hide = function() {
		this.axesContainer.style('display', 'none');
	}

	this.show = function() {
		this.axesContainer.style('display', '');
	}

	var rotateHint = this.axes.append('circle')
		.attr('cx', 50).attr('cy', 50)
		.attr('r', 25)
		.style('stroke', '#fff')
		.style('fill', 'none')
		.style('visibility', 'hidden')
		.style('opacity', 0.4);

	this.showRotateHint = function() {
		if (!self.dragging && !self.rotating)
			rotateHint.style("visibility", "visible");
	}

	this.hideRotateHint = function() {
		rotateHint.style("visibility", "hidden");
	}

	window.addEventListener('resize', onWindowResize, false);
}
AxesWidget.prototype = Object.create(Widget2D.prototype);

export function CartesianAxes(container) {
	var self = this;
	AxesWidget.call(this, container);


	this.axes.append("g")
		.call(arrow, {
			color: "#f00",
			angle: 0,
			origin: this.origin
		}).call(self.rotationBehavior(self.hideRotateHint, 0));

	this.axes.append("g")
		.call(arrow, {
			color: "#0f0",
			angle: Math.PI/2,
			origin: this.origin
		}).call(self.rotationBehavior(self.hideRotateHint, Math.PI/2));

	this.axes.select('polygon').on('mouseover', self.showRotateHint)
	                           .on('mouseout', self.hideRotateHint);

	this.axes.append('circle')
		.attr('cx', 50).attr('cy', 50)
		.attr('r', 1)
		.style('stroke', '#fff')
		.style('fill', '#fff');

	this.axes.append('rect')
		.attr('class', 'handle')
		.attr('x', 50 - 8).attr('y', 50 - 8)
		.attr('width', 16).attr('height', 16)
		.style('stroke', '#fff')
		.style('fill', '#fff')
		.style('opacity', 0.3)
		.call(self.dragBehavior);

	this.hide();
	this.onPosChange(self.x, self.y);
}
CartesianAxes.prototype = Object.create(AxesWidget.prototype);

export function PolarAxes(container) {
	var self = this;
	AxesWidget.call(this, container);

	this.axes.append("g").call(arrow, {
		color: "#f00",
		angle: 0,
		origin: this.origin
	}).call(self.rotationBehavior(self.hideRotateHint, 0));

	this.axes.select('polygon').on('mouseover', self.showRotateHint)
	                           .on('mouseout', self.hideRotateHint);

	this.axes.append('circle')
		.attr('cx', 50).attr('cy', 50)
		.attr('r', 1)
		.style('stroke', '#fff')
		.style('fill', '#fff');

	this.axes.append('circle')
		.attr('class', 'handle')
		.attr('cx', 50).attr('cy', 50)
		.attr('r', 8)
		.style('stroke', '#fff')
		.style('fill', '#fff')
		.style('opacity', 0.3)
		.call(self.dragBehavior);

	this.hide();
	this.onPosChange(self.x,self.y);
}

PolarAxes.prototype = Object.create(AxesWidget.prototype);
