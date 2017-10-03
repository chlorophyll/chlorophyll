<template>
  <div class="control-row">
    <label>{{ title }}</label>
    <span class="control medium"
          v-for="(val, idx) in vector">
        <input :value="val"
               :disabled="disabled"
               @change="updateValue(idx, $event.target.value);
                        $emit('change', vector);">
        <div class="drag_widget"
             v-if="!disabled"
             @mousedown="startDrag(idx, $event)">
        </div>
    </span>
  </div>
</template>

<script>
import Vue from 'vue';

const RANGE_NPIXELS = 400;
export default {
    name: 'vector-input',
    props: ['title', 'value', 'min', 'max', 'disabled'],
    data() {
        return {
            vector: this.value,
        };
    },
    computed: {
        range() {
            return this.max - this.min;
        }
    },
    watch: {
        value(new_value) {
            this.vector = new_value;
        },
    },
    methods: {
        updateValue(i, val) {
            if (typeof this.min !== 'undefined' && val <= this.min) {
                val = this.min;
            } else if (typeof this.max !== 'undefined' && val >= this.max) {
                val = this.max;
            }
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

<style scoped>
.wname {
    display: inline;
}
</style>
