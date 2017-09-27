import 'chl/testing';
import 'chl/patterns';
import 'chl/graphlib';

import { createSaveObject } from 'chl/savefile';
import { mappingTypes } from 'chl/mapping';
import { initModelFromJson } from 'chl/model';
import { SchemaDefs } from 'chl/schemas';

import store from 'chl/vue/store';


const model_json = JSON.stringify({
    'strips': [
        [
            [1,1,1],
            [1,1,2],
            [1,1,3],
        ],
        [
            [2,1,1],
            [2,1,2],
            [2,1,3],
        ],
        [
            [3,1,1],
            [3,1,2],
            [3,1,3],
        ],
    ]
});

describe('savefile', () => {
    beforeAll(() => {
        initModelFromJson(model_json);

        store.commit('pattern/create', {
            id: 0,
            name: 'pattern 1'
        });
        id++;

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
            id++;
        }
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

