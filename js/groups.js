/*
 * Pixel group management
 *
 * The group manager keeps track of all pixel groups for the current model.
 *
 * A group may consist of a set of pixels, xor a set of other groups, but not a
 * combination of the two.
 */

function PixelGroup(manager, pixels, name, color) {
	var self = this;
	this.name = name ? name : "unnamed"
	this.pixels = pixels ? pixels : Immutable.Map();
	this.color = color ? color : new THREE.Color(0xff0000);
	this.mappings = Immutable.Map();
	this.hidden = false;

	this.hide = function(id) {
		this.hidden = true;
		manager.updateOverlay();
	}

	this.show = function(id) {
		this.hidden = false;
		manager.updateOverlay();
	}

	this.setName = function(newName) {
		this.name = newName;
		manager.updateControls();
	}

	this.setPixels = function(newPixels) {
		this.pixels = newPixels;
	}

	this.setColor = function(newColor) {
		this.color = newColor;
		manager.updateOverlay();
	}

	// Clean up UI, to be called before destroying the group.
	this.cleanup = function() {
		manager.groupControls.removeControl(this.name);
	}

	this.snapshot = function() {
		return Immutable.fromJS({
			name: this.name,
			pixels: this.pixels,
			mappings: this.mappings,
			color: this.color,
			hidden: this.hidden
		});
	}

	this.setFromSnapshot = function(snapshot) {
		this.name = snapshot.get("name");
		this.pixels = snapshot.get("pixels");
		this.mappings = snapshot.get("mappings");
		this.color = snapshot.get("color");
		this.hidden = snapshot.get("hidden");
	}
}

function GroupManager(model) {
	var self = this;
	this.model = model;

	// Future work: nice group reordering UI, probably a layer on top of this
	// referencing group IDs, to keep groups in order
	this.groups = Immutable.Map();

	// UI stuff in here for now
	this.groupControls = QuickSettings.create(container.clientWidth - 200, 200,
		"Group Management");

	this.overlay = model.createOverlay(1);

	// Manually assign group id labels so that deleting a group doesn't
	// reassign ids
	this._nextid = 0;
	function newgid() {
		return self._nextid++;
	}

	this.createFromActiveSelection = function() {
		// Don't create an empty group
		if (worldState.activeSelection.size() == 0)
			return;

		var groupPixels = worldState.activeSelection.getPixels();
		worldState.activeSelection.clear();
		var id = newgid();
		var defaultName = "group-" + id;

		var newgroup = new PixelGroup(self, groupPixels, defaultName,
			ColorPool.random());

		self.groups = self.groups.set(id, newgroup);

		self.groupControls.addBoolean(defaultName, true, function (val) {
			if (val)
				self.groups.get(id).show();
			else
				self.groups.get(id).hide();
		});

		// Mark the group on the model
		self.updateOverlay();
		worldState.checkpoint();
	}

	this.updateOverlay = function() {
		//var hiddenColor = new THREE.Color(0x101010);
		self.overlay.clear();
		self.groups.forEach(function(group) {
			if (!group.hidden) {
				self.overlay.setAllFromSet(group.pixels, group.color);
			}
		});
	}

	this.snapshot = function () {
		return self.groups.map(function(groupobj) {
			return groupobj.snapshot();
		});
	}

	this.setFromSnapshot = function(snapshot) {
		/*
		 * If a group already exists in the current manager, just update it.
		 * If it doesn't currently exist, we need to create a new one to
		 * update, and similarly if it stopped existing it should be deleted.
		 */
		var newgroups = snapshot.map(function(groupsnap, id) {
			var existingGroup = self.groups.get(id);
			if (existingGroup) {
				existingGroup.setFromSnapshot(groupsnap);
				return existingGroup;
			} else {
				var newGroup = new PixelGroup(self);
				newGroup.setFromSnapshot(groupsnap);
				return newGroup;
			}
		});
		// Check for destroyed groups
		self.groups.forEach(function(group, id) {
			if (!newgroups.get(id)) {
				group.cleanup();
			}
		});

		self.groups = newgroups;
		self.updateOverlay();
	}

	this.groupControls.addButton('Create group', this.createFromActiveSelection);
}
