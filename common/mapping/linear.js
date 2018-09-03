import Units from '@/common/units';

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
