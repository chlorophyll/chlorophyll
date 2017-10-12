<template>
    <div class="control">
        <input
          type="text"
          size="2"
          class="fill"
          :value="display_value"
          :disabled="disabled"
          @change="updateValue($event.target.value)" />
        <div class="drag-widget" v-if="!disabled" @mousedown="startDrag" />
    </div>
</template>

<script>

import Util from 'chl/util';

const RANGE_NPIXELS = 400;

export default {
    name: 'numeric-input',
    props: {
        value: Number,
        min: Number,
        max: Number,
        disabled: {
            type: Boolean,
            default: false,
        },
        precision: {
            type: Number,
            default: 3,
        },
    },
    data() {
        return {
            drag_y: undefined,
        };
    },
    computed: {
        range() {
            return this.max - this.min;
        },
        display_value() {
            return Util.roundTo(this.value, this.precision);
        },
    },
    methods: {
        updateValue(val) {
            if (typeof val !== 'number')
                val = parseFloat(val);

            if (typeof this.min !== undefined && val <= this.min) {
                val = this.min;
            } else if (typeof this.max !== undefined && val >= this.max) {
                val = this.max;
            }

            val = Util.roundTo(val, this.precision);
            this.$emit('input', val);
        },
        startDrag(event) {
            if (event.preventDefault) event.preventDefault();
            this.drag_y = event.clientY;
            document.addEventListener('mousemove', this.drag);
            document.addEventListener('mouseup', this.endDrag);
        },
        drag(event) {
            if (event.preventDefault) event.preventDefault();

            const delta_y = event.clientY - this.drag_y;
            this.drag_y = event.clientY;
            let newval = this.display_value - (delta_y * this.range / RANGE_NPIXELS);
            this.updateValue(newval);
        },
        endDrag() {
            document.removeEventListener('mousemove', this.drag);
            document.removeEventListener('mouseup', this.endDrag);
        },
    }
};
</script>
