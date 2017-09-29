import Vue from 'vue';
import Vuex from 'vuex';

import { registerSaveField } from 'chl/savefile';

Vue.use(Vuex);

const selectionStore = {
    namespaced: true,
    state: {
        active: [],
    },
    mutations: {
        clear(state) {
            state.active = [];
        },
        set(state, sel) {
            state.active = sel;
        }
    }
};

registerSaveField('next_guid', {
    save() {
        return store.state.next_guid;
    },
    restore(next_guid) {
        store.commit('set_next_guid', { next_guid });
    }
});

const store = new Vuex.Store({
    modules: {
        selection: selectionStore,
    },
    state: {
        /*
         * Things should probably live in the global store if:
         *
         *  - It needs to wind up in the save file
         *  - It needs to be shared between >=2 top level components
         *
         * Things should probably live in a component if:
         *
         *  - It's a piece of transient UI state like a partially filled out
         *      but unsubmitted config menu, or an in-progress selection
         *  - It's only used within a component, even if used by multiple
         *      children of that component - these should be handled locally
         *      via props/events rather than cluttering global state.
         *
         * These are each an immutable object for now to make the vuex
         * transition easier. They should be gradually replaced with
         * finer-grained objects.
         */
        next_guid: 0,
        has_current_model: false,
    },
    mutations: {
        guid_increment(state) {
            state.next_guid++;
        },
        set_next_guid(state, { next_guid }) {
            state.next_guid = next_guid;
        },
        update_model(state, val) {
            state.has_current_model = val;
        },
    }
});

export default store;
export function newgid(context={}) {
    const commit = context.commit || store.commit;
    const rootState = context.rootState || store.state;
    commit('guid_increment', null, { root: true });
    return rootState.next_guid;
}
