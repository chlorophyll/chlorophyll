/*
 * Pixel group management
 *
 * The group manager keeps track of all pixel groups for the current model.
 * A pixel group is a set of pixels and a collection of mappings for those
 * points.
 */

function PixelGroup(manager, id, pixels, initname, color) {
	var self = this;

	this.id = id;
	this.tree_id = 'group-'+id;
	var _name = initname ? initname : "unnamed"
	var _color = color ? color : new THREE.Color(0xff0000);
	this.mappings = Immutable.Map();
	this.pixels = pixels ? pixels : Immutable.Set();
	this.model = manager.model;
	this.overlay = this.model.createOverlay(1);

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
		content: _name,
		dataset: {group: self}},
		'root'
	);

	var visible = true;

	var inlinePicker = new LiteGUI.MiniColor(_color.toArray(), {
		callback: function(v) {
			self.color = new THREE.Color(v[0], v[1], v[2]);
		}
	});

	var visibilityToggle = document.createElement('a');
	visibilityToggle.innerText = 'visibility';
	visibilityToggle.classList.add('material-icons');
	visibilityToggle.classList.add('visibility-toggle');

	visibilityToggle.addEventListener('click', function(e) {
		e.stopPropagation();
		visible = !visible;

		if (visible) {
			self.show();
			visibilityToggle.innerText = 'visibility';
		} else {
			self.hide();
			visibilityToggle.innerText = 'visibility_off';
		}
	});

	elem.querySelector('.postcontent').appendChild(visibilityToggle);
	elem.querySelector('.postcontent').appendChild(inlinePicker.root);

	Object.defineProperty(this, 'name', {
		get: function() { return _name; },
		set: function(v) {
			if (v.length > Const.max_name_len) {
				v = v.slice(0, Const.max_name_len);
			}
			_name = v;
			manager.tree.updateItem(this.tree_id, {
				content: _name,
				dataset: {group: this}
			});
		}
	});

	Object.defineProperty(this, 'color', {
		get: function() { return _color; },
		set: function(v) {
			_color = v;
			if (this.overlay.size() > 0)
				this.show();
			inlinePicker.setValue(_color.toArray());
			if (manager.currentGroup == self) {
				manager.currGroupColor.setValue(_color.toArray());
			}
		}
	});

	this.hide = function() {
		this.overlay.clear();
	}

	this.show = function() {
		this.overlay.setAllFromSet(this.pixels, this.color);
	}

	this.destroy = function() {
		self.mappings.forEach(function(mapping, id) {
			mapping.destroy();
		});
		self.mappings = self.mappings.clear();
		this.model.removeOverlay(this.overlay);
		manager.tree.removeItem(this.tree_id);
	}

	this.createMapping = function(type) {
		var map_id = newgid();

		var name = self.name + '-map-' + map_id;
		var Map = manager.next_maptype;
		var newmap = new Map(manager, self, map_id, name);
		// Set an initial value for the mapping - it probably won't
		// be meaningful, but avoids keeping it in a limbo state until it's
		// configured.
		if (newmap.isProjection)
			newmap.setFromCamera();

		self.mappings = self.mappings.set(map_id, newmap);
		manager.dispatchEvent(new CustomEvent('maplist_changed'));

		return newmap;
	}

	this.snapshot = function() {
		return Immutable.fromJS({
			name: _name,
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
				var map_class = mapsnap.get('map_class');
				var newMapping = null;
				if (map_class === 'projection')
					newMapping = new ProjectionMapping(manager, self, id);
				else if (map_class === 'transform')
					newMapping = new TransformMapping(manager, self, id);
				else
					console.error("Tried to restore invalid mapping");

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
		manager.dispatchEvent(new CustomEvent('maplist_changed'));
	}
}

function GroupManager(model) {
	Util.EventDispatcher.call(this);
	var self = this;
	var currentSelection = null;
	this.model = model;

	this.currentGroup = null;
	this.currentMapping = null;
	this.next_maptype = ProjectionMapping;

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

	var treePanel = new LiteGUI.Panel('group-tree-panel', {
		title: 'Pixel Group Browser',
		scroll: true
	});

	var panel = new LiteGUI.Panel('group-panel', {
		scroll: true
	});

	var groupCmds = new LiteGUI.Inspector();
	groupCmds.addButton(undefined, 'Make Group', function() {
		var newgroup = self.createFromActiveSelection();
		if (newgroup) {
			self.setCurrentGroup(newgroup);
			self.clearCurrentMapping();
			worldState.checkpoint();
		}
	});

	var currGroupInspector = new LiteGUI.Inspector(null, {name_width: '3.5em'});
	var currMappingInspector = new LiteGUI.Inspector(null, {name_width: '3.5em'});
	var mappingConfigInspector = new LiteGUI.Inspector();
	var mappingConfigDialog = new LiteGUI.Dialog('Configure Mapping', {
		title: "Configure Mapping",
		close: false,
		minimize: false,
		width: Const.sidebar_size,
		height: 300,
		scroll: true,
		resizeable: false,
		draggable: true
	});
	mappingConfigDialog.add(mappingConfigInspector);
	mappingConfigDialog.addButton('Save', function() {
		if (self.currentMapping) {
			self.currentMapping.hideConfig();
			mappingConfigDialog.hide();
			worldState.checkpoint();
		}
	});
	mappingConfigDialog.addButton('Cancel', function() {
		if (self.currentMapping) {
			self.currentMapping.hideConfig();
			mappingConfigDialog.hide();
			// TODO: Reset mapping state to what it was when the config modal
			// was opened.
		}
	});
	function showMappingConfig() {
		mappingConfigDialog.show();
		mappingConfigDialog.adjustSize();
		var dialog = mappingConfigDialog.root;
		var viewport = UI.viewport.root;
		mappingConfigDialog.setPosition(
			viewport.offsetLeft + viewport.offsetWidth - dialog.offsetWidth,
			viewport.offsetTop + viewport.offsetHeight - dialog.offsetHeight);
	}


	this.setCurrentGroup = function(group) {
		self.currentGroup = group;
		self.tree.setSelectedItem(group.tree_id);
		currGroupInspector.clear();
		currGroupInspector.addSection('Current Group');
		currGroupInspector.widgets_per_row = 2;

		group_namefield = currGroupInspector.addString('name', group.name, {
			width: -Const.group_smallbutton_width,
			callback: function(v) {
				self.currentGroup.name = v;
			}
		});
		var delete_group_button = currGroupInspector.addButton(null, 'delete', {
			width: Const.group_smallbutton_width,
			callback: function() {
				deleteGroup(self.currentGroup);
			}
		});

		delete_group_button.classList.add('material-icons');

		currGroupInspector.widgets_per_row = 1;
		self.currGroupColor = currGroupInspector.addColor('color', group.color.toArray(), {
			callback: function(v) {
				self.currentGroup.color = new THREE.Color(v[0], v[1], v[2]);
			}
		});
		currGroupInspector.addTitle('Add Mapping');
		currGroupInspector.widgets_per_row = 2;

		currGroupInspector.addCombo('type',
			self.next_maptype, {
				width: -Const.group_smallbutton_width,
				values: {
					"3D Transform": TransformMapping,
					"2D Projection": ProjectionMapping
				},
				callback: function(val) { self.next_maptype = val; }
			});

		var createMappingButton = currGroupInspector.addButton(null, 'add', {
			width: Const.group_smallbutton_width,
			callback: function() {
				var map = self.currentGroup.createMapping()
				self.setCurrentMapping(map);
				worldState.checkpoint();
			}
		});
		createMappingButton.classList.add('material-icons');
		currGroupInspector.widgets_per_row = 1;

		self.dispatchEvent(new CustomEvent('change', {
			detail: {
				group: self.currentGroup
			}
		}));
	}

	this.setCurrentMapping = function(mapping) {
		self.setCurrentGroup(mapping.group);
		self.tree.setSelectedItem(mapping.tree_id);

		if (self.currentMapping && self.currentMapping.configuring) {
			self.currentMapping.hideConfig();
			mappingConfigDialog.hide();
		}

		self.currentMapping = mapping;

		currMappingInspector.clear();
		currMappingInspector.addSection(mapping.display_name + ' Mapping');
		currMappingInspector.widgets_per_row = 2;
		mapping_namefield = currMappingInspector.addString('name', mapping.name, {
			width: -Const.group_smallbutton_width,
			callback: function(v) {
				self.currentMapping.name = v;
			}
		});
		var delete_mapping_button = currMappingInspector.addButton(null,
			'delete', {
				width: Const.group_smallbutton_width,
				callback: function() {
					deleteMapping(self.currentMapping);
				}
			});
		delete_mapping_button.classList.add('material-icons');
		currMappingInspector.widgets_per_row = 1;

		currMappingInspector.addButton(null, 'Configure Mapping', function() {
			if (!self.currentMapping.configuring) {
				self.currentMapping.showConfig(mappingConfigInspector);
				mappingConfigInspector.addCheckbox('Normalize',
					mapping.normalize, function(val) {
						self.currentMapping.normalize = val;
					});
			}
			showMappingConfig();
		});

		self.dispatchEvent(new CustomEvent('change', {
			detail: {
				mapping: self.currentMapping
			}
		}));
	}

	this.clearCurrentMapping = function() {
		if (!self.currentMapping)
			return;

		if (self.currentMapping.configuring) {
			self.currentMapping.hideConfig();
			mappingConfigDialog.hide();
		}

		self.tree.setSelectedItem(self.currentGroup.tree_id, false, false);
		self.currentMapping = null;
		currMappingInspector.clear();

		self.dispatchEvent(new CustomEvent('change', {
			detail: {
				mapping: null
			}
		}));
	}

	this.clearCurrentGroup = function() {
		self.clearCurrentMapping();
		self.tree.setSelectedItem(null, false, false);
		self.currentGroup = null;
		group_namefield = null;
		currGroupInspector.clear();

		self.dispatchEvent(new CustomEvent('change', {
			detail: {
				group: null
			}
		}));
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

		if (self.currentMapping && self.currentMapping.configuring) {
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

	UI.sidebar_top.split('vertical', ['30%', null], true);
	UI.sidebar_top.getSection(0).add(treePanel);
	UI.sidebar_top.getSection(1).add(panel);

	function createGroup(pixels, name) {
		var id = newgid();
		var name = (typeof name !== 'undefined') ? name : ("Group " + id);
		if (name.length > Const.max_name_len) {
			name = name.slice(0, Const.max_name_len);
		}

		var newgroup = new PixelGroup(self, id, pixels, name, ColorPool.random());

		self.groups = self.groups.set(id, newgroup);
		newgroup.show();

		return newgroup;
	}

	function deleteGroup(group) {
		if (group === self.currentGroup)
			self.clearCurrentGroup();
		self.groups = self.groups.delete(group.id);
		group.destroy();
		worldState.checkpoint();
	}

	function deleteMapping(map) {
		if (map === self.currentMapping)
			self.clearCurrentMapping();
		map.group.mappings = map.group.mappings.delete(map.id);
		map.destroy();
		worldState.checkpoint();
	}

	this.createFromActiveSelection = function() {
		// Don't create an empty group
		if (worldState.activeSelection.size() == 0)
			return null;

		var groupPixels = worldState.activeSelection.getPixels();
		worldState.activeSelection.clear();

		return createGroup(groupPixels);
	}

	/*
	 * Return a list of all current mappings ({name -> mapping obj})
	 * This list is not guaranteed to stay valid if mappings are changed!
	 * if has_type is provided, only mappings which support the provided type
	 * of point mapping will be returned.
	 */
	this.listMappings = function(with_type) {
		var type = (typeof with_type !== 'undefined') ? with_type : null;
		var maps = [];
		self.groups.forEach(function(group, id) {
			group.mappings.forEach(function(mapping, id) {
				if (!type || type in mapping.map_types) {
					maps.push({
						title: mapping.name,
						mapping: mapping
					});
				}
			});
		});
		return maps;
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
		self.dispatchEvent(new CustomEvent('change', {
			detail: {
				group: self.currentGroup,
				mapping: self.currentMapping
			}
		}));
	}

	var allPixels = [];
	this.model.forEach(function(_, pixel) {
		allPixels.push(pixel);
	});
	createGroup(Immutable.Set(allPixels), "All pixels");

	for (var strip = 0; strip < this.model.numStrips; strip++) {
		var name = 'Strip '+(strip+1);

		var list = [];

		this.model.forEachPixelInStrip(strip, function(pixel) {
			list.push(pixel);
		});

		var pixels = Immutable.Set(list);
		createGroup(pixels, name);
	}
}