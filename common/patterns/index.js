import clone from 'clone';

import GraphLib from '@/common/graphlib';
import { getMappedPoints, convertPointCoords } from '@/common/mapping';
import { CRGB } from '@/common/nodes/fastled/color';

export function restorePattern(patternsnap) {
    return clone(patternsnap);
}

export function restoreAllPatterns(snapshot) {
    let new_patterns = {};
    let new_pattern_ordering = [];

    for (let pattern of snapshot) {
        new_patterns[pattern.id] = restorePattern(pattern);
        new_pattern_ordering.push(pattern.id);
    }
    return { new_patterns, new_pattern_ordering };
}

export class PatternRunner {
    constructor(model, pattern, mapping) {
        const { coord_type, mapping_type } = pattern;
        const mapped_points = getMappedPoints(model, mapping, coord_type);

        this.positions = convertPointCoords(mapping_type, coord_type, mapped_points);
        this.graph = GraphLib.graphById(pattern.stages.pixel);
    }

    getFrame(prevbuf, outbuf, t) {
        this.graph.setGlobalInputData('t', t);
        this.positions.forEach(([idx, pos]) => {
            let incolor = new CRGB(
                prevbuf[3*idx+0],
                prevbuf[3*idx+1],
                prevbuf[3*idx+2]
            );

            this.graph.setGlobalInputData('coords', pos.toArray());
            this.graph.setGlobalInputData('color', incolor);
            this.graph.runStep();
            let outcolor = this.graph.getGlobalOutputData('outcolor');

            outbuf[3*idx+0] = outcolor.r;
            outbuf[3*idx+1] = outcolor.g;
            outbuf[3*idx+2] = outcolor.b;
        });
    }
}
