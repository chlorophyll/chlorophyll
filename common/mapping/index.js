import clone from 'clone';
import * as ProjectionMapping from './projection';
import * as TransformMapping from './transform';
import LinearMapping from './linear';

export const mappingTypes = {
    linear: LinearMapping,
    projection: ProjectionMapping,
    transform: TransformMapping
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
