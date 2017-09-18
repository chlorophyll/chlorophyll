import Vue from 'vue';

import store from 'chl/vue/store';
import ColorPool from 'chl/colors';

import * as Projection from './projection';
import * as Transform from './transform';

const mappingTypes = {
    projection: {
        display_name: '2D Projection',
        coord_types: Projection.coord_types,
    },
    transform: {
        display_name: '3D Transform',
        coord_types: Transform.coord_types,
    },
};

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
        groups: {},
        group_list: [],
        mappings: {},
        mapping_list: [],
    },
    mutations: {
        create_group(state, params) {
            const defaults = {
                id: params.id,
                name: `Group ${params.id}`,
                color: ColorPool.random(),
                pixels: [],
                visible: true
            };
            Vue.set(state.groups, params.id, {...defaults, ...params});
            state.group_list.push(params.id);
        },
        update_group(state, {id, props}) {
            const group = state.groups[id];
            Vue.set(state.groups, id, {...group, ...props});
        },
        create_mapping(state, params) {
            const defaults = {
                id: params.id,
                name: `Mapping ${params.id}`,
                group: -1,
                type: '',
                settings: {},
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
            let settings = {};
            // TODO these defaults should probably be provided by backend
            // calls rather than being hardcoded here
            if (type === 'projection') {
                settings = {
                    origin: [0, 0, 0],
                    plane_angle: [0, 0],
                    rotation: 0,
                };
            } else if (type === 'transform') {
                settings = {
                    shape: 'cube',
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    autoscale: true,
                };
            } else {
                console.error('Invalid mapping type: ', type);
                return;
            }
            Vue.set(state.mappings[id], 'type', type);
            Vue.set(state.mappings[id], 'settings', settings);
        },
        delete(state, {id}) {
            if (state.mappings[id] !== undefined) {
                Vue.delete(state.mappings, id);
                state.mapping_list.splice(state.mapping_list.indexOf(id), 1);
            } else if (state.groups[id] !== undefined) {
                Vue.delete(state.groups, id);
                state.group_list.splice(state.group_list.indexOf(id), 1);
            }
        }
    },
    getters: {
        mapping_list(state) {
            return state.mapping_list.map((id) => state.mappings[id]);
        }
    },
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
            if (id in this.$store.state.mapping.groups) {
                return this.$store.state.mapping.groups[id];
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
            const settings = mapping.settings;
            if (mapping.type === 'projection') {
                return {
                    origin: settings.origin.slice(),
                    plane_angle: settings.plane_angle.slice(),
                    rotation: settings.rotation
                };
            } else if (mapping.type === 'transform') {
                return {
                    shape: settings.shape,
                    position: settings.position.slice(),
                    rotation: settings.rotation.slice(),
                    scale: settings.scale.slice(),
                    autoscale: settings.autoscale
                };
            }
        },
        getMappedPoints(map, coord_type) {
            // Accept an id or the mapping object itself
            let mapping;
            if (map instanceof Number)
                mapping = this.$store.state.mapping.mappings[id];
            else
                mapping = map;

            const type_info = mappingTypes[mapping.type][coord_type];
            const group = this.$store.state.mapping.groups[mapping.group];

            let settings;
            if (type_info.precompute)
                settings = type_info.precompute(mapping.settings);
            else
                settings = mapping.settings;
            return group.pixels.map((idx) => {
                return type_info.mapPoint(settings, idx);
            });
        },
    }
};
