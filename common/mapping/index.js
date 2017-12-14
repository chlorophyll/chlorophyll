import clone from 'clone';
import * as Projection from './projection';
import * as Transform from './transform';

function coordInfo(map_type, coord_type) {
    return mappingTypes[map_type].coord_types[coord_type];
}

export const mappingTypes = {
    projection: {
        display_name: '2D Projection',
        coord_types: Projection.coord_types,
        defaultSettings() {
            return {
                origin: [0, 0, 0],
                plane_angle: [0, 0],
                rotation: 0,
            };
        },
    },
    transform: {
        display_name: '3D Transform',
        coord_types: Transform.coord_types,
        defaultSettings() {
            return {
                shape: 'cube',
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
                autoscale: true,
            };
        },
    },
};

export function restoreAllMappings(snapshot) {
    let new_mapping_list = [];
    let new_mappings = {};

    for (let mapping of snapshot) {
        new_mappings[mapping.id] = restoreMapping(mapping);
        new_mapping_list.push(mapping.id);
    }
    return { new_mappings, new_mapping_list };
}


export function restoreMapping(mappingsnap) {
    return clone(mappingsnap);
}

export function getMappedPoints(model, mapping, coord_type) {
    const type_info = coordInfo(mapping.type, coord_type);

    const pixels = model.getGroupPixels(mapping.group);

    let settings;
    if (type_info.precompute)
        settings = type_info.precompute(mapping.settings);
    else
        settings = mapping.settings;
    return pixels.map(({idx, pos}) => [idx, type_info.mapPoint(settings, pos)]);
}

export function convertPointCoords(map_type, coord_type, points) {
    const coord_info = coordInfo(map_type, coord_type);
    const coord_spec = coord_info.coords;

    const dim = coord_spec.length;

    const converted = points.map(([idx, pos]) => [idx, coord_info.convertCoords(pos)]);
    const converted_arr = converted.map(([idx, pt]) => [idx, pt.toArray()]);

    // Find the largest-valued normalized coordinate along any axis
    let extent = 0;
    converted_arr.forEach(([idx, pt]) => {
        for (let i = 0; i < dim; i++) {
            if (coord_spec[i].normalized) {
                if (pt[i] > extent)
                    extent = pt[i];
                else if (-pt[i] > extent)
                    extent = -pt[i];
            }
        }
    });

    const norm_factor = (extent != 0) ? 1 / extent : 1;
    return converted.map(([idx, pt]) => {
        const norm_pt = pt.toArray();
        for (let i = 0; i < dim; i++) {
            if (coord_spec[i].normalized) {
                norm_pt[i] *= norm_factor;
            }
        }
        return [idx, pt.fromArray(norm_pt)];
    });
}
