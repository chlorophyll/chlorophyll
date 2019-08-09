<template>
  <v-card v-ripple v-on="$listeners" class="d-flex align-center">
    <preview-model
      :width="size"
      :height="size"
      :pattern="pattern"
      :renderer="renderer"
      :loader="loader"
    />
    <v-card-text class="headline">{{ pattern.name }}</v-card-text>
  </v-card>
</template>

<script>
import PreviewModel from '@/components/PreviewModel';
export default {
  props: ['size', 'pattern', 'renderer', 'loader'],
  components: {PreviewModel},
  name: 'pattern-card',
};
</script>
