<template>
    <split-pane v-if="showToolbox"
                direction="vertical"
                :initial-split="[Const.toolbar_size, null]">
        <div class="panel config" slot="first">
            <div class="t">
                <button class="smol" @click="openConfig">
                    <span class="material-icons">settings</span>
                </button>
            </div>
        <toolbox>
            <slot />
        </toolbox>
        </div>
        <div slot="second" class="viewport" ref="container">
            <div ref="overlay">
                <dialog-box
                    @close="closeConfig"
                    v-if="inConfig"
                    :show="true"
                    width="350px"
                    :pos="{x: 120, y: 40}"
                    title="Demo Settings">
                    <div class="controls">
                        <div class="control-row">
                            <label>Use postprocessing effects</label>
                            <div><toggle v-model="enableEffects" class="toggle"/></div>
                        </div>
                        <div class="control-row">
                            <label>Auto-rotate</label>
                            <div><toggle v-model="autoRotate" class="toggle"/></div>
                        </div>
                        <div class="control-row">
                            <label>Show strips</label>
                            <div><toggle v-model="stripVisibility" class="toggle"/></div>
                        </div>
                        <div class="control-row">
                            <label>Flip camera on initial view</label>
                            <div><toggle v-model="flipCamera" class="toggle"/></div>
                        </div>
                    </div>
                </dialog-box>
            </div>
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

import { mapState } from 'vuex';
import * as THREE from 'three';
import debounce from 'lodash/debounce';
import 'three-examples/postprocessing/EffectComposer';
import 'three-examples/postprocessing/RenderPass';
import 'three-examples/postprocessing/ShaderPass';
import 'three-examples/shaders/CopyShader';
import 'three-examples/shaders/ConvolutionShader';
import 'three-examples/shaders/LuminosityHighPassShader';

import 'three-examples/postprocessing/BloomPass';
import 'three-examples/postprocessing/UnrealBloomPass';

import Const, { ConstMixin } from 'chl/const';
import Util from 'chl/util';
import store, { newgid } from 'chl/vue/store';
import { currentModel, colorDisplay } from 'chl/model';
import viewports, {createRenderer, createCamera} from 'chl/viewport';

import DialogBox from '@/components/widgets/dialog_box';
import SplitPane from '@/components/widgets/split';
import Toggle from '@/components/widgets/toggle';
import Toolbox from '@/components/tools/toolbox';

export default {
    store,
    components: { DialogBox, SplitPane, Toolbox, Toggle },
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
        }
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
            scene: null,
            renderer: null,
            camera: null,
            renderPass: null,
            bloomPass: null,
            controls: null,
            enableEffects: true,
            playbackMode: true,
            autoRotate: false,
            stripVisibility: false,
            flipCamera: false,
            inConfig: false,
            width: 0,
            height: 0,
            active: false,
            controlsEnabled: false
        };
    },

    computed: {
        ...mapState(['has_current_model']),

        showEffects() {
            return this.enableEffects && this.playbackMode;
        }
    },

    watch: {
        projection() {
            this.updateSize();
        },
        controlsEnabled(val) {
            if (this.active && this.controls)
                this.controls.enabled = val;
        },

        active(val) {
            this.controls.enabled = val && this.controlsEnabled;
        },
        scene(val) {
            if (this.renderPass) {
                this.renderPass.scene = val;
            }
            this.updateSize();
        },
        showEffects(val) {
            if (this.bloomPass) {
                this.bloomPass.enabled = val;
            }
        },
        autoRotate(val) {
            if (this.controls) {
                this.controls.autoRotate = val;
            }
        },
        stripVisibility(val) {
            if (currentModel) {
                currentModel.setStripVisibility(val);
            }
        },
        flipCamera(val) {
            if (currentModel) {
                currentModel.setFlipCamera(val);
            }
        },
    },

    mounted() {
        const container = this.$refs.container;

        this.width = container.clientWidth;
        this.height = container.clientHeight;
        colorDisplay.$on('refresh_model', this.refreshModel);
        this.initCamera();
        this.refreshModel();
        this.initRenderer();
        this.initControls();
        // this.initClippingPlanes();

        container.insertBefore(this.renderer.domElement, container.firstChild);

        this.active = true;
        this.controlsEnabled = true;
        viewports.addViewport(this.label, this);

        this.resizeDebounce = debounce(this.updateSize, 100);
        window.addEventListener('resize', this.resizeDebounce);
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
        closeConfig() {
            this.inConfig = false;
        },
        openConfig() {
            this.inConfig = true;
        },
        refreshModel() {
            if (this.has_current_model) {
                this.scene = this.preview ? currentModel.previewScene : currentModel.scene;
                this.stripVisibility = currentModel.getStripVisibility();
            } else {
                this.scene = null;
                this.stripVisibility = false;
            }
        },
        mouseEvent(event) {
            this.$emit(event.type, event);
        },

        initRenderer() {
            this.renderer = createRenderer(this.width, this.height);
            this.renderer.autoClear = false;
            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.setSize(this.width, this.height);
            this.renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(this.width, this.height),
                0.7, 0.2, 0.25
            );

            if (!this.preview && this.showEffects) {
                this.bloomPass.enabled = true;
            }
            const screenPass = new THREE.ShaderPass(THREE.CopyShader);
            screenPass.renderToScreen = true;
            this.composer.addPass(this.renderPass);
            this.composer.addPass(this.bloomPass);
            this.composer.addPass(screenPass);
        },

        initCamera() {
            this.camera = createCamera(this.projection, this.width, this.height);
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

            if (!this.width || !this.height) {
                return;
            }

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
                    const center = currentModel.zoomCameraToFit(this.camera);

                    this.controls.target = center;
                }
                this.renderer.setSize(this.width, this.height);
                this.composer.setSize(this.width, this.height);
            });
        },

        update() {
            this.controls.update();
            // TODO clipping planes?
        },

        render() {
            this.renderer.setPixelRatio(window.devicePixelRatio);
            if (currentModel) {
                currentModel.refreshUniforms(window.devicePixelRatio, this.height);
                this.composer.render();
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
.config {
    display: flex;
}

.config > div {
    flex: 1 auto;
}

.config .toggle {
    vertical-align: middle;
    margin-top: 3px;
}

.t {
    margin-right: 1em;
}
</style>
