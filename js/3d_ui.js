/*
 * 3d viewport UI components 
 */
function ViewportHandle(scene, camera, renderer) {
	var control = new THREE.TransformControls(camera, renderer.domElement);

	this.setMode = function(mode) {
		// Disable scaling mode
		if (mode === "translate" || mode === "rotate") {
			control.setMode(mode);
		}
	}

	this.update = function() {
		control.update();
		renderer.render(scene, camera)
	}

	control.addEventListener("change", this.update);
	scene.add(control);
}
