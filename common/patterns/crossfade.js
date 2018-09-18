import crossfadeFrag from './crossfader.frag';
import { ShaderRunner } from '@/common/util/shader_runner';
import * as glslify from 'glslify';

export default class Crossfader {
    constructor(gl, width, height, duration) {
        const uniforms = {
            uSource: gl.createTexture(),
            uTarget: gl.createTexture(),
            time: 0,
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
        this.uniforms.uSource = source;
        this.uniforms.uTarget = target;
        this.uniforms.time = time / this.duration;
        console.log(this.uniforms.time);
        this.runner.step(pixels);
        return this.runner.prevTexture();
    }
};
