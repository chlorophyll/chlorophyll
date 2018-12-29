import Vue from 'vue';
import _ from 'lodash';
import clone from 'clone';

import store from 'chl/vue/store';
import { mappingTypes, restoreAllMappings } from '@/common/mapping';
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
            const MapConstructor = mappingTypes[params.type];

            const defaults = {
                id: params.id,
                name: `Mapping ${params.id}`,
                type: params.type,
                settings: new MapConstructor().serialize()
            };
            Vue.set(state.mappings, params.id, {...defaults, ...params, group: undefined});
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

            if (!mappingTypes[type]) {
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
            const { new_mappings, new_mapping_list } = restoreAllMappings(mappings);
            state.mappings = new_mappings;
            state.mapping_list = new_mapping_list;
        }
    },
    getters: {
        mapping_list(state) {
            return state.mapping_list.map((id) => state.mappings[id]);
        },
    },
});


export function saveMapping(mapping) {
    let out = clone(mapping);
    delete out.group;
    return out;
}

export function saveAllMappings() {
    return store.getters['mapping/mapping_list'].map(saveMapping);
}

registerSaveField('mappings', {
    save() {
        return saveAllMappings();
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
            types[prop] = mappingTypes[prop].displayName;

        return {
            mapping_types: types
        };
    },
    computed: {
        mappingsByType() {
            const mapping_list = this.$store.getters['mapping/mapping_list'];
            const grouped = _.groupBy(mapping_list, item => item.type);
            for (const type in mappingTypes) {
                if (grouped[type] === undefined) {
                    grouped[type] = [];
                }
            }
            return grouped;
        },
    },
    methods: {
        mappingDisplayName(type) {
            return mappingTypes[type].displayName;
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
