import * as THREE from 'three';
import Const from 'chl/const';

export let scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, Const.fog_start, Const.max_draw_dist);

export let renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setClearColor(scene.fog.color);
renderer.setPixelRatio(window.devicePixelRatio);


class Screen {
    constructor(camera, active) {
        this.camera = camera;
        camera.position.x = orientation.x;
        camera.position.y = orientation.y;
        camera.position.z = orientation.z;
        let controls = new THREE.OrbitControls(this.camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.75;
        controls.enableZoom = true;
        controls.enableKeys = false;
        controls.enabled = false;

        this.controls = controls;

        this._controlsEnabled = true;
    }

    get controlsEnabled() {
        return this._controlsEnabled;
    }

    set controlsEnabled(val) {
        this._controlsEnabled = val;
        if (self.isActive)
            controls.enabled = val;
    }

    activate() {
        this.isActive = true;
        controls.enabled = this._controlsEnabled;
    }

    deactivate() {
        this.isActive = false;
        controls.enabled = false;
    }

    render() {
        renderer.render(scene, this.camera);
    }

    screenCoords(position) {
        return Util.cameraPlaneCoords(this.camera, renderer, position);
    }

    normalizedCoords(position) {
        return Util.normalizedCoords(this.camera, renderer, position);
    }

    getPointAt(model, x, y) {
        let mouse3D = new THREE.Vector3(
             (x / element.clientWidth ) * 2 - 1,
            -(y / element.clientHeight) * 2 + 1,
            0.5);
        let raycaster = new THREE.Raycaster();
        raycaster.params.Points.threshold = 10;
        raycaster.setFromCamera(mouse3D, this.camera);
        let intersects = raycaster.intersectObject(model.particles);
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

class OrthoScreen extends Screen {
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
        camera.left = -width/2;
        camera.right = width/2;
        camera.top = height/2;
        camera.bottom = -height/2;
        camera.updateProjectionMatrix();
    }
}

class PerspectiveScreen extends Screen {
    constructor(width, height, active) {
        const camera = new THREE.PerspectiveCamera(
            45, width/height, 1,
            Const.max_draw_dist);
        super(camera);
    }

    resize(width, height) {
        camera.aspect = width / height;
    }
}

export const screenManager = {
    activeScreen: undefined,
    screens: new Map(),
    resize() {
        renderer.setSize(store.viewport.width, store.viewport.height);
        this.screens.forEach((screen) => screen.resize());
    },

    addOrthoScreen(name, { active = false }) {
        const screen = new OrthoScreen(store.viewport.width, store.viewport.height);
        this.screens.set(name, screen);
        return screen;
    },

    addPerspectiveScreen(name, { active = false}) {
        const screen = new PerspectiveScreen(store.viewport.width, store.viewport.height);
        this.screens.set(name, screen);
        return screen;
    },

    setActive(name) {
        const newScreen = this.screens.get(name);

        if (newScreen === undefined)
            return;

        if (activeScreen)
            activeScreen.deactivate();

        newScreen.activate();
        this.activeScreen = newScreen;
    }
};

keyboardJS.withContext('global', function() {
    keyboardJS.bind(Hotkey.reset_camera, function() {
        if (activeScreen !== undefined) {
            Util.alignWithVector(new THREE.Vector3(0, 0, 1),
                                 screenManager.activeScreen.camera);
        }
    });
});

store.registerModule('viewport', {
    namespaced: true,
    state: {
        width: 0,
        height: 0,
    },
    mutations: {
        set_size(state, { width, height }) {
            state.width = width;
            state.height = height;
            screenManager.resize();
        },
    },
});
