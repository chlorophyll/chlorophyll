<template>
    <div class="control-row">
        <label> {{ name }} </label>
        <div class="control">
        <input class="smol" type="text" disabled="true" :value="value.lower" />
        <multirange class="fill" :min="this.value.min" :max="this.value.max" v-model="current" step="0.001" />
        <input class="smol" type="text" disabled="true" :value="value.upper" />
        </div>
    </div>
</template>

<script>
import { NodeConfigMixin } from 'chl/graphlib';

import Multirange from '@/components/widgets/multirange';

export default {
    name: 'graph-type-range',
    mixins: [NodeConfigMixin],
    components: { Multirange },
    computed: {
        current: {
            get() {
                return [this.value.lower, this.value.upper];
            },
            set([lower, upper]) {
                this.value.lower = lower;
                this.value.upper = upper;
            }
        }
    }
};
</script>
<style scoped>
input {
    width: 3em !important;
}
</style>
