import Vue from 'vue';

import clone from 'clone';

import store from 'chl/vue/store';
import { mappingTypes, restoreMapping, restoreMappings } from '@/common/mapping';
import { registerSaveField } from 'chl/savefile';

/*
 * Vuex store for mapping data
 */
store.registerModule('mapping', {
    namespaced: true,
    state: {
        /*
         * Keep both an id->object map and an array of all active IDs, to
         * keep ordering consistent when querying lists etc.
         */
        mappings: {},
        mapping_list: [],
    },
    mutations: {
        clear_mappings(state) {
            state.mappings = {};
            state.mapping_list = [];
        },
        create_mapping(state, params) {
            const defaults = {
                id: params.id,
                name: `Mapping ${params.id}`,
                group: -1,
                type: params.type,
                settings: mappingTypes[params.type].defaultSettings(),
            };
            Vue.set(state.mappings, params.id, {...defaults, ...params});
            state.mapping_list.push(params.id);
        },
        update_mapping(state, {id, props}) {
            const mapping = state.mappings[id];
            Vue.set(state.mappings, id, {...mapping, ...props});
        },
        set_mapping_type(state, {id, type}) {
            if (state.mappings[id] === undefined ||
                state.mappings[id].type === type) {
                return;
            }
            let type_info = mappingTypes[type];
            if (type_info === undefined) {
                console.error('Invalid mapping type: ', type);
                return;
            }

            let settings = mappingTypes[type].defaultSettings();

            Vue.set(state.mappings[id], 'type', type);
            Vue.set(state.mappings[id], 'settings', settings);
        },
        delete(state, {id}) {
            if (state.mappings[id] !== undefined) {
                Vue.delete(state.mappings, id);
                state.mapping_list.splice(state.mapping_list.indexOf(id), 1);
            }
        },
        restore(state, mappings) {
            restoreMappings(state, mappings);
        }
    },
    getters: {
        mapping_list(state) {
            return state.mapping_list.map((id) => state.mappings[id]);
        },
    },
});


export function saveMapping(mapping) {
    return clone(mapping);
}

registerSaveField('mappings', {
    save() {
        return store.getters['mapping/mapping_list'].map(saveMapping);
    },
    restore(mappings) {
        store.commit('mapping/restore', mappings);
    }
});

/*
 * Utility mixin for Vue components that need to reference groups & mappings
 */
export const mappingUtilsMixin = {
    data() {
        // Generate a list for use in UI selectors
        const types = {};
        for (const prop in mappingTypes)
            types[prop] = mappingTypes[prop].display_name;

        return {
            mapping_types: types
        };
    },
    methods: {
        mappingDisplayName(type) {
            return mappingTypes[type].display_name;
        },
        getGroup(id) {
            if (id in this.$store.state.pixels.groups) {
                return this.$store.state.pixels.groups[id];
            } else {
                return null;
            }
        },
        getMapping(id) {
            if (id in this.$store.state.mapping.mappings) {
                return this.$store.state.mapping.mappings[id];
            } else {
                return null;
            }
        },
        copyMappingSettings(mapping) {
            return clone(mapping.settings);
        },
    }
};
