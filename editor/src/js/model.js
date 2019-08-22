import Vue from 'vue';
import * as THREE from 'three';
import clone from 'clone';
import createKDTree from 'static-kdtree';

import { registerSaveField } from 'chl/savefile';

import Const from 'chl/const';
import store, { newgid } from 'chl/vue/store';

import Util, {quickSelect} from 'chl/util';
import ColorPool from 'chl/colors';

import ModelBase, { restoreAllGroups } from '@/common/model';
import modelVertexShader from 'chl/model_shader.vert';
import modelFragmentShader from 'chl/model_shader.frag';
/* hax */
import * as path from 'path';
import child_process from 'child_process';

export let currentModel = null;

function spawnMapper() {
    const w = currentModel.textureWidth;
    //currentModel.display_only = true;
    const mapServerPath = path.resolve(__dirname, '../../../operator-ui/backend/dist/map_server.js');
    console.log(mapServerPath);
    const dataDir = path.resolve(__dirname, '../../../wing-mapping');
    const child = child_process.fork(mapServerPath, [`--dataDir=${dataDir}`, '--editor'], {
        cwd: path.join(path.dirname(mapServerPath), '..'),
    });
    console.log(child);
    child.on('exit', ()=>console.log('exit'));
    child.on('message', ({cmd, args}) => {
        const strips = args;
        for (let i = 0; i < currentModel.colors.length; i++) {
            currentModel.colors[i] = 0;
        }
        for (const [s, colors] of Object.entries(strips)) {
            const strip = parseInt(s);
            let ptr = currentModel.strip_offsets[strip];
            for (let i = 0; i < Math.min(currentModel.numPixelsInStrip(strip), colors.length); i++) {
                const color = colors[i];
                for (let c = 0; c < 3; c++) {
                    currentModel.colors[3*ptr+c] = Math.max(0.2, color[c]);
                }
                ptr++;
            }
        }
        currentModel.geometry.attributes.aOverlayColor.needsUpdate = true;
    });
    window.addEventListener('beforeunload', () => child.kill());
    process.on('exit', () => child.kill());
}

export function setCurrentModel(model) {
    store.commit('update_model', model !== null);
    store.commit('pixels/clear_active_selection');
    currentModel = model;
    console.log(currentModel);
    spawnMapper();
    colorDisplay.$emit('refresh_model');
}

function createStripGroup(strip) {
    const id = newgid();

    let pixels = [];
    currentModel.forEachPixelInStrip(strip, pixel => {
        pixels.push(pixel);
    });

    let name = currentModel.stripLabel(strip);
    if (!name)
        name = `Strip ${strip + 1}`;

    createGroup({id, name, pixels});
}

export function importNewModel(json, options = {}) {
    // Always destroy state connected to the model itself.
    store.commit('pixels/clear_groups');
    ColorPool.reset();

    if (options.newProject) {
        store.commit('set_current_save_path', null);
        store.commit('mapping/clear');
        store.commit('pattern/clear');
        store.commit('playlists/clear');
        store.commit('hardware/clear');
    }

    let model = new Model(json);
    setCurrentModel(model);

    let all_pixels = [];
    currentModel.forEach(function(strip, pixel) {
        all_pixels.push(pixel);
    });

    let id = newgid();

    createGroup({
        id,
        name: 'All pixels',
        pixels: all_pixels,
    });

    for (let strip = 0; strip < currentModel.num_strips; strip++) {
        createStripGroup(strip);
    }
    return model;
}

const white = new THREE.Color(0xffffff);
const black = new THREE.Color(0x000000);

