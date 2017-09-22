import Vue from 'vue';

import Util from 'chl/util';
import Const from 'chl/const';

import GraphLib, { Graph } from 'chl/graphlib';
import { getMappedPoints, convertPointCoords } from 'chl/mapping';
import { currentModel } from 'chl/model';
import { CRGB } from 'chl/fastled/color';

import store from 'chl/vue/store';

store.registerModule('pattern', {
    namespaced: true,
    state: {
        patterns: {},
        cur_pattern_id: null,
    },

    mutations: {
        create(state, { id, name }) {
            let mapping_type = Const.default_map_type;
            let coord_type = Const.default_coord_type;
            let pixel_stage = new Graph();

            pixel_stage.addGlobalInput('coords');
            pixel_stage.addGlobalInput('t');
            pixel_stage.addGlobalInput('color');
            pixel_stage.addGlobalOutput('outcolor');

            let input_node = pixel_stage.addNode(`mapping/${mapping_type}/${coord_type}`, {title: 'input'});
            pixel_stage.addNode('lowlevel/output/color', {
                title: 'output',
                pos: [300, 100]
            });

            let pattern = {
                id,
                name,
                mapping_type,
                coord_type, // hmm
                input_node: input_node.id,
                stages: {
                    pixel: pixel_stage.id,
                },
            };

            Vue.set(state.patterns, pattern.id, pattern);
            if (state.cur_pattern_id === null) {
                state.cur_pattern_id = pattern.id;
            }
        },
        set_current(state, { id }) {
            state.cur_pattern_id = id;
        },

        set_coord_type(state, { id, mapping_type, coord_type }) {
            let pattern = state.patterns[id];
            let graph = GraphLib.graphById(pattern.stages.pixel);

            let old_input = graph.getNodeById(pattern.input_node);
            graph.removeNode(old_input);

            let path = `mapping/${mapping_type}/${coord_type}`;
            let input_node = graph.addNode(path, {title: 'input'});

            pattern.input_node = input_node.id;
            pattern.mapping_type = mapping_type;
            pattern.coord_type = coord_type;

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

export function runPattern(pattern, mapping) {
    let graph = GraphLib.graphById(pattern.stages.pixel);
    let mapped_points = getMappedPoints(mapping, pattern.coord_type);
    let positions = convertPointCoords(pattern.mapping_type, pattern.coord_type, mapped_points);

    function computePatternFrame(t) {
        graph.setGlobalInputData('t', t);
        positions.forEach((pos, idx) => {
            let dc = currentModel.getDisplayColor(idx);
            let incolor = new CRGB(dc[0], dc[1], dc[2]);
            graph.setGlobalInputData('coords', pos.toArray());
            graph.setGlobalInputData('color', incolor);
            graph.runStep();
            let outcolor = graph.getGlobalOutputData('outcolor');
            currentModel.setDisplayColor(idx, outcolor.r, outcolor.g, outcolor.b);
        });
        currentModel.updateColors();
    }

    return computePatternFrame;
};
