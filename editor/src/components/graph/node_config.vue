<template>
    <dialog-box title="node config" :show="true" @close="close" width="350px">
      <div class="controls config">
            <template v-for="(component, slot) in input_components">
                <component v-bind:is="component" :node="node" :slotnum="slot" />
            </template>
      </div>
            <component v-if="node.config.visualization"
                       v-bind:is="node.config.visualization"
                       :node="node"
                       :width="325"
                       :height="250" />
    </dialog-box>
</template>

<script>
import Units from '@/common/units';
import DialogBox from '@/components/widgets/dialog_box';
import OscillatorPlotter from '@/components/graph/oscillator_plotter';
import ColorPreview from '@/components/graph/color_preview';

import GraphTypeUnit from '@/components/graph/types/unit';
import GraphTypeRange from '@/components/graph/types/range';
import GraphTypeFrequency from '@/components/graph/types/frequency';
import GraphTypeNumeric from '@/components/graph/types/numeric';

import clone from 'clone';

function componentForInputType(type, slot) {
    if (type.isUnit) {
        if (type == Units.Numeric) {
            return 'graph-type-numeric';
        } else {
            return 'graph-type-unit';
        }
    }

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
        ColorPreview,
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

<style scoped>
.config >>> .control {
    display: flex;
}
</style>
