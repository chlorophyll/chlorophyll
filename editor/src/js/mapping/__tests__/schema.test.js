import store from 'chl/vue/store';

import 'chl/testing';

import { mappingTypes, saveGroup, saveMapping } from 'chl/mapping';

beforeAll(() => {
    store.commit('mapping/create_group', {
        id: 1,
        pixels: [1,2,3],
    });

    let id = 2;
    for (let type in mappingTypes) {
        store.commit('mapping/create_mapping', {
            id,
            type,
            group: 1,
        });
    }
});

describe('Mapping module', () => {

    it('saves groups according to the schema', () => {
        const group = store.state.mapping.groups[1];
        const group_saved = saveGroup(group);
        expect(group_saved).toMatchSchema('chlorophyll#/definitions/objects/group');
    });

    it('saves every map type according to the schema', () => {
        for (let id of store.state.mapping.mapping_list) {
            const mapping = store.state.mapping.mappings[id];
            const mapping_saved = saveMapping(mapping);
            expect(mapping_saved).toMatchSchema('chlorophyll#/definitions/objects/mapping');
        }
    });

});
