import Vue from 'vue';
import * as THREE from 'three';
import 'three-examples/Octree';
import clone from 'clone';
import _ from 'lodash';

import { registerSaveField } from 'chl/savefile';

import Const from 'chl/const';
import store, { newgid } from 'chl/vue/store';

import Util from 'chl/util';
import ColorPool from 'chl/colors';

import ModelBase, { restoreAllGroups } from '@/common/model';
import modelVertexShader from 'chl/model_shader.vert';
import modelFragmentShader from 'chl/model_shader.frag';

export let currentModel = null;

export function setCurrentModel(model) {
    store.commit('update_model', model !== null);
    store.commit('pixels/clear_active_selection');
    currentModel = model;
    colorDisplay.$emit('refresh_model');
}

function createStripGroup(strip) {
    let pixels = [];
    let id = newgid();
    currentModel.forEachPixelInStrip(strip, function(pixel) {
        pixels.push(pixel);
    });

    createGroup({
        id,
        name: `Strip ${strip+1}`,
        pixels: pixels,
    });

}

export function importNewModel(json) {
    store.commit('pixels/clear_groups');
    store.commit('mapping/clear_mappings');
    store.commit('pattern/clear_patterns');
    ColorPool.reset();

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
    constructor(json) {
        super(json);

        this._display_only = false;
        this.show_without_overlays = true;

        this.octree = new THREE.Octree({
            undeferred: true,
            depthMax: Infinity,
            objectsThreshold: 8,
        });


        const strip_material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
            opacity: 0.50,
            transparent: true
        });

        this.colors = new Float32Array(this.num_pixels * 3);
        let offsets = new Float32Array(this.num_pixels * 2);

        const width = Math.ceil(Math.sqrt(this.num_pixels));
        // if 3, then
        // 1/6, (2/6), 3/6, (4/6), 5/6
        for (let i = 0; i < this.num_pixels; i++) {
            const row = Math.floor(i / width);
            const col = i % width;
            offsets[2*i] = (2*col+1) / (2*width);
            offsets[2*i+1] = (2*row+1) / (2*width);
        }
        let totalDist = 0;
        let numDistances = 0;

        for (let strip = 0; strip < this.num_strips; strip++) {
            let strip_geometry = new THREE.Geometry();
            let prevPos = undefined;
            this.forEachPixelInStrip(strip, (idx) => {
                const pos = this.getPosition(idx);
                if (prevPos !== undefined) {
                    strip_geometry.vertices.push(prevPos);
                    strip_geometry.vertices.push(pos);
                    totalDist += pos.distanceTo(prevPos);
                    numDistances++;
                }
                prevPos = pos;
            });
            let strip_model = new THREE.LineSegments(strip_geometry, strip_material);
            strip_model.visible = false;
            this.strip_models.push(strip_model);
        }

        let avgDist = totalDist / numDistances;

        this.geometry = new THREE.BufferGeometry();
        this.geometry.addAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.addAttribute('overlayColor', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.addAttribute('aOffset', new THREE.BufferAttribute(offsets, 2));

        this.updateColors();

        this.geometry.computeBoundingSphere();
        this.geometry.computeBoundingBox();

        const texture = new THREE.DataTexture(
            new Float32Array(3*width*width),
            width,
            width,
            THREE.RGBFormat,
            THREE.FloatType
        );

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                pointSize: { value: this.pixelsize },
                computedColors: { value: texture },
                displayOnly: { value: false },
                scale: { value: 350 },
            },
            vertexShader: modelVertexShader,
            fragmentShader: modelFragmentShader,
            //depthWrite: false,
            //depthTest: false,
            transparent: true,
            extensions: {
                derivatives: true,
            }
        });


        this.particles = new THREE.Points(this.geometry, this.material);

        const previewMaterial = this.material.clone();
        const previewGeometry = this.geometry.clone();
        const previewMesh = new THREE.Points(previewGeometry, previewMaterial);

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, Const.fog_start, Const.max_draw_dist);
        this.scene.add(this.particles);

        this.previewScene = new THREE.Scene();
        this.previewScene.fog = new THREE.Fog(0x000000, Const.fog_start, Const.max_draw_dist);
        this.previewScene.add(previewMesh);

        for (let model of this.strip_models) {
            this.scene.add(model);
        }

        for (let i = 0; i < this.num_pixels; i++) {
            this.octree.addObjectData(this.particles, this.getPosition(i));
            this.octree.objectsData[i].index = i;
        }

        // randomly sample points, find the neighbors of minimum distance
        let potentialPointSize = avgDist;
        let done = false;
        let delta = avgDist;
        let iters = 0;
        totalDist = 0;
        let num = 0;
        while (!done) {
            const i = _.sample(_.range(this.num_pixels));
            const pos = this.getPosition(i);
            const points = this.pointsWithinRadius(pos, potentialPointSize);
            const distances = points.map(point => pos.distanceTo(point)).filter(d => d > 0);
            const best = _.min(distances);
            totalDist += _.sum(distances);
            num += distances.length;
            if (best < potentialPointSize) {
                delta = potentialPointSize - best;
                potentialPointSize -= (delta / 2);
            }
            done = delta < 0.001 || iters > 100;
            iters++;
        }
        this.pixelsize = 0.9 * potentialPointSize;
        const gapForAverageDist = (totalDist / num) - this.pixelsize;
        const ratio = this.pixelsize / gapForAverageDist;
        console.log(ratio);
        if (ratio > 0.25) {
            console.log('rescaling down');
            this.pixelsize = potentialPointSize * 0.5;
        } else if (ratio < 0.05) {
            console.log('rescaling up');
            this.pixelsize = potentialPointSize / (3*ratio);
        }
        this.material.uniforms.pointSize.value = this.pixelsize;
    }

    zoomCameraToFit(camera) {
        const boxSize = new THREE.Vector3();
        const center = new THREE.Vector3();
        this.geometry.computeBoundingBox();
        this.geometry.boundingBox.getSize(boxSize);
        this.geometry.boundingBox.getCenter(center);
        const {x, y, z} = boxSize;
        const maxDim = Math.max(x, y, z);

        const fov = camera.fov * ( Math.PI / 180 );

        let cameraZ = Math.abs( maxDim / 2 / Math.tan( fov / 2 ) );

        camera.position.z = 1.1*(center.z + cameraZ);

        camera.lookAt(center);
        camera.updateProjectionMatrix();

    }

    getCenter() {
        const center = new THREE.Vector3();
        this.geometry.boundingBox.getCenter(center);
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
        this.updateColors();
    }

    pointsWithinRadius(point, radius) {
        return this.octree.search(point, radius, true)[0].vertices;
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
        this.geometry.attributes.overlayColor.needsUpdate = true;
    }

    setFromTexture(texture) {
        this.material.uniforms.computedColors.value = texture;
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

    refreshUniforms(devicePixelRatio, height) {
        this.material.uniforms.pointSize.value = this.pixelsize * (devicePixelRatio||1);
        this.material.uniforms.scale.value = height * 0.7;
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
    return new Model(save_object.model);
}
