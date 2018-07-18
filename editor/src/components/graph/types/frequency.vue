<template>
    <div class="control-row">
        <label>{{ name }}</label>
        <div class="control">
            <select v-model="quantity">
                <template v-for="qty in value.quantities">
                    <option :value="qty">{{ qty }}</option>
                </template>
            </select>
            <numeric-input v-model="current" :dragscale="25" />
        </div>
    </div>
</template>

<script>
import { NodeConfigMixin } from 'chl/graphlib';
import NumericInput from '@/components/widgets/numeric_input';

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
        }
    }
};

</script>
