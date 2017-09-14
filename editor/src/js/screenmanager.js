import * as THREE from 'three';
import 'three-examples/controls/OrbitControls';
import keyboardJS from 'keyboardjs';

import Hotkey from 'chl/keybindings';
import Util from 'chl/util';
import Const from 'chl/const';
import { isClipped } from 'chl/tools/selection';

// TODO(rpearl) potentially support multiple views
export function Screen(element, camera, renderer, scene) {
    let self = this;

    this.camera = camera;
    this.renderer = renderer;
    this.scene = scene;

    this.isActive = false;

    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.75;
    controls.enableZoom = true;
    controls.enableKeys = false;
    controls.enabled = false;

    this.controls = controls;

    let controlsEnabled = true;

    Object.defineProperties(this, {
        controlsEnabled: {
            get: function() { return controlsEnabled; },
            set: function(v) {
                controlsEnabled = v;
                if (self.isActive)
                    controls.enabled = v;
            }

        }
    });


    this.activate = function() {
        controls.enabled = controlsEnabled;
        self.isActive = true;
    };

    this.deactivate = function() {
        self.isActive = false;
        controls.enabled = false;
    };

    this.render = function() {
        renderer.render(scene, camera);
    };

    this.updateControls = function() {
        controls.update();
    };

    this.screenCoords = function(position) {
        return Util.cameraPlaneCoords(camera, renderer, position);
    };

    this.normalizedCoords = function(position) {
        return Util.normalizedCoords(camera, renderer, position);
    };

    this.getPointAt = function(model, x, y) {
        let mouse3D = new THREE.Vector3(
             (x / element.clientWidth ) * 2 - 1,
            -(y / element.clientHeight) * 2 + 1,
            0.5);
        let raycaster = new THREE.Raycaster();
        raycaster.params.Points.threshold = 10;
        raycaster.setFromCamera(mouse3D, camera);
        let intersects = raycaster.intersectObject(model.particles);
        let chosen = undefined;
        for (let i = 0; i < intersects.length; i++) {
            if (!isClipped(intersects[i].point)) {
                chosen = intersects[i];
                break;
            }
        }
        return chosen;
    };
}

export default function ScreenManager(viewport, renderer, scene) {
    let screens = new Map();
    let _activeScreen = undefined;

    this.addScreen = function(name, options) {
        let active = options.active || false;
        let camera;
        let width = viewport.clientWidth;
        let height = viewport.clientHeight;
        if (options.isOrtho) {
            camera = new THREE.OrthographicCamera(
                width / -2, width / 2,
                height / 2, height / -2,
                1, Const.max_draw_dist);
            camera.zoom /= 2;
            camera.updateProjectionMatrix();
        } else {
            camera = new THREE.PerspectiveCamera(45, width/height, 1,
                Const.max_draw_dist);
        }
        if (options.inheritOrientation && _activeScreen) {
            camera.position.x = _activeScreen.camera.position.x;
            camera.position.y = _activeScreen.camera.position.y;
            camera.position.z = _activeScreen.camera.position.z;
        } else {
            camera.position.z = 1000;
        }
        let screen = new Screen(viewport, camera, renderer, scene);
        screens.set(name, screen);

        if (active) {
            this.setActive(name);
        }
        return screen;
    };

    this.resize = function() {
        let width = viewport.clientWidth;
        let height = viewport.clientHeight;
        renderer.setSize(width, height);

        screens.forEach(function(screen) {
            let camera = screen.camera;

            if (camera.isOrthographicCamera) {
                camera.left = -width/2;
                camera.right = width/2;
                camera.top = height/2;
                camera.bottom = -height/2;
            } else {
                camera.aspect = width/height;
            }
            camera.updateProjectionMatrix();
        });
    };

    this.setActive = function(name) {
        let newScreen = screens.get(name);

        if (newScreen == undefined)
            return; // throw, maybe?

        if (_activeScreen)
            _activeScreen.deactivate();

        newScreen.activate();
        _activeScreen = newScreen;
    };
    this.getScreen = function(name) {
        return screens.get(name);
    };

    Object.defineProperties(this, {
        activeScreen: {
            get: function() { return _activeScreen; }
        },
    });

    this.render = function() {
        _activeScreen.updateControls();
        _activeScreen.render();
    };

    keyboardJS.withContext('global', function() {
        keyboardJS.bind(Hotkey.reset_camera, function() {
            if (_activeScreen !== undefined) {
                Util.alignWithVector(new THREE.Vector3(0, 0, 1),
                                     _activeScreen.camera);
            }
        });
    });
}
