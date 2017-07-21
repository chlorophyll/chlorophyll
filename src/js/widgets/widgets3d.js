import * as THREE from 'three';
import 'three-examples/controls/TransformControls';

/*
 * 3d viewport UI components
 */
export default function ViewportHandle(screen) {
    let self = this;

    this.control = new THREE.TransformControls(screen.camera,
                                              screen.renderer.domElement);

    screen.controls.addEventListener('change', function() {
        if (screen.isActive) self.control.update();
    });

    let centerpoint_geom = new THREE.Geometry();
    centerpoint_geom.vertices.push(new THREE.Vector3(0, 0, 0));
    let centerpoint_mat = new THREE.PointsMaterial({size: 30, sizeAttenuation: true});
    let centerpoint = new THREE.Points(centerpoint_geom, centerpoint_mat);

    /*
     * Aim to have the bounds of the bounding box be clear, but not obscure
     * the enclosed points too much.
     * TODO: highlight points contained (or not contained?) in box?
     */
    let bounds_mat = new THREE.MeshBasicMaterial({
        wireframe: true,
        wireframeLinewidth: 1,
        color: 0x808080
    });

    let bounding_mesh = null;

    screen.scene.add(centerpoint);
    this.control.attach(centerpoint);
    screen.scene.add(this.control);

    this.setMode = function(mode) {
        // Disable scaling mode
        if (mode === 'translate' || mode === 'rotate') {
            self.control.setMode(mode);
        }
    };

    this.setBoundsPreview = function(shape) {
        if (bounding_mesh !== null)
            centerpoint.remove(bounding_mesh);

        let geom;
        if (shape === 'cube') {
            geom = new THREE.BoxGeometry(1, 1, 1);
        } else if (shape === 'cylinder') {
            // TODO cylinder needs rotated to match the right axis
            geom = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        } else if (shape === 'sphere') {
            geom = new THREE.SphereGeometry(0.5, 8, 6);
        }
        bounding_mesh = new THREE.Mesh(geom, bounds_mat);
        centerpoint.add(bounding_mesh);
    };

    this.data = function() {
        return {
            pos: centerpoint.position,
            quaternion: centerpoint.quaternion
        };
    };

    this.hide = function() {
        self.control.detach();
        centerpoint.traverse(function(object) { object.visible = false; });
    };

    this.show = function() {
        centerpoint.traverse(function(object) { object.visible = true; });
        self.control.attach(centerpoint);
    };

    this.setPos = function(pos) {
        if (pos.isVector3) {
            centerpoint.position.copy(pos);
        } else if (Array.isArray(pos) && pos.length == 3) {
            centerpoint.position.fromArray(pos);
        }
        self.control.update();
    };

    this.setRot = function(rot) {
        if (rot.isEuler) {
            centerpoint.setRotationFromEuler(rot);
        } else {
            centerpoint.setRotationFromQuaternion(rot);
        }
        self.control.update();
    };

    this.setScale = function(scale) {
        if (scale.isVector3) {
            centerpoint.scale.set(scale.x, scale.y, scale.z);
        } else if (Array.isArray(scale) && scale.length == 3) {
            centerpoint.scale.set(scale[0], scale[1], scale[2]);
        }
        self.control.update();
    };
}
