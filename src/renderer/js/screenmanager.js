import * as THREE from 'three';
import keyboardJS from 'keyboardjs';
import Util from 'chl/util';

// TODO(rpearl) potentially support multiple views
export function Screen(camera, renderer, scene) {
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
            get: function() {
                return controlsEnabled;
            },
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

    this.getPointAt = function(model, x, y) {
        let mouse3D = new THREE.Vector3(
             (x / container.clientWidth ) * 2 - 1,
            -(y / container.clientHeight) * 2 + 1,
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

export default function ScreenManager(renderer, scene) {
    let screens = {};
    let _activeScreen = undefined;

    this.addScreen = function(name, options) {
        let active = options.active || false;
        let camera;
        let width = container.clientWidth;
        let height = container.clientHeight;
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
        let screen = new Screen(camera, renderer, scene);
        screens[name] = screen;

        if (options.active) {
            this.setActive(name);
        }
        return screen;
    };

    this.resize = function() {
        let width = container.clientWidth;
        let height = container.clientHeight;
        renderer.setSize(width, height);

        for (let name in screens) {
            let camera = screens[name].camera;

            if (camera.isOrthographicCamera) {
                camera.left = -width/2;
                camera.right = width/2;
                camera.top = height/2;
                camera.bottom = -height/2;
            } else {
                camera.aspect = width/height;
            }
            camera.updateProjectionMatrix();
        }
    };

    this.setActive = function(name) {
        let newScreen = screens[name];
        if (_activeScreen)
            _activeScreen.deactivate();

        newScreen.activate();
        _activeScreen = newScreen;
    };

    Object.defineProperties(this, {
        activeScreen: {
            get: function() {
                return _activeScreen;
            }
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
