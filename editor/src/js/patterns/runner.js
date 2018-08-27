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
    constructor(model, pattern, group, mapping) {
        this.pattern = pattern;
        this.model = model;
        this.mapping = mapping;
        this.group = group;
        this.graph = GraphLib.graphById(pattern.stages.pixel);

        this.refresh = () => {
            this.positions = this.mapPositions();
            this.createFBO();
        };
        this.refresh();

        this.graph.addEventListener('node-removed', this.refresh);
        this.graph.addEventListener('node-added', this.refresh);
        this.graph.addEventListener('default-added', this.refresh);
        this.graph.addEventListener('edge-removed', this.refresh);
        this.graph.addEventListener('edge-added', this.refresh);
    }

    detach() {
        this.graph.removeEventListener('node-added', this.refresh);
        this.graph.removeEventListener('node-removed', this.refresh);
        this.graph.removeEventListener('default-added', this.refresh);
        this.graph.removeEventListener('edge-removed', this.refresh);
        this.graph.removeEventListener('edge-added', this.refresh);
    }

    mapPositions() {
        const { coord_type, mapping_type } = this.pattern;
        const mapped_points = getMappedPoints(this.model, this.mapping, this.group, coord_type);

        return convertPointCoords(mapping_type, coord_type, mapped_points);
    }

    createFBO() {
        const c = new GraphCompiler(this.graph);
        const compiled = c.compile();

        const uniformDecls = [
            glsl.VaryingDecl('vec2', 'vUv'),
            glsl.UniformDecl('sampler2D', 'uCoords'),
            glsl.UniformDecl('sampler2D', 'tPrev'),
            glsl.UniformDecl('sampler2D', 'uGroupMask'),
            glsl.UniformDecl('float', 'time'),
            ...compiled.uniforms.map(
                ({type, name}) => glsl.UniformDecl(type, glsl.Ident(name))
            ),
        ];
        const ast = compiled.source;
        const {glsl_type, glsl_swizzle} = mappingTypes[this.pattern.mapping_type];

        let coords = glsl.Variable(glsl_type, 'coords');
        let color = glsl.Variable('vec3', 'color');
        let outcolor = glsl.Variable('vec3', 'outcolor');
        let groupmask = glsl.Variable('float', 'groupmask');

        function extractFromTexture(target, ident, swizzle) {
            return glsl.BinOp(target, '=', glsl.Dot(
                glsl.FunctionCall('texture2D', [glsl.Ident(ident), glsl.Ident('vUv')]),
                swizzle
            ));
        }

        const main = glsl.FunctionDecl('void', 'main', [], [
            extractFromTexture(coords, 'uCoords', glsl_swizzle),
            extractFromTexture(groupmask, 'uCoords', 'a'),
            extractFromTexture(color, 'tPrev', 'rgb'),
            outcolor,
            glsl.FunctionCall(c.ident(), [
                glsl.Ident('coords'),
                glsl.Ident('time'),
                glsl.Ident('color'),
                glsl.Ident('outcolor')
            ]),
            glsl.BinOp(glsl.Ident('outcolor'), '*=', glsl.Ident('groupmask')),
            glsl.BinOp(glsl.Ident('gl_FragColor'), '=', glsl.FunctionCall('vec4', [
                glsl.Ident('outcolor'),
                glsl.Ident('groupmask'),
            ])),
        ]);

        const source = Compilation.global_decls().join('\n') + glsl.generate(glsl.Root([
            ...uniformDecls,
            ast,
            main
        ]));

        const mappedPositions = new Float32Array(this.model.num_pixels * 4);

        for (const [idx, pos] of this.positions) {
            pos.toArray(mappedPositions, idx*4);
            mappedPositions[idx*4+3] = 1; // group mask
        }

        let uniforms = {
            time: { value: 0 },
            uCoords: { value: null },
            uGroupMask: { value: null },
        };

        for (let { name, getValue } of compiled.uniforms) {
            uniforms[name] = { value: getValue() };
        }

        this.graphUniforms = compiled.uniforms;

        const { renderer } = viewports.getViewport('main');

        // For some GPUs, pixel reading alignment needs to be changed from 4
        // (the default) to 1 in order to support NPO2 framebuffer textures
        const gl = renderer.getContext();
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        this.fbo = new FBO({
            // We actually run the shader on every pixel and black out the
            // masked pixels, which is a lot simpler than figuring out where in
            // the output texture to read from in the model_frag shader.
            tWidth: this.model.num_pixels,
            tHeight: 1,
            numTargets: 3,
            simulationVertexShader: passthruVertexShader,
            simulationFragmentShader: source,
            uniforms,
            renderer,
            format: THREE.RGBAFormat,
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
