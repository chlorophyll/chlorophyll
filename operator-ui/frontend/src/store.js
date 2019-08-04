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
    },
    mutations: {
        setSavefileState(state, {patterns, patternOrder, mappings}) {
            state.patternsById = patterns;
            state.patternOrder = patternOrder;
            state.mappingsById = mappings;
            state.model = true;
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
            const savefile = await api.fetchSavefileState();
            initModel(savefile.model);
            commit('setSavefileState', savefile);
        },
    }
})
