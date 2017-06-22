// This contains patches, etc

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

LiteGUI.Tree.prototype.expandItem = function(id) {
	var item = this.getItem(id);

	if (!item || !item.listbox)
		return;

	item.listbox.setValue(true);
}

LiteGUI.Tree.prototype.collapseItem = function(id) {
	var item = this.getItem(id);

	if (!item || !item.listbox)
		return;

	item.listbox.setValue(false);
}

/*
 * Prevent infinite recursion in keyboardJS
 */
keyboardJS.Keyboard.prototype._callerHandler = null;
keyboardJS.Keyboard.prototype._clearBindings = function(event) {
	event || (event = {});

	for (var i = 0; i < this._appliedListeners.length; i += 1) {
		var listener = this._appliedListeners[i];
		var keyCombo = listener.keyCombo;
		if (keyCombo === null || !keyCombo.check(this._locale.pressedKeys)) {
			if (this._callerHandler !== listener.releaseHandler) {
				listener.preventRepeat = listener.preventRepeatByDefault;
				// Record caller handler
				this._callerHandler = listener.releaseHandler;
				listener.releaseHandler.call(this, event);
				this._callerHandler = null;
			}
			this._appliedListeners.splice(i, 1);
			i -= 1;
		}
	}
};
