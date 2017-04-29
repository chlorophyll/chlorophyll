/*
 * Pixel group management
 *
 * The group manager keeps track of all pixel groups for the current model.
 *
 * A group may consist of a set of pixels, xor a set of other groups, but not a
 * combination of the two.
 */

function PixelGroup(manager, id, pixels, name, color) {
	var self = this;
	this.id = id;
	this.tree_id = 'group-'+id;
	var group_name = name ? name : "unnamed"
	var group_color = color ? color : new THREE.Color(0xff0000);
	this.mappings = Immutable.Map();
	this.pixels = pixels ? pixels : Immutable.Set();
	this.model = manager.model;
	this.overlay = model.createOverlay(1);

	var _nextid = 0;
	function newgid() {
		return _nextid++;
	}

	/*
	 * If this group is being restored from a snapshot, the name might not
	 * be valid yet, but it'll get updated when the group info is filled in
	 * from the snapshot.
	 */
	var elem = manager.tree.insertItem({
		id: this.tree_id,
		content: group_name,
		dataset: {group: self}},
		'root'
	);

	var checkbox = new LiteGUI.Checkbox(true, function(v) {
		if (v) {
			self.show();
		} else {
			self.hide();
		}
	});

	checkbox.root.style.float = 'right';

	elem.querySelector('.postcontent').appendChild(checkbox.root);

	Object.defineProperty(this, 'name', {
		get: function() { return group_name; },
		set: function(v) {
			group_name = v;
			manager.tree.updateItem(this.tree_id, {
				content: group_name,
				dataset: {group: this}
			});
		}
	});

	Object.defineProperty(this, 'color', {
		get: function() { return group_color; },
		set: function(v) {
			group_color = v;
			if (this.overlay.size() > 0)
				this.show();
		}
	});

	this.hide = function() {
		this.overlay.clear();
	}

	this.show = function() {
		this.overlay.setAllFromSet(this.pixels, this.color);
	}

	this.destroy = function() {
		this.model.removeOverlay(this.overlay);
		manager.tree.removeItem(this.tree_id);
	}

	this.addMapping = function() {
		var map_id = newgid();

		var name = 'map-'+map_id;
		var mapping = new ProjectionMapping(manager, this, map_id, name, 'cartesian2');
		this.mappings = this.mappings.set(map_id, mapping);

		return mapping;
	}

	this.snapshot = function() {
		return Immutable.fromJS({
			name: group_name,
			id: self.id,
			tree_id: self.tree_id,
			pixels: self.pixels,
			color: self.color,
			overlay: self.overlay.snapshot(),
			mappings: self.mappings.map(function(map) {
				return map.snapshot();
			})
		});
	}

	this.restore = function(snapshot) {
		self.id = snapshot.get('id');
		self.tree_id = snapshot.get('tree_id');
		// Set name after the tree_id, so that the tree gets properly updated.
		self.name = snapshot.get("name");
		self.pixels = snapshot.get("pixels");
		self.overlay.restore(snapshot.get('overlay'));
		self.color = snapshot.get("color");
		/*
		 * If a mapping already exists, just update it.  If it doesn't
		 * currently exist, we need to create a new one to update, and
		 * similarly if it stopped existing it should be deleted.
		 */
		var newmappings = snapshot.get("mappings").map(function(mapsnap, id) {
			var existingMapping = self.mappings.get(id);
			if (existingMapping) {
				existingMapping.restore(mapsnap);
				return existingMapping;
			} else {
				var newMapping = new ProjectionMapping(manager, self, id);
				newMapping.restore(mapsnap);
				return newMapping;
			}
		});
		// Check for destroyed mappings
		self.mappings.forEach(function(mapping, id) {
			if (!newmappings.get(id)) {
				if (manager.currentMapping && id == manager.currentMapping.id)
					manager.clearCurrentMapping();
				mapping.destroy();
			}
		});

		self.mappings = newmappings;
	}
}

