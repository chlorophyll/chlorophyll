// This contains patches, etc

// The built-in context menu is not really sensible for what we want here.
(function() {
	oldMenuOptions = LGraphCanvas.prototype.getNodeMenuOptions;

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
