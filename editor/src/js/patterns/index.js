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

        clear(state) {
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

store.registerModule('timeline', {
    namespaced: true,
    state: {
        curTimelineId: null,
        timelineOrder: [],
        timelinesById: {},
        outputsById: {},
        layersById: {},
        clipsById: {},
    },
    mutations: {
        setCurTimelineId(state, timelineId) {
            state.curTimelineId = timelineId;
        },
        addTimeline(state, {timelineId, name}) {
            Vue.set(state.timelinesById, timelineId, {
                id: timelineId,
                name,
                outputOrder: [],
                clipIdSet: {},
            });
            state.timelineOrder.push(timelineId);
        },
        restoreTimelines(state, {timelines}) {
            const timelineOrder = [];
            const timelinesById = {};
            for (const snap of timelines) {
                timelineOrder.push(snap.id);
                const {outputOrder, id, name} = snap;
                const clipIdSet = {};
                for (const clipId of snap.clipIds) {
                    clipIdSet[clipId] = true;
                }

                const timeline = {
                    id,
                    outputOrder,
                    name,
                    clipIdSet: clipIdSet,
                };
                timelinesById[timeline.id] = timeline;
            }
            state.timelineOrder = timelineOrder;
            state.timelinesById = timelinesById;
        },

        setTimelineName(state, {timelineId, name}) {
            const timeline = state.timelinesById[timelineId];
            timeline.name = name;
        },

        restoreOutputs(state, {outputs}) {
            const outputsById = {};
            for (const output of outputs) {
                outputsById[output.id] = output;
            }
            state.outputsById = outputsById;
        },

        restoreLayers(state, {layers}) {
            const layersById = {};
            for (const layer of layers) {
                layersById[layer.id] = layer;
            }
            state.layersById = layersById;
        },

        restoreClips(state, {clips}) {
            const clipsById = {};
            for (const clip of clips) {
                clipsById[clip.id] = clip;
            }
            state.clipsById = clipsById;
        },

        reorderOutputs(state, {timelineId, outputOrder}) {
            state.timelinesById[timelineId].outputOrder = [...outputOrder];
        },
        addOutput(state, {timelineId, output}) {
            Vue.set(state.outputsById, output.id, output);
            const timeline = state.timelinesById[timelineId];
            timeline.outputOrder.push(output.id);
        },
        setOutputGroups(state, {outputId, groupIds}) {
            const output = state.outputsById[outputId];
            output.groupIds = groupIds;
        },
        addLayer(state, {layerIndex, outputId, layer}) {
            Vue.set(state.layersById, layer.id, layer);
            const output = state.outputsById[outputId];
            output.layerIds.splice(layerIndex, 0, layer.id);
        },
        reorderLayers(state, {outputId, layerIds}) {
            const output = state.outputsById[outputId];
            output.layerIds = [...layerIds];
        },
        setLayerMode(state, {layerId, blendingMode}) {
            const layer = state.layersById[layerId];
            layer.blendingMode = blendingMode;
        },
        setLayerOpacity(state, {layerId, opacity}) {
            const layer = state.layersById[layerId];
            layer.opacity = opacity;
        },
        deleteLayer(state, {layerId}) {
            const layer = state.layersById[layerId];
            const output = state.outputsById[layer.outputId];
            output.layerIds.splice(output.layerIds.indexOf(layerId), 1);
            Vue.delete(state.layersById, layerId);
        },
        addClip(state, {timelineId, clip}) {
            const timeline = state.timelinesById[timelineId];
            Vue.set(state.clipsById, clip.id, clip);
            Vue.set(timeline.clipIdSet, clip.id, true);
        },
        deleteClipIds(state, {timelineId, clipIds}) {
            const timeline = state.timelinesById[timelineId];
            for (const clipId of clipIds) {
                Vue.delete(state.clipsById, clipId);
                Vue.delete(timeline.clipIdSet, clipId);
            }
        },
        changeClipLayer(state, {clipId, layerId}) {
            const clip = state.clipsById[clipId];
            clip.layerId = layerId;
        },
        setClipTime(state, {clipId, startTime, endTime}) {
            const clip = state.clipsById[clipId];
            clip.startTime = startTime;
            clip.endTime = endTime;
        },
        setClipMapping(state, {clipId, mappingId}) {
            const clip = state.clipsById[clipId];
            clip.mappingId = mappingId;
        },
    },
    getters: {
        timelines(state) {
            return state.timelineOrder.map(timelineId => state.timelinesById[timelineId]);
        }
    },
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
        },

        clear(state) {
            state.playlistItems = [];
        },
    },
});


export function setCoordType(id, mapping_type, coord_type) {
    store.commit('pattern/set_coord_type', { id, mapping_type, coord_type });

    const pattern = store.state.pattern.patterns[id];
    const graph = GraphLib.graphById(pattern.stages.pixel);

    const old_input = graph.getNodeByRef('input_node');
    graph.removeNode(old_input);

    const Mapping = mappingTypes[mapping_type],
          mappingView = new Mapping().getView(coord_type);

    graph.addGlobalInput('coords', mappingView.glslType);

    const path = `mapping/${mapping_type}/${coord_type}`;
    graph.addNode(path, {
        title: 'coordinates',
        ref: 'input_node'
    });
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
    pixel_stage.addNode(path, {title: 'coordinates', ref: 'input_node'});

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

registerSaveField('timelines', {
    save() {
        const timelineIds = store.state.timeline.timelineOrder;
        const timelines = timelineIds.map(timelineId => {
            const timeline = store.state.timeline.timelinesById[timelineId];
            const clipIds = [...Object.keys(timeline.clipIdSet)].map(x => parseInt(x));
            return {
                id: timeline.id,
                name: timeline.name || 'Unnamed Timeline',
                outputOrder: timeline.outputOrder,
                clipIds,
            };
        });
        return timelines;
    },
    restore(timelines) {
        if (!timelines) {
            return;
        }
        store.commit('timeline/restoreTimelines', {timelines});
    },
});

registerSaveField('outputs', {
    save() {
        return [...Object.values(store.state.timeline.outputsById)];
    },
    restore(outputs) {
        if (!outputs) {
            return;
        }
        store.commit('timeline/restoreOutputs', {outputs});
    },
});

registerSaveField('layers', {
    save() {
        return [...Object.values(store.state.timeline.layersById)];
    },
    restore(layers) {
        if (!layers) {
            return;
        }
        store.commit('timeline/restoreLayers', {layers});
    },
});

registerSaveField('clips', {
    save() {
        return [...Object.values(store.state.timeline.clipsById)];
    },
    restore(clips) {
        if (!clips) {
            return;
        }
        store.commit('timeline/restoreClips', {clips});
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
