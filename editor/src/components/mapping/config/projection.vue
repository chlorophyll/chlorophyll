<template>
<div id="proj-config-container">
    <div class="panel" id="proj-config-controls">
        <div class="controls">
            <vector-input title="Plane Angle"
                          :min="min_angle" :max="max_angle"
                          :value="value.plane_angle"
                          @input="updateProjectionAndCamera" />
            <vector-input title="Origin"
                          :disabled="true"
                          :min="-10000" :max="10000"
                          :value="value.origin">
            </vector-input>
            <div class="control-row">
                <label>Rotation</label>
                <numeric-input title="Rotation"
                              :min="0" :max="2*max_angle"
                              :value="value.rotation"
                              @input="(angle) => updateProjection({ angle })" />
            </div>
        </div>
    </div>
    <div id="proj-config-vp">
        <viewport ref="viewport"
                  label="projconfig"
                  :preview="true"
                  projection="orthographic">
            <viewport-axes :value="proj_widget" @input="updateProjection" />
        </viewport>
    </div>
</div>
</template>

<script>
import * as THREE from 'three';

import Util from 'chl/util';
import store from 'chl/vue/store';
import { getCameraProjection } from '@/common/mapping/projection';

import VectorInput from '@/components/widgets/vector_input';
import NumericInput from '@/components/widgets/numeric_input';
import ViewportAxes from '@/components/widgets/viewport_axes';
import Viewport from '@/components/viewport';

// the 'actual data' this component edits is
// origin, plane angle, rotation

// the actual 3d origin can be changed by moving the camera or moving the axes
// the actual plane angle can be changed by moving the camera or setting the vector input
// the actual rotation can be changed by moving the axes or setting the vector input

export default {
    store,
    name: 'projection-config',
    props: ['value'],
    components: { VectorInput, NumericInput, Viewport, ViewportAxes },
    data() {
        return {
            min_angle: -Math.PI,
            max_angle: Math.PI,
            viewport_mounted: false,
        };
    },

    computed: {
        proj_widget() {
            const origin_3d = new THREE.Vector3();
            origin_3d.fromArray(this.value.origin);
            // The viewport takes a tick to come into existence
            const {x, y} = this.viewport_mounted
                ? this.$refs.viewport.normalizedCoords(origin_3d)
                : {x: 0, y: 0};
            return {
                x,
                y,
                angle: this.value.rotation,
            };
        }
    },

    mounted() {
        this.$nextTick(() => {
            this.$refs.viewport.controls.addEventListener('end', this.updateProjection);
            this.setCamera(this.value.plane_angle);
            this.viewport_mounted = true;
        });
    },

    beforeDestroy() {
        this.$refs.viewport.controls.removeEventListener('end', this.updateProjection);
        this.viewport_mounted = false;
    },

    methods: {
        setCamera(plane_angle) {
            const angle = new THREE.Euler(plane_angle[0],
                                          plane_angle[1],
                                          0, 'XYZ');
            const cam_up = new THREE.Vector3(0, 0, 1);
            Util.alignWithVector(cam_up.applyEuler(angle), this.$refs.viewport.camera);
        },
        updateProjectionAndCamera(plane_angle) {
            this.setCamera(plane_angle);
            this.updateProjection(this.proj_widget);
        },
        updateProjection({x, y, angle}) {
            if (x === undefined)
                x = this.proj_widget.x;
            if (y === undefined)
                y = this.proj_widget.y;
            if (angle === undefined)
                angle = this.proj_widget.angle;

            const proj = getCameraProjection(this.$refs.viewport.camera, {x, y, angle});
            this.$emit('input', proj);
        },
    },
};
</script>

<style scoped >
#proj-config-container {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
    align-items: stretch;
}

#proj-config-vp {
    flex: auto;
    height: 400px;
    position: relative;
}

#proj-config-controls {
    width: 300px;
    flex: initial;
}
</style>
