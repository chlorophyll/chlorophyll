<template>
</template>

<script>
import * as THREE from 'three';
import 'three-examples/controls/TransformControls';
import store from 'chl/vue/store';
import { ViewportMixin } from 'chl/viewport';
import { currentModel } from 'chl/model';

const centerpoint_mat = new THREE.PointsMaterial({
  size: 0,
  sizeAttenuation: false
});

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
  mixins: [ViewportMixin],
  props: ['value', 'mode', 'shape'],
  data() {
    return {
      control: null,
      bounding_mesh: null,
      centerpoint: null,
      scene: null,
    };
  },

  watch: {
    value: {
      deep: true,
      handler() {
        const rot = new THREE.Euler();
        this.centerpoint.position.fromArray(this.value.position);
        this.centerpoint.setRotationFromEuler(rot.fromArray(this.value.rotation));
        this.centerpoint.scale.set(...this.value.scale);
      }
    },

    mode(val) {
      if (this.control)
        this.control.setMode(val);
    },

    shape(shape) {
      this.setPreviewShape(shape);
    }
  },

  methods: {
    onChange() {
      this.$emit('input', {
        position: this.centerpoint.position.toArray(),
        rotation: this.centerpoint.rotation.toArray().slice(0, 3),
        scale: this.value.scale
      });
    },

    onStartManipulate() {
      this.mainViewport().controls.enabled = false;
    },

    onEndManipulate() {
      this.mainViewport().controls.enabled = true;
    },

    setPreviewShape(shape) {
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

  mounted() {
    const viewport = this.mainViewport();
    const {camera, renderer} = viewport;
    // Bloom & post-processing make controls hard to interact with.
    // Disable them while configuring mappings and shrink points.
    viewport.playbackMode = false;
    currentModel.setPixelScaleFactor(0.4);

    this.control = new THREE.TransformControls(camera, renderer.domElement);
    this.centerpoint = new THREE.Points(centerpoint_geom, centerpoint_mat);
    this.scene = currentModel.scene;

    this.scene.add(this.centerpoint);
    this.control.attach(this.centerpoint);
    this.scene.add(this.control);

    this.control.setMode(this.mode);
    this.setPreviewShape(this.shape);

    this.control.addEventListener('objectChange', this.onChange);
    this.control.addEventListener('mouseDown', this.onStartManipulate);
    this.control.addEventListener('mouseUp', this.onEndManipulate);
  },

  beforeDestroy() {
    const viewport = this.mainViewport();

    this.control.removeEventListener('objectChange', this.onChange);
    this.control.removeEventListener('mouseDown', this.onStartManipulate);
    this.control.removeEventListener('mouseUp', this.onEndManipulate);

    if (this.bounding_mesh)
      this.centerpoint.remove(this.bounding_mesh);
    this.scene.remove(this.centerpoint);
    this.scene.remove(this.control);
    // Reset the viewport.
    viewport.playbackMode = true;
    currentModel.resetPixelScaleFactor();
  }
};
</script>

<style>
</style>
