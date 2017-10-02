import 'chl/testing';
import 'chl/graphlib';
import 'chl/mapping';

import store from 'chl/vue/store';

import { createPattern } from 'chl/patterns';

import { model_json } from 'chl/testing/fixtures';

import { createSaveObject } from 'chl/savefile';
import { mappingTypes } from '@/common/mapping';
import { Model, createGroup, setCurrentModel } from 'chl/model';
import { SchemaDefs } from 'chl/schemas';




describe('savefile', () => {
    beforeAll(() => {
        let model = new Model(model_json);
        setCurrentModel(model);

        createPattern(0, 'pattern 1');

        id++;

        createGroup({
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

});

