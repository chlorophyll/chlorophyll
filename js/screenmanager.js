//TODO(rpearl) potentially support multiple views
Screen = function(camera, renderer, scene) {

	this.camera = camera;
	this.controls = new THREE.OrbitControls(camera, renderer.domElement);
	this.controls.enableDamping = true;
	this.controls.dampingFactor = 0.75;
	this.controls.enableZoom = true;
	this.controls.enableKeys = false;

	this.render = function() {
		renderer.render(scene, camera);
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

	this.saveCameraState = function() {
		return {
			quaternion: this.camera.quaternion.clone(),
			position: this.camera.position.clone(),
		}
	}

	this.setCameraState = function(cameraState) {
		this.camera.quaternion = cameraState.quaternion;
		this.camera.position = cameraState.position;
	}
}

ScreenManager = function(renderer, scene) {
	screens = {};
	_activeScreen = undefined;


	this.addScreen = function(name, camera, active) {
		var screen = new Screen(camera, renderer, scene);
		screens[name] = screen;

		if (active) {
			this.setActive(name);
		}
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
			newScreen.controls.enabled = _activeScreen.controls.enabled;
		_activeScreen = newScreen;
	}

	Object.defineProperties(this, {
		activeScreen: {
			get: function() { return _activeScreen; }
		},
		controls: {
			get: function() { return _activeScreen.controls; }
		}
	});

	this.render = function() {
		for (var name in screens) {
			screens[name].controls.update();
		}
		_activeScreen.render();
	}
}
