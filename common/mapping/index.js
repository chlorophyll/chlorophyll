import clone from 'clone';
import * as assert from 'assert';
import ProjectionMapping from './projection';
import TransformMapping from './transform';
import LinearMapping from './linear';

export const mappingTypes = {
    linear: LinearMapping,
    projection: ProjectionMapping,
    transform: TransformMapping
};

export function defaultSettings(type) {
    const Mapping = mappingTypes[type];
    assert.ok(Mapping);

    return new Mapping().serialize();
}

/*
 * Hopefully temporary.
 * Take a UI-style mapping blob and construct a PixelMapping.
 */
export function createFromConfig(config) {
    const Mapping = mappingTypes[config.type];
    assert.ok(Mapping);
    assert.ok(config.settings);

    return Mapping.deserialize(config.settings);
}

// TODO move methods like this into a common base mapping class
export function mappingHasView(mapping, viewName) {
    const views = mapping.constructor.views;
    return views.some(v => v.className === viewName);
}

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
