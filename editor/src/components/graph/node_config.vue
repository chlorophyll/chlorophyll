<template>
    <dialog-box title="node config" :show="true" @close="close" width="350px" :pos="{x: 40, y: 40}">
      <div class="controls config">
            <template v-for="(component, idx) in parameter_components">
                <component v-bind:is="component" :parameter="node.parameters[idx]"/>
            </template>
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

import OscillatorPlotter from './oscillator_plotter';
import ColorPreview from './color_preview';

import GraphTypeUnit from './types/unit';
import GraphTypeRange from './types/range';
import GraphTypeFrequency from './types/frequency';
import GraphTypeNumeric from './types/numeric';
import GraphTypeString from './types/string';
import GraphTypeEnum from './types/enum';

import clone from 'clone';

function componentForInputType(type) {
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
        case 'string':
            return 'graph-type-string';
        case 'Range':
            return 'graph-type-range';
        case 'Frequency':
            return 'graph-type-frequency';
        case 'Enum':
            return 'graph-type-enum';
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
        GraphTypeString,
        GraphTypeRange,
        GraphTypeUnit,
        GraphTypeEnum,
    },
    data() {
        return {
            old_defaults: clone(this.node.defaults),
            old_parameters: clone(this.node.parameters)
        };
    },
    computed: {
        input_components() {
            return this.node.input_types.map(componentForInputType);
        },

        parameter_components() {
            return this.node.parameters.map(param => componentForInputType(param.type));
        }
    },
    methods: {
        close(save) {
            if (!save) {
                this.node.defaults = this.old_defaults;
                this.node.parameters = this.old_parameters;
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
