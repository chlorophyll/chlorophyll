import 'chl/testing';
import { model_json } from 'chl/testing/fixtures';
import { Model, createGroup, saveGroup } from 'chl/model';
import { SchemaDefs } from 'chl/schemas';

import store from 'chl/vue/store';


beforeAll(() => {
    createGroup({
        id: 1,
        pixels: [1, 2, 3],
    });
});

describe('Model', () => {
    it('saves groups according to the schema', () => {
        const group = store.state.pixels.groups[1];
        const group_saved = saveGroup(group);
        expect(group_saved).toMatchSchema(SchemaDefs.object('group'));
    });

    it('saves the model according to the schema', () => {
        let model = new Model(model_json);
        let model_saved = model.save();
        expect(model_saved).toMatchSchema(SchemaDefs.object('model'));
    });

});
