import Immutable from 'immutable';
import * as THREE from 'three';
import 'three-examples/Octree';

export let currentModel = null;


export function initModelFromJson(json) {
    let model = new Model(json);
    currentModel = model;
    return model;
}

const white = new THREE.Color(0xffffff);
const black = new THREE.Color(0x000000);

export class Overlay {
    constructor(model, overlay_color = white, priority = 0) {
        this._model = model;
        this._color = overlay_color;
        this._pixels = new Immutable.Set();
        this.visible = true;
        this.priority = priority;
    }

    get color() {
        return this._color;
    }

    set color(val) {
        this._color = val;
        this._model.updateColors();
    }

    get pixels() {
        return this._pixels;
    }

    set pixels(val) {
        this._pixels = val;
        this._model.updateColors();
    }

    show() {
        if (this.visible) {
            this.pixels.forEach((px) => this._model.setColor(px, this.color.toArray()));
        }
    }
}

class Model {
    constructor(json) {
        this.overlays = {};
        this.strip_offsets = [0];
        this.strip_models = [];

        this._display_only = false;

        this.octree = new THREE.Octree({
            undeferred: true,
            depthMax: Infinity,
            objectsThreshold: 8,
        });

        const model_info = JSON.parse(json);
        const { strips } = model_info;

        const strip_material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
            opacity: 0.50,
            transparent: true
        });
        let p_idx = 0;

        this.num_pixels = 0;

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

        this.setDefaultColors();

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
        this.setDefaultColors();
        this.updateColors();
    }

    addToScene(scene) {
        scene.add(this.particles);
        for (let model of this.strip_models) {
            scene.add(model);
        }
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

    // overlay functions
    createOverlay(priority, color) {
        const overlay = new Overlay(this, color, priority);

        if (!this.overlays[priority])
            this.overlays[priority] = [];

        this.overlays[priority].push(overlay);

        return overlay;
    }

    removeOverlay(overlay) {
        let pri = overlay.priority;
        let index = this.overlays[pri].indexOf(overlay);

        if (index == -1)
            return;

        this.overlays[pri].splice(index, 1);
        this.updateColors();
    }

    setColorsFromOverlays() {
        this.setDefaultColors();
        for (let pri in this.overlays) {
            for (let overlay of this.overlays[pri]) {
                overlay.show();
            }
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

    setDefaultColors() {
        this.forEach((strip, i) => {
            let c = this.show_without_overlays ? white : black;
            this.setColor(i, c.toArray());
        });
    }

}