function GroupManager(model) {
	var self = this;
	var currentSelection = null;
	this.model = model;

	this.currentGroup = null;
	this.currentMapping = null;
	var group_namefield = null;
	var mapping_namefield = null;

	// Future work: nice group reordering UI, probably a layer on top of this
	// referencing group IDs, to keep groups in order
	this.groups = Immutable.Map();

	// Manually assign group id labels so that deleting a group doesn't
	// reassign ids
	_nextid = 0;
	function newgid() {
		return _nextid++;
	}

	var treePanel = new LiteGUI.Panel('group-tree', {
		title: 'Group Management',
		scroll: true
	});

	var panel = new LiteGUI.Panel('group-panel');

	var groupCmds = new LiteGUI.Inspector();
	groupCmds.addSeparator();
	groupCmds.addButton(undefined, 'Make Group', function() {
		var newgroup = self.createFromActiveSelection();
		if (newgroup) {
			self.setCurrentGroup(newgroup);
			self.clearCurrentMapping();
		}
		worldState.checkpoint();
	});
	groupCmds.addSeparator();

	var currGroupInspector = new LiteGUI.Inspector();
	var currMappingInspector = new LiteGUI.Inspector();
	var mappingConfigInspector = new LiteGUI.Inspector();

	this.setCurrentGroup = function(group) {
		self.currentGroup = group;
		self.tree.setSelectedItem(group.tree_id);
		currGroupInspector.clear();
		currGroupInspector.addSection('Current Group');
		group_namefield = currGroupInspector.addString('name', group.name, {
			callback: function(v) {
				self.currentGroup.name = v;
			}
		});
		currGroupInspector.addColor('color', group.color.toArray(), {
			callback: function(v) {
				self.currentGroup.color = new THREE.Color(v[0], v[1], v[2]);
			}
		});
		currGroupInspector.addSeparator();
		// TODO make this button do something
		currGroupInspector.addButton(null, 'Add Active Selection to Group');
		currGroupInspector.addButton(null, 'Add Mapping', function() {
			var map = self.currentGroup.addMapping()
			self.setCurrentMapping(map);
			worldState.checkpoint();
		});
		currGroupInspector.addButton(null, 'Delete Group', function() {
			var cur = self.currentGroup;
			self.clearCurrentGroup();
			cur.destroy();
		});
	}

	function configureCurrentMapping() {
		mappingConfigInspector.addSection('Mapping Configuration');
		self.currentMapping.makeActive(mappingConfigInspector);
	}

	this.setCurrentMapping = function(mapping) {
		self.setCurrentGroup(mapping.group);
		self.tree.setSelectedItem(mapping.tree_id);
		self.currentMapping = mapping;

		currMappingInspector.clear();
		currMappingInspector.addSection('Current Mapping');
		mapping_namefield = currMappingInspector.addString('name', mapping.name, {
			callback: function(v) {
				self.currentMapping.name = v;
			}
		});
		currMappingInspector.addCombo("Mapping type", mapping.type, {
			values: MapUtil.type_menu,
			callback: function(v) {
				self.currentMapping.setType(v);
				worldState.checkpoint();
			}
		});
		currMappingInspector.addButton(null, 'Configure Mapping', function() {
			if (!self.currentMapping.enabled)
				configureCurrentMapping();
		});
	}

	this.clearCurrentMapping = function() {
		self.tree.setSelectedItem(self.currentGroup.tree_id, false, false);
		self.currentMapping = null;
		currMappingInspector.clear();
	}

	this.clearCurrentGroup = function() {
		self.clearCurrentMapping();
		self.tree.setSelectedItem(null, false, false);
		self.currentGroup = null;
		group_namefield = null;
		currGroupInspector.clear();
	}

	this.tree = new LiteGUI.Tree('group-tree',
		{id: 'root', children: [], visible: false},
		{height: '100%', allow_rename: true}
	);

	// XXX onBackgroundClicked needs patched since liteGUI uses depricated
	// event.srcElement instead of event.target.
	this.tree.onBackgroundClicked = function() {
		self.clearCurrentGroup();
	}

	this.tree.root.addEventListener('item_selected', function(event) {
		var dataset = event.detail.data.dataset;

		if (self.currentMapping && self.currentMapping.enabled) {
			if (currentSelection)
				self.tree.markAsSelected(currentSelection);
			return;
		}

		currentSelection = event.detail.item;

		if (dataset.group) {
			self.setCurrentGroup(dataset.group);
			self.clearCurrentMapping();
		} else if (dataset.mapping) {
			self.setCurrentMapping(dataset.mapping);
		}
	});

	this.tree.root.addEventListener('item_renamed', function(event) {
		var dataset = event.detail.data.dataset;

		if (dataset.group) {
			dataset.group.name = event.detail.new_name;
			if (self.currentGroup == dataset.group) {
				group_namefield.setValue(dataset.group.name, true);
			}
		} else if (dataset.mapping) {
			dataset.mapping.name = event.detail.new_name;
			if (self.currentMapping == dataset.mapping) {
				mapping_namefield.setValue(dataset.mapping.name, true);
			}
		}
	});

	treePanel.add(this.tree);
	panel.add(groupCmds);
	panel.add(currGroupInspector);
	panel.add(currMappingInspector);
	panel.add(mappingConfigInspector);

	UI.sidebar.split('vertical', ['30%', null], true);
	UI.sidebar.getSection(0).add(treePanel);
	UI.sidebar.getSection(1).add(panel);
	UI.sidebar = UI.sidebar.getSection(1); //hm
	//UI.sidebar.add(groupCmds);
	//
	function createGroup(pixels, name) {
		var id = newgid();

		var newgroup = new PixelGroup(self, id, pixels, name, ColorPool.random());

		self.groups = self.groups.set(id, newgroup);
		newgroup.show();

		return newgroup;
	}

	this.createFromActiveSelection = function() {
		// Don't create an empty group
		if (worldState.activeSelection.size() == 0)
			return;
		var defaultName = "group-" + id;

		var groupPixels = worldState.activeSelection.getPixels();
		worldState.activeSelection.clear();
		return createGroup(groupPixels, defaultName);
	}

	this.snapshot = function () {
		var groups_snap = self.groups.map(function(groupobj) {
			return groupobj.snapshot();
		});
		return Immutable.fromJS({
			groups: groups_snap,
			current_map_id: self.currentMapping ? self.currentMapping.id : -1,
			current_group_id: self.currentGroup ? self.currentGroup.id : -1
		})
	}

	this.restore = function(snapshot) {
		/*
		 * If a group already exists in the current manager, just update it.
		 * If it doesn't currently exist, we need to create a new one to
		 * update, and similarly if it stopped existing it should be deleted.
		 */
		var newgroups = snapshot.get('groups').map(function(groupsnap, id) {
			var existingGroup = self.groups.get(id);
			if (existingGroup) {
				existingGroup.restore(groupsnap);
				return existingGroup;
			} else {
				var newGroup = new PixelGroup(self, id);
				newGroup.restore(groupsnap);
				return newGroup;
			}
		});
		// Check for destroyed groups
		self.groups.forEach(function(group, id) {
			if (!newgroups.get(id)) {
				if (self.currentGroup && id == self.currentGroup.id)
					self.clearCurrentGroup();
				group.destroy();
			}
		});
		self.groups = newgroups;

		// UI state munging: make sure the currently selected group & mapping
		// are the same as when the snapshot was taken.
		var cur_gid = snapshot.get('current_group_id');
		var cur_mid = snapshot.get('current_map_id');
		self.clearCurrentGroup();
		if (cur_gid != -1) {
			var group = self.groups.get(cur_gid);
			self.tree.setSelectedItem(group.tree_id);
			self.setCurrentGroup(group);
		}
		if (cur_mid != -1) {
			var mapping = self.currentGroup.mappings.get(cur_mid);
			self.tree.setSelectedItem(mapping.tree_id);
			self.setCurrentMapping(mapping);
		}
	}

	var allPixels = [];
	model.forEach(function(_, pixel) {
		allPixels.push(pixel);
	});
	createGroup(Immutable.Set(allPixels), "All pixels");

	for (var strip = 0; strip < model.numStrips; strip++) {
		var name = 'Strip '+(strip+1);

		var list = [];

		model.forEachPixelInStrip(strip, function(pixel) {
			list.push(pixel);
		});

		var pixels = Immutable.Set(list);
		createGroup(pixels, name);
	}

}
