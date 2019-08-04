<template>
  <canvas class="mx-auto" :width="width" :height="height" ref="canvas" />
</template>

<script>
import {mapState, mapGetters} from 'vuex';
import store from '@/store';
import api from '@/api';
import {getModel} from '@/model';
import * as THREE from 'three';
export default {
  name: 'static-preview',
  props: ['width', 'height', 'pattern', 'renderer', 'loader'],
  computed: {
    ...mapGetters([
      'mappingList',
    ]),
    mapping() {
      return this.mappingList.find(mapping => mapping.type === this.pattern.mapping_type);
    },
  },
  methods: {
    loadTexture() {
      const patternId = this.pattern.id;
      const mappingId = this.mapping.id;
      const url = `/api/preview/${patternId}/${mappingId}`;
      this.loader.load(url, (texture) => {
        texture.flipY = false;
        const model = getModel();
        const camera = new THREE.PerspectiveCamera(
          45,
          this.width / this.height,
          1,
          1000000,
        );

        model.zoomCameraToFit(camera, 1);
        model.setFromTexture(texture);
        this.renderer.render(model.scene, camera);
        const context = this.$refs.canvas.getContext('2d');
        context.drawImage(this.renderer.domElement, 0, 0);
      });
    },
  },

  mounted() {
    this.$nextTick(() => this.loadTexture());
  }
};
</script>

<style scoped>
canvas {
  border-radius: inherit;
}
</style>
