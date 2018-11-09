/*
 * Common types file.
 *
 * Put shared interfaces & types here for easy access.
 */

export interface Point {
    x: Number;
    y: Number;
    z: Number;
};

export interface PixelMapping {
    displayName: String;
    coordTypes: {
        name: String;
        displayName: String;
        mapCoordinates(Point)
    },
    settings: Object,
};
