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
  name: 'preview-model',
  props: ['width', 'height', 'pattern', 'renderer', 'loader'],
  data() {
    return {
      texture: null
    };
  },
  computed: {
    ...mapGetters([
      'mappingList',
    ]),
    mapping() {
      return this.mappingList.find(mapping => mapping.type === this.pattern.mapping_type);
    },
    url() {
      const patternId = this.pattern.id;
      const mappingId = this.mapping.id;
      return `/api/preview/${patternId}/${mappingId}`;
    },
  },
  watch: {
    width() {
      this.render();
    },
    height() {
      this.render();
    },
    url() {
      this.loadTexture();
    },
  },
  methods: {
    render() {
      const model = getModel();
      const camera = new THREE.PerspectiveCamera(
        45,
        this.width / this.height,
        1,
        1000000,
      );

      model.zoomCameraToFit(camera, 1.1);
      model.setFromTexture(this.texture);
      this.renderer.setSize(this.width, this.height);
      this.renderer.render(model.scene, camera);
      const context = this.$refs.canvas.getContext('2d');
      context.drawImage(this.renderer.domElement, 0, 0);
    },
    loadTexture() {
      this.loader.load(this.url, texture => {
        texture.flipY = false;
        this.texture = texture;
        this.render();
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
