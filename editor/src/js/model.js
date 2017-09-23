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
    constructor(model, overlay_color = white) {
        this._model = model;
        this._color = overlay_color;
        this._pixels = new Immutable.Set();
        this.visible = true;
        this.priority = 0;
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
}

export default function Model(json) {
    let self = this;
    this.overlays = [];
    this.numStrips = 0;
    let stripOffsets;
    let stripModels = [];
    let numPixels;
    let pixelData;
    let colors;
    let geometry;

    this.displayOnly = false;

    let showWithoutOverlays = true;

    this.showUnderlyingModel = function() {
        showWithoutOverlays = true;
        this.updateColors();
    };

    this.hideUnderlyingModel = function() {
        showWithoutOverlays = false;
        this.updateColors();
    };

    this.octree = new THREE.Octree( {
        // when undeferred = true, objects are inserted immediately
        // instead of being deferred until next octree.update() call
        // this may decrease performance as it forces a matrix update
        undeferred: true,
        // set the max depth of tree
        depthMax: Infinity,
        // max number of objects before nodes split or merge
        objectsThreshold: 8,
    });

    this.getPosition = function(i) {
        return pixelData[i];
    };

    this.forEach = function(func) {
        let strip = 0;
        for (let i = 0; i < numPixels; i++) {
            let stripEnd = stripOffsets[strip+1];
            if (i >= stripEnd)
                strip++;
            func(strip, i);
        }
    };

    this.forEachPixelInStrip = function(strip, func) {
        let stripStart = stripOffsets[strip];
        let stripEnd = stripOffsets[strip+1];
        for (let i = stripStart; i < stripEnd; i++) {
            func(i);
        }
    };


    this.setColor = function(i, color) {
        colors[i].set(color);
        geometry.colorsNeedUpdate = true;
    };

    this.getDisplayColor = function(i) {
        if (this.displayOnly) {
            return [colors[i].r*255, colors[i].g*255, colors[i].b*255];
        }
    };

    this.setDisplayColor = function(i, r, g, b) {
        if (this.displayOnly) {
            colors[i].setRGB(r/255, g/255, b/255);
        }
    };

    this.getStrip = function(i) {
        for (let s = 0; s < stripOffsets.length-1; s++) {
            let start = stripOffsets[s];
            let end = stripOffsets[s+1];
            if (start <= i && i < end) {
                return s;
            }
        }
        return undefined;//
    };

    let setDefaultColors = function() {

        self.forEach(function(strip, i) {
            self.setColor(i, showWithoutOverlays ? white : black);
        });
    };

    this.pointsWithinRadius = function(point, radius) {
        return this.octree.search(point, radius);
    };

    this.updateColors = function() {
        if (self.displayOnly) {
            geometry.colorsNeedUpdate = true;
        } else {
            setDefaultColors();
            self.overlays.forEach(function(pri) {
                for (let i = 0, l = pri.length; i < l; i++) {
                    if (pri[i].visible) {
                        pri[i].pixels.forEach(function(px) {
                            self.setColor(px, pri[i].color);
                        });
                    }
                }
            });
        }
    };

    this.createOverlay = function(priority, color) {
        if (!priority)
            priority = 0;

        let overlay = new Overlay(this, color);
        overlay.priority = priority;

        if (!this.overlays[priority])
            this.overlays[priority] = [];
        this.overlays[priority].push(overlay);

        return overlay;
    };

    this.removeOverlay = function(overlay) {
        let pri = overlay.priority;
        let index = this.overlays[pri].indexOf(overlay);

        if (index == -1)
            return;

        this.overlays[pri].splice(index, 1);
        this.updateColors();
    };

    this.addToScene = function(scene) {
        scene.add(this.particles);
        for (let i = 0; i < stripModels.length; i++) {
            scene.add(stripModels[i]);
        }
    };

    this.setStripVisibility = function(val) {
        for (let i = 0; i < stripModels.length; i++) {
            stripModels[i].visible = val;
        }
    };

    // Initialize
    function init() {
        let model_dict = JSON.parse(json);

        stripOffsets = [0];

        let lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
            opacity: 0.50,
            transparent: true
        });

        pixelData = [];
        colors = [];
        const strips = model_dict['strips'];

        let p_idx = 0;
        for (let strip = 0; strip < strips.length; strip++) {
            let stripGeometry = new THREE.Geometry();
            for (let pixel = 0; pixel < strips[strip].length; pixel++) {
                pixelData[p_idx] = new THREE.Vector3().fromArray(strips[strip][pixel]);
                if (pixel > 0) {
                    stripGeometry.vertices.push(pixelData[p_idx - 1]);
                    stripGeometry.vertices.push(pixelData[p_idx]);
                }
                p_idx++;
                colors.push(new THREE.Color());
            }
            let model = new THREE.LineSegments(stripGeometry, lineMaterial);
            model.visible = false;
            stripModels.push(model);
            stripOffsets.push(p_idx);
        }
        numPixels = p_idx;
        self.numStrips = strips.length;

        geometry = new THREE.Geometry();
        geometry.vertices = pixelData;

        setDefaultColors();
        geometry.colors = colors;

        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();

        let modelsize = geometry.boundingBox.getSize();
        let max = Math.max(modelsize.x, modelsize.y, modelsize.z);

        let factor = 750 / max;

        let avgDist = 0;

        for (let i = 0; i < numPixels; i++) {
            pixelData[i] = pixelData[i].multiplyScalar(factor);
            if (i > 0) {
                avgDist += pixelData[i].distanceTo(pixelData[i-1]);
            }
        }
        avgDist /= numPixels;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();

        let pixelsize = THREE.Math.clamp(avgDist / 3, 5, 15);
        let material = new THREE.PointsMaterial({
            size: pixelsize,
            vertexColors: THREE.VertexColors
        });
        self.particles = new THREE.Points(geometry, material);
        self.octree.add(self.particles, {useVertices: true});

        for (let i = 0; i < numPixels; i++) {
            self.octree.objectsData[i].index = i;
        }
    }
    init();
}
