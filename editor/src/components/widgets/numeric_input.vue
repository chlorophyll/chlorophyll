<template>
    <div class="root">
        <input
          type="text"
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
        dragscale: Number,
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
            start_val: undefined,
        };
    },
    computed: {
        range() {
            if (this.dragscale)
                return this.dragscale;

            if (this.min === undefined || this.max === undefined)
                return undefined;

            return this.max - this.min;
        },
        has_value() {
            return this.value !== null && this.value !== undefined;
        },
        display_value() {
            return this.has_value ? Util.roundTo(this.value, this.precision) : null;
        },
    },
    methods: {
        updateValue(val) {
            if (typeof val !== 'number')
                val = parseFloat(val);

            if (typeof this.min !== undefined && val < this.min) {
                val = this.min;
            } else if (typeof this.max !== undefined && val > this.max) {
                val = this.max;
            }

            val = Util.roundTo(val, this.precision);
            this.$emit('input', val);
        },
        startDrag(event) {
            if (event.preventDefault) event.preventDefault();
            this.drag_y = event.clientY;
            this.start_val = this.display_value || 0;
            document.addEventListener('mousemove', this.drag);
            document.addEventListener('mouseup', this.endDrag);
        },
        drag(event) {
            if (event.preventDefault) event.preventDefault();

            const delta_y = event.clientY - this.drag_y;
            let newval = this.start_val - (delta_y * this.range / RANGE_NPIXELS);
            this.updateValue(newval);
        },
        endDrag() {
            document.removeEventListener('mousemove', this.drag);
            document.removeEventListener('mouseup', this.endDrag);
        },
    }
};
</script>

<style scoped>
.root {
    display: flex;
}
input {
    flex: auto;
    width: 0;
}
</style>
