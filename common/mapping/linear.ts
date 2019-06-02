import Units from '../units';
import * as T from '../types'

type LinearMode = 'continuous' | 'discrete';

export default class LinearMapping implements T.PixelMapping {
    static readonly className = 'linear';
    readonly className = 'linear';

    static readonly displayName = '1D Linear Map';
    readonly displayName = '1D Linear Map';

    public settings = {
        pixelIds: [],
        groupIds: []
    };

    static readonly views = [
        {
            className: 'continuous',
            displayName: 'Linear (continuous)',
            coords: [
                {name: 'x', unit: Units.Percentage}
            ],
            glslType: 'float',
            glslSwizzle: 'x'
        },
        {
            className: 'discrete',
            displayName: 'Linear (indexed)',
            coords: [
                {name: 'x', unit: Units.UInt8}
            ],
            glslType: 'int',
            glslSwizzle: 'x'
        }
    ];

    constructor(attrs) {
        this.settings = {
            ...this.settings,
            ...attrs
        };
    }

    getView(className: LinearMode): T.MapMode {
        return LinearMapping.views.find(m => m.className === className);
    }

    mapPixels(pixels: Array<T.Pixel>, mode: LinearMode): Array<T.MappedPixel> {
        const nPixels = this.settings.pixelIds.length;
        const idxToMappedIdx = new Map();

        // Pixels are listed in the settings as their global index
        this.settings.pixelIds.forEach((globalIdx, mapIdx) => {
            idxToMappedIdx.set(globalIdx, mapIdx);
        });

        return pixels.map(pixel => {
            const globalIdx = pixel.idx;
            // If the point isn't in the set of pixels, it can't be mapped.
            if (!idxToMappedIdx.has(globalIdx))
                return {idx: -1, pos: null};

            // 1-length mappings arbitrarily get positioned at 0.
            if (this.settings.pixelIds.length <= 1)
                return {idx: 0, pos: {x: 0}};

            // Otherwise, space points evenly along the axis.
            // The last pixel has x < 1. This prevents the first and last pixel
            // from overlapping when treating the mapping as a circle.
            const mappedIdx = idxToMappedIdx.get(globalIdx);
            switch (mode) {
                case 'continuous':
                    return {
                        idx: globalIdx,
                        pos: mappedIdx / nPixels
                    };

                case 'discrete':
                    return {
                        idx: globalIdx,
                        pos: mappedIdx
                    };

                default:
                    throw new Error(`Invalid mode: ${mode}`);
            }
        });
    }

    /*
     * Modifying & config methods
     */

    // Add all of a group's pixels to the mapping
    addGroup(group) {
        if (this.settings.groupIds.includes(group.id))
            return;

        const groupPixels = new Set(group.pixels);
        const withoutGroup = this.settings.pixelIds.filter(i => !groupPixels.has(i));

        this.settings.groupIds = [...this.settings.groupIds, group.id],
        this.settings.pixelIds = [...withoutGroup, ...group.pixels]
    }

    // Remove all of a group's pixels from the mapping
    removeGroup(group) {
        if (!this.settings.groupIds.includes(group.id))
            return;

        const groupPixels = new Set(group.pixels);

        this.settings.groupIds = this.settings.groupIds.filter(gid => gid !== group.id);
        this.settings.pixelIds = this.settings.pixelIds.filter(i => !groupPixels.has(i));
    }

    /*
     * Serialization
     */

    serialize() {
        return this.settings;
    }

    static deserialize(attrs) {
        return new LinearMapping(attrs);
    }
}
