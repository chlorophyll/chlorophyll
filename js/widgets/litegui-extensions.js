LiteGUI.DualSlider = function(value, options) {
	options = options || {};
	this.root = document.createElement("div");
	this.root.style.display = 'inline-block';
	this.root.style.width = 'calc(100% - 6.5em)';
	this.root.style.height = '1.2em';
	this.root.style.position = 'relative';

	var slider = document.createElement('div');

	slider.style.position = 'relative';
	slider.style.backgroundColor = '#999';
	slider.style.borderLeft = '2px solid #da2';
	slider.style.borderRight = '2px solid #da2';
	slider.style.height = '100%';

	this.root.appendChild(slider);

	var self = this;

	this.value = value; // should be an object with left and right

	var min = options.min || 0.0;
	var max = options.max || 1.0;

	var range = max - min;

	this.setValue = function(value, skip_event) {
		if (value.left > value.right) {
			var temp = value.left;
			value.left = value.right;
			value.right = temp;
		}
		var left = Util.clamp(value.left, min, max);
		var right = Util.clamp(value.right, min, max);

		var normleft = (left - min) / range;
		var normright = (right - min) / range;

		slider.style.left = (normleft*100) + '%';
		slider.style.width = ((normright-normleft)*100) + '%';

		if (left != self.value.left || right != self.value.right) {
			self.value.left = left;
			self.value.right = right;
			if (!skip_event)
				LiteGUI.trigger(self.root, "change", self.value);
		}
	}

	function setFromX(x) {
		var width = self.root.clientWidth;
		var norm = x / width;

		var val = range * norm + min;

		var value = {
			left: self.value.left,
			right: self.value.right
		}

		if (Math.abs(val - value.left) < Math.abs(val - value.right)) {
			value.left = val;
		} else {
			value.right = val;
		}
		self.setValue(value);
	}

	var doc_binded = null;

	self.root.addEventListener("mousedown", function(e) {
		setFromX(Util.relativeCoords(self.root, e.pageX, e.pageY).x);
		doc_binded = self.root.ownerDocument;
		doc_binded.addEventListener("mousemove", onMouseMove);
		doc_binded.addEventListener("mouseup", onMouseUp);
	});

	function onMouseMove(e) {
		setFromX(Util.relativeCoords(self.root, e.pageX, e.pageY).x);
		e.preventDefault();
		return false;
	}

	function onMouseUp(e) {
		var doc = doc_binded || document;
		doc_binded = null;
		doc.removeEventListener("mousemove", onMouseMove);
		doc.removeEventListener("mouseup", onMouseUp);
		e.preventDefault();
		return false;
	}

	this.setValue(value);
}

LiteGUI.Slider = function(value, options) {
	options = options || {};
	this.root = document.createElement("div");
	this.root.style.display = 'inline-block';
	this.root.style.width = 'calc(100% - 3.5em)';
	this.root.style.float = 'right';
	this.root.style.height = '1.2em';
	this.root.style.position = 'relative';

	var slider = document.createElement('div');

	slider.style.position = 'relative';
	slider.style.backgroundColor = '#999';
	slider.style.borderRight = '2px solid #da2';
	slider.style.height = '100%';
	slider.style.left = '0%';

	this.root.appendChild(slider);

	var self = this;

	this.value = value; // should be an object with left and right

	var min = options.min || 0.0;
	var max = options.max || 1.0;

	var range = max - min;

	this.setValue = function(value, skip_event) {
		var value = Util.clamp(value, min, max);

		var norm = (value - min) / range;

		slider.style.width = (norm*100) + '%';

		if (value != self.value) {
			self.value = value;
			if (!skip_event)
				LiteGUI.trigger(self.root, "change", value);
		}
	}

	function setFromX(x) {
		var width = self.root.clientWidth;
		var norm = x / width;

		var val = range * norm + min;

		self.setValue(val);
	}

	var doc_binded = null;

	self.root.addEventListener("mousedown", function(e) {
		setFromX(Util.relativeCoords(self.root, e.pageX, e.pageY).x);
		doc_binded = self.root.ownerDocument;
		doc_binded.addEventListener("mousemove", onMouseMove);
		doc_binded.addEventListener("mouseup", onMouseUp);
	});

	function onMouseMove(e) {
		setFromX(Util.relativeCoords(self.root, e.pageX, e.pageY).x);
		e.preventDefault();
		return false;
	}

	function onMouseUp(e) {
		var doc = doc_binded || document;
		doc_binded = null;
		doc.removeEventListener("mousemove", onMouseMove);
		doc.removeEventListener("mouseup", onMouseUp);
		e.preventDefault();
		return false;
	}

	this.setValue(value);
};

