import GraphLib from '@/common/graphlib';
import { GraphCompiler, Compilation } from '@/common/graphlib/compiler';
import { getMappedPoints, convertPointCoords, mappingTypes } from '@/common/mapping';
import _ from 'lodash';
import * as THREE from 'three';
import FBO from 'three.js-fbo';

import * as glsl from '@/common/glsl';

import viewports from 'chl/viewport';

function createDataTexture({data, tWidth, tHeight, format, filterType}) {
    const dataTexture = new THREE.DataTexture(
        data,
        tWidth,
        tHeight,
        format,
        THREE.FloatType,
    );

    dataTexture.minFilter = dataTexture.magFilter = filterType;
    dataTexture.needsUpdate = true;
    dataTexture.flipY = false;

    return dataTexture;
}

const passthruVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const GRAPH_EVENTS = [
    'node-removed',
    'node-added',
    'node-property-changed',
    'node-default-added',
    'edge-removed',
    'edge-added',
];

function extractFromTexture(target, ident, vec2, swizzle) {
    const pos = _.isArray(vec2) ? glsl.FunctionCall('vec2', vec2) : vec2;

    return glsl.BinOp(target, '=', glsl.Dot(
        glsl.FunctionCall('texture2D', [glsl.Ident(ident), pos]),
        swizzle
    ));
}

export class PatternRunner {
    constructor(model, pattern, group, mapping) {
        const { renderer } = viewports.getViewport('main');
        this.renderer = renderer;
        this.pattern = pattern;
        this.model = model;
        this.mapping = mapping;
        this.group = group;
        this.graph = GraphLib.graphById(pattern.stages.pixel);
        this.cur_oscillators = [];

        this._buildSharedTextures();

        this.refresh = (evt) => {
            this.updatePositions();
            this.recompile();
        };
        this.refresh();
        for (const event of GRAPH_EVENTS) {
            this.graph.addEventListener(event, () => this.refresh(event));
        }

    }

    detach() {
        for (const event of GRAPH_EVENTS) {
            this.graph.removeEventListener(event, this.refresh);
        }
    }

    mapPositions() {
        const { coord_type, mapping_type } = this.pattern;
        const mapped_points = getMappedPoints(this.model, this.mapping, this.group, coord_type);

        return convertPointCoords(mapping_type, coord_type, mapped_points);
    }

    updatePositions() {
        const positions = this.mapPositions();

        for (const [idx, pos] of positions) {
            pos.toArray(this.mappedPositions, idx*4);
            this.mappedPositions[idx*4+3] = 1; // group mask
        }

        this.uCoords.needsUpdate = true;
    }


    _buildSharedTextures() {
        const width = this.model.num_pixels;
        this.mappedPositions = new Float32Array(width * 4);
        this.uCoords = createDataTexture({
            data: this.mappedPositions,
            tWidth: width,
            tHeight: 1,
            format: THREE.RGBAFormat,
            filterType: THREE.NearestFilter,
        });
    }

    _compilePhaseUpdateStage() {
        const new_oscillators = this.graph.getOscillators();
        const num_oscillators = new_oscillators.length;

        if (num_oscillators == 0) {
            this.cur_oscillators = [];
            return;
        }

        const c = new GraphCompiler(this.graph);
        const context = {
            name: 'phase_update',
            inputs: [
                {name: 'cur_oscillator', type: 'int'},
                {name: 'cur_phase', type: 'float'},
            ],
            outputs: [
                {name: 'out_phase', type: 'float'},
            ]
        };
        const compiled = c.compile(context);
        const uniformDecls = [
            glsl.VaryingDecl('vec2', 'vUv'),
            glsl.UniformDecl('sampler2D', 'uCoords'),
            glsl.UniformDecl('sampler2D', 'uColor'),
            glsl.UniformDecl('sampler2D', 'tPrev'),
            glsl.UniformDecl('sampler2D', 'uPrevPhaseMap'),
            glsl.UniformDecl('sampler2D', 'uPrevPhaseTexture'),
            glsl.UniformDecl('bool', 'uReadPrevPhase'),
            glsl.UniformDecl('float', 'time'),
            ...compiled.uniforms.map(
                ({type, name}) => glsl.UniformDecl(type, glsl.Ident(name))
            ),
        ];
        const ast = compiled.source;

        const {glsl_type, glsl_swizzle} = mappingTypes[this.pattern.mapping_type];

        const coords = glsl.Variable(glsl_type, 'coords');
        const color = glsl.Variable('vec3', 'color');
        const cur_oscillator = glsl.Variable('int', 'cur_oscillator');
        const cur_phase = glsl.Variable('float', 'cur_phase');
        const new_phase = glsl.Variable('float', 'new_phase');
        const outcolor = glsl.Variable('vec3', 'outcolor');
        const vC = glsl.Variable('vec2', 'vC');

        const vCvalue = glsl.FunctionCall('vec2', [
            glsl.Dot(glsl.Ident('vUv'), 'x'),
            glsl.Const(0.5)
        ]);

        const main = glsl.FunctionDecl('void', 'main', [], [
            glsl.BinOp(cur_oscillator, '=', glsl.FunctionCall('int', [glsl.BinOp(
                glsl.Dot(glsl.Ident('vUv'), 'y'),
                '*',
                glsl.Const(num_oscillators)
            )])),
            extractFromTexture(cur_phase, 'tPrev', glsl.Ident('vUv'), 'r'),
            glsl.BinOp(vC, '=', vCvalue),
            // check if i can just use vUv for these...
            extractFromTexture(coords, 'uCoords', glsl.Ident('vC'), glsl_swizzle),
            extractFromTexture(color, 'uColor', glsl.Ident('vC'), 'rgb'),
            new_phase,
            outcolor,
            glsl.FunctionCall(c.ident(), [
                glsl.Ident('coords'),
                glsl.Ident('time'),
                glsl.Ident('color'),
                glsl.Ident('outcolor'),
                glsl.Ident('cur_oscillator'),
                glsl.Ident('cur_phase'),
                glsl.Ident('new_phase'),
            ]),
            glsl.BinOp(glsl.Ident('gl_FragColor'), '=', glsl.FunctionCall('vec4', [
                glsl.Ident('new_phase')
            ])),
        ]);

        const width = this.model.num_pixels;
        const height = num_oscillators;

        const uniforms = {
            time: { value: 0 },
            uCoords: { value: this.uCoords },
            uColor: {value: null },
        };

        for (let { name, getValue } of compiled.uniforms) {
            uniforms[name] = { value: getValue() };
        }

        const source = Compilation.global_decls().join('\n') + glsl.generate(glsl.Root([
            ...uniformDecls,
            ast,
            main
        ]));

        // ideally, we would copy over the old texture and rearrange it
        // appropriately so that we don't get a discontinuity/phase reset when
        // a new oscillator is added.
        //
        // However, this is Complicated because you can't copy floating point
        // textures, and doing it by hand is error-prone
        // (aka I couldn't get it right, 8/2018)
        //
        if (!_.isEqual(new_oscillators, this.cur_oscillators)) {
            this.phase_update_stage = new FBO({
                tWidth: width,
                tHeight: height,
                numTargets: 3,
                simulationVertexShader: passthruVertexShader,
                simulationFragmentShader: source,
                uniforms,
                renderer: this.renderer,
                format: THREE.RGBAFormat,
                filterType: THREE.NearestFilter,
            });
        } else {
            this.phase_update_stage.simulationShader.fragmentShader = source;
            const savedUniforms = this.phase_update_stage.simulationShader.uniforms;
            this.phase_update_stage.simulationShader.uniforms = {
                numFrames: savedUniforms.numFrames,
                tPrev: savedUniforms.tPrev,
                tCurr: savedUniforms.tCurr,
                ...uniforms,
            };
            this.phase_update_stage.simulationShader.needsUpdate = true;
        }
        this.cur_oscillators = new_oscillators;
    }

