<template>
  <div class="control-row">
    <label>{{ title }}</label>
    <template v-for="(val, idx) in vector">
        <numeric-input :value="val"
                       :min="min"
                       :max="max"
                       :dragscale="dragscale"
                       :precision="precision"
                       :disabled="disabled"
                       @input="(val) => updateValue(idx, val)" />
    </template>
  </div>
</template>

<script>
import Util from 'chl/util';
import NumericInput from '@/components/widgets/numeric_input';

export default {
    name: 'vector-input',
    components: { NumericInput },
    props: {
        title: String,
        value: Array,
        min: Number,
        max: Number,
        dragscale: Number,
        disabled: {
            type: Boolean,
            default: false,
        },
        precision: {
            type: Number,
            default: 3
        }
    },
    computed: {
        vector() {
            return this.value.map((x) => Util.roundTo(x, this.precision));
        },
    },
    methods: {
        updateValue(i, val) {
            let out = this.vector.concat();
            out[i] = val;
            this.$emit('input', out);
        },
    }
};
</script>

<style>
</style>
