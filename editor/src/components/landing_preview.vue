<template>
    <div class="preview">
        <canvas v-show="this.preview !== null" ref="canvas" :width="width" :height="height" />
        <spinner v-if="show_spinner" class="spinner" />
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
            preview: null,
            preview_unavailable: false,
        };
    },

    computed: {
        show_spinner() {
            return this.preview === null && !this.preview_unavailable;
        }
    },

    watch: {
        preview(model) {
            model.zoomCameraToFit(this.camera);
            this.renderer.render(model.scene, this.camera);
            this.$refs.canvas.getContext('2d').drawImage(this.renderer.domElement, 0, 0);
        }
    },

    mounted() {
        this.$nextTick(() => {
            if (this.project.preview) {
                const model = new Model(this.project.preview);
                this.preview = model;
            } else {
                previewSavefile(this.project.file).then(model => {
                    this.preview = model;
                });
            }

            setTimeout(() => {
                if (this.preview === null) {
                    this.preview_unavailable = true;
                }
            }, 5000);
        });
    },
};
</script>

<style scoped>
.spinner {
    position: absolute;
    top: 0;
    left: 0;
}
