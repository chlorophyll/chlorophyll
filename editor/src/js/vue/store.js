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

registerSaveField('next_guid', () => store.state.next_guid);

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
        next_guid: 0
    },
    mutations: {
        /*
         * Initialize the global state with the provided object.
         * Any properties must be declared above for Vue to track them.
         *
         * Used to set initial values for fields after the root Vue instance
         * has been created, and also temporarily to make vuex and worldState
         * play nicely together until the latter is axed.
         */
        init(state, payload) {
            state = {...state, ...payload};
        },

        guid_increment(state) {
            state.next_guid++;
        },
    }
});

export default store;
export function newgid() {
    store.commit('guid_increment');
    return store.state.next_guid;
}
