import crossfadeFrag from '@/common/patterns/crossfader.frag';
import { ShaderRunner } from '@/common/util/shader_runner';
import * as glslify from 'glslify';

export default class Crossfader {
    constructor(gl, width, height, duration) {
        const uniforms = {
            uSource: gl.createTexture(),
            uTarget: gl.createTexture(),
            amount: 0,
        };

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
};
