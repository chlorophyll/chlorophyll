<template>
</template>

<script>
import * as THREE from 'three';
import 'three-examples/controls/TransformControls';
import store from 'chl/vue/store';
import { mapGetters } from 'vuex';
import { currentModel } from 'chl/model';

const centerpoint_mat = new THREE.PointsMaterial({size: 30, sizeAttenuation: true});
const bounds_mat = new THREE.MeshBasicMaterial({
  wireframe: true,
  wireframeLinewidth: 1,
  color: 0x808080
});
const centerpoint_geom = new THREE.Geometry();
centerpoint_geom.vertices.push(new THREE.Vector3(0, 0, 0));

export default {
  store,
  name: 'viewport-transform-control',
  props: ['value', 'mode', 'shape'],
  data() {
    return {
      control: null,
      bounding_mesh: null,
      centerpoint: null,
      scene: null,
    };
  },
  computed: {
    ...mapGetters('viewport', ['activeScreen'])
  },
  watch: {
    value: {
      deep: true,
      handler() {
        const rot = new THREE.Euler();
        this.centerpoint.position.fromArray(this.value.position);
        this.centerpoint.setRotationFromEuler(rot.fromArray(this.value.rotation));
        this.centerpoint.scale.set(...this.value.scale);
        this.control.update();
      }
    },

    mode(mode) {
      if (this.control)
        this.control.setMode(mode);
    },

    shape(shape) {
      if (this.bounding_mesh !== null)
        this.centerpoint.remove(this.bounding_mesh);

      if (!shape)
        return;

      let geom;
      if (shape === 'cube') {
          geom = new THREE.BoxGeometry(1, 1, 1);
      } else if (shape === 'cylinder') {
          geom = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
      } else if (shape === 'sphere') {
          geom = new THREE.SphereGeometry(0.5, 8, 6);
      }
      this.bounding_mesh = new THREE.Mesh(geom, bounds_mat);
      this.centerpoint.add(this.bounding_mesh);
    }
  },

  methods: {
    update() {
      this.control.update();
    },

    onChange() {
      this.$emit('input', {
        position: this.centerpoint.position.toArray(),
        rotation: this.centerpoint.rotation.toArray().slice(0, 3),
        scale: this.value.scale
      });
    }
  },

  mounted() {
    const camera = this.activeScreen.camera;
    const renderer = this.activeScreen.renderer;
    this.control = new THREE.TransformControls(camera, renderer.domElement);
    this.centerpoint = new THREE.Points(centerpoint_geom, centerpoint_mat);
    this.scene = currentModel.scene;

    this.scene.add(this.centerpoint);
    this.control.attach(this.centerpoint);
    this.scene.add(this.control);
    this.control.setMode(this.mode);

    this.activeScreen.controls.addEventListener('change', this.update);
    this.control.addEventListener('objectChange', this.onChange);
  },

  beforeDestroy() {
    this.activeScreen.controls.removeEventListener('change', this.update);
    this.control.removeEventListener('objectChange', this.onChange);

    if (this.bounding_mesh)
      this.centerpoint.remove(this.bounding_mesh);
    this.scene.remove(this.centerpoint);
    this.scene.remove(this.control);
  }
};
</script>

<style>
</style>
