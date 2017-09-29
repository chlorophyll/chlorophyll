import Vue from 'vue';

import Util from 'chl/util';
import Const from 'chl/const';

import GraphLib, { Graph } from 'chl/graphlib';
import { getMappedPoints, convertPointCoords } from 'chl/mapping';
import { CRGB } from 'chl/fastled/color';
import { registerSaveField } from 'chl/savefile';

import store, { newgid } from 'chl/vue/store';

import register_nodes from 'chl/patterns/registry';

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

        set_current(state, { id }) {
            state.cur_pattern_id = id;
        },

        set_coord_type(state, { id, input_id, mapping_type, coord_type }) {
            const pattern = state.patterns[id];
            pattern.input_node = input_id;
            pattern.mapping_type = mapping_type;
            pattern.coord_type = coord_type;
        },

        delete(state, { id }) {
            let pattern = state.patterns[id];

            if (pattern === undefined)
                return;

            Vue.delete(state.patterns, id);
            state.pattern_ordering.splice(state.pattern_ordering.indexOf(id), 1);
        },

        restore(state, snapshot) {
            let new_patterns = {};
            let new_pattern_ordering = [];

            for (let pattern of snapshot.patterns) {
                new_patterns[pattern.id] = restorePattern(pattern);
                new_pattern_ordering.push(pattern.id);
            }
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

export function setCoordType(id, mapping_type, coord_type) {
    const pattern = store.state.pattern.patterns[id];

    const graph = GraphLib.graphById(pattern.stages.pixel);

    const old_input = graph.getNodeByRef('input_node');
    graph.removeNode(old_input);

    const path = `mapping/${mapping_type}/${coord_type}`;
    const input_id = newgid();
    const input_node = graph.addNode(path, {
        id: input_id,
        title: 'input',
        ref: 'input_node'
    });

    store.commit('pattern/set_coord_type', { id, input_id, mapping_type, coord_type });
}

export function createPattern(id, name, {set_current=true} = {}) {
    const mapping_type = Const.default_map_type;
    const coord_type = Const.default_coord_type;

    const graphid = newgid();
    let pixel_stage = new Graph(graphid);

    pixel_stage.addGlobalInput('coords');
    pixel_stage.addGlobalInput('t');
    pixel_stage.addGlobalInput('color');
    pixel_stage.addGlobalOutput('outcolor');

    let path = `mapping/${mapping_type}/${coord_type}`;
    const input_id = newgid();
    pixel_stage.addNode(path, {title: 'input', ref: 'input_node'});

    const output_id = newgid();
    pixel_stage.addNode('lowlevel/output/color', {
        id: output_id,
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
    return Util.clone(pattern);
}

export function restorePattern(patternsnap) {
    return Util.clone(patternsnap);
}

export function saveAllPatterns() {
    let patterns = store.getters['pattern/pattern_list'].map(savePattern);
    return { patterns };
}

registerSaveField('patterns', {
    save() {
        return store.getters['pattern/pattern_list'].map(savePattern);
    },
    restore(patterns) {
        store.commit('pattern/restore', { patterns });
    }
});

export class PatternRunner {
    constructor(pattern, mapping) {
        const { coord_type, mapping_type } = pattern;
        const mapped_points = getMappedPoints(mapping, coord_type);

        this.positions = convertPointCoords(mapping_type, coord_type, mapped_points);
        this.graph = GraphLib.graphById(pattern.stages.pixel);
    }

    getFrame(prevbuf, outbuf, t) {
        this.graph.setGlobalInputData('t', t);
        this.positions.forEach(([idx, pos]) => {
            let incolor = new CRGB(
                prevbuf[3*idx+0],
                prevbuf[3*idx+1],
                prevbuf[3*idx+2]
            );

            this.graph.setGlobalInputData('coords', pos.toArray());
            this.graph.setGlobalInputData('color', incolor);
            this.graph.runStep();
            let outcolor = this.graph.getGlobalOutputData('outcolor');

            outbuf[3*idx+0] = outcolor.r;
            outbuf[3*idx+1] = outcolor.g;
            outbuf[3*idx+2] = outcolor.b;
        });
    }
}

export const RunState = {
    Stopped: 0,
    Running: 1,
    Paused: 2,
};

export let PatternPreview = Vue.component('pattern-preview', {
    props: ['model', 'pattern', 'mapping', 'runstate'],
    data() {
        return {
            buf_idx: 0,
            time: 0,
            request_id: null,
        };
    },

    computed: {
        step() {
            let runner = new PatternRunner(this.pattern, this.mapping);
            let prevbuf = new Uint8Array(3*this.model.num_pixels);
            let curbuf = new Uint8Array(3*this.model.num_pixels);

            return () => {
                runner.getFrame(prevbuf, curbuf, this.time);
                this.model.setFromBuffer(curbuf);
                [prevbuf, curbuf] = [curbuf, prevbuf];
                this.time++;
            };
        },
        running() {
            return this.runstate == RunState.Running;
        }
    },

    watch: {
        runstate(newval) {
            switch (newval) {
                case RunState.Stopped:
                    this.stop();
                    break;
                case RunState.Paused:
                    this.pause();
                    break;
                case RunState.Running:
                    this.start();
                    break;
            }
        }
    },

    render() {},

    methods: {
        run() {
            this.step();
            if (this.running)
                this.request_id = window.requestAnimationFrame(() => this.run());
        },
        start() {
            this.model.display_only = true;
            this.run();
        },
        pause() {
            if (this.request_id !== null) {
                window.cancelAnimationFrame(this.request_id);
            }
            this.request_id = null;
        },
        stop() {
            this.pause();
            this.model.display_only = false;
            this.time = 0;
        }
    }
});
