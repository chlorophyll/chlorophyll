<template>
<div class="panel">
  <div class="control-row">
    <label>Shape preview</label>
    <select v-model="shape">
      <option v-for="opt in shape_options" :value="opt.val">
        {{ opt.label }}
      </option>
    </select>
  </div>
  <div class="control-row">
    <label>Tool mode:</label>
    <select v-model="handle_mode">
      <option v-for="opt in mode_options" :value="opt.val">
        {{ opt.label }}
      </option>
    </select>
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
                :min="0.1" :max="10000"
                :value="value.scale"
                @input="val => transformUpdated({scale: val})" />
  <div class="control-row">
    <label>Auto scale</label>
    <input type="checkbox"
           v-model="autoscale" />
  </div>
  <viewport-transform-control @input="transformUpdated"
    :value="handle_data"
    :mode="handle_mode"
    :shape="shape" />
</div>
</template>

<script>
import VectorInput from '@/components/widgets/vector_input';
import ViewportTransformControl from '@/components/widgets/viewport_transform_control';
import TransformMapping from '@/common/mapping/transform';
import { currentModel } from 'chl/model';

export default {
  name: 'transform-config',
  props: ['value'],
  components: { VectorInput, ViewportTransformControl },

  data() {
    return {
      handle_mode: 'translate',
      mode_options: [
        { label: 'Translate', val: 'translate' },
        { label: 'Rotate', val: 'rotate' }
      ],
      shape_options: [
        { label: 'Cartesian', val: 'cube' },
        { label: 'Cylindrical', val: 'cylinder' },
        { label: 'Spherical', val: 'sphere' }
      ],
    };
  },

  computed: {
    handle_data() {
      return {
        position: this.value.position,
        rotation: this.value.rotation,
        scale: this.value.scale,
      };
    },

    autoscale: {
      get() { return this.value.autoscale; },
      set(val) { this.transformUpdated({autoscale: val}); }
    },

    shape: {
      get() { return this.value.shape; },
      set(val) { this.transformUpdated({shape: val}); }
    }
  },

  mounted() {
    this.mapping = new TransformMapping(this.value);
  }

  methods: {
    transformUpdated(toUpdate) {
      // Grab any fields provided, defaulting to the existing value.
      const updated = {
        ...this.value,
        ...toUpdate
      };

      this.mapping.setParameters(updated);
      this.$emit('input', this.mapping.serialize());
    }
  }
};
</script>

<style>
</style>
