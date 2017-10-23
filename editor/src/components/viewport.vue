<template>
    <div id="viewport">
        <div id="overlays" />
    </div>
</template>

<script>

import { renderer } from 'chl/viewport';
import store from 'chl/vue/store';

export default {
    store,
    name: 'viewport',
    mounted() {
        this.$el.insertBefore(renderer.domElement, this.$el.firstChild);
        const width = this.$el.clientWidth;
        const height = this.$el.clientHeight;
        this.$store.commit('viewport/init', { width, height });
        window.addEventListener('resize', this.update_size);
    },
    updated() {
        this.update_size();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.update_size);
    },
    methods: {
        update_size() {
            const width = this.$el.clientWidth;
            const height = this.$el.clientHeight;
            this.$store.commit('viewport/set_size', { width, height });
        }
    }
};
</script>

<style scoped>
#viewport {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>
