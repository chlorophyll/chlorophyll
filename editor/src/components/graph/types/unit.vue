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
                return this.value !== null ? this.value.valueOf() : null;
            },
            set(val) {
                if (isNaN(val))
                    val = 0;
                this.value = this.type.create(val);
            }
        },
        max() {
            return this.type.range[1];
        },
        min() {
            return this.type.range[0];
        }
    }
};
</script>