    _compilePixelStage() {
        const c = new GraphCompiler(this.graph);
        const compiled = c.compile();

        const uniformDecls = [
            glsl.VaryingDecl('vec2', 'vUv'),
            glsl.UniformDecl('sampler2D', 'uCoords'),
            glsl.UniformDecl('sampler2D', 'uCurPhase'),
            glsl.UniformDecl('sampler2D', 'tPrev'),
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


        const main = glsl.FunctionDecl('void', 'main', [], [
            extractFromTexture(coords, 'uCoords', glsl.Ident('vUv'), glsl_swizzle),
            extractFromTexture(groupmask, 'uCoords', glsl.Ident('vUv'), 'a'),
            extractFromTexture(color, 'tPrev', glsl.Ident('vUv'), 'rgb'),
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

        this.graphUniforms = compiled.uniforms;

        const uniforms = {
            time: { value: 0 },
            uCoords: { value: this.uCoords },
            uCurPhase: {value: null },
        };

        for (let { name, getValue } of this.graphUniforms) {
            uniforms[name] = { value: getValue() };
        }

        if (!this.pixel_stage) {
            this.pixel_stage = new FBO({
                // We actually run the shader on every pixel and black out the
                // masked pixels, which is a lot simpler than figuring out where in
                // the output texture to read from in the model_frag shader.
                tWidth: this.model.num_pixels,
                tHeight: 1,
                numTargets: 3,
                simulationVertexShader: passthruVertexShader,
                simulationFragmentShader: source,
                uniforms: uniforms,
                renderer: this.renderer,
                format: THREE.RGBAFormat,
                filterType: THREE.NearestFilter,
            });
        } else {
            this.pixel_stage.simulationShader.fragmentShader = source;
            const savedUniforms = this.pixel_stage.simulationShader.uniforms;
            this.pixel_stage.simulationShader.uniforms = {
                numFrames: savedUniforms.numFrames,
                tPrev: savedUniforms.tPrev,
                tCurr: savedUniforms.tCurr,
                ...uniforms,
            };
            this.pixel_stage.simulationShader.needsUpdate = true;
        }
    }

    recompile() {
        this._compilePixelStage();
        this._compilePhaseUpdateStage();
    }

    updateUniforms(shader, time) {
        shader.uniforms.time.value = time;
        for (let {name, getValue} of this.graphUniforms) {
            if (shader.uniforms[name]) {
                shader.uniforms[name].value = getValue();
            }
        }
    }

    get num_oscillators() {
        return this.cur_oscillators.length;
    }

    step(time) {
        this.updateUniforms(this.pixel_stage.simulationShader);
        let uCurPhase = null;
        if (this.num_oscillators > 0) {
            this.updateUniforms(this.phase_update_stage.simulationShader);
            let uColor;
            if (this.pixel_stage.count === -1) {
                uColor = this.pixel_stage.targets[0].texture;
            } else {
                uColor = this.pixel_stage.getCurrentFrame().texture;
            }
            this.phase_update_stage.simulationShader.uniforms['uColor'].value = uColor;
            this.phase_update_stage.simulate();
            uCurPhase = this.phase_update_stage.getCurrentFrame().texture;
        }

        this.pixel_stage.simulationShader.uniforms['uCurPhase'].value = uCurPhase;
        this.pixel_stage.simulate();
        return this.pixel_stage.getCurrentFrame().texture;
    }
}
