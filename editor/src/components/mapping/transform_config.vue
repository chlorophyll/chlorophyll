<template>
<div class="panel">
  <div class="control-row">
    <label>Shape preview</label>
    <select v-model="">
  </div>
  <vector-input title="Position"
                min="-10000" max="10000"
                :value=""
                @input="" />
  <vector-input title="Rotation"
                min="-180" max="180"
                :value=""
                @input="" />
  <vector-input title="Scale"
                min="0.00001" max="1000000"
                :value=""
                @input="" />
  <div class="control-row">
    <label>Auto scale</label>
    <input type="checkbox" v-model="">
  </div>
  <viewport-transform-control @input="handleChanged"
    :value="handle_data"
    :mode="handle_mode"
    :shape="value.shape" />
</div>
</template>

<script>
import VectorInput from '@/components/widgets/vector_input';
import TransformControl from '@/components/widgets/viewport_transform_control';

export default {
  store,
  name: 'transform-config',
  props: ['value'],
  components: { VectorInput, TransformControl },
  data() {
    return {
      handle_mode: 'translate',
    };
  },
  computed: {
    handle_data() {
      return {
        pos: this.value.position,
        rot: this.value.rotation,
        scale: this.value.scale,
      };
    }
  },
  methods: {
    handleChanged(event) {
      // TODO
    }
  }
};
</script>

<style>
</style>
