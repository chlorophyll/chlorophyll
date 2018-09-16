import GraphLib from '@/common/graphlib';
import { Compilation, GraphCompiler } from '@/common/graphlib/compiler';
import { getMappedPoints, convertPointCoords, mappingTypes } from '@/common/mapping';
import _ from 'lodash';

import * as glsl from '@/common/glsl';
import { glTrace } from '@/common/util/gl_debug';
import { ShaderRunner, getFloatingPointTextureOptions } from '@/common/util/shader_runner';
import * as twgl from 'twgl.js';

function extractFromTexture(target, ident, vec2, swizzle) {
    const pos = _.isArray(vec2) ? glsl.FunctionCall('vec2', vec2) : vec2;

    return glsl.BinOp(target, '=', glsl.Dot(
        glsl.FunctionCall('texture2D', [glsl.Ident(ident), pos]),
        swizzle
    ));
}

export default class RawPatternRunner {
    constructor(gl, model, pattern, group, mapping) {
        this.gl = gl;
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
    }

    detach() {
        if (this.phaseUpdateStage) {
            this.phaseUpdateStage.detach();
        }

        if (this.pixelStage) {
            this.pixelStage.detach();
        }
        this.gl.deleteTexture(this.uCoords);
    }

    mapPositions() {
        const { coord_type, mapping_type } = this.pattern;
        const mapped_points = getMappedPoints(this.model, this.mapping, this.group, coord_type);

        return convertPointCoords(mapping_type, coord_type, mapped_points);
    }

    updatePositions() {
        const positions = this.mapPositions();
        const {gl} = this;

        for (const [idx, pos] of positions) {
            pos.toArray(this.mappedPositions, idx*4);
            this.mappedPositions[idx*4+3] = 1; // group mask
        }
        glTrace(gl, 'before setTextureFromArray');
        const textureOptions = getFloatingPointTextureOptions(gl, this.model.num_positions, 1);
        twgl.setTextureFromArray(gl, this.uCoords, this.mappedPositions, textureOptions);
        glTrace(gl, 'after setTextureFromArray');
    }

    _buildSharedTextures() {
        const width = this.model.num_pixels;
        const {gl} = this;
        this.mappedPositions = new Float32Array(width * 4);
        glTrace(gl, 'before creating uCoords texture');
        const textureOptions = {
            src: this.mappedPositions,
            ...getFloatingPointTextureOptions(gl, width, 1),
        };
        this.uCoords = twgl.createTexture(gl, textureOptions);
        glTrace(gl, 'after creating uCoords texture');
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
            glsl.UniformDecl('float', 'time'),
        ];

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
            glsl.BinOp(
                glsl.Dot(glsl.Ident('gl_FragColor'), 'rgb'),
                '=',
                glsl.FunctionCall('vec3', [
                    glsl.FunctionCall('fract', [glsl.Ident('new_phase')])
                ])
            ),
            glsl.BinOp(
                glsl.Dot(glsl.Ident('gl_FragColor'), 'a'),
                '=',
                glsl.Const(1)
            ),
        ]);

        const width = this.model.num_pixels;
        const height = num_oscillators;

        const uniforms = {
            time: 0,
            uCoords: this.uCoords,
            uColor: null,
        };

        for (let { name, getValue } of compiled.uniforms) {
            uniforms[name] = getValue();
        }

        const source = Compilation.generateSource(uniformDecls, compiled, main);

        // ideally, we would copy over the old texture and rearrange it
        // appropriately so that we don't get a discontinuity/phase reset when
        // a new oscillator is added.
        //
        // However, this is Complicated because you can't copy floating point
        // textures, and doing it by hand is error-prone
        // (aka I couldn't get it right, 8/2018)
        //
        if (!_.isEqual(new_oscillators, this.cur_oscillators)) {
            if (this.phaseUpdateStage) {
                this.phaseUpdateStage.detach();
            }
            this.phaseUpdateStage = new ShaderRunner({
                gl: this.gl,
                width,
                height,
                numTargets: 3,
                fragmentShader: source,
                uniforms
            });
        } else {
            this.phaseUpdateStage.setFragmentShader(source, uniforms);
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
        ];
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

        const source = Compilation.generateSource(uniformDecls, compiled, main);

        this.graphUniforms = compiled.uniforms;

        const uniforms = {
            time: 0,
            uCoords: this.uCoords,
            uCurPhase: null,
        };

        for (let { name, getValue } of this.graphUniforms) {
            uniforms[name] = getValue();
        }

        if (!this.pixelStage) {
            this.pixelStage =  new ShaderRunner({
                gl: this.gl,
                width: this.model.num_pixels,
                height: 1,
                numTargets: 3,
                fragmentShader: source,
                uniforms
            });
        } else {
            this.pixelStage.setFragmentShader(source);
        }
    }

    recompile() {
        this._compilePixelStage();
        this._compilePhaseUpdateStage();
    }

    updateUniforms(shader, time) {
        shader.uniforms.time = time;
        for (let {name, getValue} of this.graphUniforms) {
            shader.uniforms[name] = getValue();
        }
    }

    get num_oscillators() {
        return this.cur_oscillators.length;
    }

    step(time, pixels=null) {
        this.updateUniforms(this.pixelStage, time);
        let uCurPhase = null;
        if (this.num_oscillators > 0) {
            this.updateUniforms(this.phaseUpdateStage, time);
            const uColor = this.pixelStage.prevTexture();
            this.phaseUpdateStage.uniforms['uColor'] = uColor;
            this.phaseUpdateStage.step();
            uCurPhase = this.phaseUpdateStage.prevTexture();
        }

        this.pixelStage.uniforms['uCurPhase'] = uCurPhase;
        this.pixelStage.step(pixels);
        return this.pixelStage.prevTexture();
    }
}
