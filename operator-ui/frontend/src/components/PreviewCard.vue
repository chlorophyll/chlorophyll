<template>
  <v-toolbar :extension-height="size+36" absolute :width="width" class="my-auto">
      <v-toolbar-title>{{ pattern.name }}</v-toolbar-title>
      <v-spacer />
        <v-btn icon class="ml-3" @click="selectPreviewItem(null)"><v-icon>mdi-close</v-icon></v-btn>
    <template #extension>
      <v-layout column>
        <v-flex align-self-center>
        <v-btn class="mx-1" @click="addToQueue" small color="primary">Add to queue</v-btn>
        <v-btn class="mx-1" small>Play next</v-btn>
        <v-btn class="mx-1" small>Play now</v-btn>
        </v-flex>
        <preview-model
          :width="size*(16/9)"
          :height="size"
          :pattern="pattern"
          :renderer="renderer"
          :loader="loader"
          :animated="true"
          @loading="loading=true"
          @done-loading="loading=false"
        />
      </v-layout>
    </template>
  </v-toolbar>
</template>

<script>
import {mapMutations} from 'vuex';
import PreviewModel from '@/components/PreviewModel';
import store from '@/store';
import * as realtime from '@/realtime';
export default {
  props: ['pattern', 'width', 'size', 'renderer', 'loader'],
  components: { PreviewModel },
  name: 'preview-card',
  data() {
    return {
      loading: false,
    };
  },
  methods: {
    ...mapMutations([
      'selectPreviewItem',
    ]),
    addToQueue() {
      const playlist = this.$store.state.realtime.playlist || [];
      realtime.submitOp(realtime.ops.insert('playlist', playlist.length, this.pattern.id));
    },
  },
};
</script>
