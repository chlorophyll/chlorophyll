CommandManager = function() {
	var commands = [];
	var settings = QuickSettings.create(window.innerWidth-210, 0, "Commands");
	var returnToDefault = true;
	var defaultCommand;

	function startCommand(command) {
		for (var i = 0; i < commands.length; i++) {
			var other = commands[i];
			other.enabled = false;
		}
		command.enabled = true;
	}
	this.addCommand = function(name, command, keybinding, isDefault) {
		commands.push(command);
		command.manager = this;
		f = function() {
			startCommand(command);
		}
		Mousetrap.bind(keybinding, f);
		settings.addButton(name, f);

		if (isDefault) {
			settings.addBoolean('Default to '+name, returnToDefault, function(val) {
				returnToDefault = val;
			});
			defaultCommand = command;
			startCommand(command);
		}
	}

	this.endCommand = function() {
		if (returnToDefault) {
			startCommand(defaultCommand);
		}
	}
}


function getQsPos(panel) {
	var x = parseInt(this._panel.style.left),
		y = parseInt(this._panel.style.top);
	return {x: x, y: y}
}

function enableHotkey(key, callback, upCallback) {
	if (typeof upCallback !== 'undefined') {
		Mousetrap.bind(key, callback, "keydown");
		Mousetrap.bind(key, upCallback, "keyup");
	} else {
		Mousetrap.bind(key, callback);
	}
}

function disableHotkey(key) {
	Mousetrap.unbind(key);
}

/*
 * UI view object
 *
 * A UI view is a set of panels, controls, and hotkeys which can be enabled and
 * disabled as a group.  Views are tracked as a hierarchy.  Disabling a group
 * also disables all of its descendents.
 *
 * The optional setup() and teardown() functions will be called when the view
 * is enabled and disabled, respectively.
 */
UIPanel = function(view, name, x, y) {
	this.view = view;
	this.manager = view.manager;
	this.name = name;
	this.x = x;
	this.y = y;

	this.controls = [];

	this.qs = QuickSettings.create(this.x, this.y, this.name);
	this.qs.hide();

	this.hidden = false;

	// Controls can be added to a view other than the one which owns the panel,
	// so the view for the control is passed in.
	this.addControl = function(controlView, type, params, callback, hotkey) {
		// The control callback is specified separately from the rest of the
		// control arguments - append it to the parameter list.
		params.push(control.callback);
		// The type of a control is just the QuickSettings add function.
		type.apply(this.qs, params);

		var title = control.params[0];
		panel.qs.hideControl(control.title);

		var control = {
			title: title,
			type: type,
			params: params,
			callback: callback,
			hotkey: hotkey
		}
		this.controls[title] = control;
		controlView.controls[title] = control;

		return this;
	}
}

