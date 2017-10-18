<template>
    <div class="multirange">
        <input type="range"
               ref="s1" class="s1" :value="current[0]"
               :min="min" :max="max" :step="step"
               @input="update" />
        <input type="range"
               ref="s2" :value="current[1]" class="s2"
               :min="min" :max="max" :step="step"
               @input="update" />
    </div>
</template>

<script>
export default {
    name: 'multirange',
    props: {
        value: Array,
        min: {
            type: Number,
            default: 0,
        },
        max: {
            type: Number,
            default: 100,
        },
        step: {
            type: [Number, String],
            default: 1,
        }
    },
    data() {
        return {
            current: this.value
        };
    },
    methods: {
        update() {
            let v1 = this.$refs.s1.value;
            let v2 = this.$refs.s2.value;
            let valueLow = Math.min(v1, v2);
            let valueHigh = Math.max(v1, v2);
            this.$emit('input', [valueLow, valueHigh] );
        }
    }
};
</script>

<style scoped>
div {
    position: relative;
}

input {
    padding: 0;
    margin: 0;
    display: inline-block;
    vertical-align: top;
}

.s1 {
    position: absolute;
}

input.s1::-webkit-slider-thumb {
    position: relative;
    z-index: 1;
}

input.s2::-webkit-slider-thumb {
    position: relative;
    z-index: 2;
}

input.s2 {
    position: relative;
    background: none transparent;
    border: 0;
}

</style>
