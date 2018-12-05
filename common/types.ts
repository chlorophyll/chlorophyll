/*
 * Common types file.
 *
 * Put shared interfaces & types here for easy access.
 */

/*
 * Basic types and units
 */
export interface Point {
    x: number;
    y: number;
    z: number;
};

export interface RangeType {
    range: [number, number];
    create(any): number;
    isUnit: true;
};

/*
 * Mappings & transformations
 */

export interface CoordSpec {
    normalized: boolean;
    name: string;

};

export interface MapMode {
    className: string;
    displayName: string;
    coords: Array<CoordSpec>;
};

export interface PixelMapping {
    className: string;
    displayName: string;
    modes: Array<MapMode>;
    settings: object;

    serialize(): object;
    deserialize(object);
};
