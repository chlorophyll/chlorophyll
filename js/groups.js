/*
 * Pixel group management
 *
 * The group manager contains a map from group IDs (an opaque integer) to
 * group objects.  A group may consist of a set of pixels, xor a set of other
 * groups, but not a combination of the two.
 *
 * Each group (a Map) contains these properties:
 *
 *		name		user-assigned name of the group
 *		pixels		if a pixel group, a set of the points in the model which
 *						make up the group.
 *		children	if a metagroup, a set of the group ids which make it up.
 *		parents		a set of parents which contain this group
 *		mappings	a set of mappings which have been composed for this group
 *
 * A group may not have both "children" and "pixels" entries.
 */

function GroupManager(model) {
	var self = this;

	// Future work: nice group reordering UI, probably a layer on top of this
	// referencing group IDs, to keep groups in order
	this.groups = Immutable.Map();

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

		var id = newgid();
		var newgroup = Immutable.fromJS({
			name: "group-" + id,
			pixels: worldState.activeSelection.pixelSet(),
			parents: Immutable.Set(),
			mappings: Immutable.Map()
		});

		self.groups = self.groups.set(id, newgroup);
		console.log(self.groups);
		worldState.checkpoint();
	}

	this.snapshot = function () {
		return this.groups;
	}

	this.setFromSnapshot = function(snapshot) {
		this.groups = snapshot;
		// TODO groupsControls.reload();
	}
}