(function() {
var oldSlider = LiteGUI.Inspector.prototype.addSlider;
LiteGUI.Inspector.prototype.addSlider = function(name, value, options) {
	var element = oldSlider.call(this, name, value, options);
	var sliderText = element.querySelector('.slider-text');
	sliderText.style.width = '2em';
	return element;
}

LiteGUI.Inspector.prototype.addQuantity = function(name, value, options) {
	var self = this;

	options = this.processOptions(options);

	value = value || {number: 0, units: options.units[0]};

	var element = this.createWidget(name,"", options);
	this.append(element, options);

	self.values[name] = value;

	var units = options.units;
	options.units = null;
	options.extraclass = "full";
	options.tab_index = this.tab_index;
	options.full = true;
	options.precision = options.precision !== undefined ? options.precision : 2;
	options.step = options.step === undefined ? (options.precision == 0 ? 1 : 0.1) : options.step;
	this.tab_index++;

	var dragger = new LiteGUI.Dragger(value.number, options);
	var div = dragger.root;
	var input = dragger.input;
	element.content.appendChild(div);
	div.style.width = 'calc(99% - 4em - 5px)';
	div.style.display = 'inline-block';

	input.addEventListener('change', function(e) {
		value.number = e.target.value;
		if (options.callback) {
			var ret = options.callback.call(element, element.getValue());
			if (ret !== undefined) {
				element.setValue(ret);
			}
		}
	});

	var select = document.createElement('select');
	element.content.appendChild(select);
	select.style.width = '4em';
	options = this.processOptions(options);
	for (var i = 0; i < units.length; i++) {
		var option = document.createElement('option');
		option.value = units[i];
		option.innerText = units[i];
		select.appendChild(option);
	}
	select.value = value.units;
	select.addEventListener('change', function() {
		var old = value.units;
		value.units = select.value;
		if (options.callback) {
			var ret = options.callback.call(element, element.getValue(), old);
			if (ret !== undefined) {
				element.setValue(ret);
			}
		}
	});

	element.setValue = function(v) {
		value.units = v.units;
		value.number = parseFloat(v.number);
		if (options.precision)
			value.number = value.number.toFixed(options.precision);
		input.value = value.number;
		select.value = value.units;

		if (self.onchange)
			self.onchange(name,value,element);
	}

	element.getValue = function() {
		return {number: value.number, units: value.units};
	}

	return element;
}

Inspector.prototype.addDualSlider = function(name, value, options) {
	options = this.processOptions(options);

	if(options.min === undefined)
		options.min = 0;

	if(options.max === undefined)
		options.max = 1;

	if(options.step === undefined)
		options.step = 0.01;

	var that = this;
	if(value === undefined || value === null) {
		value = {
			left: options.min,
			right: options.max
		}
	}
	this.values[name] = value;

	var element = this.createWidget(name,
		"<span class='inputfield full'><input tabIndex='"+this.tab_index+"' type='text' class='slider-text slider-left fixed nano' value='"+value.left+"' /><span class='slider-container'></span><input tabIndex='"+this.tab_index+"' type='text' class='slider-text fixed nano slider-right' value='"+value.right+"' /></span>", options);

	var slider_container = element.querySelector(".slider-container");

	var slider = new LiteGUI.DualSlider(value,options);
	slider_container.appendChild(slider.root);

	//Text change -> update slider
	var skip_change = false;

	var left_text = element.querySelector('.slider-left');
	left_text.style.width = '2em';
	var right_text = element.querySelector('.slider-right');
	right_text.style.width = '2em';

	left_text.addEventListener('change', function(e) {
		if(skip_change)
			return;
		var v = parseFloat( this.value );
		value.left = v;
		slider.setValue( value );
		Inspector.onWidgetChange.call( that,element,name,value, options );
	});
	right_text.addEventListener('change', function(e) {
		if(skip_change)
			return;
		var v = parseFloat( this.value );
		value.right = v;
		slider.setValue( value );
		Inspector.onWidgetChange.call( that,element,name,value, options );
	});

	//Slider change -> update Text
	slider.root.addEventListener("change", function(e) {
		value = e.detail;
		left_text.value = value.left;
		right_text.value = value.right;
		Inspector.onWidgetChange.call(that,element,name,value, options);
	});

	this.append(element,options);

	element.setValue = function(v,skip_event) { 
		if(v === undefined)
			return;
		value = v;
		slider.setValue(v,skip_event);
	};
	element.getValue = function() { 
		return value;
	};

	this.processElement(element, options);
	return element;
}
})();

Inspector.prototype.addColor = function(name, value, options) {
	optins = this.processOptions(options);

	value = value || [0, 0, 0];

	var self = this;

	this.values[name] = value;

	var input = document.createElement('input');

	input.tabIndex = this.tab_index++;
	input.id = 'colorpicker-'+name;
	input.className = 'color';

	console.log(input.value);

	input.disabled = options.disabled || false;

	var element = this.createWidget(name, input, options);

	this.append(element, options);

	var picker = new jscolor.color(input);
	picker.pickerFaceColor = "#333";
	picker.pickerBorderColor = "black";
	picker.pickerInsetColor = "#222";

	console.log('whee');

	picker.fromRGB(value[0], value[1], value[2]);

	picker.onImmediateChange = function() {
		var v = picker.rgb;
		var event_data = [v.concat(), picker.toString()];
		LiteGUI.trigger(element, 'wbeforechange', event_data);
		self.values[name] = v;

		if (options.callback)
			options.callback.call(element, v.concat(), '#'+picker.toString(), picker);

		LiteGUI.trigger( element, "wchange", event_data );
		if(self.onchange) self.onchange(name, v.concat(), element);
	}
	element.setValue = function(value,skip_event) {
		myColor.fromRGB(value[0],value[1],value[2]);
		if(!skip_event)
			LiteGUI.trigger( dragger.input, "change" );
	}
	this.processElement(element, options);
	return element;
}
