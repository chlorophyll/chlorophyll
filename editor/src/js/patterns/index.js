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

            let path = `mapping/${mapping_type}/${coord_type}`;
            let input_node = pixel_stage.addNode(path, {title: 'input'});

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

export function makePatternRunner(pattern, mapping) {
    let graph = GraphLib.graphById(pattern.stages.pixel);
    let mapped_points = getMappedPoints(mapping, pattern.coord_type);
    let positions = convertPointCoords(pattern.mapping_type, pattern.coord_type, mapped_points);

    return function(prevbuf, outbuf, t) {
        graph.setGlobalInputData('t', t);
        positions.forEach(([idx, pos]) => {
            let incolor = new CRGB(prevbuf[3*idx+0], prevbuf[3*idx+1], prevbuf[3*idx+2]);

            graph.setGlobalInputData('coords', pos.toArray());
            graph.setGlobalInputData('color', incolor);
            graph.runStep();
            let outcolor = graph.getGlobalOutputData('outcolor');

            outbuf[3*idx+0] = outcolor.r;
            outbuf[3*idx+1] = outcolor.g;
            outbuf[3*idx+2] = outcolor.b;
        });
    };
}

export class PatternPreview {
    constructor(model, pattern, mapping) {
        let buf1 = new Uint8Array(3*model.num_pixels);
        let buf2 = new Uint8Array(3*model.num_pixels);

        this.buffers = [buf1, buf2];
        this.buf_idx = 0;
        this.model = model;

        this.getFrame = makePatternRunner(pattern, mapping);
        this.time = 0;

        this.running = false;
        this.request_id = null;
    }

    get prevbuf() {
        return this.buffers[1-this.buf_idx];
    }

    get curbuf() {
        return this.buffers[this.buf_idx];
    }

    step() {
        this.getFrame(this.prevbuf, this.curbuf, this.time);
        this.model.setFromBuffer(this.curbuf);
        this.buf_idx = 1-this.buf_idx;
        this.time++;
    }

    run() {
        this.step();
        if (this.running)
            this.request_id = window.requestAnimationFrame(() => this.run());
    }

    start() {
        this.running = true;
        this.run();
    }

    stop() {
        this.running = false;
        if (this.request_id) {
            window.cancelAnimationFrame(this.request_id);
        }

        this.request_id = null;
    }

}
