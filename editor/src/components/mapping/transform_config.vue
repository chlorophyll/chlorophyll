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
</div>
</template>

<script>
import VectorInput from '@/components/widgets/vector_input';
import Handle3D from '@/components/widgets/handle_3d';

export default {
  store,
  name: 'transform-config',
  props: ['value'],
  components: { VectorInput, Handle3D },
  data() {
  },
  computed: {
  },
  methods: {
  }
};
</script>

<style>
</style>
