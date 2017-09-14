import * as THREE from 'three';
import { UILayout, screenManager, toolbarManager } from 'chl/init';
import Util from 'chl/util';
import Mapping from './maputil';
import { CartesianAxes } from 'chl/widgets/axes2d';
import { currentModel } from 'chl/init';

function projectPoint(plane, idx) {
    let pos = currentModel.getPosition(idx);
    let fromOrigin = pos.clone().sub(plane.origin);
    return new THREE.Vector2(plane.proj_plane.xaxis.dot(fromOrigin),
                             plane.proj_plane.yaxis.dot(fromOrigin));
}

/*
 * Tools for projecting sets of points from 3d space onto a 2d plane
 */
export const coord_types = {
    cartesian2d: {
        name: '2D Cartesian',
        norm_coords: [true, true],
        precompute(settings) {
            // TODO generate x/y axes
            return settings;
        },
        mapPoint(settings, idx) {
            // TODO generate x/y axes
            return projectPoint(settings, idx);
        }
    },
    polar2d: {
        name: '2D Polar',
        norm_coords: [true, false],
        precompute(settings) {
            return settings;
        },
        mapPoint(settings, idx) {
            let point = projectPoint(settings, idx);
            // map from x,y -> r, theta
            return new THREE.Vector2(point.length(), point.angle());
        }
    },
};

export function getCameraProjection(camera, screen_origin) {
    camera.updateMatrixWorld();
    let plane_rot = camera.quaternion.clone();

    // Create plane from the camera's look vector
    let plane_normal = new THREE.Vector3(0, 0, -1);
    plane_normal.applyQuaternion(plane_rot).normalize();
    let plane = new THREE.Plane(plane_normal);
    // Save angle for later reference
    let plane_euler = new THREE.Euler();
    plane_euler.setFromQuaternion(plane_rot);

    // Project the screen position of the origin widget onto the proejction
    // plane.  This is the 3d position of the mapping origin.
    let raycaster = new THREE.Raycaster();
    let widgetpos = new THREE.Vector2(screen_origin.x, screen_origin.y);
    raycaster.setFromCamera(widgetpos, camera);

    return {
        origin: raycaster.ray.intersectPlane(plane).toArray(),
        plane_angle: plane_euler.toArray().slice(0, 2),
        rotation: screen_origin.angle,
    };
}

export function getProjectedAxes(settings) {
    /*
     * Create axes for the projection and rotate them appropriately.
     * To be precomputed at the beginning of mapPoints.
     */
    let up = new THREE.Vector3(0, 1, 0);
    let quat = new THREE.Quaternion();
    let plane_normal = new THREE.Vector3(0, 0, -1);

    quat.setFromEuler(settings.plane_angle);
    plane_normal.applyQuaternion(quat);

    self.proj_plane.yaxis = up.applyQuaternion(quat);
    self.proj_plane.yaxis.applyAxisAngle(plane_normal, origin.angle);
    self.proj_plane.yaxis.normalize();

    self.proj_plane.xaxis = plane_normal.clone().cross(self.proj_plane.yaxis);
    self.proj_plane.xaxis.normalize();
}
