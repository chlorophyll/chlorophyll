var globalSettingsTest;
CommandManager = function() {
	var commands = [];
	var settings = QuickSettings.create(window.innerWidth-210, 0, "Commands");
	globalSettingsTest = settings;
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
 *
 * View definition (viewspec):
 * 	{
 * 		panels: [ panel list ],
 * 		controls: [ control list ],
 * 		hotkeys: [ listohotkeyz ]
 * 	}
 *
 * Panel:
 * 	{
 *		name: "panelname",
 *		x: 0
 *		y: 0
 *		parent: "someotherpanelname"
 *		attach: "none/left/right/bottom/top/offset"
 *		qs: *filled in on creation*
 * 	}
 *
 * Control:
 * 	{
 * 		panel: "panelname",
 * 		type: QuickSettings.addButton,
 * 		params: ["Bhutan"],
 * 		callback: fn,
 * 		hotkey: "x"
 * 			(hotkeys optional, more complicated callbacks can be specified
 * 			 in the hotkey list)
 * 	}
 *
 * Hotkey:
 * 	{
 * 		key: "x",
 * 		callback: somefunc,
 * 		upCallback: otherfunc, <- optional, called on release
 * 		label: "Frobnicate"
 * 	}
 */
UIView = function(manager, name, viewspec, parent, setup, teardown) {
	this.name = name;
	this.parent = parent;
	this.children = [];

	this.panels = [];
	this.controls = [];
	this.hotkeys = [];
	this.setup = function() {};
	this.teardown = function() {};
	this.enabled = false;
	this.wasEnabled = false;

	if ("panels" in viewspec) this.panels = viewspec.panels;
	if ("controls" in viewspec) this.controls = viewspec.controls;
	if ("hotkeys" in viewspec) this.hotkeys = viewspec.hotkeys;
	if (typeof setup !== 'undefined') this.setup = setup;
	if (typeof teardown !== 'undefined') this.teardown = teardown;

	for (var panel of this.panels) {
		if (panel.name in manager.panels) {
			console.error("UIView: panel already exists: ", panel.name);
		}
		// TODO create in the right spot wrt parent, handle dragging
		// var parentPos = getQsPos(panel.parent);
		panel.qs = QuickSettings.create(panel.x, panel.y, panel.name);
		panel.qs.hide();
		// Panel hidden/shown state is stored separately in the object (i.e. it
		// doesn't always match the QuickSettings state) so that enable/disable
		// doesn't clobber visibility state when switching between UI views.
		panel.hidden = false;
		manager.panels[panel.name] = panel;
	}

	for (var control of this.controls) {
		var panel = manager.panels[control.panel];
		// The control callback is specified separately from the rest of the
		// control arguments - append it to the parameter list.
		control.params.push(control.callback);
		// The type of a control is just the QuickSettings add function.
		control.type.apply(panel.qs, control.params);
		control.title = control.params[0];
		panel.qs.hideControl(control.title);
	}

	if (parent)
		parent.children.push(this);

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

	this.active_views = {};
	this.active_panels = {};
	this.active_hotkeys = {};

	this.views = {};
	this.panels = {};

	this.newView = function(name, controls, parent, setup, teardown) {
		if (name in this.views) {
			console.error("UIManager: view already exists: ", name);
			return;
		}
		if (parent && !(parent in this.views)) {
			console.error("UIManager: parent does not exist: ", parent);
			return;
		}
		var view = new UIView(this, name, controls, this.views[parent], setup,
			teardown);
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


// for toolbox: Create toolbox as child of Model-editing-mode in init func.
// 		tracks active thing internally. Sets colors when appropriate key/bhutan
// 		/etc. pushed to indicate active tool.
//
// 		Other things will need to do this too: how should we express
//		"add a thingus to that panel over there?" maybe just toolbox name,
//		like
//		setup(manager) {
//			manager.addControl("toolbox", function(panel){ panel.addButton(...)})
//		}
//		could make this nicer. Maybe could even just get away with object:
//		controls_to_add = [ { "toolbox", addButton, params, "k", momentary=false},
//						    { "settings", "addButton, params ...},
//						    ...
//						  ]
//		can use ".apply()" real nice - just apply the param list
//		can also be used as a "stuff to remove when done" list
//		this makes setup/teardown functions p optional
//
//		undoing: maybe snap to just the top-level mode?
