<template>
    <split-pane v-if="showToolbox"
                direction="vertical"
                :initial-split="[Const.toolbar_size, null]">
        <toolbox slot="first">
            <slot />
        </toolbox>
        <div slot="second" class="viewport" ref="container">
            <div ref="overlay" />
        </div>
    </split-pane>
    <!-- If there's no toolbox, still embed the tools,
         but omit the toolbox and rely on the parent to enable/disable them as needed. -->
    <div v-else class="viewport" ref="container">
        <div ref="overlay" />
        <slot />
    </div>
</template>

<script>

import * as THREE from 'three';
import debounce from 'lodash/debounce';

import Const, { ConstMixin } from 'chl/const';
import Util from 'chl/util';
import store, { newgid } from 'chl/vue/store';
import { currentModel } from 'chl/model';
import viewports, {createRenderer, createCamera} from 'chl/viewport';

import SplitPane from '@/components/widgets/split';
import Toolbox from '@/components/tools/toolbox';

export default {
    store,
    components: { SplitPane, Toolbox },
    name: 'viewport',
    mixins: [ConstMixin],
    props: {
        projection: { type: String, default: 'perspective' },
        showToolbox: { type: Boolean, default: false },
        preview: { type: Boolean, default: false },
        label: {
            type: String,
            default() {
                return `viewport-${newgid()}`;
            }
        },
    },
    /*
     * Allow any descendent of the viewport component to reference it via inject(),
     * this is necessary for tools and such to query the viewport.
     */
    provide() {
        return {
            localViewport: this
        };
    },

    data() {
        return {
            renderer: null,
            camera: null,
            controls: null,
            width: 0,
            height: 0,
            active: false,
            controlsEnabled: false
        };
    },
    watch: {
        controlsEnabled(val) {
            if (this.active && this.controls)
                this.controls.enabled = val;
        },

        active(val) {
            this.controls.enabled = val && this.controlsEnabled;
        }
    },

    mounted() {
        const container = this.$refs.container;

        this.width = container.clientWidth;
        this.height = container.clientHeight;

        this.initRenderer();
        this.initCamera();
        this.initControls();
        // this.initClippingPlanes();

        container.insertBefore(this.renderer.domElement, container.firstChild);

        this.active = true;
        this.controlsEnabled = true;
        viewports.addViewport(this.label, this);

        this.resizeDebounce = debounce(this.updateSize, 100);
        window.addEventListener('resize', this.resizeDebounce);
    },

    updated() {
        this.updateSize();
    },

    // TODO use keep-alive to avoid teardown/rebuild of renderer state
    activated() {
    },

    deactivated() {
    },

    beforeDestroy() {
        this.resizeDebounce.cancel();
        window.removeEventListener('resize', this.resizeDebounce);
        viewports.removeViewport(this.label);
    },

    methods: {

        mouseEvent(event) {
            this.$emit(event.type, event);
        },

        initRenderer() {
            this.renderer = createRenderer(this.width, this.height);
        },

        initCamera() {
            this.camera = createCamera(this.projection);
            /*
             * TODO instantiate both, then just flip between them as necessary.
             */
        },

        initControls() {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.75;
            this.controls.enableZoom = true;
            this.controls.enableKeys = false;
            this.controls.enabled = false;
        },

        updateSize() {
            this.width = this.$refs.container.clientWidth;
            this.height = this.$refs.container.clientHeight;

            // Call asynchronously to avoid blocking other UI re-rendering
            setImmediate(() => {
                if (this.projection === 'perspective') {
                    this.camera.aspect = this.width / this.height;
                } else {
                    this.camera.left = -this.width/2;
                    this.camera.right = this.width/2;
                    this.camera.top = this.height/2;
                    this.camera.bottom = -this.height/2;
                }
                this.camera.updateProjectionMatrix();

                if (currentModel) {
                    currentModel.zoomCameraToFit(this.camera);

                    const center = currentModel.getCenter();

                    this.controls.target = center;
                }

                this.renderer.setSize(this.width, this.height);
            });
        },

        update() {
            this.controls.update();
            // TODO clipping planes?
        },

        render() {
            this.renderer.setPixelRatio(window.devicePixelRatio);
            if (currentModel) {
                currentModel.setPixelRatio(window.devicePixelRatio);
                const scene = this.preview ? currentModel.previewScene : currentModel.scene;
                this.renderer.render(scene, this.camera);
            }
        },

        relativePageCoords(pageX, pageY) {
            return Util.relativeCoords(this.$refs.container, pageX, pageY);
        },

        screenCoords(position) {
            return Util.cameraPlaneCoords(this.camera, this.renderer, position);
        },

        normalizedCoords(position) {
            return Util.normalizedCoords(this.camera, this.renderer, position);
        },

        getPointAt(x, y) {
            const mouse3D = new THREE.Vector3((x /  this.width) * 2 - 1,
                                            -(y / this.height) * 2 + 1,
                                            0.5);
            const raycaster = new THREE.Raycaster();
            raycaster.params.Points.threshold = 10;
            raycaster.setFromCamera(mouse3D, this.camera);
            const intersects = raycaster.intersectObject(currentModel.particles);

            let chosen = null;
            for (let i = 0; i < intersects.length; i++) {
                if (!this.isClipped(intersects[i].point)) {
                    chosen = intersects[i];
                    break;
                }
            }
            return chosen;
        },

        /*
         * TODO maybe get rid of clipping planes
         * Are these still useful? back clipping plane maybe for performance reasons,
         * but for selection tools they're clumsy and don't do much.
         */
        initClippingPlanes() {
            const v = new THREE.Vector3();
            this.camera.getWorldDirection(v);
            const nv = v.clone().negate();
            this.frontPlane = new THREE.Plane(v, Const.max_clip_plane);
            this.backPlane = new THREE.Plane(nv, Const.max_clip_plane);
            this.renderer.clippingPlanes = [];
        },

        updateClippingPlanes(camera) {
            const v = new THREE.Vector3();
            this.camera.getWorldDirection(v);
            this.frontPlane.normal = v;
            this.backPlane.normal = v.clone().negate();
        },

        isClipped(v) {
            return false;
            /*
            return (this.frontPlane.distanceToPoint(v) < 0 ||
                    this.backPlane.distanceToPoint(v) < 0);
            */
        }
    }
};

</script>

<style scoped>
.viewport {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>
