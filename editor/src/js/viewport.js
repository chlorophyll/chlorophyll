import * as THREE from 'three';
import 'three-examples/controls/OrbitControls';
import keyboardJS from 'keyboardjs';
import store from 'chl/vue/store';
import Util from 'chl/util';
import Const from 'chl/const';
import Hotkey from 'chl/keybindings';

/*
 * Viewport global state tracking
 *
 * 3D viewports need to be able to be queried by other components which may not
 * be closely related in the Vue component hierarchy. They also need to carry
 * their own independent state (THREE.js cameras, renderers, etc.) which can't
 * be easily serialized.
 *
 * Thankfully, all direct changes to viewports (focus/defocus, size changes, etc.)
 * can be made locally through a parent, so we can get away with keeping
 * state in the viewport component itself without syncing anything to vuex.
 *
 * Instead, we keep track of all active viewports which need to be rendered, and
 * provide a mixin for any other vue components which need to call out to a viewport
 * (e.g. computing relative screen coordinates). If global state is needed, it should be
 * handled on a case-by-case basis in the viewport's parent component.
 */
class ViewportManager {
    constructor() {
        /*
         * A list of all current visible renderable viewports.
         * Each record contains a label and a reference to the corresponding
         * active Vue component.
         */
        this.viewports = [];
    }

    addViewport(label, component) {
        if (this.getViewport(label)) {
            console.error(`ViewportManager: viewport ${label} already exists`);
            return;
        }
        this.viewports.push({label, component});
    }

    removeViewport(label) {
        this.viewports = this.viewports.filter(vp => vp.label !== label);
    }

    getViewport(label) {
        const viewport = this.viewports.find(vp => vp.label === label);
        if (!viewport)
            return null;

        return viewport.component;
    }

    renderAll() {
        if (!store.state.has_current_model)
            return;

        for (let vp of this.viewports) {
            vp.component.update();
            vp.component.render();
        }
    }
}

const viewports = new ViewportManager();

export default viewports;

export function mainViewport() {
    return viewports.getViewport('main');
}

keyboardJS.withContext('global', function() {
    keyboardJS.bind(Hotkey.reset_camera, function() {
        if (mainViewport() !== null) {
            Util.alignWithVector(new THREE.Vector3(0, 0, 1),
                mainViewport().camera);
        }
    });
});

export function createRenderer(width, height) {
    const renderer = new THREE.WebGLRenderer({antialias: true, sortObjects: false});
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    // For some GPUs, pixel reading alignment needs to be changed from 4
    // (the default) to 1 in order to support NPO2 framebuffer textures
    const gl = renderer.getContext();
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    console.log(renderer, gl);

    return renderer;
}

export function createCamera(projection, width, height) {
    let camera;
    if (projection === 'perspective') {
        camera = new THREE.PerspectiveCamera(
            45, width / height,
            0.1, Const.max_draw_dist);
    } else {
        camera = new THREE.OrthographicCamera(
            width / -2, width / 2,
            height / 2, height / -2,
            0.1, Const.max_draw_dist);
        camera.zoom /= 2;
    }
    camera.position.z = 1000;
    camera.updateProjectionMatrix();
    return camera;
}

export const ViewportMixin = {
    methods: {
        mainViewport() {
            return viewports.getViewport('main');
        },

        getScreenCoords(label, position) {
            const vp = viewports.getViewport(label);
            if (!vp)
                return null;

            return vp.screenCoords(position);
        },

        getNormalizedCoords(label, position) {
            const vp = viewports.getViewport(label);
            if (!vp)
                return null;

            return vp.normalizedCoords(position);
        }
    }
};
