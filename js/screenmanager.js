//TODO(rpearl) potentially support multiple views
Screen = function(camera, renderer, scene) {
	var self = this;

	this.camera = camera;
	this.renderer = renderer;
	this.scene = scene;

	this.isActive = false;

	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.75;
	controls.enableZoom = true;
	controls.enableKeys = false;
	controls.enabled = false;

	this.controls = controls;

	var controlsEnabled = true;

	Object.defineProperties(this, {
		controlsEnabled: {
			get: function() { return controlsEnabled; },
			set: function(v) {
				controlsEnabled = v;
				if (self.isActive)
					controls.enabled = v;
			}

		}
	});


	this.activate = function() {
		controls.enabled = controlsEnabled;
		self.isActive = true;
	}

	this.deactivate = function() {
		self.isActive = false;
		controls.enabled = false;
	}

	this.render = function() {
		renderer.render(scene, camera);
	}

	this.updateControls = function() {
		controls.update();
	}

	this.screenCoords = function(position) {
		return Util.cameraPlaneCoords(camera, renderer, position);
	}

	this.getPointAt = function(model, x, y) {
		var mouse3D = new THREE.Vector3(
			 (x / container.clientWidth ) * 2 - 1,
			-(y / container.clientHeight) * 2 + 1,
			0.5);
		var raycaster = new THREE.Raycaster();
		raycaster.params.Points.threshold = 10;
		raycaster.setFromCamera(mouse3D, camera);
		var intersects = raycaster.intersectObject(model.particles);
		var chosen = undefined;
		for (var i = 0; i < intersects.length; i++) {
			if (!isClipped(intersects[i].point)) {
				chosen = intersects[i];
				break;
			}
		}
		return chosen;
	}
}

ScreenManager = function(renderer, scene) {
	screens = {};
	_activeScreen = undefined;

	this.addScreen = function(name, options) {
		var active = options.active || false;
		var camera;
		var width = container.clientWidth;
		var height = container.clientHeight;
		if (options.isOrtho) {
			camera = new THREE.OrthographicCamera(
				width / -2,  width / 2,
				height / 2, height / -2,
				1, Const.max_draw_dist);
			camera.zoom /= 2;
			camera.updateProjectionMatrix();
		} else {
			camera = new THREE.PerspectiveCamera(45, width/height, 1,
				Const.max_draw_dist);
		}
		if (options.inheritOrientation && _activeScreen) {
			camera.position.x = _activeScreen.camera.position.x;
			camera.position.y = _activeScreen.camera.position.y;
			camera.position.z = _activeScreen.camera.position.z;
		} else {
			camera.position.z = 1000;
		}
		var screen = new Screen(camera, renderer, scene);
		screens[name] = screen;

		if (options.active) {
			this.setActive(name);
		}
		return screen;
	}

	this.resize = function() {
		var width = container.clientWidth;
		var height = container.clientHeight;
		renderer.setSize(width, height);

		for (var name in screens) {
			var camera = screens[name].camera;

			if (camera.isOrthographicCamera) {
				camera.left = -width/2;
				camera.right = width/2;
				camera.top = height/2;
				camera.bottom = -height/2;
			} else {
				camera.aspect = width/height;
			}
			camera.updateProjectionMatrix();
		}
	}

	this.setActive = function(name) {
		var newScreen = screens[name];
		if (_activeScreen)
			_activeScreen.deactivate();

		newScreen.activate();
		_activeScreen = newScreen;
	}

	Object.defineProperties(this, {
		activeScreen: {
			get: function() { return _activeScreen; }
		},
	});

	this.render = function() {
		_activeScreen.updateControls();
		_activeScreen.render();
	}

	Mousetrap.bind('space', function() {
		if (_activeScreen !== undefined) {
			Util.alignWithVector(new THREE.Vector3(0, 0, 1),
			                     _activeScreen.camera);
		}
	});
}
