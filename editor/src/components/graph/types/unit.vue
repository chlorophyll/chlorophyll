<template>
    <div class="control-row">
        <label>{{ name }}</label>
        <numeric-input v-model="current" />
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
                const Ctor = this.type;
                this.value = new Ctor(val);
            }
        }
    }
};
</script>
