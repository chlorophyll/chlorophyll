import * as THREE from 'three';
import Const from 'chl/const';
import store from 'chl/vue/store';

export let scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, Const.fog_start, Const.max_draw_dist);

export let renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setClearColor(scene.fog.color);
renderer.setPixelRatio(window.devicePixelRatio);


let ocam = new THREE.OrthographicCamera(0, 0, 0, 0, 1, Const.max_draw_dist);
ocam.zoom /= 2;
ocam.updateProjectionMatrix();

let pcam = new THREE.PerspectiveCamera(1);

function make_controls(camera) {
    let controls = new THREE.OrbitControls(this.camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.75;
    controls.enableZoom = true;
    controls.enableKeys = false;
    controls.enabled = false;
    let _controlsEnabled = true;

    let ret = {
        controls,
        get controlsEnabled() {
            return _controlsEnabled;
        },
        set controlsEnabled(val) {
            _controlsEnabled = val;
            if (this.active) {
                controls.enabled = val;
            }
        }
    };

    return ret;
}

export const screens = {
    orthographic: {
        camera: ocam,
        resize(width, height) {
            ocam.left = -width/2;
            ocam.right = width/2;
            ocam.top = height/2;
            ocam.bottom = -height/2;
            ocam.updateProjectionMatrix();
        },
        ...make_controls(ocam)
    },
    perspective: {
        camera: pcam;
        resize(width, height) {
            pcam.aspect = width / height;
            pcam.updateProjectionMatrix();
        },
        ...make_controls(pcam)
    },
};

//keyboardJS.withContext('global', function() {
//    keyboardJS.bind(Hotkey.reset_camera, function() {
//        if (activeScreen !== undefined) {
//            Util.alignWithVector(new THREE.Vector3(0, 0, 1),
//                                 screenManager.activeScreen.camera);
//        }
//    });
//});

store.registerModule('viewport', {
    namespaced: true,
    state: {
        width: 0,
        height: 0,
        activeScreenName: null,
    },
    mutations: {
        set_size(state, { width, height }) {
            state.width = width;
            state.height = height;
            for (let name in screens) {
                screens[name].resize(width, height);
            }
        },

        set_active(state, { name }) {
            state.activeScreenName = name;
            for (let p in screens) {
                screens[p].controls.enabled = false;
            }
            let active = screens[state.activeScreenName];
            active.controls.enabled = active.controlsEnabled;
        }
    },
    getters: {
        activeScreen(state) {
            return screens[state.activeScreenName];
        },
    },
});
