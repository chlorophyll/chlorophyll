/*
 * 3d transform mappings
 *
 * These are actually simpler than projection mapping. The mapping consists of
 * a simple transformation (translation, rotation, scaling) in 3d space.
 *
 * When a pattern is applied, pixel positions can be described in
 * cartesian, cylindrical (along any axis), or spherical coordinates.
 */
var TransformMapping = function(manager, group, id, initname) {
	Mapping.call(this, manager, group, id, initname)
	var self = this;

	this.isTransform = true;
	this.shape = "cube";
	this.position = new THREE.Vector3(0, 0, 0);
	this.rotation = new THREE.Euler(0, 0, 0);
	this.scale = new THREE.Vector3(1, 1, 1);
	this.autoscale = true;

	this.widget = new ViewportHandle(screenManager.activeScreen);
	this.widget.setBoundsPreview(this.shape);

	var ui_controls = {};
	var enabled = false;

	function scaleToFitPoints() {
		if (!self.autoscale || self.position === null)
			return;

		// TODO scale based on preview shape - a sphere is strictly smaller than
		// the others, though, so it's a workable approximation.
		var furthest = 0;
		self.group.pixels.forEach(function(i) {
			var dist = self.position.distanceToSquared(self.model.getPosition(i));
			if (dist > furthest)
				furthest = dist;
		});
		var scale_factor = 2 * Math.sqrt(furthest);

		self.scale.fromArray([scale_factor, scale_factor, scale_factor]);
		self.widget.setScale(self.scale);
		ui_controls.scale_widget.setValue(self.scale.toArray(), true);
	}

	/*
	 * Manipulate a point to be positioned correctly for the mapping.
	 * Returns new coordinates for the point in local cartesian space.
	 */
	function transformPoint(idx) {
		var pos = self.model.getPosition(idx);
		var fromOrigin = pos.clone().sub(self.position);
		var rot_inv = new THREE.Quaternion();
		rot_inv.setFromEuler(self.rotation).inverse();
		fromOrigin.applyQuaternion(rot_inv);
		fromOrigin.divide(self.scale);

		return fromOrigin;
	}

	this.map_types.cartesian3d = {
		name: "3D Cartesian",
		mapPoint: transformPoint
	};

	this.map_types.cylinder3d = {
		name: "3D Cylindrical",
		mapPoint: function(idx) {
			var cart = transformPoint(idx);
			// x, y, z -> r, theta, z
			var polar = new THREE.Vector2(cart.x, cart.y);
			return new THREE.Vector3(polar.length(), polar.angle(), cart.z);
		}
	};

	this.map_types.sphere3d = {
		name: "3D Spherical",
		mapPoint: function(idx) {
			var cart = transformPoint(idx);
			var r = cart.length();
			var theta = (r == 0) ? 0 : Math.acos(cart.z / r);
			var phi = (r == 0) ? 0 : Math.atan2(cart.y, cart.x);
			return new THREE.Vector3(r, theta, phi);
		}
	};

	/*
	 * When selected, show the handle and cube outline.
	 * TODO UI elements:
	 * When scale locked, switch out box to manually change.
	 *
	 * undo ckpt on change, when mouse released.
	 * timeout registering a checkpoint to avoid spamming for rapid changes,
	 * like happens with the slider fields - e.g. wait for 1sec idle, maybe.
	 * Alternatively: check for events on the gui control, maybe there's an
	 * end-interact event.
	 */
	this.showConfig = function(inspector) {
		if (enabled) return;

		ui_controls.inspector = inspector;

		toolbarManager.setActiveTool('camera');
		self.model.hideUnderlyingModel();

		self.widget.show();
		self.widget.setPos(self.position);
		self.widget.setRot(self.rotation);
		self.widget.setScale(self.scale);

		ui_controls.previewshape_widget = inspector.addComboButtons(
			'Preview', "cube",
			{
				values: ["cube", "cylinder", "sphere"],
				callback: function(v) {
					self.shape = v;
					self.widget.setBoundsPreview(v);
					scaleToFitPoints();
				}
			});

		ui_controls.controlmode_widget = inspector.addComboButtons(
			'Control mode', "translate",
			{
				values: ["translate", "rotate"],
				callback: self.widget.setMode
			});

		ui_controls.pos_widget = inspector.addVector3("Position",
			self.position.toArray(),
			{
				precision: 1,
				callback: function(v) {
					self.position.fromArray(v);
					self.widget.setPos(self.position);
					scaleToFitPoints()
				}
			});

		ui_controls.rot_widget = inspector.addVector3("Rotation",
			self.rotation.toArray().slice(0, 3).map(x => x * THREE.Math.RAD2DEG),
			{
				min: -180, max: 180,
				precision: 1,
				callback: function(v) {
					self.rotation.fromArray(v.map(x => x * THREE.Math.DEG2RAD));
					self.widget.setRot(self.rotation);
					scaleToFitPoints()
				}
			});

		ui_controls.scale_widget = inspector.addVector3("Scale",
			self.scale.toArray(),
			{
				precision: 1,
				disabled: true,
				callback: function(v) {
					self.scale.fromArray(v);
					self.widget.setScale(self.scale);
				}
			});

		inspector.addTitle("Reset:");
		inspector.widgets_per_row = 3;
		inspector.addButton(null, 'Position', function() {
			self.position.fromArray([0, 0, 0]);
			self.widget.setPos(self.position);
			ui_controls.pos_widget.setValue([0, 0, 0], true);
			scaleToFitPoints()
		});
		inspector.addButton(null, 'Rotation', function() {
			self.rotation.fromArray([0, 0, 0]);
			self.widget.setRot(self.rotation);
			ui_controls.rot_widget.setValue([0, 0, 0], true);
			scaleToFitPoints()
		});
		ui_controls.reset_scale = inspector.addButton(null, 'Scale', function() {
			if (!self.autoscale) {
				self.scale.fromArray([1, 1, 1]);
				self.widget.setScale(self.scale);
				ui_controls.scale_widget.setValue([1, 1, 1], true);
			}
		});
		inspector.widgets_per_row = 1;

		inspector.addCheckbox("Auto Scale", self.autoscale, function(val) {
			self.autoscale = val;
			if (val)
				scaleToFitPoints();
		});

		self.widget.control.addEventListener("objectChange", function() {
			var transform = self.widget.data();
			self.position = transform.pos;
			self.rotation.setFromQuaternion(transform.quaternion);
			scaleToFitPoints()
			ui_controls.pos_widget.setValue(self.position.toArray(), true);
			// Euler angles return the order as well.
			ui_controls.rot_widget.setValue(self.rotation.toArray()
				.slice(0, 3).map(x => x * THREE.Math.RAD2DEG), true);
			ui_controls.scale_widget.setValue(self.scale.toArray(), true);
		});

		scaleToFitPoints();

		self.widget.control.addEventListener("mouseUp", function() {
			// worldState.checkpoint();
		});

	}

	this.hideConfig = function() {
		if (!enabled) return;

		self.model.showUnderlyingModel();
		self.widget.hide();

		self.widget.control.removeEventListener("objectChange");
		self.widget.control.removeEventListener("mouseUp");
		ui_controls.inspector.clear();
		ui_controls = {};
	}

	this.destroy = function() {
		self.hideConfig();
		manager.tree.removeItem(self.tree_id);
	}

	this.snapshot = function() {
		console.error("No snapshot() for TransformMapping");
	}

	this.restore = function() {
		console.error("No restore() for TransformMapping");
	}
}
