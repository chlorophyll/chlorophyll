<template>
  <v-card v-on="$listeners" class="d-flex align-center">
    <preview-model
      :width="size"
      :height="size"
      :pattern="pattern"
      :renderer="renderer"
      :loader="loader"
    />
    <v-card-text class="headline">{{ pattern.name }}</v-card-text>
    <v-spacer />
    <v-icon v-if="draggable" class="handle" x-large>mdi-drag</v-icon>
  </v-card>
</template>

<script>
import PreviewModel from '@/components/PreviewModel';
export default {
  props: ['size', 'pattern', 'renderer', 'loader', 'draggable'],
  components: {PreviewModel},
  name: 'pattern-card',
};
</script>
