import 'chl/testing';
import { model_json } from 'chl/testing/fixtures';
import { saveGroup } from 'chl/model';
import { SchemaDefs } from 'chl/schemas';

import store from 'chl/vue/store';


beforeAll(() => {
    return store.dispatch('pixels/create_group', {
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
});
