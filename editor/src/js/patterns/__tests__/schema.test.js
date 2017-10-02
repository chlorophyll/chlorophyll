import store from 'chl/vue/store';
import { SchemaDefs } from 'chl/schemas';
import { createPattern, savePattern, saveAllPatterns } from 'chl/patterns';

import 'chl/testing';

beforeAll(() => {
    createPattern(1, { name: 'pattern 1' });
});

describe('Pattern module', () => {
    it('has patterns that meet the schema', () => {
        let pattern = store.state.pattern.patterns[1];
        let saved = savePattern(pattern);
        expect(saved).toMatchSchema(SchemaDefs.object('patternType'));
    });
    it('can delete patterns', () => {
        createPattern(2, 'pattern 2');
        expect(store.state.pattern.patterns[2]).not.toBeUndefined();
        expect(store.state.pattern.pattern_ordering.length).toEqual(2);

        store.commit('pattern/delete', { id: 2});
        expect(store.state.pattern.patterns[2]).toBeUndefined();
        expect(store.state.pattern.pattern_ordering.length).toEqual(1);
    });
    it('can properly restore patterns', () => {
        let saved = saveAllPatterns();
        store.commit('pattern/delete', { id: 1 });
        expect(store.state.pattern.pattern_ordering.length).toEqual(0);
        expect(store.state.pattern.patterns[1]).toBeUndefined();

        createPattern(2, 'pattern 2');
        expect(store.state.pattern.pattern_ordering.length).toEqual(1);
        expect(store.state.pattern.patterns[2]).not.toBeUndefined();

        store.commit('pattern/restore', saved);

        expect(store.state.pattern.pattern_ordering.length).toEqual(1);
        expect(store.state.pattern.patterns[1]).not.toBeUndefined();
        expect(store.state.pattern.patterns[1].name).toEqual('pattern 1');
        expect(store.state.pattern.patterns[2]).toBeUndefined();
    });
});