store.registerModule('pixels', {
    namespaced: true,
    state: {
        groups: {},
        group_list: [],
        active_selection: [],
    },

    mutations: {
        clear_groups(state) {
            state.groups = {};
            state.group_list = [];
        },

        clear_active_selection(state) {
            state.active_selection = [];
        },

        set_active_selection(state, pixels) {
            state.active_selection = pixels;
        },

        add_group(state, { id, name, color, pixels }) {
            Vue.set(state.groups, id, {
                id,
                name,
                pixels,
                color,
                visible: true,
            });
            state.group_list.push(id);
        },

        delete_group(state, { id }) {
            Vue.delete(state.groups, id);
            state.group_list.splice(state.group_list.indexOf(id), 1);
        },

        set_name(state, { id, name }) {
            state.groups[id].name = name;
        },

        set_color(state, { id, color }) {
            state.groups[id].color = color;
        },

        set_pixels(state, { id, pixels }) {
            state.groups[id].pixels = pixels;
        },

        set_visible(state, { id, visible }) {
            state.groups[id].visible = visible;
        },

        restore(state, groups) {
            let { new_groups, new_group_list } = restoreAllGroups(groups);

            state.groups = new_groups;
            state.group_list = new_group_list;
        }
    },
    getters: {
        group_list(state) {
            return state.group_list.map((id) => state.groups[id]);
        },
    }
});

export function createGroup({ id, name, color, pixels }) {
    color = color || ColorPool.random();
    name = name || Util.uniqueName('Group ', store.getters['pixels/group_list']);

    store.commit('pixels/add_group', {
        id,
        name,
        color,
        pixels
    });
}

export function restoreGroup(group) {
    return clone(group);
}

export function saveGroup(group) {
    let { id, name, pixels, color, visible } = group;
    return {
        id,
        name,
        pixels: [...pixels],
        color,
        visible,
    };
}

registerSaveField('groups', {
    save() {
        return store.getters['pixels/group_list'].map(saveGroup);
    },
    restore(groups) {
        store.commit('pixels/restore', groups);
    }
});

export const colorDisplay = new Vue({
    store,
    data: {
        selection_threshold: 5,
        in_progress_selection: [],
    },
    computed: {
        pixel_colors() {
            const groups = this.$store.getters['pixels/group_list'];

            let out = {};
            for (let group of groups) {
                if (!group.visible)
                    continue;
                for (let pixel of group.pixels) {
                    out[pixel] = new THREE.Color(group.color);
                }
            }
            // TODO set up some consistent thing for these so we don't need
            // to loop for every special case

            for (const pixel of this.$store.state.pixels.active_selection)  {
                out[pixel] = white;
            }

            for (let pixel of this.in_progress_selection) {
                out[pixel] = white;
            }
            return out;
        }
    },
    watch: {
        pixel_colors() {
            if (currentModel !== null)
                currentModel.updateColors();
        }
    },
    methods: {
        newModel() {
        }
    }
});

