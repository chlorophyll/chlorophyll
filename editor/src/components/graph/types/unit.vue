<template>
    <div class="control-row">
        <label>{{ name }}</label>
        <numeric-input v-model="current" :max="max" :min="min" />
    </div>
</template>

<script>
import { NodeConfigMixin } from 'chl/graphlib';
import NumericInput from '@/components/widgets/numeric_input';

export default {
    name: 'graph-type-unit',
    mixins: [NodeConfigMixin],
    components: { NumericInput },
    computed: {
        current: {
            get() {
                return this.value !== undefined ? this.value.valueOf() : null;
            },
            set(val) {
                const v = this.type.create(val);
                this.value = v;
            }
        },
        max() {
            return this.type.range[1];
        },
        min() {
            return this.type.range[0];
        }
    },
};
</script>
