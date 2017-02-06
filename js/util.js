var Util = {
	distanceToLine: function(point, line) {
		//var d1 = point.clone().sub(line.start);
		//var d2 = point.clone().sub(line.end);

		//d1.cross(d2);

		//return d1.length() / line.distance();
		//
		var closest = line.closestPointToPoint(point, true);
		var ret = closest.sub(point).length();
		return ret;
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