UIView = function(manager, name, parent) {
	self = this;
	this.name = name;
	this.parent = parent;
	this.children = [];

	this.panels = {};
	this.controls = {};
	this.hotkeys = {};
	this.setup = function() {};
	this.teardown = function() {};
	this.enabled = false;
	this.wasEnabled = false;

	if (parent)
		parent.children.push(this);

	// Get a panel by name, or create it if it doesn't exist.
	// Doesn't return the actual panel object, just accessor functions.
	this.panel = function(name, x, y) {
		var panel;
		if (name in manager.panels) {
			panel = manager.panels[name];
		} else {
			panel = new UIPanel(this, name, x, y);
			manager.panels[name] = panel;
			this.panels[name] = panel;
		}
		// Return an object containing utility functions
		return {
			addControl: function(type, params, callback, hotkey) {
				panel.addControl(self, type, params, callback, hotkey);
			}
		};
	}

	this.addHotkey = function(key, callback, upCallback, label) {
		if (key in this.hotkeys) {
			console.error("Duplicate hotkey in view %s: %s", this.name, key);
			return this;
		}
		this.hotkeys[key] = {
			key: key,
			callback: callback,
			upCallback: upCallback,
			label: label
		};
		return this;
	}

	// Show a view's panels & controls and enable its hotkeys
	this.enable = function() {
		if (!this.enabled) {
			this.setup();
			this.enabled = true;
			this.wasEnabled = true;
			for (var panel of this.panels) {
				if (!panel.hidden) {
					panel.qs.show();
				}
			}
			for (var control of this.controls) {
				manager.getPanel(control.panel).showControl(control.title);
				if ('hotkey' in control) {
					enableHotkey(control.hotkey, control.callback);
				}
			}
			for (var hotkey of this.hotkeys) {
				enableHotkey(hotkey.key, hotkey.callback, hotkey.upCallback);
			}
		}
	}

	// Hide a view's panels and disable its hotkeys
	// Also disables all children. When the group is next re-enabled, any
	// descendents that were enabled before this call will be re-enabled.
	this.disable = function() {
		var subViews = this.children;
		for (var child of subViews) {
			child.disable();
		}

		if (this.enabled) {
			this.teardown();
			this.enabled = false;
			this.wasEnabled = true;
			for (var panel of this.panels) {
				panel.qs.hide();
			}
			for (var control of this.controls) {
				manager.getPanel(control.panel).hideControl(control.title);
				if ('hotkey' in control) {
					disableHotkey(control.hotkey);
				}
			}
			for (var hotkey of this.hotkeys) {
				disableHotkey(hotkey.key);
			}
		} else {
			this.wasEnabled = false;
		}
	}
}

UIManager = function() {
	this.views = {};
	this.panels = {};

	this.newView = function(name, parent) {
		if (name in this.views) {
			console.error("UIManager: view already exists: ", name);
			return;
		}
		if (parent && !(parent in this.views)) {
			console.error("UIManager: parent does not exist: ", parent);
			return;
		}
		var view = new UIView(this, name, this.views[parent]);
		this.views[name] = view;

		return view;
	}

	// Used to completely remove a view (e.g. if the object it's bound to is
	// destroyed).
	this.destroyView = function(name) {
		var view = this.views[name];

		// Destroy any existing children and remove from parent.
		var subViews = view.children;
		for (var child of subViews) {
			this.destroyView(subm.name);
		}
		if (view.parent) {
			delete view.parent.children[name];
		}
		// Run any necessary cleanup first
		if (view.enabled) {
			this.disableView(name);
		}

		// Destroy all the actual UI components
		for (var control of view.controls) {
			var panel = this.panels[control.panel];
			panel.qs.removeControl(control.title);
		}
		for (var panel of view.panels) {
			panel.qs.destroy();
			delete this.panels[panel.name];
		}
		delete this.views[name];
	}

	// Enabling/disabling views by name is necessary to allow for UI views
	// which modify their own visibility state.
	this.enableView = function(name) {
		if (!(name in this.views)) {
			console.error("UIManager: no such view: ", name);
			return;
		}
		var view = this.views[name];
		view.enable();
	}

	this.disableView = function(name) {
		if (!(name in this.views)) {
			console.error("UIManager: no such view: ", name);
			return;
		}
		var view = this.views[name];
		view.disable();
	}

	// Enable one view and hide all its siblings (other children of its parent)
	this.enableViewExclusive = function(name) {
		var view = this.views[name];
		if (!view.parent) {
			this.enableView(name);
		}
		for (var sibling of view.parent.children) {
			if (sibling !== view) {
				this.disableView(sibling.name);
			}
			this.enableView(name);
		}
	}

	// Hide the individual panel, and also mark it as hidden in its record
	this.hidePanel = function(panelName) {
		var panel = this.panels[panelName];
		panel.hidden = true;
		panel.qs.hide();
	}

	this.showPanel = function(panelName) {
		var panel = this.panels[panelName];
		panel.hidden = false;
		panel.qs.show();
	}

	this.getPanel = function(panelName) {
		return this.panels[panelName].qs;
	}
}
