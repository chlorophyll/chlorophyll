<template>
    <svg :width="size"
         :height="size"
         :style="{left: pixel_left, top: pixel_top}"
         viewBox="0 0 100 100">
        <g :transform="`rotate(${angle_degrees}, 50, 50)`">
        <circle v-if="rotate_hinting" cx="50"
                cy="50"
                r="25"
                stroke="#fff"
                fill="none"
                style="opacity: 0.4" />
        <g>
        <axis-arrow
          angle="0"
          color="#f00"
          @hoverstart="hovering=true"
          @hoverend="hovering=false"
          @drag="({x,y}) => rotate(x, y, 0)"
        />
        <axis-arrow
          angle="90"
          color="#0f0"
          @hoverstart="hovering=true"
          @hoverend="hovering=false"
          @drag="({x,y}) => rotate(x, y, Math.PI/2)"
        />
        </g>
        <circle class="handle" cx="50" cy="50" r="1" stroke="white" fill="white" />
        <rect class="handle" x="42" y="42" width="16" height="16" stroke="white" fill="white" />
        </g>
    </svg>
</template>

<script>
import * as THREE from 'three';
import { UILayout } from 'chl/init';
import Util from 'chl/util';

import AxisArrow from '@/components/widgets/arrow';

export default {
    name: 'viewport-axes',
    components: { AxisArrow },
    props: ['value'],
    mounted() {
        UILayout.viewport.appendChild(this.$el);
        this.update_container();
        window.addEventListener('resize', this.update_container);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.update_container);
    },
    data() {
        return {
            container_width: 0,
            container_height: 0,
            hovering: false,
            startangle: this.value.angle,
        };
    },
    computed: {
        size() {
            return 50 + this.container_height * 0.2;
        },
        center_x() {
            return this.container_width * (this.value.x + 1)/2;
        },
        center_y() {
            return -this.container_height * (this.value.y - 1)/2;
        },
        pixel_top() {
            return this.center_y - this.size / 2;
        },
        pixel_left() {
            return this.center_x - this.size / 2;
        },
        rotate_hinting() {
            return this.hovering;
        },
        angle_degrees() {
            return THREE.Math.radToDeg(this.value.angle);
        }
    },
    methods: {
        update_container() {
            this.container_width = UILayout.viewport.clientWidth;
            this.container_height = UILayout.viewport.clientHeight;
        },
        rotate(pageX, pageY, offset) {
            let {x, y} = Util.relativeCoords(UILayout.viewport, pageX, pageY);
            const center = new THREE.Vector2(this.center_x, this.center_y);
            const mouse = new THREE.Vector2(x, y);
            mouse.sub(center);
            let angle = mouse.angle();
            angle += offset;
            this.$emit('input', {angle, x: this.value.x, y: this.value.y});
        }
    }
};
</script>

<style scoped>
rect {
    opacity: 0.3;
}
</style>
