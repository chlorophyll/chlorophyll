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
        <g v-once>
            <template v-for="axis in axes">
                <g :transform="`rotate(${-radToDeg(axis.angle)}, 50, 50)`">
                    <line x1="50" y1="50" x2="99" y2="50" :stroke="axis.color" />
                    <polygon
                        points="91,46 99,50 91,54"
                        class="handle"
                        :stroke="axis.color"
                        :fill="axis.color"
                        @mouseover="startHover"
                        @mouseout="endHover"
                        @mousedown="startRotate(axis.angle)"
                    />
                </g>
            </template>
        <circle class="handle" cx="50" cy="50" r="1" stroke="white" fill="white" />
        <rect class="handle"
              x="42"
              y="42"
              width="16"
              height="16"
              stroke="white"
              fill="white"
              @mousedown="startDrag"
              />
        </g>

        </g>
    </svg>
</template>

<script>
import * as THREE from 'three';
import keyboardJS from 'keyboardjs';
import Hotkey from 'chl/keybindings';
import store from 'chl/vue/store';

const axes = [
    { angle: 0, color: '#f00' },
    { angle: Math.PI/2, color: '#0f0' },
];

export default {
    store,
    name: 'viewport-axes',
    props: ['value'],
    inject: ['localViewport'],
    data() {
        return {
            hovering: false,
            dragging: false,
            rotating: false,
            rotate_offset: 0,
            snap_angles: false,
            axes,
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
            return this.hovering && !(this.rotating || this.dragging);
        },
        angle_degrees() {
            return this.radToDeg(this.value.angle);
        },
        container_width() {
            return this.localViewport.width;
        },
        container_height() {
            return this.localViewport.height;
        }
    },

    mounted() {
        this.localViewport.$refs.overlay.appendChild(this.$el);
        keyboardJS.bind(Hotkey.widget_snap_angles, this.enableSnap, this.disableSnap);
    },

    beforeDestroy() {
        const overlay = this.localViewport.$refs.overlay;
        if (overlay)
            overlay.removeChild(this.$el);
        keyboardJS.unbind(Hotkey.widget_snap_angles, this.enableSnap, this.disableSnap);
    },

    methods: {
        radToDeg(deg) {
            return THREE.Math.radToDeg(deg);
        },

        startRotate(offset) {
            this.rotating = true;
            this.rotate_offset = offset;
            window.addEventListener('mousemove', this.rotate);
            window.addEventListener('mouseup', this.endRotate);
        },

        endRotate() {
            this.rotating = false;
            window.removeEventListener('mousemove', this.rotate);
            window.removeEventListener('mouseup', this.endRotate);
        },

        rotate(event) {
            let {pageX, pageY} = event;
            let {x, y} = this.localViewport.relativePageCoords(pageX, pageY);

            const offset = this.rotate_offset;
            const center = new THREE.Vector2(this.center_x, this.center_y);
            const mouse = new THREE.Vector2(x, y);
            mouse.sub(center);
            let angle = mouse.angle();
            angle += offset;
            if (this.snap_angles) {
                angle -= (angle % (Math.PI / 12));
            }
            this.$emit('input', {angle, x: this.value.x, y: this.value.y});
        },

        startDrag(event) {
            this.dragging = true;
            const vp = this.localViewport.$refs;
            vp.container.addEventListener('mousemove', this.drag);
            vp.container.addEventListener('mouseup', this.endDrag);
        },

        drag(event) {
            event.preventDefault();
            let {x: px, y: py} = this.localViewport.relativePageCoords(event.pageX, event.pageY);
            let x = +(px / this.container_width) * 2 - 1;
            let y = -(py / this.container_height) * 2 + 1;
            this.$emit('input', {angle: this.value.angle, x, y});
        },

        endDrag(event) {
            this.dragging = false;
            const vp = this.localViewport.$refs;
            vp.container.removeEventListener('mousemove', this.drag);
            vp.container.removeEventListener('mouseup', this.endDrag);
        },

        startHover() {
            this.hovering = true;
        },
        endHover() {
            this.hovering = false;
        },
        enableSnap() {
            this.snap_angles = true;
        },
        disableSnap() {
            this.snap_angles = false;
        }
    }
};
</script>

<style scoped>
rect {
    opacity: 0.3;
}
</style>
