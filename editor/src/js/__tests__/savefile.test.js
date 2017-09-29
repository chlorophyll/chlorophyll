import 'chl/testing';
import { createPattern } from 'chl/patterns';
import 'chl/graphlib';

import { model_json } from 'chl/testing/fixtures';

import { createSaveObject } from 'chl/savefile';
import { mappingTypes } from 'chl/mapping';
import { Model, setCurrentModel } from 'chl/model';
import { SchemaDefs } from 'chl/schemas';

import store from 'chl/vue/store';



describe('savefile', () => {
    beforeAll(() => {
        let model = new Model(model_json);
        setCurrentModel(model);

        createPattern(0, 'pattern 1');

        id++;

        let group = store.dispatch('pixels/create_group', {
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
            id++;
        }

        return group;
    });

    it('creates a save file conforming to the schema', () => {
        let save = createSaveObject();
        expect(save).toMatchSchema(SchemaDefs.definition('chlorophyllSavefile'));
    });

    //afterAll(() => {
    //    store.commit('pattern/delete', { id: 0 });
    //    store.commit('mapping/delete', { id: 1 });

    //    let id = 2;
    //    for (let type in mappingTypes) {
    //        store.commit('mapping/delete', { id });
    //        id++;
    //    }
    //});
});

