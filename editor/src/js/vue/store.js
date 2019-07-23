import Vue from 'vue';
import Vuex from 'vuex';

import { registerSaveField } from 'chl/savefile';

Vue.use(Vuex);

registerSaveField('next_guid', {
    save() {
        return store.state.next_guid;
    },
    restore(next_guid) {
        store.commit('set_next_guid', { next_guid });
    }
});

const store = new Vuex.Store({
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
        current_save_path: null,
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
        set_current_save_path(state, path) {
            state.current_save_path = path;
        }
    }
});

console.log(store);

export default store;

export function newgid(context={}) {
    const commit = context.commit || store.commit;
    const rootState = context.rootState || store.state;
    commit('guid_increment', null, { root: true });
    return rootState.next_guid;
}

export function crud(shortName, idMap, idList, defaultAttrs) {
  return {
    [`clear_${shortName}`]: (state) => {
      state[idMap] = {};
      state[idList] = [];
    },

    [`create_${shortName}`]: (state, attrs) => {
      const defaults = {
        id: attrs.id,
        name: `${shortName} ${attrs.id}`,
        ...defaultAttrs(attrs.id)
      };
      Vue.set(state[idMap], attrs.id, {...defaults, ...attrs});
      state[idList].push(attrs.id);
    },

    [`update_${shortName}`]: (state, {id, attrs}) => {
      Vue.set(state[idMap], id, {...state[idMap][id], ...attrs});
    },

    [`delete_${shortName}`]: (state, {id}) => {
      if (!state[idMap][id])
        return;

      Vue.delete(state[idMap], id);
      state[idList].splice(state[idList].indexOf(id), 1);
    }
  };
}
