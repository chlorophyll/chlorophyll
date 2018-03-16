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
/* 
export class PatternRunner {
    constructor(model, pattern, mapping) {
        const { coord_type, mapping_type } = pattern;
        const mapped_points = getMappedPoints(model, mapping, coord_type);
        this.pattern = pattern;
        this.positions = convertPointCoords(mapping_type, coord_type, mapped_points);
        this.graph = GraphLib.graphById(pattern.stages.pixel);
    }

    compile() {
        const c = new GraphCompiler(this.graph);
        const ast = c.compile();

        const uniforms = [
            glsl.UniformDecl('sampler2D', 'uCoords'),
            glsl.UniformDecl('sampler2D', 'uColors'),
            glsl.UniformDecl('float', 'time'),
        ];
        const {glsl_type, glsl_swizzle} = mappingTypes[pattern.mapping_type];

        let coords = glsl.Variable(glsl_type, 'coords');
        let color = glsl.Variable('vec3f', 'color');

        const main = glsl.FunctionDecl('void', 'main', [], [
            glsl.BinOp(coords, '=', glsl.Dot(
                glsl.FunctionCall('texture2D', [glsl.Ident('uCoords'), glsl.Ident('vUv')]),
                glsl_swizzle
            )),
            glsl.BinOp(color, '=', glsl.Dot(
                glsl.FunctionCall('texture2D', [glsl.Ident('uColors'), glsl.Ident('vUv')]),
                'rgb'
            )),
            glsl.FunctionCall(c.ident(), [
                glsl.Ident('coords'),
                glsl.Ident('color'),
                glsl.Ident('time'),
                glsl.Ident('gl_FragColor')
            ]),
        ]);
    }

    getFrame(prevTexture, outTexture, t) {
        // textures remain in gpu memory.
        // bind prevTexture to uColors
        // bind this.positions texture to uCoords
        // set time
        // run shader
        // outTexture now holds computed frame
    }
}

*/
