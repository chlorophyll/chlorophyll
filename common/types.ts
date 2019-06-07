/*
 * Common types file.
 *
 * Put shared interfaces & types here for easy access.
 */

/*
 * Basic pattern graph types and units
 */
export interface Serializable {
    _tag: string;
    serialize(): object;
}

export interface Point {
    x: number;
    y?: number;
    z?: number;
};

export interface MappedPixel {
    idx: number;
    // 3, 2, or 1 dimension of coordinates can result from mapping
    pos: THREE.Vector3 | THREE.Vector2 | number;
}

export interface Pixel {
    idx: number;
    pos: THREE.Vector3
}

export interface GraphUnit {
    isUnit: true;
    create(any): any;
}

export interface RangeUnit extends GraphUnit {
    isCastable: true;
    range: [number, number];
    // compile a type conversion
    castFrom(val: object, fromUnit: RangeUnit): object;
};

/*
 * Mappings & transformations
 */

export interface CoordSpec {
    name: string;
    unit: RangeUnit;
};

export interface MapMode {
    className: string;
    displayName: string;
    coords: Array<CoordSpec>;
    glslType: string;
    glslSwizzle: string;
};

export interface PixelMapping {
    className: string;
    displayName: string;
    settings: object;
    getView(string): MapMode;
    mapPixels(pixels: Array<Pixel>, ...args: any[]): Array<MappedPixel>;

    serialize(): object;
};
