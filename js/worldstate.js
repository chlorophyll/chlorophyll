WorldState = function(start) {

	for (prop in start) {
		this[prop] = start[prop];
	}

	var history = [];
	var idx = -1;

	this.update = function(fn, undo) {
		fn(this);
		// delete the future (maybe could branch)
		history = history.slice(0, idx + 1);
		history.push({
			redo: fn,
			undo: undo,
		});
		idx++;
	}

	this.undo = function() {
		if (idx == -1)
			return;
		history[idx].undo(this);
		idx--;
	}

	this.redo = function() {
		if (idx == history.length-1)
			return;
		idx++;
		history[idx].redo(this);
	}
}
