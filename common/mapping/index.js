import clone from 'clone';
import * as ProjectionMapping from './projection';
import * as TransformMapping from './transform';
import LinearMapping from './linear';

function coordInfo(map_type, coordType) {
    return mappingTypes[map_type].coord_types[coordType];
}

export const mappingTypes = {
    linear: LinearMapping,
    projection: ProjectionMapping,
    transform: TransformMapping
};

/*
        display_name: '2D Projection',
        coord_types: Projection.coord_types,
        glsl_type: 'vec2',
        glsl_swizzle: 'xy',
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
        glsl_type: 'vec3',
        glsl_swizzle: 'xyz',
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
*/

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

export function getMappedPoints(model, mapping, group, coordType) {
    const typeInfo = coordInfo(mapping.type, coordType);

    const pixels = model.getGroupPixels(group.id);

    let settings;
    if (typeInfo.precompute)
        settings = typeInfo.precompute(mapping.settings);
    else
        settings = mapping.settings;

    return pixels.map(({idx, pos}, groupIdx) => [
        idx,
        typeInfo.mapPoint(settings, pos, groupIdx)
    ]);
}

export function convertPointCoords(map_type, coordType, points) {
    const typeInfo = coordInfo(map_type, coordType);
    const coordSpec = typeInfo.coords;

    const dim = coordSpec.length;

    const converted = points.map(([idx, pos]) => [idx, typeInfo.convertCoords(pos)]);
    // No normalized coordinates, we're done.
    if (!coordSpec.some(c => c.normalized))
        return converted;

    const converted_arr = converted.map(([idx, pt]) => [idx, pt.toArray()]);

    // Find the largest-valued normalized coordinate along any axis
    let extent = 0;
    converted_arr.forEach(([idx, pt]) => {
        for (let i = 0; i < dim; i++) {
            if (coordSpec[i].normalized) {
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
            if (coordSpec[i].normalized) {
                norm_pt[i] *= norm_factor;
            }
        }
        return [idx, pt.fromArray(norm_pt)];
    });
}
