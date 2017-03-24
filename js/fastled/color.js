FastLED = Module;

var hsv2rgb = function(hue, sat, val) {
	var h = 360*(hue/255), s = sat/255, v = val/255;
	var rgb, i, data = [];
	if (s === 0) {
		rgb = [v,v,v];
	} else {
		h = h / 60;
		i = Math.floor(h);
		data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
		switch(i) {
			case 0:
				rgb = [v, data[2], data[0]];
				break;
			case 1:
				rgb = [data[1], v, data[0]];
				break;
			case 2:
				rgb = [data[0], v, data[2]];
				break;
			case 3:
				rgb = [data[0], data[1], v];
				break;
			case 4:
				rgb = [data[2], data[0], v];
				break;
			default:
				rgb = [v, data[0], data[1]];
				break;
		}
	}
	return rgb[0]*255 << 16 | rgb[1]*255 << 8 | rgb[2]*255;
}

function CHSV(h, s, v) {
	this.h = h;
	this.s = s;
	this.v = v;
}

function CRGB(r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;
}

//hsv2rgb = FastLED.cwrap('hsv2rgb_rainbow', 'number',
//	['number', 'number', 'number']);

function make_node(target, name, args, code) {
	var output, hasThis;
	// expose as normal code
	target[name] = code;

	// now expose to LiteGraph
	var arglist = args.slice();

	if (target.prototype == undefined) { // this is on the prototype
		output = target.constructor.name;
		arglist.unshift(output);
		hasThis = true;
	} else {
		output = target.name;
		hasThis = false;
	}


	var f = function() {
		for (var arg of arglist) {
			this.addInput(arg);
		}
		this.addOutput(output);
	}

	f.title = output + '.' + name;

	f.prototype.onExecute = function() {
		var values = [];

		for (var i = 0; i < arglist.length; i++) {
			values.push(this.getInputData(i));
		}

		var that = undefined;

		if (hasThis) {
			that = values.shift();
		}
		this.setOutputData(0, code.apply(that, values));
	}

	LiteGraph.registerNodeType(output+'/'+name, f);
}

make_node(CHSV, 'construct', ['h','s','v'], function(h,s,v) {
	return new CHSV(h,s,v);
});

make_node(CRGB, 'construct', ['r','g','b'], function(r,g,b) {
	return new CRGB(r,g,b);
});

make_node(CRGB, 'fromColorCode', ['colorCode'], function(colorCode) {
    var c = new CRGB();
	return c.setColorCode(colorCode);
});

make_node(CRGB, 'fromHSV', ['hue', 'sat', 'val'], function(hue, sat, val) {
	hue = TypeUtil.convert_to_uint8_t(hue);
	sat = TypeUtil.convert_to_uint8_t(sat);
	val = TypeUtil.convert_to_uint8_t(val);
	return CRGB.fromColorCode(hsv2rgb(hue, sat, val));
});

make_node(CRGB, 'fromHue', ['hue'], function(hue, sat, val) {
	hue = TypeUtil.convert_to_uint8_t(hue);
	return CRGB.fromColorCode(hsv2rgb(hue, 255, 255));
});

make_node(CRGB.prototype, 'setColorCode', ['colorCode'], function(colorCode) {
	this.r = (colorCode >> 16) & 0xFF;
	this.g = (colorCode >>  8) & 0xFF;
	this.b = (colorCode >>  0) & 0xFF;
	return this;
});

make_node(CRGB.prototype, 'setHue', ['hue'],  function(hue) {
	var ccode = hsv2rgb(hue, 255, 255);
	this.setColorCode(ccode);
	return this;
});

make_node(CRGB.prototype, 'add', ['rhs'], function(rhs) {
	this.r = Math8.qadd8(this.r, rhs.r);
	this.g = Math8.qadd8(this.g, rhs.g);
	this.b = Math8.qadd8(this.b, rhs.b);
	return this;
});

make_node(CRGB.prototype, 'addToRGB', ['d'], function(d) {
	this.r = Math8.qadd8(this.r, d);
	this.g = Math8.qadd8(this.g, d);
	this.b = Math8.qadd8(this.b, d);
	return this;
});

make_node(CRGB.prototype, 'inc', [], function() {
	return this.addToRGB(1);
});

