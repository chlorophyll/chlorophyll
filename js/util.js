var Util = {
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
	}
};

var _Unused = {
	roundRect: function(ctx, x, y, w, h, r) {
		ctx.beginPath();
		ctx.moveTo(x+r, y);
		ctx.lineTo(x+w-r, y);
		ctx.quadraticCurveTo(x+w, y, x+w, y+r);
		ctx.lineTo(x+w, y+h-r);
		ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
		ctx.lineTo(x+r, y+h);
		ctx.quadraticCurveTo(x, y+h, x, y+h-r);
		ctx.lineTo(x, y+r);
		ctx.quadraticCurveTo(x, y, x+r, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	},
	// This place is not a place of honor.
	// No highly esteemed deed is commemorated here.
	// Nothing valued is here. What is here is repulsive to us.
	// It came from StackOverflow.
	textSprite: function(message, parameters) {
		if ( parameters === undefined ) parameters = {};
		var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Arial";
		var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 18;
		//fontsize *= 4;
		var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 4;
		var borderColor = parameters.hasOwnProperty("borderColor") ?parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
		var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };
		var textColor = parameters.hasOwnProperty("textColor") ?parameters["textColor"] : { r:0, g:0, b:0, a:1.0 };

		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.font = "Bold " + fontsize + "px " + fontface;
		var metrics = context.measureText( message );
		var textWidth = metrics.width;
		var width = (textWidth + borderThickness);
		var height = fontsize * 1.4 + borderThickness;

		canvas.width = width;
		canvas.height = height;
		context.font = "Bold " + fontsize + "px " + fontface;

		context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
		context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

		context.lineWidth = borderThickness;
		roundRect(context, borderThickness/2, borderThickness/2, width, height, 8);

		context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
		context.fillText( message, borderThickness, fontsize + borderThickness);

		var texture = new THREE.Texture(canvas);
		texture.minFilter = THREE.LinearFilter; // NearestFilter;
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.SpriteMaterial( { map: texture} );
		var sprite = new THREE.Sprite( spriteMaterial );
		sprite.scale.set(fontsize, fontsize / 2, 0.1 * fontsize);
		return sprite;
	},
}
