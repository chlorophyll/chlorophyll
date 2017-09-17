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

        this.$on('resize', this.update_size);
        window.addEventListener('resize', this.update_size);
    },
    beforeDestroy() {
        this.$off('resize', this.update_size);
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
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>
