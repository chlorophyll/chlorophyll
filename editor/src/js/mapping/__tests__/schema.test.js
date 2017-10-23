import store from 'chl/vue/store';

import { SchemaDefs } from 'chl/schemas';
import { mappingTypes } from '@/common/mapping';
import { saveMapping, saveAllMappings } from 'chl/mapping';

import 'chl/testing';

let num_mapping_types = 0;

beforeAll(() => {
    let id = 0;
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


describe('Mapping module', () => {
    it('saves every map type according to the schema', () => {
        for (let id of store.state.mapping.mapping_list) {
            const mapping = store.state.mapping.mappings[id];
            const mapping_saved = saveMapping(mapping);
            expect(mapping_saved).toMatchSchema(SchemaDefs.object('mapping'));
        }
    });

    it("correctly restores a saved snapshot", () => {
        let saved = saveAllMappings();

        for (let id = 0; id < num_mapping_types; id++) {
            store.commit('mapping/delete', { id });
        }
        expect(store.state.mapping.mapping_list.length).toEqual(0);

        store.commit('mapping/restore', saved);

        expect(store.state.mapping.mapping_list.length).toEqual(num_mapping_types);
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
    });

});
