/*
 * Common types file.
 *
 * Put shared interfaces & types here for easy access.
 */

/*
 * Basic pattern graph types and units
 */
export interface Point {
    x: number;
    y?: number;
    z?: number;
};

export interface Pixel {
    idx: number;
    pos: Point;
}

export interface GraphUnit {
    isUnit: true;
    name: string;
    create(any): any;
    serialize(any): any;
}

export interface RangeUnit extends GraphUnit {
    isCastable: true;
    range: [number, number];
    // compile a type conversion
    compile(val: any, castFrom: GraphUnit): any;
    // convert between types in-editor
    castFrom(val: any, castFrom: GraphUnit): GraphUnit;
};

/*
 * Mappings & transformations
 */

export interface CoordSpec {
    normalized: boolean;
    name: string;
    unit: GraphUnit;
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

    serialize(): object;
    deserialize(object);
};
