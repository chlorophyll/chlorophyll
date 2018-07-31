import Vue from 'vue';
import clone from 'clone';

import Util from 'chl/util';
import Const from 'chl/const';

import GraphLib from '@/common/graphlib';

import store, { newgid } from 'chl/vue/store';

import { Graph } from 'chl/graphlib';
import { restoreAllPatterns } from '@/common/patterns';
import { PatternRunner } from 'chl/patterns/runner';
import { mappingTypes } from '@/common/mapping';
import { currentModel } from 'chl/model';
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

export function setCoordType(id, mapping_type, coord_type) {
    const pattern = store.state.pattern.patterns[id];

    const graph = GraphLib.graphById(pattern.stages.pixel);

    const old_input = graph.getNodeByRef('input_node');
    graph.removeNode(old_input);

    graph.addGlobalInput('coords', mappingTypes[mapping_type].glsl_type);

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
    name = name || Util.uniqueName('Pattern ', store.getters['pattern/pattern_list']);

    let pixel_stage = new Graph();

    pixel_stage.addGlobalInput('coords', mappingTypes[mapping_type].glsl_type);
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

export const RunState = {
    Stopped: 0,
    Running: 1,
    Paused: 2,
};

export let PatternPreview = Vue.component('pattern-preview', {
    props: ['pattern', 'mapping', 'group', 'runstate'],
    data() {
        return {
            time: 0,
            request_id: null,
            runner: null,
        };
    },

    computed: {
        step() {
            return (time) => {
                const current = this.runner.step(time);
                currentModel.setFromTexture(current);
            };
        },
        running() {
            return this.runstate == RunState.Running;
        },
        runnerParams() {
            return {
                pattern: this.pattern,
                group: this.group,
                mapping: this.mapping,
            };
        },
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
        },
        runnerParams(newval) {
            this.createRunner();
        }
    },

    render() {},

    methods: {
        run() {
            if (!this.runner) {
                this.createRunner();
            }
            this.step(this.time);
            this.time++;
            if (this.running)
                this.request_id = window.requestAnimationFrame(() => this.run());
        },
        start() {
            currentModel.display_only = true;
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
            currentModel.display_only = false;
            this.time = 0;
        },
        createRunner() {
            const {pattern, group, mapping} = this;
            this.runner = new PatternRunner(currentModel, pattern, group, mapping);
        }
    }
});
