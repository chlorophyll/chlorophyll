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
    playlistOrder: [],
    playlistsById: {},
    model: false,
    realtime: {},
    realtimeLoaded: false,
    previewItem: null,
  },
  mutations: {
    setSavefileState(state, savefile) {
      const {patterns, patternOrder, mappings, playlistsById, playlistOrder} = savefile;
      state.patternsById = patterns;
      state.patternOrder = patternOrder;
      state.mappingsById = mappings;
      state.playlistsById = playlistsById;
      state.playlistOrder = playlistOrder;
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
    updatePlaylists(state, {playlistsById, playlistOrder}) {
      state.playlistsById = playlistsById;
      state.playlistOrder = playlistOrder;
    },
  },
  getters: {
    patternList(state) {
      return state.patternOrder.map(patternId => state.patternsById[patternId]);
    },
    mappingList(state) {
      return Object.values(state.mappingsById);
    },
    activePlaylist(state) {
      const items = state.realtime.playlist || [];
      return items.map(item => ({
        id: item.id,
        duration: item.duration,
        pattern: state.patternsById[item.patternId],
      }));
    },
    playlists(state) {
      return state.playlistOrder.map(playlistId => state.playlistsById[playlistId]);
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
    },

    async newPlaylist({commit}) {
      const result = await api.playlistNew();
      commit('updatePlaylists', result);
    }
  }
})
