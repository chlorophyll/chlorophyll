function CommandManager(managername, toolbar, menu) {
	var self = this;
	var commands = [];
	var defaultCommand;
	var commandInProgress = undefined;

	function startCommand(command) {
		self.disableButtons();

		command.start();
		command.elem.disabled = false;
		commandInProgress = command;
	}

	this.foreachCommand = function(f) {
		for (var i = 0; i < commands.length; i++) {
			f(commands[i]);
		}
	}

	this.enableButtons = function() {
		self.foreachCommand(function(command) {
			command.elem.disabled = false;
		});
	}

	this.disableButtons = function() {
		self.foreachCommand(function(command) {
			command.elem.disabled = true;
		});
	}

	this.endCommand = function() {
		self.enableButtons();
		commandInProgress = undefined;
	}

	self.addCommand = function(name, command, hotkey) {
		command.manager = self;

		var f = function() {
			if (commandInProgress != undefined)
				return;
			startCommand(command);
		}

		var elem = toolbar.addButton(null, name, f);
		elem.classList.remove('even');
		elem = elem.querySelector('button');
		elem.disabled = true;

		Mousetrap.bind(hotkey, f);
		if (menu)
			menu.add(managername+'/'+name, f);

		command.elem = elem;

		commands.push(command);

	}
}
