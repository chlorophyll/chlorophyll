<template>
  <div class="control fill">
    <input ref="input"
           :value="value"
           class="control"
           :style="input_style"
           readonly="true"
           @click="showPicker"/>
    <colorpicker-popup
           :active="active"
           :value="value"
           @blur="active=false"
           @input="(val) => $emit('input', val)" />
  </div>
</template>

<script>

import * as tinycolor from 'tinycolor2';

import ColorpickerPopup from '@/components/widgets/colorpicker/popup';

export default {
    props: ['value'],
    name: 'colorpicker-input',
    components: { ColorpickerPopup },
    data() {
        return {
            active: false,
        };
    },
    computed: {
        input_style() {
            return {
                backgroundColor: this.value,
                color: tinycolor.mostReadable(this.value, ['black', 'white']),
            };
        },
    },
    methods: {
        showPicker() {
            this.active = true;
            this.$refs.input.blur();
        }
    }
};
</script>

<style scoped>
</style>
