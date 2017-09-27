import store from 'chl/vue/store';

import { SchemaDefs } from 'chl/schemas';
import { getSaveField } from 'js/savefile';
import { mappingTypes, saveGroup, saveMapping } from 'chl/mapping';

import 'chl/testing';

let num_mapping_types = 0;

beforeAll(() => {
    store.commit('mapping/create_group', {
        id: 1,
        pixels: [1,2,3],
    });

    let id = 2;
    for (let type in mappingTypes) {
        num_mapping_types++;
        store.commit('mapping/create_mapping', {
            id,
            type,
            group: 1,
        });
        id++;
    }
});

function saveAllMappings() {
    let groups = getSaveField('groups')();
    let mappings = getSaveField('mappings')();
    return { groups, mappings };
}

describe('Mapping module', () => {

    it('saves groups according to the schema', () => {
        const group = store.state.mapping.groups[1];
        const group_saved = saveGroup(group);
        expect(group_saved).toMatchSchema(SchemaDefs.object('group'));
    });

    it('saves every map type according to the schema', () => {
        for (let id of store.state.mapping.mapping_list) {
            const mapping = store.state.mapping.mappings[id];
            const mapping_saved = saveMapping(mapping);
            expect(mapping_saved).toMatchSchema(SchemaDefs.object('mapping'));
        }
    });

    it("correctly restores a saved snapshot", () => {
        let saved = saveAllMappings();

        store.commit('mapping/delete', {id: 1});
        store.commit('mapping/delete', {id: 2});
        store.commit('mapping/delete', {id: 3});

        expect(store.state.mapping.mapping_list.length).toEqual(0);
        expect(store.state.mapping.group_list.length).toEqual(0);

        store.commit('mapping/restore', saved);

        expect(store.state.mapping.mapping_list.length).toEqual(num_mapping_types);
        expect(store.state.mapping.group_list.length).toEqual(1);
    });

    it("correctly removes objects when restoring", () => {
        let saved = saveAllMappings();

        let id = num_mapping_types + 2;

        store.commit('mapping/create_mapping', {
            id,
            type: 'projection',
            group: 1,
        });

        expect(store.state.mapping.mappings[id]).not.toBeUndefined();
        expect(store.state.mapping.mapping_list.length).toEqual(num_mapping_types+1);

        store.commit('mapping/restore', saved);
        expect(store.state.mapping.mappings[id]).toBeUndefined();

        expect(store.state.mapping.mapping_list.length).toEqual(num_mapping_types);
        expect(store.state.mapping.group_list.length).toEqual(1);

    });

});
