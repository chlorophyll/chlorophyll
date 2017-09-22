<template>
</template>

<script>
import { Color } from 'three';
import Immutable from 'immutable';
import { currentModel } from 'chl/model';

/*
 * Thin wrapper around model Overlays, to allow them to react properly to
 * Vue mutations. Note that this is one-way: the vue model can not react to
 * external changes to the overlay state.
 */
export default {
    name: 'model-overlay',
    props: {
        priority: Number,
        pixels: Array,
        color: Number,
        visible: Boolean,
    },
    data() {
        return {
            overlay: currentModel.createOverlay(this.priority,
                                                new Color(this.color))
        };
    },
    mounted() {
        this.overlay.pixels = Immutable.Set(this.pixels);
    },
    watch: {
        pixels(new_pix, old_pix) {
            this.overlay.pixels = Immutable.Set(new_pix);
        },
        visible(new_vis) {
            this.overlay.visible = new_vis;
        }
    },
    // Props won't be used without a template,
    // so give an empty render function
    render(createElement) {
        return createElement();
    },
    beforeDestroy() {
        currentModel.removeOverlay(this.overlay);
    }
};
</script>

<style>
</style>
