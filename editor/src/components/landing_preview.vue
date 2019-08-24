<template>
    <div class="preview">
        <canvas v-show="this.hasPreview" ref="canvas" :width="width" :height="height" />
        <spinner v-if="showSpinner" class="spinner" />
    </div>
</template>

<script>
import { previewSavefile } from 'chl/savefile/io';
import { Model } from 'chl/model';

import Spinner from '@/components/widgets/spinner';

export default {
    name: 'landing-preview',
    components: { Spinner },
    props: ['project', 'width', 'height', 'renderer', 'camera'],
    data() {
        return {
            hasPreview: false,
            previewUnavailable: false,
        };
    },

    computed: {
        showSpinner() {
            return true;
            return !this.hasPreview && !this.previewUnavailable;
        }
    },
    watch: {
        project() {
            this.renderModel();
        },
    },
    async mounted() {
        this.$nextTick(() => {
            this.renderModel();
        });
    },

    methods: {
        async renderModel() {
            let model;
            if (this.project.preview) {
                model = new Model(this.project.preview, true);
            } else if (this.project.file) {
                model = await previewSavefile(this.project.file);
            } else {
                return;
            }
            this.$nextTick(() => {
                if (model) {
                    model.zoomCameraToFit(this.camera, 1);
                    this.renderer.render(model.scene, this.camera);
                    this.$refs.canvas.getContext('2d').drawImage(this.renderer.domElement, 0, 0);
                    this.hasPreview = true;
                }
            });
        }
    }
};
</script>

<style scoped>
.spinner {
    position: absolute;
    top: 0;
    left: 0;
}
