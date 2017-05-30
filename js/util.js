var Util = {
	clone: function(obj) {
		// Handle the 3 simple types, and null or undefined
		if (null == obj || "object" != typeof obj) return obj;

		// Handle Date
		if (obj instanceof Date) {
			var copy = new Date();
			copy.setTime(obj.getTime());
			return copy;
		}

		// Handle Array
		if (obj instanceof Array) {
			var copy = [];
			for (var i = 0, len = obj.length; i < len; i++) {
				copy[i] = Util.clone(obj[i]);
			}
			return copy;
		}

		if (obj.clone) {
			return obj.clone();
		}

		// Handle Object
		if (obj instanceof Object) {
			var copy = {};
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = Util.clone(obj[attr]);
			}
			return copy;
		}

		throw new Error("Unable to copy obj! Its type isn't supported.");
	},
	clamp: function(val, min, max) {
		if (val < min)
			val = min;
		if (val > max)
			val = max;
		return val;
	},
	bezierByH: function(x0, y0, x1, y1) {
		var mx = x0 + (x1 - x0) / 2;

		return 'M' + x0 + ' ' + y0 + ' '
			 + 'C' + mx + ' ' + y0 + ' '
			 +       mx + ' ' + y1 + ' '
			 +       x1 + ' ' + y1;
	},
	rotateTransform: function(angleRad, origin) {
		return 'rotate('+[THREE.Math.radToDeg(angleRad), origin.x, origin.y].join(',')+')';
	},

	distanceToLine: function(point, line, clamp) {
		if (clamp == undefined) {
			clamp = true;
		}
		var closest = line.closestPointToPoint(point, clamp);
		var ret = closest.sub(point).length();
		return ret;
	},

	relativeCoords: function relativeCoords(container, pageX, pageY) {
		var offset = $(container).offset();
		return {
			x: pageX - offset.left,
			y: pageY - offset.top
		}
	},

	cameraPlaneCoords: function(camera, renderer, position) {
		var vector = position.clone();
		var width = container.clientWidth;
		var height = container.clientHeight;

		// map to normalized device coordinate (NDC) space
		vector.project( camera );

		vector.x = (   vector.x + 1 ) * width  / 2;
		vector.y = ( - vector.y + 1 ) * height / 2;

		vector.z = 0;
		return vector;
	},

	centroid: function(points) {
		var sum = new THREE.Vector3();

		for (var i = 0; i < points.length; i++) {
			sum.add(points[i]);
		}
		return sum.divideScalar(points.length);
	},

	// Code based on http://www.ilikebigbits.com/blog/2015/3/2/plane-from-points
	bestFitPlane: function(points) {
		var centroid = Util.centroid(points);

		// Calc full 3x3 covariance matrix, excluding symmetries:
		var xx = 0.0, xy = 0.0, xz = 0.0;
		var yy = 0.0, yz = 0.0, zz = 0.0;

		for (var i = 0; i < points.length; i++) {
			var r = points[i].clone().sub(centroid);
			xx += r.x * r.x;
			xy += r.x * r.y;
			xz += r.x * r.z;
			yy += r.y * r.y;
			yz += r.y * r.z;
			zz += r.z * r.z;
		}
		var det_x = yy*zz - yz*yz;
		var det_y = xx*zz - xz*xz;
		var det_z = xx*yy - xy*xy;

		var det_max = Math.max(det_x, det_y, det_z);

		var dir = new THREE.Vector3();
        if (det_max == det_x) {
            var a = (xz*yz - xy*zz) / det_x;
            var b = (xy*yz - xz*yy) / det_x;
			dir.set(1.0, a, b);
        } else if (det_max == det_y) {
            var a = (yz*xz - xy*zz) / det_y;
            var b = (xy*xz - yz*xx) / det_y;
            dir.set(a, 1.0, b);
		} else {
			var a = (yz*xy - xz*yy) / det_z;
			var b = (xz*xy - yz*xx) / det_z;
			dir.set(a, b, 1.0);
		}
		dir.normalize();
		return new THREE.Plane().setFromNormalAndCoplanarPoint(dir, centroid);
	},

	alignWithVector: function(vec, camera) {
		var radius = camera.position.length();
		var s = new THREE.Spherical().setFromVector3(vec);
		s.radius = radius;
		s.makeSafe();
		camera.position.setFromSpherical(s);
	},

	hilightElement: function(elem) {
		elem.__saved_background = elem.style.background;
		elem.style.background = "transparent " +
			"linear-gradient(#ed5f0e, #b7551d) repeat scroll 0px 0px";
	},

	unhilightElement: function(elem) {
		elem.style.background = elem.__saved_background;
		delete elem.saved_background;
	},

	Range: function(min, max, lower, upper) {
		this.min = min;
		this.max = max;
		this.lower = lower;
		this.upper = upper;

		this.toString = function() {
			return `${this.lower.toFixed(2)} - ${this.upper.toFixed(2)}`
		}

		this.serialize = function() {
			return {min: this.min, max: this.max, lower: this.lower, upper: this.upper};
		}

		this.constructor.deserialize = function(obj) {
			return new Util.Range(obj.min, obj.max, obj.lower, obj.upper);
		}
	},
};

Util.JSON = {
	tags: {},
	addType: function(tag, constructor) {
		this.tags[tag] = constructor;

		constructor.toJSON = function() {
			return {'_tag': tag};
		}

		constructor.prototype.toJSON = function() {
			return {'_tag': tag, value: this.serialize()};
		}
	},

	dump: function(obj) {
		return JSON.stringify(obj)
	},

	load: function(s) {
		var out = JSON.parse(s, function(key, val) {
			if (val instanceof Object && val._tag) {
				if (val.value !== undefined) {
					return Util.JSON.tags[val._tag].deserialize(val.value);
				} else {
					return Util.JSON.tags[val._tag];
				}
			} else {
				return val;
			}
		});
		return out;
	}
};

Util.JSON.addType('Range', Util.Range);
