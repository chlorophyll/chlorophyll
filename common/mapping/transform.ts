import {
    Euler,
    Quaternion,
    Vector2,
    Vector3,
} from 'three';

import Units from '../units';
import * as T from '../types';

/*
 * 3d transform mappings
 *
 * These are actually simpler than projection mapping. The mapping consists of
 * a simple transformation (translation, rotation, scaling) in 3d space.
 *
 * When a pattern is applied, pixel positions can be described in
 * cartesian, cylindrical, or spherical coordinates.
 */
type TransformMode = 'cartesian3d'
                   | 'cylinder3d'
                   | 'sphere3d';

export default class TransformMapping implements T.PixelMapping {
    static readonly className = 'transform';
    readonly className = 'transform';
    static readonly displayName = '3D Transform';
    readonly displayName = '3D Transform';

    public settings = {
        shape: 'cube',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        autoscale: true,
        // TODO autoscale to specific group
        // TODO constrain proportions for cylinder / cartesian maps
    };

    static readonly views = [
        {
            className: 'cartesian3d',
            displayName: '3D Cartesian',
            coords: [
                {name: 'x', unit: Units.Distance},
                {name: 'y', unit: Units.Distance},
                {name: 'z', unit: Units.Distance}
            ],
            glslType: 'vec3',
            glslSwizzle: 'xyz'
        },
        {
            className: 'cylinder3d',
            displayName: '3D Cylindrical',
            coords: [
                {name: 'r', unit: Units.Distance},
                {name: 'theta', unit: Units.Angle},
                {name: 'z', unit: Units.Distance}
            ],
            glslType: 'vec3',
            glslSwizzle: 'xyz'
        },
        {
            className: 'sphere3d',
            displayName: '3D Spherical',
            coords: [
                {name: 'r', unit: Units.Distance},
                {name: 'theta', unit: Units.Angle},
                {name: 'phi', unit: Units.Angle}
            ],
            glslType: 'vec3',
            glslSwizzle: 'xyz'
        },
    ];

    constructor(attrs) {
        this.settings = {
            ...this.settings,
            ...attrs
        };
    }

    getView(className: TransformMode): T.MapMode {
        return TransformMapping.views.find(m => m.className === className);
    }

    mapPixels(pixels: Array<T.Pixel>, mode: TransformMode): Array<T.MappedPixel> {
        const position = new Vector3().fromArray(this.settings.position);
        const rotation = new Euler().fromArray([...this.settings.rotation, 'XYZ']);
        const scale = new Vector3().fromArray(this.settings.scale);

        const rotInv = new Quaternion()
            .setFromEuler(rotation)
            .inverse();

        return pixels.map(({idx, pos}) => {
            const transformed = pos.clone()
                .sub(position)
                .applyQuaternion(rotInv)
                .divide(scale);

            return {
                idx: idx,
                pos: this.convertCoords(transformed, mode)
            };
        });
    }

    /*
     * Modifying & config methods
     */
    setParameters(settings) {
        this.settings = {
            ...this.settings,
            ...settings
        };

        // TODO implement decent autoscaling post-group/map split
        if (this.settings.autoscale)
            console.warn('UNIMPLEMENTED: 3d transform mapping autoscaling');
    }

    // Take a cartesian coordinate vector vector and express it in the right coordinates
    private convertCoords(cart: THREE.Vector3, mode: TransformMode): THREE.Vector3 {
        switch (mode) {
            case 'cartesian3d':
                return cart;

            case 'cylinder3d':
                // x, y, z -> r, theta, z
                const polar = new Vector2(cart.x, cart.z);
                return new Vector3(polar.length(), polar.angle(), cart.y);

            case 'sphere3d':
                const r = cart.length();
                if (r === 0)
                    return new Vector3(r, 0, 0);

                // longitude
                const theta = new Vector2(cart.x, cart.z).angle();
                // latitude, 0 -> south pole, 1 -> north pole
                const south = new Vector3(0, -1, 0);
                const phi = south.angleTo(cart) * 2;

                return new Vector3(r, theta, phi);

            default:
                throw new Error(`Invalid mode: ${mode}`);
        }
    }

    /*
     * Serialization
     */

    serialize() {
        return this.settings;
    }

    static deserialize(attrs) {
        return new TransformMapping(attrs);
    }
}
