<template>
    <div id="viewport">
        <div id="rendered" />
        <div id="overlays" />
    </div>
</template>

<script>

import { screens } from 'chl/viewport';
import store from 'chl/vue/store';

export default {
    store,
    name: 'viewport',
    mounted() {
        this.$el.appendChild(renderer);
        this.update_size();

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
            this.$store.state.viewport.commit('set_size', {width, height});
        }
    }
};
</script>

<style scoped>
#viewport {
    position: relative;
    top: 0;
    left: 0;
}
</style>
