import Vue from 'vue';

import store from 'chl/vue/store';
import ColorPool from 'chl/colors';
import { screenManager } from 'chl/init';

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
        mappedPoints(state, getters) {
            // TODO precompute then map points
            return (id, coord_type) => {
                // 1. lookup
                // 2. precompute
                // 3. mapPoint
                return [];
            };
        },
    },
});

/*
 * Utility mixin for Vue components that need to reference groups & mappings
 */
export const mappingUtilsMixin = {
    data() {
        return {
            mapping_types: {
                projection: '2D Projection',
                transform: '3D Transform',
            }
        };
    },
    methods: {
        mappingDisplayName(type) {
            const names = {
                'projection': '2D Projection',
                'transform': '3D Transform',
            };
            return names[type];
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
        }
    }
};

/*
 * Generic Mapping class.
 *
 * Provides a common interface to list types of mapping transformations and
 * generate sets of points from them.
 */
export default function Mapping(manager, group, id, initname) {
    let self = this;

    this.widget = null;
    this.configuring = false;
    this.normalize = true;

    /*
     * To be provided by mapping subclasses:
     */
    this.showConfig = null;
    this.hideConfig = null;
    this.type = '';
    this.display_name = 'Unknown Type';
    // coord_types describes each type of transformation the mapping supports,
    // in the form: { uniqueidentifier: { name: ..., mapPoint: ...}, ... }
    this.coord_types = {};

    Object.defineProperty(this, 'coord_type_menu', {
        get: function() {
            let menu = {};
            for (let type in self.coord_types) {
                if (self.coord_types[type] !== undefined)
                    menu[self.coord_types[type].name] = type;
            }
            return menu;
        }
    });

    this.getPositions = function(type) {
        if (!(type in self.coord_types)) {
            console.error('No such mapping type: ' + type);
            return;
        }
        let mapFn = self.coord_types[type].mapPoint;
        return group.pixels.map(function(idx) {
            return [idx, mapFn(idx)];
        });
    };

    /*
     * Returns a serialized object containing an array of mapped points for
     * each coordinate type the mapping supports, keyed by coord type.
     */
    this.allMappedPoints = function() {
        let mapped = {};
        for (let type in self.coord_types) {
            if (self.coord_types.hasOwnProperty(type)) {
                mapped[type] = self.getPositions(type);
            }
        }
        return mapped;
    };
}
