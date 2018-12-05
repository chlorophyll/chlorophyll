import Units from '../units';
import * as T from '../types'

export class LinearMapping implements T.PixelMapping {
    readonly className = 'linear';
    readonly displayName = '1d Linear Map';
    readonly modes = [
        {
            className: 'continuous',
            displayName: 'Linear (continuous)',
            coords: [
                {normalized: false, name: 'x', unit: Units.Distance}
            ],
        },
        {
            className: 'discrete',
            displayName: 'Linear (indexed)',
            coords: [
                {normalized: false, name: 'x', unit: Units.Numeric}
            ]
        }
    ];

    settings = {};

    constructor(attrs) {
        this.deserialize(attrs);
    }

    getMode(className) {
        const foundMode: T.MapMode = this.modes.find(m => m.className === className);
        if (!foundMode)
            throw new Error(`Invalid coordinate mode: ${className}`);
    }

    serialize() {
        return {};
    }

    deserialize(attrs) {
        this.settings = attrs;
    }
}


export const coord_types = {
    continuous1d: {
        name: 'Linear (continuous)',

        coords: [
            // Coords are always already normalized in this case.
            {normalized: false, name: 'x', unit: Units.Distance}
        ],
        precompute: null,
        mapPoint(settings, pos, idx) {
            // 0 or 1-length mappings arbitrarily get positioned at 0.
            // This shouldn't ever get called when we don't have any points,
            // but just in case.
            if (settings.pixels.length <= 1)
                return 0;

            return idx / (settings.pixels.length - 1);
        },
        convertCoords: (point) => point
    }
};

export function addGroup(settings, group) {
    if (settings.groupIds.includes(group.id))
        return settings;

    const groupPixels = new Set(group.pixels);
    const withoutGroup = settings.pixels.filter(i => !groupPixels.has(i));
    return {
        groupIds: [...settings.groupIds, group.id],
        pixels: [...withoutGroup, ...group.pixels]
    };
}

export function removeGroup(settings, group) {
    if (!settings.groupIds.includes(group.id))
        return settings;

    const groupPixels = new Set(group.pixels);
    return {
        groupIds: settings.groupIds.filter(gid => gid !== group.id),
        pixels: settings.pixels.filter(i => !groupPixels.has(i))
    };
}
