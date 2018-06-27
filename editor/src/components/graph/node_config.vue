<template>
    <dialog-box title="node config" :show="true" @close="close" width="350px">
            <template v-for="(component, slot) in input_components">
                <component v-bind:is="component" :node="node" :slotnum="slot" />
            </template>
            <component v-if="node.config.visualization"
                       v-bind:is="node.config.visualization"
                       :node="node"
                       :width="325"
                       :height="250" />
    </dialog-box>
</template>

<script>
import DialogBox from '@/components/widgets/dialog_box';
import OscillatorPlotter from '@/components/graph/oscillator_plotter';

import GraphTypeUnit from '@/components/graph/types/unit';
import GraphTypeRange from '@/components/graph/types/range';
import GraphTypeFrequency from '@/components/graph/types/frequency';
import GraphTypeNumeric from '@/components/graph/types/numeric';

import clone from 'clone';

function componentForInputType(type, slot) {
    if (type.isUnit) {
        return 'graph-type-unit';
    }
    console.log(type);

    switch (type) {
        case 'number':
            return 'graph-type-numeric';
        case 'Range':
            return 'graph-type-range';
        case 'Frequency':
            return 'graph-type-frequency';
    }
}

export default {
    name: 'node-config',
    props: ['node'],
    components: {
        DialogBox,
        OscillatorPlotter,
        GraphTypeFrequency,
        GraphTypeNumeric,
        GraphTypeRange,
        GraphTypeUnit,
    },
    data() {
        return {
            old_defaults: clone(this.node.defaults),
        };
    },
    computed: {
        input_components() {
            return this.node.input_types.map(componentForInputType);
        }
    },
    methods: {
        close(save) {
            if (!save) {
                this.node.defaults = this.old_defaults;
            }
            this.$emit('close', save);
        }
    }
};
</script>
