<template>
    <div @click.stop="active=true" :style="input_style">
        <colorpicker-popup
           :active="active"
           :value="value"
           @blur="active=false"
           @input="(val) => $emit('input', val)" />
    </div>
</template>

<script>
import ColorpickerPopup from '@/components/widgets/colorpicker/popup';

export default {
    props: ['value'],
    name: 'colorpicker-inline',
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
            };
        }
    }
};
</script>
<style scoped>
div {
    display: inline-block;
    width: 0.8em;
    height: 0.8em;
}

</style>
