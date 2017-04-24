// This contains patches, etc

// The built-in context menu is not really sensible for what we want here.
(function() {
	var oldMenuOptions = LGraphCanvas.prototype.getNodeMenuOptions;

	LGraphCanvas.prototype.getNodeMenuOptions = function(node) {
		var options = oldMenuOptions(node);

		whitelist = [
			"Collapse",
			"Shapes",
			"Clone",
			"Remove"
		]

		out = [];

		for (option of options) {
			if (!option || whitelist.indexOf(option.content) != -1) {
				out.push(option);
			}
		}

		return out;
	}
})();

Inspector.prototype.addComboButtons = function(name, value, options)
{
	options = this.processOptions(options);

	value = value || "";
	var that = this;
	this.values[name] = value;

	var code = "";
	if(options.values)
		for(var v of options.values)
			code += "<button class='wcombobutton "+(value == v ? "selected":"")+"' data-name='"+v+"'>" + v + "</button>";

	var element = this.createWidget(name,code, options);
	var buttons = element.querySelectorAll( ".wcontent button" );
	LiteGUI.bind( buttons, "click", function(e) {

		var buttonname = e.target.innerHTML;
		that.values[name] = buttonname;

		var elements = element.querySelectorAll(".selected");
		for(var el of elements)
			el.classList.remove("selected");
		this.classList.add("selected");

		Inspector.onWidgetChange.call( that,element,name,buttonname, options );
	});

	element.setValue = function(val) {
		var selected;
		for (var el of buttons) {
			if (el.getAttribute('data-name') == val)
				selected = el;
			el.classList.remove('selected');
		}

		if (selected)
			selected.classList.add('selected');

		that.values[name] = val;
	}

	this.append(element,options);
	this.processElement(element, options);
	return element;
}


LiteGraph.getNodeTypesInCategory = function(category) {
	var r = [];
	for(var i in this.registered_node_types) {
		if (this.registered_node_types[i].skip_list)
			continue;
		if(category == "") {
			if (this.registered_node_types[i].category == null)
				r.push(this.registered_node_types[i]);
		} else if (this.registered_node_types[i].category == category) {
			r.push(this.registered_node_types[i]);
		}
	}
	return r;
}

LiteGraph.isValidConnection = function(type_a, type_b) {
	return (!type_a || !type_b || type_a == type_b)
}

LGraph.prototype.listeners = [];
LGraph.prototype.addEventListener = function(type, callback) {
	if (!(type in this.listeners)) {
		this.listeners[type] = [];
	}
	this.listeners[type].push(callback);
};

LGraph.prototype.removeEventListener = function(type, callback) {
	if (!(type in this.listeners)) {
		return;
	}
	var stack = this.listeners[type];
	for (var i = 0, l = stack.length; i < l; i++) {
		if (stack[i] === callback){
			stack.splice(i, 1);
			return;
		}
	}
};

LGraph.prototype.dispatchEvent = function(event) {
	if (!(event.type in this.listeners)) {
		return true;
	}
	var stack = this.listeners[event.type];
	event.target = this;
	for (var i = 0, l = stack.length; i < l; i++) {
		stack[i].call(this, event);
	}
	return !event.defaultPrevented;
};


LGraph.prototype.onPlayEvent = function() {
	var evt = new CustomEvent('play');
	this.dispatchEvent(evt);
}


LGraph.prototype.onStopEvent = function() {
	var evt = new CustomEvent('stop');
	this.dispatchEvent(evt);
}

LGraph.prototype.onExecuteStepEvent = function() {
	var evt = new CustomEvent('execute-step');
	this.dispatchEvent(evt);
}

LGraph.prototype.onAfterExecuteEvent = function() {
	var evt = new CustomEvent('after-execute');
	this.dispatchEvent(evt);
}

LGraph.prototype.onNodeAdded = function(node) {
	var evt = new CustomEvent('node-added', {
		detail: {
			node: node
		}
	});
	this.dispatchEvent(evt);
}

LGraph.prototype.onNodeRemoved = function(node) {
	var evt = new CustomEvent('node-removed', {
		detail: {
			node: node
		}
	});
	this.dispatchEvent(evt);
}

LGraph.prototype.onGlobalInputAdded = function(name, type) {
	var evt = new CustomEvent('global-input-added', {
		detail: {
			name: name,
			type: type
		}
	});
	this.dispatchEvent(evt);
}

LGraph.prototype.onGlobalInputRemoved = function(name) {
	var evt = new CustomEvent('global-input-removed', {
		detail: {
			name: name,
		}
	});
	this.dispatchEvent(evt);
}

LGraph.prototype.onGlobalOutputAdded = function(name, type) {
	var evt = new CustomEvent('global-output-added', {
		detail: {
			name: name,
			type: type
		}
	});
	this.dispatchEvent(evt);
}

LGraph.prototype.onGlobalOutputRemoved = function(name) {
	var evt = new CustomEvent('global-output-removed', {
		detail: {
			name: name,
		}
	});
	this.dispatchEvent(evt);
}

LGraph.prototype.onGlobalsChange = function() {
	var evt = new CustomEvent('globals-change');
	this.dispatchEvent(evt);
}

LGraph.prototype.onConnectionChange = function(node) {
	var evt = new CustomEvent('connection-change', {
		detail: {
			node: node
		}
	});
	this.dispatchEvent(evt);
}
