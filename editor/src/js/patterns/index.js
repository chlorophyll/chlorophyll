import Vue from 'vue';

import Util from 'chl/util';
import Const from 'chl/const';

import { Graph } from 'chl/graphlib/graph';

import store, { newgid } from 'chl/vue/store';

store.registerModule('pattern', {
    namespaced: true,
    state: {
        patterns: {},
        cur_pattern_id: null,
    },

    mutations: {
        create(state, { id }) {
            let pattern = create_pattern(id);
            Vue.set(state.patterns, pattern.id, pattern);
            if (state.cur_pattern_id === null) {
                state.cur_pattern_id = pattern.id;
            }
        },
        set_current(state, { id }) {
            state.cur_pattern_id = id;
        }
    },

    getters: {
        cur_pattern(state) {
            if (state.cur_pattern_id === null)
                return null;
            return state.patterns[state.cur_pattern_id];
        },
        pattern_list(state) {
            return Object.values(state.patterns);
        },
        unique_name(state, getters) {
            let names = getters.pattern_list.map((pattern) => pattern.name);
            return Util.uniqueName('pattern-', names);
        }
}
});

function create_pattern(id) {
    let time = 0;

    let name = store.getters['pattern/unique_name'];

    let mapping_type = Const.default_map_type;
    let coord_type = Const.default_coord_type;
    let pixel_stage = new Graph();

    pixel_stage.addGlobalInput('coords');
    pixel_stage.addGlobalInput('t');
    pixel_stage.addGlobalInput('color');
    pixel_stage.addGlobalOutput('outcolor');

    let map_input = pixel_stage.addNode(`lowlevel/input/${coord_type}`, {title: 'input'});
    pixel_stage.addNode('lowlevel/output/color', {
        title: 'output',
        pos: [300, 100]
    });


    return {
        id,
        name,
        time,
        mapping_type,
        coord_type, // hmm
        stages: {
            pixel: pixel_stage.id,
        },
        map_input: map_input.id,
    };
}

export function run_pattern(pattern, mapping) {
    return;
};
