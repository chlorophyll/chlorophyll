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
			code += "<button class='wcombobutton "+(value == v ? "selected":"")+"' data-name='v'>" + v + "</button>";

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

	this.append(element,options);
	this.processElement(element, options);
	return element;
}
