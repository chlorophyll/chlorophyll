<template>
    <div>
        <input type="range"
               ref="s1" class="s1" :value="val1"
               :min="min" :max="max" :step="step"
               @input="update" />
        <input type="range"
               ref="s2" :value="val2" class="s2"
               :min="min" :max="max" :step="step"
               @input="update" />
    </div>
</template>

<script>
export default {
    name: 'multirange',
    props: {
        value: String,
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
    computed: {
        val1() {
            return parseInt(this.value.split(',')[0]);
        },
        val2() {
            return parseInt(this.value.split(',')[1]);
        },
    },
    methods: {
        update() {
            let v1 = this.$refs.s1.value;
            let v2 = this.$refs.s2.value;
            let valueLow = Math.min(v1, v2);
            let valueHigh = Math.max(v1, v2);
            this.$emit('input', { valueLow, valueHigh });
        }
    }
};
</script>

<style scoped>
span {
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

input::-webkit-slider-thumb {
    position: relative;
    z-index: 2;
}

input.s2 {
    position: relative;
    background: none transparent;
    border: 0;
}

</style>
