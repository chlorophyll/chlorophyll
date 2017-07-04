var ProjectionMapping = function(manager, group, id, initname) {
	Mapping.call(this, manager, group, id, initname);
	var self = this;

	this.display_name = "2D Projection";
	this.isProjection = true;

	this.mapping_valid = false;
	this.proj_plane = {};

	this.widget = new CartesianAxes(container);

	var ui_controls = {};

	var screen = screenManager.addScreen(this.tree_id,
			{isOrtho: true, inheritOrientation: true});

	function projectPoint(idx) {
		var pos = self.model.getPosition(idx);
		var fromOrigin = pos.clone().sub(self.proj_plane.origin);
		return new THREE.Vector2(self.proj_plane.xaxis.dot(fromOrigin),
								 self.proj_plane.yaxis.dot(fromOrigin));
	}

	this.map_types.cartesian2d = {
		name: "2D Cartesian",
		mapPoint: projectPoint
	};

	this.map_types.polar2d = {
		name: "2D Polar",
		mapPoint: function(idx) {
			var point = projectPoint(idx);
			// map from x,y -> r, theta
			return new THREE.Vector2(point.length(), point.angle());
		}
	};

	this.setFromCamera = function() {
		var origin = self.widget.data();
		screen.camera.updateMatrixWorld();
		var cam_quaternion = screen.camera.quaternion.clone();

		// Create plane from the camera's look vector
		var plane_normal = new THREE.Vector3(0, 0, -1);
		plane_normal.applyQuaternion(cam_quaternion).normalize();
		var plane = new THREE.Plane(plane_normal);
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
		self.proj_plane.origin = raycaster.ray.intersectPlane(plane);

		// generate normalization factor once
		var pixels = group.pixels.map(i => [i, projectPoint(i)]);

		self.mapping_valid = true;

		self.dispatchEvent(new CustomEvent('change'));
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

	this.hideConfig = function() {
		self.model.showUnderlyingModel();
		screenManager.setActive('main');
		self.widget.hide();

		self.configuring = false;
		self.widget.removeEventListener('change', onWidgetChange);
		screen.controls.removeEventListener('end', setProjection);
		ui_controls.inspector.clear();
		ui_controls = {};
	}

	/*
	 * When the projection origin widget is moved, re-generate the mapping
	 * and update the panel view to reflect its new location.
	 */
	function onWidgetChange(evt) {
		self.setFromCamera();
		var map_origin = self.proj_plane.origin;
		ui_controls.origin_pos_widget.setValue(
			[map_origin.x, map_origin.y, map_origin.z], true);
	}

	this.showConfig = function(inspector) {
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

		ui_controls.origin_pos_widget = inspector.addVector3("origin position",
			origin_pos, {
				disabled: true,
				precision: 1,
			});

		self.widget.addEventListener('change', onWidgetChange);
	}

	this.destroy = function() {
		if (self.configuring)
			self.hideConfig();
		manager.tree.removeItem(self.tree_id);
	}

	this.snapshot = function() {
		if (self.configuring) {
			console.error("Attempted to snapshot ", self.tree_id,
			    " while configuring");
		}
		var widgetdata = self.widget.data();
		var snap = {
			map_class: 'projection',
			name: self.name,
			id: self.id,
			tree_id: self.tree_id,
			mapping_valid: self.mapping_valid,
			normalize: self.normalize,
			widget_x: widgetdata.x,
			widget_y: widgetdata.y,
			widget_angle: widgetdata.angle
		}
		if (self.mapping_valid) {
			var normal = self.proj_plane.euler;
			snap.plane_normal = normal.toArray();
        }
		return Immutable.fromJS(snap);
	}

	this.restore = function(snapshot) {
		if (self.configuring) {
			self.hideConfig();
		}
		self.id = snapshot.get('id');
		self.tree_id = snapshot.get('tree_id');
		self.name = snapshot.get('name');
		self.widget.setPos(snapshot.get('widget_x'), snapshot.get('widget_y'));
		self.widget.setRot(snapshot.get('widget_angle'));
		self.mapping_valid = snapshot.get('mapping_valid');
		self.normalize = snapshot.get('normalize');
		if (self.mapping_valid) {
			var norm = snapshot.get('plane_normal');
			var euler = new THREE.Euler().fromArray(norm.toArray());
			var cam_up = new THREE.Vector3(0, 0, 1);
			Util.alignWithVector(cam_up.applyEuler(euler), screen.camera);
			self.setFromCamera();
		}
	}
}