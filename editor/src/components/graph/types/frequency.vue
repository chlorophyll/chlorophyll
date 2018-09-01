<template>
    <div class="control-row">
        <label>{{ name }}</label>
        <div class="control">
            <select v-model="quantity">
                <template v-for="qty in quantities">
                    <option :value="qty">{{ qty }}</option>
                </template>
            </select>
            <numeric-input class="fill" v-model="current" :min="0" :dragscale="dragscale"/>
        </div>
    </div>
</template>

<script>
import { NodeConfigMixin } from 'chl/graphlib';
import NumericInput from '@/components/widgets/numeric_input';
import { FrequencyQuantities } from '@/common/nodes/oscillators/util';

export default {
    name: 'graph-type-frequency',
    mixins: [NodeConfigMixin],
    components: { NumericInput },
    mounted() {
        console.log(this.value);
    },
    computed: {
        current: {
            get() {
                return this.value[this.quantity];
            },
            set(val) {
                this.value[this.quantity] = val;
            }
        },
        quantity: {
            get() {
                return this.value.display_qty;
            },
            set(val) {
                this.value.display_qty = val;
            }
        },
        quantities() {
            return FrequencyQuantities;
        },
        dragscale() {

            if (this.value.display_qty == 'bpm') {
                return 80;
            } else if (this.value.display_qty == 'sec') {
                return 4;
            } else {
                return 1;
            }
        }
    }
};

</script>

<style scoped>
</style>
