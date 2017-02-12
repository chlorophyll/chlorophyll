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

/*
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
 * 		params: ["Bhutan", somefunc]
 * 	}
 *
 * Hotkey:
 * 	{
 * 		key: "x",
 * 		callback: somefunc,
 * 		upCallback: otherfunc, <- optional
 * 		label: "Frobnicate"
 * 	}
 *
 * Mode definition:
 * 	{
 * 		panels: [ listopanelz ],
 * 		controls: [ listocontrolz ],
 * 		hotkeys: [ listohotkeyz ]
 * 	}
 */

function getQsPos(panel) {
	var x = parseInt(this._panel.style.left),
		y = parseInt(this._panel.style.top);
	return {x: x, y: y}
}

// A UI mode, consisting of a set of controls assigned to panels and hotkeys.
// setup() and teardown() functions are optional
UIMode = function(manager, name, modespec, parent, setup, teardown) {
	this.name = name;
	this.parent = parent;
	this.children = [];

	this.panels = [];
	this.controls = [];
	this.hotkeys = [];
	this.setup = function() {};
	this.teardown = function() {};
	this.enabled = false;

	if (modespec.panels) this.panels = modespec.panels;
	if (modespec.controls) this.controls = modespec.controls;
	if (modespec.hotkeys) this.hotkeys = modespec.hotkeys;
	if (setup) this.setup = setup;
	if (teardown) this.teardown = teardown;

	for (var panel of this.panels) {
		if (panel.name in manager.panels) {
			console.error("UIMode: panel already exists: ", panel.name);
		}
		// TODO create in the right spot wrt parent, handle dragging
		// var parentPos = getQsPos(panel.parent);
		panel.qs = QuickSettings.create(panel.x, panel.y, panel.name);
		panel.qs.hide();
		panel.hidden = false;
		manager.panels[panel.name] = panel;
	}

	for (var control of this.controls) {
		var panel = manager.getPanel(control.panel);
		// The type of a control is the QuickSettings add/bind function.
		// Apply it to the panel with the given paremeters.
		control.type.apply(panel.qs, control.params);
		control.title = control.params[0];
		panel.qs.hideControl(control.title);
	}

	if (parent)
		parent.children.push(this);
}

UIManager = function() {

	this.active_modes = {};
	this.active_panels = {};
	this.active_hotkeys = {};

	this.modes = {};
	this.panels = {};

	this.newMode = function(name, controls, parent, setup, teardown) {
		if (name in this.modes) {
			console.error("UIManager: mode already exists: ", name);
			return;
		}
		if (parent && !(parent in this.modes)) {
			console.error("UIManager: parent does not exist: ", parent);
			return;
		}
		var mode = new UIMode(this, name, controls, this.modes[parent], setup,
			teardown);
		this.modes[name] = mode;

		return mode;
	}

	// Used to completely remove a mode (e.g. if the object it's bound to is
	// destroyed).
	this.destroyMode = function(name) {
		var mode = this.modes[name];
		if (mode.enabled) {
			this.disableMode(name);
		}
		var subModes = this.children;
		for (var child of subModes) {
			this.destroyMode(subm.name);
		}
		delete mode.parent.children[name];
		// TODO: destroy controls too
		for (var panel of mode.panels) {
			panel.qs.destroy();
			delete this.panels[panel.name];
		}
		delete this.modes[name];
	}

	// Show a mode's panels and enable its hotkeys
	this.enableMode = function(name) {
		// need to store panel hidden/shown state separately in the object
		// so that enable/disable doesn't clobber it.
		var mode = this.modes[name];
		if (!mode.enabled) {
			mode.setup();
			mode.enabled = true;
			for (var panel of mode.panels) {
				if (!panel.hidden) {
					panel.qs.show();
				}
			}
			for (var control of mode.controls) {
				var title = control.params[0];
				var panel = this.panels[control.panel];
				panel.qs.showControl(title);
			}
			for (var hotkey of mode.hotkeys) {
				if ('upCallback' in hotkey) {
					Mousetrap.bind(hotkey.key, hotkey.callback, "keydown");
					Mousetrap.bind(hotkey.key, hotkey.upCallback, "keyup");
				} else {
					Mousetrap.bind(hotkey.key, hotkey.callback);
				}
			}
		}
	}

	// Hide a mode's panels and disable its hotkeys
	// Also disables all children
	this.disableMode = function(name) {
		var mode = this.modes[name];
		var subModes = mode.children;
		for (var child of subModes) {
			this.disableMode(child.name);
		}

		if (mode.enabled) {
			mode.teardown();
			mode.enabled = false;
			for (var panel of mode.panels) {
				panel.qs.hide();
			}
			for (var control of mode.controls) {
				var title = control.params[0];
				var panel = this.panels[control.panel];
				panel.qs.hideControl(title);
			}
			for (var hotkey of mode.hotkeys) {
				Mousetrap.unbind(hotkey.key);
			}
		}
	}

	// Enable one mode and hide all its siblings (other children of its parent)
	this.setModeExclusive = function(name) {
		var mode = this.modes[name];
		if (!mode.parent) {
			this.enableMode(name);
		}
		for (var sibling of mode.parent.children) {
			if (sibling !== mode) {
				this.disableMode(sibling.name);
			}
			this.enableMode(name);
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
		return this.panels[panelName];
	}
}


// Toolbox: circular?
// need buttons to set Mode
// need to add a Mode specifically for selecting Modes
// 	Toolbox object: created from UIManager, handle coloring toolbox buttons?
// 	^ nah, can just create a mode for it & enable in bigger mode init
//
// notion of parents/children:
//		top level: changing between main views etc. can keep controls around
//		as long as the objects that refer to them still exist (just hide/show).
//		objects can be responsible for cleaning up their UI stuff (calling
//		destroyMode())
//
//		calling enable: just enables that mode/panels
//		calling disable: disables + all children
//			destroy behaves similar
//
//		panel position is in relation to its parent
//			attach mode: unattached/top/bottom/left/right/absolute
//
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
