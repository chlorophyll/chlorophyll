function Cartesian2DMapping() {
	this.widget = new Widget2D(container, CartesianHandle);

	this.mapPoint = function(idx) {
		var pos = model.getPosition(idx);
		var fromOrigin = pos.clone().sub(this.proj_plane.origin);
		return new THREE.Vector2(this.proj_plane.xaxis.dot(fromOrigin),
								 this.proj_plane.yaxis.dot(fromOrigin));
	}
}

function Polar2DMapping() {
	this.widget = new Widget2D(container, PolarHandle);

	this.mapPoint = function(idx) {
		var pos = model.getPosition(idx);
		var fromOrigin = pos.clone().sub(this.proj_plane.origin);
		var point = new THREE.Vector2(this.proj_plane.xaxis.dot(fromOrigin),
									  this.proj_plane.yaxis.dot(fromOrigin));
		// map from x,y -> r, theta
		return new THREE.Vector2(point.length(), point.angle());
	}
}

function ProjectionMapping(manager, group, id, name, maptype) {
	var self = this;

	this.group = group;
	this.model = group.model;
	this.tree_id = group.group_id + '-map-' + id;
	var mapping_name = name;

	this.enabled = false;
	this.mapping_valid = false;
	this.proj_plane = {};
	this.widget = null;

	var type = null;
	var first_enable = true;

	var screen = screenManager.addScreen(this.tree_id,
			{isOrtho: true, inheritOrientation: true});

	var elem = manager.tree.insertItem({
		id: self.tree_id,
		content: mapping_name,
		dataset: {mapping: self}
	}, group.group_id);

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

	this.setType = function(newtype) {
		if (newtype != type) {
			if (self.widget) {
				//self.widget.destroy();
			}
			self.mapping_valid = false;
			first_enable = true;
			type = newtype;
			newtype.call(self);
		}
	}

	if (typeof maptype !== 'undefined') {
		this.setType(maptype);
	}

	this.getPositions = function() {
		return group.pixels.map(function(idx) {
			return [idx, self.mapPoint(idx)]
		});
	}

	this.setFromCamera = function() {
		var origin = self.widget.data();
		var cam_quaternion = screenManager.activeScreen.camera.quaternion.clone();
		var cam_up = screenManager.activeScreen.camera.up.clone();

		// Create plane from the camera's look vector
		var plane_normal = new THREE.Vector3(0, 0, -1);
		plane_normal.applyQuaternion(cam_quaternion).normalize();
		self.proj_plane.plane = new THREE.Plane(plane_normal);
		self.proj_plane.euler = screenManager.activeScreen.camera.rotation.clone();

		// Create axes for the projection and rotate them appropriately
		self.proj_plane.yaxis = cam_up.clone().applyQuaternion(cam_quaternion);
		self.proj_plane.yaxis.applyAxisAngle(plane_normal, origin.angle);
		self.proj_plane.yaxis.normalize();

		self.proj_plane.xaxis = plane_normal.clone().cross(self.proj_plane.yaxis);
		self.proj_plane.xaxis.normalize();

		// Project the screen position of the origin widget onto the proejction
		// plane.  This is the 3d position of the mapping origin.
		var raycaster = new THREE.Raycaster();
		var widgetpos = new THREE.Vector2(origin.x_norm, origin.y_norm);
		raycaster.setFromCamera(widgetpos, screenManager.activeScreen.camera);
		self.proj_plane.origin = raycaster.ray.intersectPlane(self.proj_plane.plane);

		self.mapping_valid = true;
		// TODO undo snapshot
	}

	this.enable = function() {
		if (self.enabled) return;

		self.model.hideUnderlyingModel();
		screenManager.setActive(self.tree_id);

		if (first_enable) {
			first_enable = false;
			self.widget.showAt(200,200);
		} else {
			self.widget.show();
		}

		self.enabled = true;
	}

	this.disable = function() {
		if (!self.enabled) return;

		self.model.showUnderlyingModel();
		screenManager.setActive('main');
		self.widget.hide();

		self.enabled = false;
	}
}


