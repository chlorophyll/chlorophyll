import Vue from 'vue';
import Vuex from 'vuex';

import api from './api';

import {initModel} from './model';

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        patternsById: {},
        patternOrder: [],
        mappingsById: {},
        model: false,
        realtime: {},
        previewItem: null,
        playlistItems: [],
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
    },
    getters: {
        patternList(state) {
            return state.patternOrder.map(patternId => state.patternsById[patternId]);
        },
        mappingList(state) {
            return Object.values(state.mappingsById);
        },
    },

    actions: {
        async fetchSavefileState({commit}) {
            const state = await api.fetchState();
            initModel(state.model);
            commit('setSavefileState', state);
            commit('realtimeChange', state.realtime);
        },
    }
})
