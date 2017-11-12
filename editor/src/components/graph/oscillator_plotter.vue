<template>
    <plotter v-if="!has_dynamic_props"
             :func="func" :width="width" :height="height" />
</template>

<script>
import Plotter from '@/components/widgets/plotter';

export default {
    name: 'oscillator-plotter',
    props: ['node', 'width', 'height'],
    components: { Plotter },
    data() {
        return {
            func: this.makeFunction()
        };
    },
    watch: {
        'node.defaults': {
            handler() {
                this.func = this.makeFunction();
            },
            deep: true,
        }
    },
    computed: {
        has_dynamic_props() {
            return this.node.inputs.some((slot) => slot.state.num_edges > 0);
        },
    },
    methods: {
        makeFunction() {
            const { frequency, amplitude, phase } = this.node.defaults;
            const waveform = this.node.graph_node.waveform;
            return (t) => waveform(frequency, amplitude, phase, t);
        },
    }

};
</script>
