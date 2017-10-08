<template>
  <div class="control-row">
    <label>{{ title }}</label>
    <template v-for="(val, idx) in vector">
        <input type="text" size="2" class="control"
               :value="val"
               :disabled="disabled"
               @change="updateValue(idx, $event.target.value);
                        $emit('change', vector);">
        <div class="drag-widget"
             v-if="!disabled"
             @mousedown="startDrag(idx, $event)">
        </div>
    </template>
  </div>
</template>

<script>
import Vue from 'vue';
import Util from 'chl/util';

const RANGE_NPIXELS = 400;
export default {
    name: 'vector-input',
    props: ['title', 'value', 'min', 'max', 'disabled'],
    data() {
        return {
            vector: this.value,
            // TODO make a prop
            precision: 3,
        };
    },
    computed: {
        range() {
            return this.max - this.min;
        }
    },
    watch: {
        value(new_value) {
            this.vector = new_value.map((x) => Util.roundTo(x, this.precision));
        },
    },
    methods: {
        updateValue(i, val) {
            if (typeof val !== 'number')
              val = parseInt(val);

            if (typeof this.min !== 'undefined' && val <= this.min) {
                val = this.min;
            } else if (typeof this.max !== 'undefined' && val >= this.max) {
                val = this.max;
            }
            val = Util.roundTo(val, this.precision);
            Vue.set(this.vector, i, val);
            this.$emit('input', this.vector);
        },
        startDrag(i, event) {
            if (event.preventDefault) event.preventDefault();

            this.dragging = i;
            this.drag_y = event.clientY;
            document.addEventListener('mousemove', this.drag);
            document.addEventListener('mouseup', this.endDrag);
        },
        drag(event) {
            if (event.preventDefault) event.preventDefault();

            const delta_y = event.clientY - this.drag_y;
            this.drag_y = event.clientY;
            let newval = this.vector[this.dragging]
                - (delta_y * this.range / RANGE_NPIXELS);

            this.updateValue(this.dragging, newval);
        },
        endDrag() {
            this.dragging = -1;
            document.removeEventListener('mousemove', this.drag);
            document.removeEventListener('mouseup', this.endDrag);
            this.$emit('change', this.vector);
        }
    }
};
</script>

<style>
</style>
