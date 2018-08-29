<template>
    <div class="preview">
        <canvas v-show="this.preview !== null" ref="canvas" :width="width" :height="height" />
        <spinner v-if="this.preview === null" class="spinner" />
    </div>
</template>

<script>
import { previewSavefile } from 'chl/savefile/io';
import { Model } from 'chl/model';

import Viewport from '@/components/viewport';
import Spinner from '@/components/widgets/spinner';

export default {
    name: 'landing-preview',
    components: { Viewport, Spinner },
    props: ['project', 'width', 'height', 'renderer', 'camera'],
    data() {
        return {
            preview: null,
        };
    },

    watch: {
        preview(model) {
            this.renderer.render(model.scene, this.camera);
            this.$refs.canvas.getContext('2d').drawImage(this.renderer.domElement, 0, 0);
        }
    },

    mounted() {
        if (this.project.preview) {
            const model = new Model(this.project.preview);
            this.preview = model;
        } else {
            previewSavefile(this.project.file).then(model => {
                this.preview = model;
            });
        }
    },
};
</script>

<style scoped>
.spinner {
    position: absolute;
    top: 0;
    left: 0;
}
