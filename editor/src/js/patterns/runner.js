import GraphLib from '@/common/graphlib';
import { GraphCompiler } from '@/common/graphlib/compiler';
import { getMappedPoints, convertPointCoords, mappingTypes } from '@/common/mapping';
import _ from 'lodash';
import * as THREE from 'three';
import FBO from 'three.js-fbo';

import * as glsl from '@/common/glsl';

import viewports from 'chl/viewport';

import PixelPusherRegistry from 'pixelpusher-driver';


const passthruVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

class PixelDriver {
    constructor() {
        console.log('got here');
        this.controllerForStrip = new Map();
        this.controllers = [];

        this.registry = new PixelPusherRegistry();

        this.registry.on('discovered', (controller) => this.addController(controller));
        this.registry.start();
    }

    setRunner(runner) {
        this.runner = runner;
        this.model = runner.model;
        this.pixels = new Uint8Array(3*this.model.num_pixels);
        this.dataTexture = new THREE.DataTexture(
            new Uint8Array(3*this.model.num_pixels),
            this.model.num_pixels,
            1,
            THREE.RGBFormat,
            THREE.UnsignedByteType);
    }

    addController(controller) {
        controller.setColorCorrection(0xffffff);
        this.controllers.push(controller);
        this.controllers = _.sortBy(this.controllers, 'controller_id');
    }

    makeStripBuffer(strip) {
        let num_pixels = this.model.numPixelsInStrip(strip);
        return new Buffer(3*num_pixels);
    }

    getStripBuffers() {
        let ptr = 0;

        let stripbufs = [];

        for (let strip = 0; strip < this.model.num_strips; strip++) {
            let buf = this.makeStripBuffer(strip);
            for (let i = 0; i < buf.length; i++) {
                buf[i] = this.pixels[ptr++];
            }
            stripbufs.push(buf);
        }

        return stripbufs;
    }

    pushFrame() {
        let strips_attached = 0;
        for (let controller of this.controllers) {
            strips_attached += controller.strips_attached;
        }
        if (strips_attached < this.model.num_strips)
            return;
        const { renderer } = viewports.getViewport('main');
        const gl = renderer.getContext();
        const fbo = this.runner.fbo;
        renderer.setTexture2D(this.dataTexture, 0);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGB, 0, 0, this.model.num_pixels, 1, fbo.getCurrentFrame().texture.data);
        gl.readPixels(0, 0, this.model.num_pixels, 1, gl.RGB, gl.UNSIGNED_BYTE, this.pixels);

        let stripbufs = this.getStripBuffers();
        let strip_idx = 0;
        for (let controller of this.controllers) {
            for (let cstrip = 0; strip_idx < this.model.num_strips && cstrip < controller.strips_attached; cstrip++) {
                controller.setStrip(cstrip, stripbufs[strip_idx]);
                strip_idx++;
            }
            controller.sync();
        }
    }
}

const driver = new PixelDriver();

export class PatternRunner {
    constructor(model, pattern, group, mapping) {
        const { coord_type, mapping_type } = pattern;
        this.pattern = pattern;
        this.model = model;
        this.mapped_points = getMappedPoints(model, mapping, group, coord_type);

        this.positions = convertPointCoords(mapping_type, coord_type, this.mapped_points);
        this.graph = GraphLib.graphById(pattern.stages.pixel);

        this.createFBO();

        this.listener = () => this.createFBO();

        this.pixelDriver = driver;
        driver.setRunner(this);

        this.graph.addEventListener('node-removed', this.listener);
        this.graph.addEventListener('edge-removed', this.listener);
        this.graph.addEventListener('edge-added', this.listener);
    }

    detach() {
        this.graph.removeEventListener('node-removed', this.listener);
        this.graph.removeEventListener('edge-removed', this.listener);
        this.graph.removeEventListener('edge-added', this.listener);
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
            extractFromTexture(color, 'tPrev', 'rgb'),
            extractFromTexture(groupmask, 'uGroupMask', 'r'),
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

        const mappedPositions = new Float32Array(this.model.num_pixels * 3);
        const groupMask = new Float32Array(this.model.num_pixels*3);

        for (const [idx, pos] of this.positions) {
            pos.toArray(mappedPositions, idx*3);
            groupMask[idx*3] = 1;
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
        this.fbo = new FBO({
            tWidth: this.model.num_pixels,
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
        this.fbo.setTextureUniform('uGroupMask', groupMask);
    }

    step(time) {
        this.fbo.simulationShader.uniforms['time'].value = time;
        for (let {name, getValue} of this.graphUniforms) {
            this.fbo.simulationShader.uniforms[name].value = getValue();
        }

        this.fbo.simulate();
        this.pixelDriver.pushFrame();
        return this.fbo.getCurrentFrame().texture;
    }
}
