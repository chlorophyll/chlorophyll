<template>
<div class="panel">
  <div class="control-row">
    <label>Shape preview</label>
    <select :value="value.shape"
            @input="val => transformUpdated({shape: val})" />
  </div>
  <div class="control-row">
    <label>Tool mode:</label>
    <select v-model="handle_mode" />
  </div>
  <vector-input title="Position"
                :dragscale="100"
                :value="value.position"
                @input="val => transformUpdated({position: val})" />
  <vector-input title="Rotation"
                :min="-180" :max="180"
                :value="value.rotation"
                @input="val => transformUpdated({rotation: val})" />
  <vector-input title="Scale"
                :dragscale="2"
                :min="0.0001"
                :value="value.scale"
                @input="val => transformUpdated({scale: val})" />
  <div class="control-row">
    <label>Auto scale</label>
    <input type="checkbox"
           :value="value.autoscale"
           @input="val => transformUpdated({autoscale: val})" />
  </div>
  <viewport-transform-control @input="transformUpdated"
    :value="handle_data"
    :mode="handle_mode"
    :shape="value.shape" />
</div>
</template>

<script>
import VectorInput from '@/components/widgets/vector_input';
import TransformControl from '@/components/widgets/viewport_transform_control';
import { scaleToFitPoints } from '@/common/mapping/transform';
import { currentModel } from 'chl/model';

export default {
  name: 'transform-config',
  props: ['value', 'group'],
  components: { VectorInput, TransformControl },
  data() {
    return {
      handle_mode: 'translate'
    };
  },
  computed: {
    handle_data() {
      return {
        position: this.value.position,
        rotation: this.value.rotation,
        scale: this.value.scale,
      };
    }
  },
  methods: {
    transformUpdated(toUpdate) {
      // Grab any fields provided, defaulting to the existing value.
      let {
        autoscale = this.value.autoscale,
        shape = this.value.shape,
        position = this.value.position,
        rotation = this.value.rotation,
        scale = this.value.scale,
      } = toUpdate;

      if (autoscale)
        scale = scaleToFitPoints(currentModel.getGroupPixels(this.group), position);

      this.$emit('input', {autoscale, shape, position, rotation, scale});
    }
  }
};
</script>

<style>
</style>