make_node(CRGB.prototype, 'subtract', ['rhs'], function(rhs) {
	this.r = Math8.qsub8(this.r, rhs.r);
	this.g = Math8.qsub8(this.g, rhs.g);
	this.b = Math8.qsub8(this.b, rhs.b);
	return this;
});

make_node(CRGB.prototype, 'subtractFromRGB', ['d'], function(d) {
	this.r = Math8.qsub8(this.r, d);
	this.g = Math8.qsub8(this.g, d);
	this.b = Math8.qsub8(this.b, d);
	return this;
});

make_node(CRGB.prototype, 'dec', [], function() {
	return this.subtractFromRGB(1);
});

make_node(CRGB.prototype, 'div', ['d'], function(d) {
	this.r /= d;
	this.g /= d;
	this.b /= d;
	return this;
});

make_node(CRGB.prototype, 'rsh', ['d'], function(d) {
	this.r >>= d;
	this.g >>= d;
	this.b >>= d;
	return this;
});

make_node(CRGB.prototype, 'mul', ['d'], function(d) {
	this.r = Math8.qmul8(this.r, d);
	this.g = Math8.qmul8(this.g, d);
	this.b = Math8.qmul8(this.b, d);
	return this;
});

make_node(CRGB.prototype,'nscale8_video', ['scaledown'], function(scaledown) {
	return this.setColorCode(Math8.nscale8x3_video(this.r, this.b, this.g, scaledown));
});

make_node(CRGB.prototype,'fadeLightBy', ['fadefactor'], function(fadefactor) {
	fadefactor &= 0xff;
	return this.setColorCode(Math8.nscale8x3_video(this.r, this.g, this.b, 255-fadefactor));
});

make_node(CRGB.prototype,'nscale8', ['scaledown'], function(scaledown) {
	return this.setColorCode(Math8.nscale8x3(this.r, this.b, this.g, scaledown));
});

make_node(CRGB.prototype,'nscale8_each', ['rgb'], function(rgb) {
	this.r = Math8.scale8(this.r, rgb.r);
	this.g = Math8.scale8(this.g, rgb.g);
	this.b = Math8.scale8(this.b, rgb.b);
	return this;
});

make_node(CRGB.prototype,'fadeToBlackBy', ['fadefactor'], function(fadefactor) {
	fadefactor &= 0xff;
	return this.setColorCode(Math8.nscale8x3(this.r, this.g, this.b, 255-fadefactor));
});

make_node(CRGB.prototype,'or_each', ['rhs'], function(rhs) {
	if (rhs.r > this.r) this.r = rhs.r;
	if (rhs.g > this.g) this.g = rhs.g;
	if (rhs.b > this.b) this.b = rhs.b;
	return this;
});

make_node(CRGB.prototype,'or', ['d'], function(d) {
	if (d > this.r) this.r = d;
	if (d > this.g) this.g = d;
	if (d > this.b) this.b = d;
	return this;
});

make_node(CRGB.prototype,'and_each', ['rhs'], function(rhs) {
	if (rhs.r < this.r) this.r = rhs.r;
	if (rhs.g < this.g) this.g = rhs.g;
	if (rhs.b < this.b) this.b = rhs.b;
	return this;
});

make_node(CRGB.prototype,'and', ['d'], function(d) {
	if (d < this.r) this.r = d;
	if (d < this.g) this.g = d;
	if (d < this.b) this.b = d;
	return this;
});

make_node(CRGB.prototype,'invert', [], function() {
	this.r = 255 - this.r;
	this.g = 255 - this.g;
	this.b = 255 - this.b;
});

make_node(CRGB.prototype,'lerp8', ['other', 'frac'], function(other, frac) {
	var r = Math8.lerp8by8(this.r, other.r, frac);
	var g = Math8.lerp8by8(this.g, other.g, frac);
	var b = Math8.lerp8by8(this.b, other.b, frac);
	return new CRGB(r,g,b);
});

make_node(CRGB.prototype,'lerp16', ['other', 'frac'], function(other, frac) {
	var r = Math8.lerp16by16(this.r, other.r, frac);
	var g = Math8.lerp16by16(this.g, other.g, frac);
	var b = Math8.lerp16by16(this.b, other.b, frac);
	return new CRGB(r,g,b);
});
