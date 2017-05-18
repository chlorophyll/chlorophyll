/*
 * Mapping utility values
 *
 * For each type of mapping, provide a descriptive name and a point mapping
 * function which, when called on a mapping object, returns the mapped
 * coordinates of the point.
 */
MapUtil = {
	default_type: "cartesian2d",
	mapping_types: {
		cartesian2d: {
			name: "2D Cartesian",
			mapPoint: function(idx) {
				var pos = this.model.getPosition(idx);
				var fromOrigin = pos.clone().sub(this.proj_plane.origin);
				return new THREE.Vector2(this.proj_plane.xaxis.dot(fromOrigin),
										 this.proj_plane.yaxis.dot(fromOrigin));
			},
			coord_names: ['x', 'y']
		},
		polar2d: {
			name: "2D Polar",
			mapPoint: function(idx) {
				var pos = this.model.getPosition(idx);
				var fromOrigin = pos.clone().sub(this.proj_plane.origin);
				var point = new THREE.Vector2(this.proj_plane.xaxis.dot(fromOrigin),
											  this.proj_plane.yaxis.dot(fromOrigin));
				// map from x,y -> r, theta
				return new THREE.Vector2(point.length(), point.angle());
			},
			coord_names: ['r', 'theta']
		}
	},
	// generated from mapping_types
	type_menu: {}
}
// Generate display name -> use name mapping for the settings menu
for (type in MapUtil.mapping_types) {
	MapUtil.type_menu[MapUtil.mapping_types[type].name] = type;
}


