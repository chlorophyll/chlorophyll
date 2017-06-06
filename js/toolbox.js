/*
 * Toolbox manager
 *
 * Tracks state for active tools on a toolbar, creates buttons and hotkeys for
 * them.
 *
 * A tool can be anything with an enable() and disable() function.
 * Tool objects should not respond to any input after disable() has been called,
 * and should avoid carrying state from one invocation to the next.
 */
function Toolbox(managername, toolbar, menu) {
	var self = this;
	var tools = {};
	var activeTool = null;

	this.setActiveTool = function(name) {
		if (activeTool != null)
			self.exitActiveTool();

		tool = tools[name];
		tool.enable();
		tool.ui_button.disabled = false;
		Util.hilightElement(tool.ui_button);
		activeTool = tool;
	}

	this.exitActiveTool = function() {
		if (activeTool === null)
			return;

		activeTool.disable();
		Util.unhilightElement(activeTool.ui_button);
		activeTool = null;
	}

	this.forEachTool = function(f) {
		for (name in tools) {
			if (tools.hasOwnProperty(name))
				f(tools[name]);
		}
	}

	this.enableButtons = function() {
		self.forEachTool(function(tool) {
			tool.ui_button.disabled = false;
			Util.unhilightElement(tool.ui_button);
		});
	}

	this.disableButtons = function() {
		self.forEachTool(function(tool) {
			tool.ui_button.disabled = true;
			Util.unhilightElement(tool.ui_button);
		});
	}

	this.addTool = function(name, tool, hotkey) {
		tool.manager = self;

		var f = function() {
			self.setActiveTool(name);
		}

		var elem = toolbar.addButton(null, name, f);
		elem.classList.remove('even');
		elem = elem.querySelector('button');
		elem.disabled = true;

		Mousetrap.bind(hotkey, f);
		if (menu)
			menu.add(managername+'/'+name, f);

		tool.ui_button = elem;

		tools[name] = tool;
	}
}
