import Vue from 'vue';
import * as THREE from 'three';
import 'three-examples/Octree';
import { registerSaveField } from 'chl/savefile';

import Const from 'chl/const';
import store, { newgid } from 'chl/vue/store';

import Util from 'chl/util';
import ColorPool from 'chl/colors';

export let currentModel = null;

export function setCurrentModel(model) {
    store.commit('pixels/clear_active_selection');
    currentModel = model;
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

    let model = new Model(json);
    setCurrentModel(model);

    let all_pixels = [];
    currentModel.forEach(function(_, pixel) {
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
            let new_groups = {};
            let new_group_list = [];

            for (let group of groups) {
                new_groups[group.id] = restoreGroup(group);
                new_group_list.push(group.id);
            }

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
    return Util.clone(group);
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
    }
});

export class Model {
    constructor(json, parse=true) {
        this.strip_offsets = [0];
        this.strip_models = [];

        this._display_only = false;
        this.show_without_overlays = true;

        this.octree = new THREE.Octree({
            undeferred: true,
            depthMax: Infinity,
            objectsThreshold: 8,
        });

        if (parse) {
            this.model_info = JSON.parse(json);
        } else {
            this.model_info = json;
        }

        const { strips } = this.model_info;

        const strip_material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
            opacity: 0.50,
            transparent: true
        });
        let p_idx = 0;

        this.num_pixels = 0;

        this.all_overlays = new Map();

        for (const strip of strips) {
            this.num_pixels += strip.length;
        }
        this.colors = new Float32Array(this.num_pixels * 3);
        this.positions = new Float32Array(this.num_pixels * 3);


        for (const strip of strips) {
            let strip_geometry = new THREE.Geometry();
            let first = true;

            for (const pixel_pos of strip) {
                for (let i = 0; i < 3; i++) {
                    this.positions[3*p_idx + i] = pixel_pos[i];
                }
                if (!first) {
                    strip_geometry.vertices.push(this.getPosition(p_idx-1));
                    strip_geometry.vertices.push(this.getPosition(p_idx));
                }
                p_idx++;
                first = false;
            }

            let strip_model = new THREE.LineSegments(strip_geometry, strip_material);
            strip_model.visible = false;
            this.strip_models.push(strip_model);
            this.strip_offsets.push(p_idx);
        }
        this.num_pixels = p_idx;

        this.geometry = new THREE.BufferGeometry();
        this.geometry.addAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.addAttribute('color', new THREE.BufferAttribute(this.colors, 3));

        this.updateColors();

        this.geometry.computeBoundingSphere();
        this.geometry.computeBoundingBox();

        const modelsize = this.geometry.boundingBox.getSize();
        const max = Math.max(modelsize.x, modelsize.y, modelsize.z);

        const factor = 750 / max;

        let avg_dist = 0;

        for (let i = 0; i < this.num_pixels; i++) {
            let pos = this.getPosition(i);
            pos = pos.multiplyScalar(factor);
            if (i > 0) {
                avg_dist += pos.distanceTo(this.getPosition(i-1));
            }

            pos.toArray(this.positions, 3*i);
        }
        avg_dist /= this.num_pixels;
        this.geometry.computeBoundingSphere();
        this.geometry.computeBoundingBox();

        const pixelsize = THREE.Math.clamp(avg_dist / 3, 5, 15);
        const material = new THREE.PointsMaterial({
            size: pixelsize,
            vertexColors: THREE.VertexColors
        });
        this.particles = new THREE.Points(this.geometry, material);

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, Const.fog_start, Const.max_draw_dist);
        this.scene.add(this.particles);
        for (let model of this.strip_models) {
            this.scene.add(model);
        }

        for (let i = 0; i < this.num_pixels; i++) {
            this.octree.addObjectData(this.particles, this.getPosition(i));
            this.octree.objectsData[i].index = i;
        }
    }

    get num_strips() {
        return this.strip_offsets.length-1;
    }

    // ui
    setStripVisiblity(val) {
        for (let model of this.strip_models) {
            model.visible = val;
        }
    }

    get display_only() {
        return this._display_only;
    }

    set display_only(val) {
        this._display_only = val;
        this.updateColors();
    }

    // pixel data
    getPosition(i) {
        return new THREE.Vector3().fromArray(this.positions, 3*i);
    }

    pointsWithinRadius(point, radius) {
        return this.octree.search(point, radius);
    }

    forEach(func) {
        let strip = 0;
        for (let i = 0; i < this.num_pixels; i++) {
            if (i >= this.strip_offsets[strip+1])
                strip++;
            func(strip, i);
        }
    }

    forEachPixelInStrip(strip, func) {
        const strip_start = this.strip_offsets[strip];
        const strip_end = this.strip_offsets[strip+1];
        for (let i = strip_start; i < strip_end; i++) {
            func(i);
        }
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
        this.geometry.attributes.color.needsUpdate = true;
    }

    setFromBuffer(colorbuf) {
        for (let i = 0; i < this.num_pixels*3; i++) {
            this.colors[i] = colorbuf[i]/255;
        }
        this.updateColors();
    }

    getToBuffer(colorbuf) {
        for (let i = 0; i < this.num_pixels*3; i++) {
            colorbuf[i] = this.colors[i]*255;
        }
    }

    setColor(i, [r, g, b]) {
        this.colors[3*i+0] = r;
        this.colors[3*i+1] = g;
        this.colors[3*i+2] = b;
    }

    getDisplayColor(i) {
        if (this.display_only) {
            return [
                this.colors[3*i+0]*255,
                this.colors[3*i+1]*255,
                this.colors[3*i+2]*255
            ];
        }
    }

    setDisplayColor(i, r, g, b) {
        if (this.display_only) {
            this.setColor(i, [r/255, g/255, b/255]);
        }
    }

    save() {
        return this.model_info;
    }
}

registerSaveField('model', {
    save() {
        return currentModel.save();
    },
    restore(model_json) {
        setCurrentModel(new Model(model_json, false));
    }
});
