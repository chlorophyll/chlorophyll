import GraphLib from '@/common/graphlib';
import { GraphCompiler } from '@/common/graphlib/compiler';
import { getMappedPoints, convertPointCoords, mappingTypes } from '@/common/mapping';

import * as THREE from 'three';
import FBO from 'three.js-fbo';

import * as glsl from '@/common/glsl';

import viewports from 'chl/viewport';


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
        const compiled = c.compile();

        const uniformDecls = [
            glsl.VaryingDecl('vec2', 'vUv'),
            glsl.UniformDecl('sampler2D', 'uCoords'),
            glsl.UniformDecl('sampler2D', 'tPrev'),
            glsl.UniformDecl('float', 'time'),
            ...compiled.uniforms.map(
                ({type, name}) => glsl.UniformDecl(type, glsl.Ident(name))
            ),
        ];
        const ast = compiled.source;
        const {glsl_type, glsl_swizzle} = mappingTypes[pattern.mapping_type];

        let coords = glsl.Variable(glsl_type, 'coords');
        let color = glsl.Variable('vec3', 'color');
        let outcolor = glsl.Variable('vec3', 'outcolor');

        const main = glsl.FunctionDecl('void', 'main', [], [
            glsl.BinOp(coords, '=', glsl.Dot(
                glsl.FunctionCall('texture2D', [glsl.Ident('uCoords'), glsl.Ident('vUv')]),
                glsl_swizzle
            )),
            glsl.BinOp(color, '=', glsl.Dot(
                glsl.FunctionCall('texture2D', [glsl.Ident('tPrev'), glsl.Ident('vUv')]),
                'rgb'
            )),
            outcolor,
            glsl.FunctionCall(c.ident(), [
                glsl.Ident('coords'),
                glsl.Ident('time'),
                glsl.Ident('color'),
                glsl.Ident('outcolor')
            ]),
            glsl.BinOp(glsl.Ident('gl_FragColor'), '=', glsl.FunctionCall('vec4', [
                glsl.Ident('outcolor'),
                glsl.Const(1.0),
            ])),
        ]);

        const source = Compilation.global_decls().join('\n') + glsl.generate(glsl.Root([
            ...uniformDecls,
            ast,
            main
        ]));

        console.log(source);

        const mappedPositions = new Float32Array(model.num_pixels * 3);
        const colors = new Float32Array(model.num_pixels * 3);

        for (const [idx, pos] of this.positions) {
            pos.toArray(mappedPositions, idx*3);
        }

        let uniforms = {
            time: { value: 0 },
            uCoords: { value: null },
        };

        for (let { name, getValue } of compiled.uniforms) {
            uniforms[name] = { value: getValue() };
        }

        this.graphUniforms = compiled.uniforms;

        const { renderer } = viewports.getViewport('main');
        this.fbo = new FBO({
            tWidth: model.num_pixels,
            tHeight: 1,
            numTargets: 3,
            simulationVertexShader: passthruVertexShader,
            simulationFragmentShader: source,
            uniforms,
            renderer,
            format: THREE.RGBFormat,
            filterType: THREE.NearestFilter,
        });

        this.fbo.setTextureUniform('uCoords', mappedPositions);

    }

    step(time) {
        this.fbo.simulationShader.uniforms['time'].value = time;
        for (let {name, getValue} of this.graphUniforms) {
            this.fbo.simulationShader.uniforms[name].value = getValue();
        }

        this.fbo.simulate();
        return this.fbo.getCurrentFrame().texture;
    }
}
