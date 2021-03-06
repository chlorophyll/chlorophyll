import RawPatternRunner from '@/common/patterns/runner';
import { ShaderRunner, getFloatingPointTextureOptions } from '@/common/util/shader_runner';
import _ from 'lodash';
import blendingModes from '@/common/util/blending_modes';

import * as twgl from 'twgl.js';
import * as glslify from 'glslify';

const vertexShader = `
#ifdef GL_ES
precision highp float;
#endif
attribute vec4 position;
attribute vec2 texcoord;

varying vec2 vUv;

void main() {
    gl_Position = position;
    vUv = texcoord;
}
`;

function makeBlendShader(mode) {
    return glslify.compile(`
        #ifdef GL_ES
        precision highp float;
        #endif
        uniform sampler2D texForeground;
        uniform sampler2D texBackground;

        uniform float opacity;

        varying vec2 vUv;

        #pragma glslify: blend = require(glsl-blend/${mode})

        void main() {
            vec3 foreground = texture2D(texForeground, vUv).rgb;
            vec3 background = texture2D(texBackground, vUv).rgb;

            vec3 result = blend(background, foreground, opacity);

            gl_FragColor = vec4(result, 1.);
        }
    `);
}


export default class Timeline {
    constructor(gl, model) {
        this.gl = gl;
        this.model = model;

        this.time = 0;

        this.clips = [];
        this.clipsById = new Map();

        const width = this.model.textureWidth;
        const height = width;
        const blackArray = new Float32Array(width * width * 4);

        const textureOptions = {
            src: blackArray,
            ...getFloatingPointTextureOptions(gl, width, height),
        };

        this.initialTexture = twgl.createTexture(gl, textureOptions);

        const uniforms = {
            texForeground: null,
            texBackground: this.initialTexture,
            blendMode: 1,
            opacity: 0,
        };
        const programs = {};
        for (const mode of blendingModes) {
            const src = makeBlendShader(mode.module);
            programs[mode.value] = twgl.createProgramInfo(gl, [vertexShader, src]);
        }
        this.programs = programs;

        this.mixer = new ShaderRunner({
            gl,
            width,
            height,
            numTargets: 2,
            uniforms,
        });

        this.uniforms = uniforms;
    }

    getOrCreateClip({id, pattern, blendingMode, opacity, groups, mapping, startTime, endTime}) {
        if (this.clipsById.has(id)) {
            const clip = this.clipsById.get(id);
            const {runner} = clip;
            const groupSet = new Set(groups.map(group => group.id));
            const curGroupSet = new Set(clip.groups.map(group => group.id));

            if (clip.mapping.id !== mapping.id || !_.isEqual(groupSet, curGroupSet)) {
                clip.groups = groups;
                clip.mapping = mapping;
                runner.updatePixels(groups, mapping);
            }
            return clip;
        }
        const {gl, model} = this;
        const runner = new RawPatternRunner(gl, model, pattern, groups, mapping);
        const clip = {
            id,
            runner,
            pattern,
            groups,
            mapping,
            blendingMode,
            startTime,
            endTime,
            time: 0,
            opacity,
            playing: false,
        };
        this.clipsById.set(id, clip);
        return clip;
    }

    updateClips(clipInfos) {
        const clipsAfterUpdate = [];
        const removedClipIds = new Set(this.clipsById.keys());
        for (const clipInfo of clipInfos) {
            const clip = this.getOrCreateClip(clipInfo);
            clip.blendingMode = clipInfo.blendingMode;
            clip.layerIndex = clipInfo.layerIndex;
            clip.startTime = clipInfo.startTime;
            clip.endTime = clipInfo.endTime;
            clip.fadeInTime = clipInfo.fadeInTime;
            clip.fadeOutTime = clipInfo.fadeOutTime;
            clip.opacity = clipInfo.opacity;

            clipsAfterUpdate.push(clip);
            removedClipIds.delete(clip.id);
        }

        for (const clipId of removedClipIds) {
            const clip = this.clipsById.get(clipId);
            this.clipsById.delete(clipId);
            clip.runner.detach();
        }
        this.clips = _.sortBy(clipsAfterUpdate, clip => clip.layerIndex);
    }

    stop() {
        for (const clip of this.clips) {
            const {pattern, groups, mapping} = clip;
            const {gl, model} = this;
            clip.runner.detach();
            clip.runner = new RawPatternRunner(gl, model, pattern, groups, mapping);
            clip.time = 0;
        }
        this.time = 0;
    }

    pause() {
        for (const clip of this.clips) {
            if (clip.startTime <= this.time && clip.endTime >= this.time) {
                clip.runner.pause();
            }
        }
    }

    step(pixels=null) {
        const activeClips = this.clips.filter(clip => (
            clip.startTime <= this.time && clip.endTime >= this.time
        ));

        let background = this.initialTexture;
        for (let i = activeClips.length-1; i >= 0; i--) {
            const clip = activeClips[i];
            if (clip.startTime === this.time) {
                clip.runner.start();
            }

            const texture = clip.runner.step(clip.time);
            const {blendingMode} = clip;
            const timeRemaining = clip.endTime - clip.time;

            let opacity = clip.opacity;
            if (clip.time < clip.fadeInTime) {
                opacity *= clip.time / clip.fadeInTime;
            } else if (timeRemaining < clip.fadeOutTime) {
                opacity *= timeRemaining / clip.fadeOutTime;
            }
            clip.time++;

            if (clip.endTime === this.time) {
                clip.runner.stop();
            }
            this.uniforms.texBackground = background;
            this.uniforms.texForeground = texture;
            this.uniforms.opacity = opacity;
            this.mixer.programInfo = this.programs[blendingMode];
            const buf = i === 0 ? pixels : null;
            this.mixer.step(buf);
            background = this.mixer.prevTexture();
        }
        this.time++;
        const done = activeClips.length === 0;
        return {texture: background, done};
    }
}
