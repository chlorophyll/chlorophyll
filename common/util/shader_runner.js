import * as twgl from 'twgl.js';

const vertexShader = `
precision highp float;
attribute vec4 position;
attribute vec2 texcoord;

varying vec2 vUv;

void main() {
    gl_Position = position;
    vUv = texcoord;
}
`;

export class ShaderRunner {
    constructor({gl, width, height, numTargets, fragmentShader, uniforms}) {

        this.framebuffers = [];
        this.width = width;
        this.height = height;

        const attachments = [{
            format: gl.RGBA,
            type: gl.FLOAT,
            minMag: gl.NEAREST,
            wrap: gl.CLAMP_TO_EDGE,
            src: new Float32Array(width*height*4),
            width,
            height,
            flipY: false,
        }];

        for (let i = 0; i < numTargets; i++) {
            const fb = twgl.createFramebufferInfo(gl, attachments, width, height);
            this.framebuffers.push(fb);
        }
        this.gl = gl;
        fragmentShader = 'precision highp float;\n'+fragmentShader;
        this.programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
        this.quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

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
        gl.deleteProgram(this.programInfo.program);
        this.programInfo = twgl.createProgramInfo(gl, [vertexShader, source]);
    }

    detach() {
        const {gl} = this;
        gl.deleteProgram(this.programInfo.program);
        for (const fb of this.framebuffers) {
            gl.deleteTexture(fb.attachments[0]);
            gl.deleteFramebuffer(fb);
        }
    }

    step(debug=false) {
        const {programInfo, gl, quadBufferInfo} = this;
        gl.useProgram(programInfo.program);
        const tPrev = this.prevTexture();

        twgl.setUniforms(programInfo, this.uniforms);
        twgl.setUniforms(programInfo, {
            tPrev
        });
        twgl.setBuffersAndAttributes(gl, programInfo, quadBufferInfo);
        twgl.bindFramebufferInfo(gl, this.curFramebuffer());
        twgl.drawBufferInfo(gl, quadBufferInfo);
        const pixels = new Float32Array(this.width*this.height*4);
        if (debug) {
            gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.FLOAT, pixels);
            debugger;
        }

        const len = this.framebuffers.length;

        this.curFramebufferIndex = (this.curFramebufferIndex + 1) % len;
    }
}