function ProjectionMapping(manager, group, id, name) {
	var self = this;

	this.group = group;
	this.model = group.model;
	this.id = id;
	this.tree_id = group.tree_id + '-map-' + id;
	var mapping_name = name;

	this.configuring = false;
	this.mapping_valid = false;
	this.proj_plane = {};
	this.widget = new CartesianAxes(container);

	var ui_controls = {};

	var screen = screenManager.addScreen(this.tree_id,
			{isOrtho: true, inheritOrientation: true});

	var elem = manager.tree.insertItem({
		id: self.tree_id,
		content: mapping_name,
		dataset: {mapping: self}
	}, group.tree_id);

	Object.defineProperty(this, 'name', {
		get: function() { return mapping_name; },
		set: function(v) {
			mapping_name = v;
			manager.tree.updateItem(self.tree_id, {
				content: mapping_name,
				dataset: {mapping: self}
			});
		}
	});

	this.getPositions = function(type) {
		return group.pixels.map(function(idx) {
			return [idx, MapUtil.mapping_types[type].mapPoint.call(self, idx)]
		});
	}

	this.setFromCamera = function() {
		var origin = self.widget.data();
		var cam_quaternion = screen.camera.quaternion.clone();

		// Create plane from the camera's look vector
		var plane_normal = new THREE.Vector3(0, 0, -1);
		plane_normal.applyQuaternion(cam_quaternion).normalize();
		self.proj_plane.plane = new THREE.Plane(plane_normal);
		self.proj_plane.euler = screen.camera.rotation.clone();

		// Create axes for the projection and rotate them appropriately
		var up = screen.camera.up.clone();
		self.proj_plane.yaxis = up.applyQuaternion(cam_quaternion);
		self.proj_plane.yaxis.applyAxisAngle(plane_normal, origin.angle);
		self.proj_plane.yaxis.normalize();

		self.proj_plane.xaxis = plane_normal.clone().cross(self.proj_plane.yaxis);
		self.proj_plane.xaxis.normalize();

		// Project the screen position of the origin widget onto the proejction
		// plane.  This is the 3d position of the mapping origin.
		var raycaster = new THREE.Raycaster();
		var widgetpos = new THREE.Vector2(origin.x, origin.y);
		raycaster.setFromCamera(widgetpos, screen.camera);
		self.proj_plane.origin = raycaster.ray.intersectPlane(self.proj_plane.plane);

		self.mapping_valid = true;
	}

	/* Updates the camera projection and shows it in the ui */
	var setProjection = function() {
		var angle = screen.camera.rotation;
		ui_controls.cam_angle_widget.setValue(
			[angle.x * THREE.Math.RAD2DEG,
				angle.y * THREE.Math.RAD2DEG,
				angle.z * THREE.Math.RAD2DEG], true);
		self.setFromCamera();
	}

	this.endConfig = function() {
		self.model.showUnderlyingModel();
		screenManager.setActive('main');
		self.widget.hide();

		self.configuring = false;
		self.widget.onChange = null;
		screen.controls.removeEventListener('end', setProjection);
		ui_controls.inspector.clear();
		ui_controls = {};
	}

	this.startConfig = function(inspector) {

		if (self.configuring) return;

		ui_controls.inspector = inspector;

		toolbarManager.exitActiveTool();
		self.model.hideUnderlyingModel();
		screenManager.setActive(self.tree_id);

        self.widget.show();
		self.configuring = true;

		screen.controls.addEventListener('end', setProjection);

		// Default values for position/angle settings
		var origin_pos = [0,0,0];
		var plane_angle = screen.camera.rotation;
		if (self.mapping_valid) {
			var map_origin = self.proj_plane.origin;
			origin_pos = [map_origin.x, map_origin.y, map_origin.z];
			plane_angle = self.proj_plane.euler;
		}

		// display as degrees for human readability
		ui_controls.cam_angle_widget = inspector.addVector3("plane normal",
			[plane_angle.x * THREE.Math.RAD2DEG,
			 plane_angle.y * THREE.Math.RAD2DEG,
			 plane_angle.z * THREE.Math.RAD2DEG],
			{
				min: -180, max: 180,
				precision: 1,
				callback: function(v) {
					// Rotate the camera to the set angle
					var new_normal = new THREE.Vector3(0, 0, 1);
					new_normal.applyEuler(new THREE.Euler(
						v[0] * THREE.Math.DEG2RAD,
						v[1] * THREE.Math.DEG2RAD,
						v[2] * THREE.Math.DEG2RAD));
					Util.alignWithVector(new_normal,
						screen.camera);
					self.setFromCamera();
				}
			});

		var origin_pos_widget = inspector.addVector3("origin position",
			origin_pos, {
				disabled: true,
				precision: 1,
			});

		/*
		 * When the projection origin widget is moved, re-generate the mapping
		 * and update the panel view to reflect its new location.
		 */
		self.widget.onChange = function(data) {
			self.setFromCamera();
			var map_origin = self.proj_plane.origin;
			origin_pos_widget.setValue([map_origin.x, map_origin.y, map_origin.z], true);
		}

		inspector.addButton(null, 'Save and close', function() {
			self.endConfig();
			// Only snapshot state on save+close to avoid gross state fiddling
			worldState.checkpoint();
		});
	}

	this.destroy = function() {
		if (self.configuring)
			self.endConfig();
		manager.tree.removeItem(self.tree_id);
	}

	this.snapshot = function() {
		if (self.configuring) {
			console.error("Attempted to snapshot ", self.tree_id,
			    " while configuring");
		}
		var widgetdata = self.widget.data();
		snap = {
			name: mapping_name,
			id: self.id,
			tree_id: self.tree_id,
			mapping_valid: self.mapping_valid,
			widget_x: widgetdata.x,
			widget_y: widgetdata.y,
			widget_angle: widgetdata.angle
		}
		if (self.mapping_valid) {
			var normal = self.proj_plane.euler;
			snap.plane_normal = [normal.x, normal.y, normal.z];
        }
		return Immutable.fromJS(snap);
	}

	this.restore = function(snapshot) {
		if (self.configuring) {
			self.endConfig();
		}
		self.id = snapshot.get('id');
		self.tree_id = snapshot.get('tree_id');
		self.name = snapshot.get('name');
		self.widget.setPos(snapshot.get('widget_x'), snapshot.get('widget_y'));
		self.widget.setAngle(snapshot.get('widget_angle'));
		self.mapping_valid = snapshot.get('mapping_valid');
		if (self.mapping_valid) {
			var norm = snapshot.get('plane_normal');
			var euler = new THREE.Euler(norm.get(0), norm.get(1), norm.get(2));
			var cam_up = new THREE.Vector3(0, 0, 1);
			Util.alignWithVector(cam_up.applyEuler(euler), screen.camera);
			self.setFromCamera();
		}
	}
}
