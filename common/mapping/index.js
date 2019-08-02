import * as assert from 'assert';
import ProjectionMapping from './projection';
import TransformMapping from './transform';
import LinearMapping from './linear';
import UVMapping from './uv';
import {restoreAll} from '../util/serialization';

export const mappingTypes = {
    linear: LinearMapping,
    projection: ProjectionMapping,
    transform: TransformMapping,
    uv: UVMapping
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
    console.log('checking views', mapping.constructor.views, 'for view:', viewName);
    const views = mapping.constructor.views;
    return views.some(v => v.className === viewName);
}

export function restoreAllMappings(snapshot) {
    const {resourcesById, idList} = restoreAll(snapshot);
    return {
        new_mappings: resourcesById,
        new_mapping_list: idList
    };
}
