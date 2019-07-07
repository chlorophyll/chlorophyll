import { Vector3 } from 'three';
import clone from 'clone';

export default class ModelBase {
    constructor(json) {
        this.strip_offsets = [0];
        this.strip_models = [];
        this.num_pixels = 0;
        this.model_info = json;
        this.strip_labels = [];

        let { strips } = this.model_info;
        strips = strips.map((s, i) => {
            if (Array.isArray(s)) {
                // Plain format: Strip as an array of pixel positions.
                this.strip_labels.push(null);
                return s;
            } else {
                // Labeled format: Strip as a {label, pixels} object.
                this.strip_labels.push(s.label || `strip_${i}`);
                return s.pixels;
            }
        });

        for (const strip of strips) {
            this.num_pixels += strip.length;
        }
        this.positions = new Float32Array(this.num_pixels * 3);

        let p_idx = 0;

        for (const strip of strips) {
            for (const pos of strip) {
                for (let i = 0; i < 3; i++) this.positions[3*p_idx + i] = pos[i];
                p_idx++;
            }
            this.strip_offsets.push(p_idx);
        }
    }

    get num_strips() {
        return this.strip_offsets.length-1;
    }

    getPosition(i) {
        return new Vector3().fromArray(this.positions, 3*i);
    }

    save() {
        return this.model_info;
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

    allPixelPositions() {
        const positions = [];
        for (let idx = 0; idx < this.num_pixels; idx++) {
            positions.push({idx, pos: this.getPosition(idx)});
        }
        return positions;
    }

    pixelPositions(group) {
        return group.pixels.map((idx) => ({idx, pos: this.getPosition(idx)}));
    }

    numPixelsInStrip(strip) {
        return this.strip_offsets[strip+1] - this.strip_offsets[strip];
    }

    stripLabel(strip) {
        return this.strip_labels[strip];
    }

    getStripByLabel(label) {
        return this.strip_labels.findIndex(l => l === label);
    }
}

export function restoreGroup(group) {
    return clone(group);
}

export function restoreAllGroups(groups) {
    let new_groups = {};
    let new_group_list = [];

    for (let group of groups) {
        new_groups[group.id] = restoreGroup(group);
        new_group_list.push(group.id);
    }

    return {new_groups, new_group_list};
}
