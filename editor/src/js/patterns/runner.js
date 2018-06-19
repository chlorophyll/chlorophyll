import GraphLib from '@/common/graphlib';
import { GraphCompiler } from '@/common/graphlib/compiler';
import { getMappedPoints, convertPointCoords, mappingTypes } from '@/common/mapping';

import * as THREE from 'three';
import FBO from 'three.js-fbo';

import * as glsl from '@/common/glsl';

import { renderer } from 'chl/viewport';

const passthruVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export class PatternRunner {
    constructor(model, pattern, mapping) {
        const { coord_type, mapping_type } = pattern;
        const mapped_points = getMappedPoints(model, mapping, coord_type);

        this.positions = convertPointCoords(mapping_type, coord_type, mapped_points);
        this.graph = GraphLib.graphById(pattern.stages.pixel);

        const c = new GraphCompiler(this.graph);
        const ast = c.compile();

        const uniforms = [
            glsl.VaryingDecl('vec2', 'vUv'),
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
                glsl.FunctionCall('texture2D', [glsl.Ident('tPrev'), glsl.Ident('vUv')]),
                'rgb'
            )),
            glsl.FunctionCall(c.ident(), [
                glsl.Ident('coords'),
                glsl.Ident('color'),
                glsl.Ident('time'),
                glsl.Ident('gl_FragColor')
            ]),
        ]);

        const source = Compilation.global_decls().join('\n') + glsl.generate(glsl.Root([
            ...uniforms,
            ast,
            main
        ]));

        const mappedPositions = new Float32Array(model.num_pixels * 3);
        const colors = new Float32Array(model.num_pixels * 3);

        for (const [idx, pos] of this.positions) {
            pos.toArray(mappedPositions, idx*3);
        }

        const fbo = new FBO({
            tWidth: this.num_pixels,
            tHeight: 1,
            numTargets: 3,
            uniforms: {
                time: { value: 0 },
                uCoords: { value: null },
                uColors: { value: null },
            },
            simulationVertexShader: passthruVertexShader,
            simulationFragmentShader: source,
        });

        fbo.setTextureUniform('uCoords', mappedPositions);

    }
}
