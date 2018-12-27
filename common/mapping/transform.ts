import Units from '@/common/units';
import {
    Euler,
    Quaternion,
    Vector2,
    Vector3,
} from 'three';

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
    const center = new Vector3();
    center.fromArray(position);

    let furthest = 0;
    pixels.forEach(({pos}) => {
        let dist = center.distanceToSquared(pos);
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
function transformPoint(settings, pos) {
    const fromOrigin = pos.clone().sub(settings.position);
    const rot_inv = new Quaternion();
    rot_inv.setFromEuler(settings.rotation).inverse();
    fromOrigin.applyQuaternion(rot_inv);
    fromOrigin.divide(settings.scale);

    return fromOrigin;
}

function settingsToVectors(settings) {
    return {
        position: new Vector3().fromArray(settings.position),
        rotation: new Euler().fromArray([...settings.rotation, 'XYZ']),
        scale: new Vector3().fromArray(settings.scale),
    };
}

export const coord_types = {
    cartesian3d: {
        name: '3D Cartesian',
        coords: [
            {normalized: true, name: 'x', unit: Units.Distance},
            {normalized: true, name: 'y', unit: Units.Distance},
            {normalized: true, name: 'z', unit: Units.Distance}
        ],
        precompute: settingsToVectors,
        mapPoint: transformPoint,
        convertCoords: (point) => point,
    },

    cylinder3d: {
        name: '3D Cylindrical',
        coords: [
            {normalized: true, name: 'r', unit: Units.Percentage},
            {normalized: false, name: 'theta', unit: Units.Angle},
            {normalized: true, name: 'z', unit: Units.Distance}
        ],
        precompute: settingsToVectors,
        mapPoint: transformPoint,
        convertCoords(cart) {
            // x, y, z -> r, theta, z
            let polar = new Vector2(cart.x, cart.z);
            return new Vector3(polar.length(), polar.angle(), cart.y);
        }
    },

    sphere3d: {
        name: '3D Spherical',
        coords: [
            {normalized: true, name: 'r', unit: Units.Percentage},
            {normalized: false, name: 'theta', unit: Units.Angle},
            {normalized: false, name: 'phi', unit: Units.Angle}
        ],
        precompute: settingsToVectors,
        mapPoint: transformPoint,
        convertCoords(cart) {
            let r = cart.length();
            if (r === 0)
                return new Vector3(r, 0, 0);

            // longitude
            const theta = new Vector2(cart.x, cart.z).angle();
            // latitude, 0 -> south pole, 1 -> north pole
            const south = new Vector3(0, -1, 0);
            const phi = south.angleTo(cart) * 2;

            return new Vector3(r, theta, phi);
        }
    },
};
