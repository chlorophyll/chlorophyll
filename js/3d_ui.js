/*
 * 3d viewport UI components
 */
function ViewportHandle(scene, camera, renderer) {
	var control = new THREE.TransformControls(camera, renderer.domElement);

	var centerpoint_geom = new THREE.Geometry();
	centerpoint_geom.vertices.push(new THREE.Vector3(0, 0, 0));
	var centerpoint_mat = new THREE.PointCloudMaterial({size: 30, sizeAttenuation: true});
	var centerpoint = new THREE.PointCloud(centerpoint_geom, centerpoint_mat);

	scene.add(centerpoint);
	control.attach(centerpoint);
	scene.add(control);

	this.setMode = function(mode) {
		// Disable scaling mode
		if (mode === "translate" || mode === "rotate") {
			control.setMode(mode);
		}
	}

	this.getPosition = function() {
		return centerpoint.position;
	}

	this.setPosition = function(pos) {
		if (pos.isVector3) {
			centerpoint.position = pos;
		}
	}

	this.update = function() {
		var pos = centerpoint.position;
		//console.log("handle pos: %d %d %d", pos.x, pos.y, pos.z);
		control.update();
	}

	control.addEventListener("change", this.update);
}
