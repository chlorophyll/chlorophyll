import clone from 'clone';
import GraphLib from '@/common/graphlib';

import * as glsl from '@/common/glsl';

import { getMappedPoints, convertPointCoords, mappingTypes } from '@/common/mapping';
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
