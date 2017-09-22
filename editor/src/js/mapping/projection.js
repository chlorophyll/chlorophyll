import * as THREE from 'three';
import Units from 'chl/units';
import { currentModel } from 'chl/model';

function projectPoint(plane, idx) {
    let pos = currentModel.getPosition(idx);
    let fromOrigin = pos.clone().sub(plane.origin);
    return new THREE.Vector2(plane.xaxis.dot(fromOrigin),
                             plane.yaxis.dot(fromOrigin));
}

/*
 * Tools for projecting sets of points from 3d space onto a 2d plane
 */
export const coord_types = {
    cartesian2d: {
        name: '2D Cartesian',
        coords: [
            {normalized: true, name: 'x', unit: Units.Distance},
            {normalized: true, name: 'y', unit: Units.Distance}
        ],
        precompute: getProjectedAxes,
        mapPoint: projectPoint,
        convertCoords: (point) => point,
    },
    polar2d: {
        name: '2D Polar',
        coords: [
            {normalized: true, name: 'r', unit: Units.Percentage},
            {normalized: false, name: 'theta', unit: Units.Angle}
        ],
        precompute: getProjectedAxes,
        mapPoint: projectPoint,
        convertCoords(point) {
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

/*
 * Create axes for the projection and rotate them appropriately.
 * To be precomputed at the beginning of mapPoints.
 */
export function getProjectedAxes(settings) {
    let up = new THREE.Vector3(0, 1, 0);
    let quat = new THREE.Quaternion();
    // The camera looks along the negative Z axis, so that's the initial
    // facing direction of the projection plane.
    const plane_normal = new THREE.Vector3(0, 0, -1);

    quat.setFromEuler(settings.plane_angle);
    plane_normal.applyQuaternion(quat);

    const yaxis = up.applyQuaternion(quat);
    yaxis.applyAxisAngle(plane_normal, settings.rotation);
    yaxis.normalize();

    const xaxis = plane_normal.clone().cross(yaxis);
    xaxis.normalize();

    const origin = new THREE.Vector3();
    origin.fromArray(settings.origin);

    return { xaxis, yaxis, origin };
}
