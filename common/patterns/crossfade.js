import crossfadeFrag from '@/common/patterns/crossfader.frag';
import { ShaderRunner, getFloatingPointTextureOptions } from '@/common/util/shader_runner';
import * as twgl from 'twgl.js';
import * as glslify from 'glslify';

export default class Crossfader {
    constructor(gl, width, height, duration) {
        const uniforms = {
            uSource: gl.createTexture(),
            uTarget: gl.createTexture(),
            amount: 0,
        };

        const zeroes = new Float32Array(2 * 2 * 4);

        this.blackFrame = twgl.createTexture(gl, {
            src: zeroes,
            ...getFloatingPointTextureOptions(gl, 2, 2),
        });

        this.runner = new ShaderRunner({
            gl,
            width,
            height,
            numTargets: 3,
            fragmentShader: glslify.compile(crossfadeFrag),
            uniforms,
        });
        this.uniforms = uniforms;
        this.duration = duration;
    }

    step(time, source, target, pixels=null) {
        const amount = time / this.duration;
        this.uniforms.uSource = source;
        this.uniforms.uTarget = target;
        this.uniforms.amount = amount;
        this.runner.step(pixels);
        return this.runner.prevTexture();
    }

    fadeToBlack(time, source, pixels=null) {
        const amount = time / this.duration;
        this.uniforms.uSource = source;
        this.uniforms.uTarget = this.blackFrame;
        this.uniforms.amount = amount;
        this.runner.step(pixels);
        return this.runner.prevTexture();
    }
};
