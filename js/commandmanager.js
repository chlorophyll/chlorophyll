function Toolbox(managername, toolbar, menu) {
	var self = this;
	var commands = [];
	var defaultCommand;
	var commandInProgress = null;

	function startCommand(command) {
		command.enable();
		command.ui_button.disabled = false;
		Util.hilightElement(command.ui_button);
		commandInProgress = command;
	}

	this.foreachCommand = function(f) {
		for (var i = 0; i < commands.length; i++) {
			f(commands[i]);
		}
	}

	this.enableButtons = function() {
		self.foreachCommand(function(command) {
			command.ui_button.disabled = false;
			Util.unhilightElement(command.ui_button);
		});
	}

	this.disableButtons = function() {
		self.foreachCommand(function(command) {
			command.ui_button.disabled = true;
			Util.unhilightElement(command.ui_button);
		});
	}

	this.endCommand = function() {
		commandInProgress.disable();
		Util.unhilightElement(commandInProgress.ui_button);
		commandInProgress = null;
	}

	this.addCommand = function(name, command, hotkey) {
		command.manager = self;

		var f = function() {
			if (commandInProgress != null)
				self.endCommand();
			startCommand(command);
		}

		var elem = toolbar.addButton(null, name, f);
		elem.classList.remove('even');
		elem = elem.querySelector('button');
		elem.disabled = true;

		Mousetrap.bind(hotkey, f);
		if (menu)
			menu.add(managername+'/'+name, f);

		command.ui_button = elem;

		commands.push(command);
	}
}
