<template>
    <div class="container" :style="box_size">
        Color Preview:
        <div :style="color_style" v-if="!has_dynamic_props" />
    </div>
</template>

<script>
export default {
    name: 'color-preview',
    props: ['node', 'width', 'height'],
    computed: {
        has_dynamic_props() {
            return this.node.inputs.some((slot) => slot.state.num_edges > 0);
        },
        box_size() {
            return {
                width: `${this.width}px`,
                height: '3em',
            };
        },
        color_style() {
            const {red, green, blue} = this.node.defaults;
            return {
                'background-color': `rgb(${red*100}%, ${green*100}%, ${blue*100}%)`,
                width: '2.5em',
                height: '2.5em',
            };
        },
    }
};
</script>
<style scoped>
.container {
    margin: 0 auto;
    position: relative;
    padding-top: 1em;
}

.container div {
    margin-left: 1em;
    vertical-align: middle;
    display: inline-block;
}

</style>
