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
