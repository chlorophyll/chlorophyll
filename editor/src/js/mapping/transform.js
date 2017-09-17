import { currentModel } from 'chl/init';
import * as THREE from 'three';

/*
 * 3d transform mappings
 *
 * These are actually simpler than projection mapping. The mapping consists of
 * a simple transformation (translation, rotation, scaling) in 3d space.
 *
 * When a pattern is applied, pixel positions can be described in
 * cartesian, cylindrical, or spherical coordinates.
 */

export function scaleToFitPoints(pixels, position) {
    // TODO scale based on preview shape - a sphere is strictly smaller than
    // the others, though, so it's a workable approximation.
    const center = new THREE.Vector3();
    center.fromArray(position);

    let furthest = 0;
    pixels.forEach((i) => {
        let dist = center.distanceToSquared(currentModel.getPosition(i));
        if (dist > furthest)
            furthest = dist;
    });
    let scale_factor = 2 * Math.sqrt(furthest);

    return [scale_factor, scale_factor, scale_factor];
}

/*
 * Manipulate a point to be positioned correctly for the mapping.
 * Returns new coordinates for the point in local cartesian space.
 */
function transformPoint(settings, idx) {
    const pos = currentModel.getPosition(idx);
    const fromOrigin = pos.clone().sub(settings.position);
    const rot_inv = new THREE.Quaternion();
    rot_inv.setFromEuler(settings.rotation).inverse();
    fromOrigin.applyQuaternion(rot_inv);
    fromOrigin.divide(settings.scale);

    return fromOrigin;
}

function settingsToVectors(settings) {
    return {
        position: new THREE.Vector3().fromArray(settings.position),
        rotation: new THREE.Euler().fromArray([...settings.rotation, 'XYZ']),
        scale: new THREE.Vector3().fromArray(settings.scale),
    };
}

export const coord_types = {
    cartesian3d: {
        name: '3D Cartesian',
        norm_coords: [true, true, true],
        precompute: settingsToVectors,
        mapPoint: transformPoint
    },

    cylinder3d: {
        name: '3D Cylindrical',
        norm_coords: [true, false, true],
        precompute: settingsToVectors,
        mapPoint: function(settings, idx) {
            let cart = transformPoint(settings, idx);
            // x, y, z -> r, theta, z
            let polar = new THREE.Vector2(cart.x, cart.y);
            return new THREE.Vector3(polar.length(), polar.angle(), cart.z);
        }
    },

    sphere3d: {
        name: '3D Spherical',
        norm_coords: [true, false, false],
        precompute: settingsToVectors,
        mapPoint: function(settings, idx) {
            let cart = transformPoint(settings, idx);
            let r = cart.length();
            let theta = (r == 0) ? 0 : Math.acos(cart.z / r);
            let phi = (r == 0) ? 0 : Math.atan2(cart.y, cart.x);
            return new THREE.Vector3(r, theta, phi);
        }
    },
};
