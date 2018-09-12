import * as twgl from 'twgl.js';
import { glTrace } from '@/common/util/gl_debug';

const vertexShader = `
attribute vec4 position;
attribute vec2 texcoord;

varying vec2 vUv;

void main() {
    gl_Position = position;
    vUv = texcoord;
}
`;

export function getFloatingPointTextureOptions(gl, width, height) {
    return {
        width,
        height,
        format: gl.RGBA,
        internalFormat: gl.RGBA32F,
        minMag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
        type: gl.FLOAT,
        auto: false,
    };
}

function addPrefix(fragmentShader) {
    return `
    #ifdef GL_ES
    precision highp float;
    #endif
    ${fragmentShader}`;
}

export class ShaderRunner {
    constructor({gl, width, height, numTargets, fragmentShader, uniforms}) {

        this.framebuffers = [];
        this.width = width;
        this.height = height;

        const attachments = [{
            ...getFloatingPointTextureOptions(gl, width, height),
            src: new Float32Array(width*height*4),
        }];

        for (let i = 0; i < numTargets; i++) {
            const fb = twgl.createFramebufferInfo(gl, attachments, width, height);
            this.framebuffers.push(fb);
        }
        this.gl = gl;
        fragmentShader = addPrefix(fragmentShader);
        glTrace(gl, 'before createProgram');
        this.programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
        glTrace(gl, 'before quadBuffer');
        this.quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
        glTrace(gl, 'after quadBuffer');

        this.uniforms = uniforms;

        this.curFramebufferIndex = 0;
    }

    curFramebuffer() {
        return this.framebuffers[this.curFramebufferIndex];
    }

    curTexture() {
        return this.curFramebuffer().attachments[0];
    }

    prevTexture() {
        const len = this.framebuffers.length;
        const index = (this.curFramebufferIndex + len - 1) % len;
        const fb = this.framebuffers[index];
        return fb.attachments[0];
    }

    setFragmentShader(source) {
        const {gl} = this;
        const fragmentShader = addPrefix(source);
        gl.deleteProgram(this.programInfo.program);
        this.programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
    }

    detach() {
        const {gl} = this;
        gl.deleteProgram(this.programInfo.program);
        for (const fb of this.framebuffers) {
            gl.deleteTexture(fb.attachments[0]);
            gl.deleteFramebuffer(fb);
        }
    }

    step(pixels=null) {
        const {programInfo, gl, quadBufferInfo} = this;
        glTrace(gl, 'before useProgram');
        gl.useProgram(programInfo.program);
        glTrace(gl, 'after useProgram');
        const tPrev = this.prevTexture();

        twgl.setUniforms(programInfo, this.uniforms);
        glTrace(gl, 'after setUniforms');
        twgl.setUniforms(programInfo, {
            tPrev
        });
        twgl.setBuffersAndAttributes(gl, programInfo, quadBufferInfo);
        glTrace(gl, 'after setBuffersAndAttributes');
        twgl.bindFramebufferInfo(gl, this.curFramebuffer());
        glTrace(gl, 'after bindFramebufferInfo');
        twgl.drawBufferInfo(gl, quadBufferInfo);
        glTrace(gl, 'after drawBufferInfo');
        if (pixels !== null) {
            gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.FLOAT, pixels);
            glTrace(gl, 'after readPixels');
        }

        const len = this.framebuffers.length;
        this.curFramebufferIndex = (this.curFramebufferIndex + 1) % len;

    }
}
