import Vue from 'vue';
import Vuex from 'vuex';

import api from './api';

import {initModel} from './model';
import * as realtime from './realtime';

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        patternsById: {},
        patternOrder: [],
        mappingsById: {},
        model: false,
        realtime: {},
        realtimeLoaded: false,
        previewItem: null,
    },
    mutations: {
        setSavefileState(state, {patterns, patternOrder, mappings}) {
            state.patternsById = patterns;
            state.patternOrder = patternOrder;
            state.mappingsById = mappings;
            state.model = true;
        },
        realtimeChange(state, doc) {
            state.realtime = {...doc};
        },
        selectPreviewItem(state, pattern) {
            state.previewItem = pattern ? pattern.id : null;
        },
        realtimeLoaded(state, val) {
            state.realtimeLoaded = val;
        },
    },
    getters: {
        patternList(state) {
            return state.patternOrder.map(patternId => state.patternsById[patternId]);
        },
        mappingList(state) {
            return Object.values(state.mappingsById);
        },
        playlist(state) {
            const items = state.realtime.playlist || [];
            return items.map(item => ({
                id: item.id,
                duration: item.duration,
                pattern: state.patternsById[item.patternId],
            }));
        },
    },

    actions: {
        async fetchSavefileState({commit}) {
            const state = await api.fetchState();
            initModel(state.model);
            commit('setSavefileState', state);
            commit('realtimeChange', state.realtime);
        },

        async createPlaylistItem({commit, state}, {index, patternId}) {
            if (!patternId) {
                return;
            }
            const id = await api.newgid();
            const duration = 60;

            if (state.previewItem === patternId) {
                commit('selectPreviewItem', null);
            }
            const item = {
                id,
                duration,
                patternId,
            };
            realtime.submitOp(realtime.ops.insert('playlist', index, item));
        },
        updateDuration(st, {index, newval, oldval}) {
            realtime.submitOp(realtime.ops.number(['playlist', index, 'duration'], newval, oldval));
        },

        async removePlaylistItem(st, {item, index}) {
            realtime.submitOp(realtime.ops.delete('playlist', index, item));
        }
    }
})
