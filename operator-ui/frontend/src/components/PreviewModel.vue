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
  props: ['width', 'height', 'pattern', 'renderer', 'loader', 'animated'],
  data() {
    return {
      texture: null,
      requestId: null,
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
      const ext = this.animated ? 'mp4' : 'png';
      const patternId = this.pattern.id;
      const mappingId = this.mapping.id;
      return `/api/preview/${patternId}/${mappingId}.${ext}`;
    },
    vid() {
      if (this.animated) {
        const vid = document.createElement('video');
        vid.src = this.url;
        vid.autoplay = true;
        vid.loop = true;
        return vid;
      } else {
        return null;
      }
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
    animated(newval) {
      if (newval) {
        this.requestId = window.requestAnimationFrame(() => this.render());
      } else {
        if (this.requestId) {
          window.cancelAnimationFrame(this.requestId);
          this.requestId = null;
        }
      }
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

      if (this.animated) {
        this.requestId = window.requestAnimationFrame(() => this.render());
      }
    },
    loadTexture() {
      if (this.animated) {
        this.texture = new THREE.VideoTexture(this.vid);
        this.texture.flipY = false;
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.maxFilter = THREE.LinearFilter;
        this.render();
      } else {
        this.loader.load(this.url, texture => {
          texture.flipY = false;
          this.texture = texture;
          this.render();
        });
      }
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