export class Model extends ModelBase {
    constructor(json, isLanding = false) {
        super(json);

        this._display_only = false;
        this.show_without_overlays = true;

        this.colors = new Float32Array(this.num_pixels * 3);
        let offsets = new Float32Array(this.num_pixels * 2);

        const width = this.textureWidth;
        // if 3, then
        // 1/6, (2/6), 3/6, (4/6), 5/6
        for (let i = 0; i < this.num_pixels; i++) {
            const row = Math.floor(i / width);
            const col = i % width;
            offsets[2*i] = (2*col+1) / (2*width);
            offsets[2*i+1] = (2*row+1) / (2*width);
        }


        const geometry = new THREE.InstancedBufferGeometry();
        // const circleGeometry = new THREE.CircleBufferGeometry(1, 6);
        // geometry.index = circleGeometry.index;
        // geometry.attributes = circleGeometry.attributes;

        const geometryCoords = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
        geometryCoords.setXYZ(0, -0.5, 0.5, 0.0);
        geometryCoords.setXYZ(1, 0.5, 0.5, 0.0);
        geometryCoords.setXYZ(2, -0.5, -0.5, 0.0);
        geometryCoords.setXYZ(3, 0.5, -0.5, 0.0);
        geometry.addAttribute('position', geometryCoords);

        const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
        uvs.setXYZ(0, 0.0, 0.0);
        uvs.setXYZ(1, 1.0, 0.0);
        uvs.setXYZ(2, 0.0, 1.0);
        uvs.setXYZ(3, 1.0, 1.0);
        geometry.addAttribute('uv', uvs);

        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1));
        const aTranslate = new THREE.InstancedBufferAttribute(this.positions, 3, false);
        const aOverlayColor = new THREE.InstancedBufferAttribute(this.colors, 3, false);
        const aOffset = new THREE.InstancedBufferAttribute(offsets, 2, false);
        geometry.addAttribute('aTranslate', aTranslate);
        geometry.addAttribute('aOverlayColor', aOverlayColor);
        geometry.addAttribute('aOffset', aOffset);
        this.geometry = geometry;

        this.updateColors();

        const texture = new THREE.DataTexture(
            new Float32Array(3*width*width),
            width,
            width,
            THREE.RGBFormat,
            THREE.FloatType
        );

        const allPositions = this.allPixelPositions().map(({pos}) => pos.toArray());

        if (this.model_info.tree) {
            this.tree = createKDTree.deserialize(this.model_info.tree);
        } else {
            this.tree = createKDTree(allPositions);
            this.model_info.tree = this.tree.serialize();
        }

        const boundingBox = new THREE.Box3();
        for (const {pos} of this.allPixelPositions()) {
            boundingBox.expandByPoint(pos);
        }
        this.boundingBox = boundingBox;

        this.boxSize = new THREE.Vector3();
        this.boundingBox.getSize(this.boxSize);

        this.center = new THREE.Vector3();
        this.boundingBox.getCenter(this.center);

        const minDistances = allPositions.map(pos => {
            const pts = this.tree.knn(pos, 2);
            const nearest = allPositions[pts[1]];
            let distsq = 0;
            for (let i = 0; i < pos.length; i++) {
                const d = nearest[i] - pos[i];
                distsq += d*d;
            }
            return distsq;
        });

        const distsq = quickSelect(minDistances, 0.75);
        const dist = Math.sqrt(distsq);

        this.pixelsize = 0.8 * dist;
        if (isLanding && this.num_pixels > 1000) {
            this.pixelsize *= 2;
        }
        this.model_info.pixelsize = this.pixelsize;

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                outlineWidth: {value: isLanding ? 0 : 0.025},
                pointSize: { value: this.pixelsize },
                computedColors: { value: texture },
                displayOnly: { value: false },
                scale: { value: 350 },
            },
            vertexShader: modelVertexShader,
            fragmentShader: modelFragmentShader,
            transparent: true,
            depthWrite: true,
            defines: {
                ALPHATEST: 0.999,
            },
            extensions: {
                derivatives: true,
            }
        });

        this.edgeMaterial = this.material.clone();
        this.edgeMaterial.depthTest = true;
        this.edgeMaterial.depthWrite = false;
        this.edgeMaterial.defines.ALPHATEST = 0.15;

        this.particles = new THREE.Mesh(this.geometry, this.material);
        this.edges = new THREE.Mesh(this.geometry, this.edgeMaterial);
        for (let obj of [this.particles, this.edges])
            obj.frustumCulled = false;

        this.scene = new THREE.Scene();
        this.scene.add(this.particles);
        this.scene.add(this.edges);
        this.scene.fog = new THREE.Fog(0x000000, Const.fog_start, Const.max_draw_dist);

        if (!isLanding) {
            this._initStripModels();
            const previewMaterial = this.material.clone();
            const previewGeometry = this.geometry.clone();
            const previewMesh = new THREE.Points(previewGeometry, previewMaterial);
            this.previewScene = new THREE.Scene();
            this.previewScene.fog = new THREE.Fog(0x000000, Const.fog_start, Const.max_draw_dist);
            this.previewScene.add(previewMesh);
            this.geometry.computeBoundingSphere();
            this.geometry.computeBoundingBox();
        }

        // this.stripStats();
    }

    setFlipCamera(val) {
        this.model_info.flip_camera = val;
    }
    getFlipCamera() {
        return this.model_info.flip_camera;
    }

    _initStripModels() {
        const stripMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
            opacity: 0.50,
            transparent: true
        });

        for (let strip = 0; strip < this.num_strips; strip++) {
            let stripGeometry = new THREE.Geometry();
            let prevPos = undefined;
            this.forEachPixelInStrip(strip, (idx) => {
                const pos = this.getPosition(idx);
                if (prevPos !== undefined) {
                    stripGeometry.vertices.push(prevPos);
                    stripGeometry.vertices.push(pos);
                }
                prevPos = pos;
            });
            let strip_model = new THREE.LineSegments(stripGeometry, stripMaterial);
            strip_model.visible = false;
            this.strip_models.push(strip_model);
            this.scene.add(strip_model);
        }
    }

    zoomCameraToFit(camera, oversizeFactor = 1.1) {
        const center = this.center;
        const {x, y, z} = this.boxSize;
        const maxDim = Math.max(x, y, z);

        if (this.model_info.flip_camera) {
            oversizeFactor *= -1;
        }


        if (camera.isPerspectiveCamera) {
            const fov = camera.fov * ( Math.PI / 180 );
            const cameraZ = Math.abs( maxDim / 2 / Math.tan( fov / 2 ) );
            camera.position.z = oversizeFactor * (center.z + cameraZ);
        } else if (camera.isOrthographicCamera) {
            const maxCameraDim = Math.max(
                camera.right - camera.left,
                camera.top - camera.bottom
            );
            camera.zoom = camera.zoom * (maxCameraDim / maxDim) / oversizeFactor;
        }

        camera.lookAt(center);
        camera.updateProjectionMatrix();
        return center;
    }

    // ui
    setStripVisibility(val) {
        for (let model of this.strip_models) {
            model.visible = val;
        }
    }

    getStripVisibility() {
        return this.strip_models[0].visible;
    }

    get display_only() {
        return this._display_only;
    }

    set display_only(val) {
        this._display_only = val;
        this.material.uniforms.displayOnly.value = val;
        this.edgeMaterial.uniforms.displayOnly.value = val;
        this.updateColors();
    }

    pointsWithinRadius(point, radius) {
        const points = [];
        this.tree.rnn(point.toArray(), radius, (idx) => {
            points.push(this.getPosition(idx));
        });
        return points;
    }

    setColorsFromOverlays() {
        let pixel_colors = colorDisplay.pixel_colors;
        let base_color = this.show_without_overlays ? white : black;

        for (let i = 0; i < this.num_pixels; i++) {
            const color = pixel_colors[i] || base_color;
            color.toArray(this.colors, 3*i);
        }
    }

    // color functions
    updateColors() {
        if (!this.display_only) {
            this.setColorsFromOverlays();
        }
        this.geometry.attributes.aOverlayColor.needsUpdate = true;
    }

    setFromTexture(texture) {
        this.material.uniforms.computedColors.value = texture;
        this.edgeMaterial.uniforms.computedColors.value = texture;
    }

    save() {
        return this.model_info;
    }

    getGroupPixels(id) {
        let group = store.state.pixels.groups[id];
        if (group === undefined)
            return undefined;

        return this.pixelPositions(group);
    }

    setPixelScaleFactor(scale) {
        if (scale <= 0 || scale > 2) {
            console.warn('MODEL', `tried to set invalid point scale factor: ${scale}`);
            return this.resetPixelScaleFactor();
        }
        this.material.uniforms.pointSize.value = this.pixelsize * scale;
        this.edgeMaterial.uniforms.pointSize.value = this.pixelsize * scale;
    }

    resetPixelScaleFactor() {
        this.material.uniforms.pointSize.value = this.pixelsize;
        this.edgeMaterial.uniforms.pointSize.value = this.pixelsize;
    }

    refreshUniforms(devicePixelRatio, height) {
        this.material.uniforms.scale.value = height * 0.7;
        this.edgeMaterial.uniforms.scale.value = height * 0.7;
    }

    stripStats() {
        for (let i = 0; i < this.num_strips; i++) {
            console.log(`STRIP ${i}:\t${this.numPixelsInStrip(i)} pixels`);
        }
    }
}

registerSaveField('model', {
    save() {
        return currentModel.save();
    },
    restore(model_json) {
        setCurrentModel(new Model(model_json));
    }
});

export function modelPreview(save_object) {
    return new Model(save_object.model, true);
}
