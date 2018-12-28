import Vue from 'vue';
import clone from 'clone';

import Util from 'chl/util';
import Const from 'chl/const';

import GraphLib from '@/common/graphlib';

import store, { newgid } from 'chl/vue/store';

import { Graph } from 'chl/graphlib';
import { restoreAllPatterns, restorePlaylistItems } from '@/common/patterns';
import { mappingTypes } from '@/common/mapping';
import { registerSaveField } from 'chl/savefile';

import register_nodes from '@/common/nodes/registry';

register_nodes();

store.registerModule('pattern', {
    namespaced: true,
    state: {
        patterns: {},
        pattern_ordering: [],
        cur_pattern_id: null,
    },

    mutations: {
        add(state, pattern) {
            Vue.set(state.patterns, pattern.id, pattern);
            state.pattern_ordering.push(pattern.id);
        },
        clear_patterns(state) {
            state.patterns = {};
            state.pattern_ordering = [];
            state.cur_pattern_id = null;
        },
        set_current(state, { id }) {
            state.cur_pattern_id = id;
        },

        set_coord_type(state, { id, mapping_type, coord_type }) {
            const pattern = state.patterns[id];
            pattern.mapping_type = mapping_type;
            pattern.coord_type = coord_type;
        },

        delete(state, { id }) {
            let pattern = state.patterns[id];

            if (pattern === undefined)
                return;

            Vue.delete(state.patterns, id);
            state.pattern_ordering.splice(state.pattern_ordering.indexOf(id), 1);
            if (state.cur_pattern_id == id) {
                state.cur_pattern_id = null;
            }
        },

        set_name(state, { id, name }) {
            let pattern = state.patterns[id];
            if (pattern === undefined)
                return;

            pattern.name = name;
        },

        restore(state, snapshot) {
            const { new_patterns, new_pattern_ordering } = restoreAllPatterns(snapshot);
            state.patterns = new_patterns;
            state.pattern_ordering = new_pattern_ordering;
            state.cur_pattern_id = null;
        }
    },
    getters: {
        cur_pattern(state) {
            if (state.cur_pattern_id === null)
                return null;
            return state.patterns[state.cur_pattern_id];
        },
        pattern_list(state) {
            return state.pattern_ordering.map((id) => state.patterns[id]);
        },
    },
    actions: {
    }
});

store.registerModule('playlists', {
    namespaced: true,
    state: {
        playlistItems: [],
    },

    mutations: {
        update(state, items) {
            state.playlistItems = [...items];
        },
        restore(state, snapshot) {
            state.playlistItems = restorePlaylistItems(snapshot);
        },
        updateItem(state, {index, ...updates}) {
            console.log(index, updates);
            const cur = state.playlistItems[index];
            const newItem = {
                ...cur,
                ...updates,
            };
            console.log(newItem);
            Vue.set(state.playlistItems, index, newItem);
        },
        deleteItem(state, {index}) {
            state.playlistItems.splice(index, 1);
        }
    },
});


export function setCoordType(id, mapping_type, coord_type) {
    const pattern = store.state.pattern.patterns[id];

    const graph = GraphLib.graphById(pattern.stages.pixel);

    const old_input = graph.getNodeByRef('input_node');
    graph.removeNode(old_input);

    const Mapping = mappingTypes[mapping_type],
          mappingView = new Mapping().getView(coord_type);

    graph.addGlobalInput('coords', mappingView.glslType);

    const path = `mapping/${mapping_type}/${coord_type}`;
    graph.addNode(path, {
        title: 'input',
        ref: 'input_node'
    });

    store.commit('pattern/set_coord_type', { id, mapping_type, coord_type });
}

export function createPattern(id, {name, set_current=true} = {}) {
    const mapping_type = Const.default_map_type;
    const coord_type = Const.default_coord_type;
    const Mapping = mappingTypes[mapping_type],
          mappingView = new Mapping().getView(coord_type);
    name = name || Util.uniqueName('Pattern ', store.getters['pattern/pattern_list']);

    let pixel_stage = new Graph();

    pixel_stage.addGlobalInput('coords', mappingView.glslType);
    pixel_stage.addGlobalInput('t', 'float');
    pixel_stage.addGlobalInput('color', 'CRGB');
    pixel_stage.addGlobalOutput('outcolor', 'CRGB');

    let path = `mapping/${mapping_type}/${coord_type}`;
    pixel_stage.addNode(path, {title: 'input', ref: 'input_node'});

    pixel_stage.addNode('lowlevel/output/color', {
        title: 'output',
        pos: [300, 100]
    });

    const pattern = {
        id,
        name,
        mapping_type,
        coord_type, // hmm
        stages: {
            pixel: pixel_stage.id,
        },
    };
    store.commit('pattern/add', pattern);
    if (set_current) {
        store.commit('pattern/set_current', pattern);
    }
}

export function savePattern(pattern) {
    return clone(pattern);
}


export function saveAllPatterns() {
    let patterns = store.getters['pattern/pattern_list'].map(savePattern);
    return patterns;
}

export function copyPattern(pattern, { set_current=true } = {}) {
    let { mapping_type, coord_type } = pattern;
    let pixel_stage = GraphLib.graphById(pattern.stages.pixel).copy();
    let id = newgid();
    let name = Util.copyName(pattern.name);

    const copied = {
        id,
        name,
        mapping_type,
        coord_type,
        stages: {
            pixel: pixel_stage.id,
        },
    };

    store.commit('pattern/add', copied);
    if (set_current) {
        store.commit('pattern/set_current', copied);
    }
}

registerSaveField('patterns', {
    save() {
        return saveAllPatterns();
    },
    restore(patterns) {
        store.commit('pattern/restore', patterns);
    }
});

export function savePlaylistItems() {
    const playlistItems = store.state.playlists.playlistItems;
    return clone(playlistItems);
}

registerSaveField('playlistItems', {
    save() {
        const ret = savePlaylistItems();
        return ret;
    },
    restore(snap) {
        store.commit('playlists/restore', snap);
    },
});

export const patternUtilsMixin = {
    methods: {
        getPattern(id) {
            if (id in this.$store.state.pattern.patterns) {
                return this.$store.state.pattern.patterns[id];
            } else {
                return null;
            }
        },
    }
};
