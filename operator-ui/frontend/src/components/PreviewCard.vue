<template>
  <v-toolbar extension-height="size" absolute width="50%" class="my-auto">
      <v-toolbar-title>{{ pattern.name }}</v-toolbar-title>
      <v-spacer />
        <v-btn class="mx-1" small color="primary">Add to queue</v-btn>
        <v-btn class="mx-1" small>Play next</v-btn>
        <v-btn class="mx-1" small>Play now</v-btn>
        <v-btn icon class="ml-3" @click="selectPreviewItem(null)"><v-icon>mdi-close</v-icon></v-btn>
    <template #extension>
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
    </template>
  </v-toolbar>
</template>

<script>
import {mapMutations} from 'vuex';
import PreviewModel from '@/components/PreviewModel';
import store from '@/store';
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
  },
};
</script>
