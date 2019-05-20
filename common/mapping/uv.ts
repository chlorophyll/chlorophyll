import {Vector3} from 'three';

import Units from '../units';
import * as T from '../types';

type UVMode = 'uv2d';

/*
 * UVW texture coordinate mappings
 *
 * These are actually simpler than projection mapping. The mapping consists of
 * a simple transformation (translation, rotation, scaling) in 3d space.
 *
 * When a pattern is applied, pixel positions can be described in
 * cartesian, cylindrical, or spherical coordinates.
 */

export default class UVMapping implements T.PixelMapping {
    static readonly className = 'uv';
    readonly className = 'uv';
    static readonly displayName = 'UV Unwrap';
    readonly displayName = 'UV Unwrap';

    public settings = {
        uvCoords: [],
        dimension: 2
    };

    static readonly views = [
        {
            className: 'uv2d',
            displayName: '2D UV',
            coords: [
                {name: 'x', unit: Units.Distance},
                {name: 'y', unit: Units.Distance},
            ],
            glslType: 'vec2',
            glslSwizzle: 'xy'
        }
    ];

    constructor(attrs) {
        this.settings = {
            ...this.settings,
            ...attrs
        };
        console.log(`Init ${this.className} mapping:`, this.settings);
    }

    getView(): T.MapMode {
        return UVMapping.views[0];
    }
    
    mapPixels(pixels: Array<T.Pixel>): Array<T.MappedPixel> {
        return pixels.map(px => {
            if (!(px.idx in this.settings.uvCoords))
                return null;

            return this.settings.uvCoords[px.idx];
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
    }

    /*
     * Serialization
     */

    serialize() {
        return {
            ...this.settings,
            uvCoords: this.settings.uvCoords.map(v => v.toArray())
        };
    }

    static deserialize(attrs) {
        return new UVMapping(attrs);
    }
}

