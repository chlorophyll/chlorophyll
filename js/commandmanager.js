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
			settings.addBoolean('Default to '+name, function(val) {
				returnToDefault = val;
			}, returnToDefault);
			defaultCommand = command;
			startCommand(command);
		}
	}

	this.endCommand = function() {
		console.log('endCommand');
		if (returnToDefault) {
			startCommand(defaultCommand);
		}
	}
}
