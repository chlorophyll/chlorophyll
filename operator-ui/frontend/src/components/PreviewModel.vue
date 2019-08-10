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
  texture: null,
  model: null,
  context: null,
  data() {
    return {
      camera: null,
    };
  },
  computed: {
    ...mapGetters([
      'mappingList',
    ]),
    mapping() {
      return this.mappingList.find(mapping => mapping.type === this.pattern.mapping_type);
    },
    baseUrl() {
      const patternId = this.pattern.id;
      const mappingId = this.mapping.id;
      return `/api/preview/${patternId}/${mappingId}`;
    },
    imageUrl() {
      return this.baseUrl + '.png';
    },
    videoUrl() {
      return this.baseUrl + '.mp4';
    },
    url() {
      return this.animated ? this.videoUrl : this.imageUrl;
    },
    vid() {
      console.log('recomputing vid?');
      if (this.animated) {
        const vid = document.createElement('video');
        vid.autoplay = true;
        vid.loop = true;
        vid.addEventListener('canplay', () => {
          this.$emit('done-loading');
          const texture = new THREE.VideoTexture(vid);
          texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearFilter;
          texture.flipY = false;
          this.$options.texture = texture;
          this.render();
        });
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
  },
  methods: {
    loadVideoTexture() {
      this.$emit('loading');
      this.vid.src = this.videoUrl;
    },

    render() {
      if (this.$refs.canvas) {
        this.$options.model.setFromTexture(this.$options.texture);
        this.renderer.setSize(this.width, this.height);
        this.renderer.render(this.$options.model.scene, this.camera);
        this.$options.context.drawImage(this.renderer.domElement, 0, 0);
      }
      if (this.animated) {
        window.requestAnimationFrame(this.render);
      }
    },
    loadTexture() {
      if (this.animated) {
        console.log('loading video texture');
        this.loadVideoTexture();
      }
      this.loader.load(this.imageUrl, texture => {
        console.log('loading image texture');
        texture.flipY = false;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        this.$options.texture = texture;
        this.render();
      });
    },
  },

  mounted() {
    this.$options.model = getModel();
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      1,
      1000000,
    );
    this.$options.model.zoomCameraToFit(this.camera, 1.01);
    this.$nextTick(() => {
      this.$options.context = this.$refs.canvas.getContext('2d');
      this.loadTexture()
    });
  }
};
</script>

<style scoped>
canvas {
  border-radius: inherit;
}
</style>
