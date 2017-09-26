import store from 'chl/vue/store';
import { savePattern } from 'chl/patterns';

import 'chl/testing';

beforeAll(() => {
    store.commit('pattern/create', {
        id: 1,
        name: 'pattern 1'
    });
});

describe('Pattern module', () => {
    it('has patterns that meet the schema', () => {
        let pattern = store.state.pattern.patterns[1];
        let saved = savePattern(pattern);
        expect(saved).toMatchSchema('chlorophyll#/definitions/objects/patternType');
    });
});
