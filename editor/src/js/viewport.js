import * as THREE from 'three';
import 'three-examples/controls/OrbitControls';
import keyboardJS from 'keyboardjs';
import Const from 'chl/const';
import store from 'chl/vue/store';
import Util from 'chl/util';

import Hotkey from 'chl/keybindings';

import { currentModel } from 'chl/model';


export let renderer = null;

let frontPlane = null;
let backPlane = null;

export let activeScreen = () => store.getters['viewport/activeScreen'];


function initClippingPlanes() {
    let v = new THREE.Vector3();
    activeScreen().camera.getWorldDirection(v);
    let nv = v.clone().negate();
    frontPlane = new THREE.Plane(v, Const.max_clip_plane);
    backPlane = new THREE.Plane(nv, Const.max_clip_plane);
    renderer.clippingPlanes = [];
}

function updateClippingPlanes(camera) {
    let v = new THREE.Vector3();
    camera.getWorldDirection(v);
    frontPlane.normal = v;
    backPlane.normal = v.clone().negate();
}

export function isClipped(v) {
    if (frontPlane.distanceToPoint(v) < 0)
        return true;

    if (backPlane.distanceToPoint(v) < 0)
        return true;
    return false;
}

export function initRenderer() {
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setPixelRatio(window.devicePixelRatio);
}

export function renderViewport() {
    if (!store.state.has_current_model)
        return;
    activeScreen().update();
    activeScreen().render();
}

export function getPointAt(x, y) {
    return activeScreen().getPointAt(currentModel, x, y);
}

export function screenCoords(v) {
    return activeScreen().screenCoords(v);
}

class Screen {
    constructor(camera, active) {
        this.camera = camera;
        this.renderer = renderer;
        camera.position.z = 1000;
        let controls = new THREE.OrbitControls(this.camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.75;
        controls.enableZoom = true;
        controls.enableKeys = false;
        controls.enabled = false;

        this.controls = controls;

        this.active = active;

        this.controlsEnabled = true;
    }

    get controlsEnabled() {
        return this._controlsEnabled;
    }

    set controlsEnabled(val) {
        this._controlsEnabled = val;

        if (this._active) this.controls.enabled = val;
    }

    get active() {
        return this._active || false;
    }

    set active(val) {
        this._active = val;
        if (val) {
            this.controls.enabled = this._controlsEnabled;
        } else {
            this.controls.enabled = false;
        }
    }

    update() {
        this.controls.update();
        updateClippingPlanes(this.camera);
    }

    render() {
        if (currentModel)
            renderer.render(currentModel.scene, this.camera);
    }

    screenCoords(position) {
        return Util.cameraPlaneCoords(this.camera, renderer, position);
    }

    normalizedCoords(position) {
        return Util.normalizedCoords(this.camera, renderer, position);
    }

    getPointAt(x, y) {
        const { width, height } = store.state.viewport;
        let mouse3D = new THREE.Vector3(
             (x /  width) * 2 - 1,
            -(y / height) * 2 + 1,
            0.5);
        let raycaster = new THREE.Raycaster();
        raycaster.params.Points.threshold = 10;
        raycaster.setFromCamera(mouse3D, this.camera);
        let intersects = raycaster.intersectObject(currentModel.particles);
        let chosen = undefined;
        for (let i = 0; i < intersects.length; i++) {
            if (!isClipped(intersects[i].point)) {
                chosen = intersects[i];
                break;
            }
        }
        return chosen;
    }
};

class OrthographicScreen extends Screen {
    constructor(width, height, active) {
        let camera = new THREE.OrthographicCamera(
            width / -2, width / 2,
            height / 2, height / -2,
            1, Const.max_draw_dist);
        camera.zoom /= 2;
        camera.updateProjectionMatrix();

        super(camera, active);
    }

    resize(width, height) {
        this.camera.left = -width/2;
        this.camera.right = width/2;
        this.camera.top = height/2;
        this.camera.bottom = -height/2;
        this.camera.updateProjectionMatrix();
    }
}

class PerspectiveScreen extends Screen {
    constructor(width, height, active) {
        const camera = new THREE.PerspectiveCamera(
            45, width/height, 1,
            Const.max_draw_dist);
        super(camera, active);
    }

    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
}

let screens = {};

keyboardJS.withContext('global', function() {
    keyboardJS.bind(Hotkey.reset_camera, function() {
        if (activeScreen() !== undefined) {
            Util.alignWithVector(new THREE.Vector3(0, 0, 1),
                activeScreen().camera);
        }
    });
});

store.registerModule('viewport', {
    namespaced: true,
    state: {
        width: 0,
        height: 0,
        activeScreenName: null,
    },
    mutations: {
        init(state, { width, height }) {
            screens.perspective = new PerspectiveScreen(width, height, true);
            screens.orthographic = new OrthographicScreen(width, height, false);
            state.width = width;
            state.height = height;
            renderer.setSize(width, height);
            state.activeScreenName = 'perspective';
            initClippingPlanes();
        },
        set_size(state, { width, height }) {
            state.width = width;
            state.height = height;
            screens.perspective.resize(width, height);
            screens.orthographic.resize(width, height);
            renderer.setSize(width, height);
        },
        set_orthographic(state) {
            state.activeScreenName = 'orthographic';
            screens.perspective.active = false;
            screens.orthographic.active = true;
        },
        set_perspective(state) {
            state.activeScreenName = 'perspective';
            screens.perspective.active = true;
            screens.orthographic.active = false;
        },
    },
    getters: {
        activeScreen(state) {
            return screens[state.activeScreenName];
        },
    },
});

