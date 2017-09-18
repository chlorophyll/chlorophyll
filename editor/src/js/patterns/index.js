import Const from 'chl/const';
import Vue from 'vue';

import { Graph } from 'chl/graphlib/graph';

import store, { newgid } from 'chl/vue/store';

store.registerModule('pattern', {
    namespaced: true,
    state: {
        patterns: {},
        cur_pattern_id: null,
    },

    mutations: {
        create(state, pattern) {
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
            console.log(state);
            if (state.cur_pattern_id === null)
                return null;
            return state.patterns[state.cur_pattern_id];
        }
}
});

export function create_pattern(name) {
    const id = newgid();
    let time = 0;

    let mapping_type = Const.default_map_type;
    let pixel_stage = new Graph();

    pixel_stage.addGlobalInput('coords');
    pixel_stage.addGlobalInput('t');
    pixel_stage.addGlobalInput('color');
    pixel_stage.addGlobalOutput('outcolor');

    let path = `lowlevel/input/${mapping_type}`;

    let map_input = pixel_stage.addNode(`lowlevel/input/${mapping_type}`, {title: 'input'});
    pixel_stage.addNode('lowlevel/output/color', {
        title: 'output',
        pos: [300, 100]
    });


    store.commit('pattern/create', {
        id,
        name,
        time,
        mapping_type,
        stages: {
            pixel: pixel_stage.id,
        },
        map_input: map_input.id,
    });
}

export function run_pattern(pattern, mapping) {
    return;
};
