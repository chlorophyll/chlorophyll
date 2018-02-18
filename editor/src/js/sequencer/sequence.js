/* eslint-disable */
import Vue from 'vue';
import clone from 'clone';

import store, { crud } from 'chl/vue/store';
import { registerSaveField } from 'chl/savefile';
import Clip from './clip';

export default class Sequence {
  constructor(attrs) {
    this.clip_ids = clone(attrs.clips);
    this.name = attrs.name;

    this.clips = [];
  }

  static fetch(id) {
    return new Sequence(store.state.seq.sequences[id]);
  }

  fetchClips() {
    this.clips = this.clip_ids.map((id) => {
      const attrs = store.seq.clips[id];
      return Clip.fetch(id);
    });
  }

  previewSequence() {
    fetchClips();
    // take control of the viewport
    // get OSC defs from each clip
    // generate a stream of osc messages
    // create pattern instances
    // asynchronously run pattern frames from osc commands
  }
}

store.registerModule('seq', {
  namespaced: true,
  state: {
    sequences: {},
    sequence_list: []
  },
  mutations: {
    ...crud('seq', 'sequences', 'sequence_list', {
      tracks: [],
      clips: []
    }),

    ...crud('clip', 'clips', 'clip_list', {
      start: 0,
      end: 0,
      track: -1,
      assignments: []
    })
  }
});

export const seqUtilsMixin = {
  methods: {
    getSequence(id) {
      return this.$store.state.seq.sequences[id];
    }
  }
};
