import Vue from 'vue'
import Vuex from 'vuex'
import api from './api';

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        panel: null,
        allPanels: null,
        guess: null,
        col: null,
        mode: null,
    },
    mutations: {
        init(state, {panels}) {
            state.allPanels = panels;
        },
        setMapperState(state, {guess, col, mode}) {
            state.guess = guess;
            state.col = col;
            state.mode = mode;
        },
        setPanel(state, {panel}) {
            state.panel = panel;
        },
    },
    actions: {
        async init({commit}) {
            const panels = await api.getPanels();
            commit('init', panels);
        },
        async selectPanel({commit}, panel) {
            const mapperState = await api.getMapperState(panel);
            commit('setPanel', {panel});
            commit('setMapperState', mapperState);
        },

        async increment({commit, state}) {
            const {panel} = state;
            const mapperState = await api.increment(panel);
            commit('setMapperState', mapperState);
        },

        async decrement({commit, state}) {
            const {panel} = state;
            const mapperState = await api.decrement(panel);
            commit('setMapperState', mapperState);
        },

        async prev({commit, state}) {
            const {panel} = state;
            const mapperState = await api.prev(panel);
            commit('setMapperState', mapperState);
        },

        async next({commit, state}) {
            const {panel} = state;
            const mapperState = await api.next(panel);
            commit('setMapperState', mapperState);
        },

        async setGuess({commit, state}, guess) {
            const {panel} = state;
            const mapperState = await api.setGuess(panel, guess);
            commit('setMapperState', mapperState);
        },

        async setMode({commit, state}, mode) {
            const {panel} = state;
            const mapperState = await api.setMode(panel, mode);
            commit('setMapperState', mapperState);
        },

    }
})
