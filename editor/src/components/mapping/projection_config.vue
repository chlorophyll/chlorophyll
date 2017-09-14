<template>
<div>
    <vector-input title="Plane Angle"
                  min="-180" max="180"
                  :value="value.plane_angle"
                  @input="updateProjectionAndCamera" />
    <vector-input title="Origin"
                  :min="-10000" :max="10000"
                  :value="value.origin">
    </vector-input>
    <vector-input title="Rotation"
                  :min="0" :max="6.28"
                  :value="[value.rotation]"
                  @input="([angle]) => updateProjection({ angle })">
    </vector-input>
    <viewport-axes :value="proj_widget" @input="updateProjection" />
</div>
</template>

<script>
import * as THREE from 'three';
import Util from 'chl/util';
import { screenManager } from 'chl/init';
import { getCameraProjection } from 'chl/mapping/projection';

import VectorInput from '@/components/widgets/vector_input';
import ViewportAxes from '@/components/widgets/viewport_axes';
// the 'actual data' this component edits is
// origin, plane angle, rotation

// the actual 3d origin can be changed by moving the camera or moving the axes
// the actual plane angle can be changed by moving the camera or setting the vector input
// the actual rotation can be changed by moving the axes or setting the vector input

const configScreen = () => screenManager.getScreen('proj_config');

export default {
    name: 'projection-config',
    props: ['value'],
    components: { VectorInput, ViewportAxes },
    computed: {
        proj_widget() {
            const origin_3d = new THREE.Vector3();
            origin_3d.fromArray(this.value.origin);
            const {x, y} = configScreen().normalizedCoords(origin_3d);
            return {
                x,
                y,
                angle: this.value.rotation,
            };
        },
    },
    created() {
        screenManager.setActive('proj_config');
        configScreen().controls.addEventListener('end', this.updateProjection);
    },
    beforeDestroy() {
        screenManager.setActive('main');
        configScreen().controls.removeEventListener('end', this.updateProjection);
    },
    methods: {
        updateProjectionAndCamera(plane_angle) {
            const angle = new THREE.Euler(plane_angle[0],
                                          plane_angle[1],
                                          0, 'XYZ');
            const cam_up = new THREE.Vector3(0, 0, 1);
            Util.alignWithVector(cam_up.applyEuler(angle), configScreen().camera);
            this.updateProjection(this.proj_widget);

        },
        updateProjection({x, y, angle}) {
            x = x || this.proj_widget.x;
            y = y || this.proj_widget.y;
            angle = angle || this.proj_widget.angle;
            const proj = getCameraProjection(configScreen().camera, {x, y, angle});
            this.$emit('input', proj);
        },
    },
};
</script>

<style>
</style>
