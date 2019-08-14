<template>
  <v-fade-transition>
  <v-toolbar :extension-height="size+36" absolute :width="width" class="my-auto">
      <v-toolbar-title>{{ pattern.name }}</v-toolbar-title>
      <v-spacer />
        <v-btn icon class="ml-3" @click="selectPreviewItem(null)"><v-icon>mdi-close</v-icon></v-btn>
    <template #extension>
      <v-layout column>
        <v-flex align-self-center>
        <v-btn class="mx-1" @click="addToQueue" small color="primary">Add to queue</v-btn>
        <v-btn class="mx-1" @click="playNext" small>Play next</v-btn>
        <v-btn class="mx-1" @click="playNow" small>Play now</v-btn>
        </v-flex>
        <preview-model
          :width="size*(16/9)"
          :height="size"
          :pattern="pattern"
          :renderer="renderer"
          :loader="loader"
          @loading="loading=true"
          @done-loading="loading=false"
        />
      </v-layout>
    </template>
  </v-toolbar>
  </v-fade-transition>
</template>

<script>
import {mapState, mapMutations, mapActions} from 'vuex';
import PreviewModel from '@/components/PreviewModel';
import store from '@/store';
import * as realtime from '@/realtime';
import {ApiMixin} from '@/api';
export default {
  store,
  props: ['pattern', 'width', 'size', 'renderer', 'loader'],
  components: { PreviewModel },
  name: 'preview-card',
  mixins: [ApiMixin],
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    ...mapState([
      'realtime',
      'previewItem',
    ]),
  },
  methods: {
    ...mapActions([
      'createPlaylistItem',
    ]),
    ...mapMutations([
      'selectPreviewItem',
    ]),
    async addToQueue() {
      const playlist = this.realtime.playlist || [];
      const index = playlist.length;
      await this.createPlaylistItem({index, patternId: this.previewItem});
    },

    async createPlaylistItemAtTarget() {
      const playlist = this.realtime.playlist || [];
      let index = 0;
      if (this.realtime.timeInfo.targetItemId) {
        index = playlist.findIndex(item => item.id === this.realtime.timeInfo.targetItemId) + 1;
      }

      await this.createPlaylistItem({index, patternId: this.previewItem});
      await realtime.nothingPending();
      return index;
    },

    async playNext() {
      const index = await this.createPlaylistItemAtTarget();
      if (!this.realtime.timeInfo.activeItemId) {
        await this.playlistStart(index);
      }
    },

    async playNow() {
      const index = await this.createPlaylistItemAtTarget();
      await this.playlistStart(index);
    }

  },
};
</script>
