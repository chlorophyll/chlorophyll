import EventEmitter from 'events';
import mixerFrag from '@/common/patterns/mixer.frag';
import RawPatternRunner from '@/common/patterns/runner';
import { ShaderRunner, getFloatingPointTextureOptions } from '@/common/util/shader_runner';

import * as twgl from 'twgl.js';
import * as glslify from 'glslify';

export default class Mixer extends EventEmitter {
    constructor(gl, model) {
        super();
        this.gl = gl;
        this.model = model;

        this.clips = [];
        this.clipsById = new Map();

        const uniforms = {
            texForeground: null,
            texBackground: null,
            blendMode: 1,
            opacity: 0,
        };

        const width = this.model.textureWidth;
        const height = width;

        this.layerBlender = new ShaderRunner({
            gl,
            width,
            height,
            numTargets: 3,
            fragmentShader: glslify.compile(mixerFrag),
            uniforms,
        });

        const blackArray = new Float32Array(width * width * 4);
        const textureOptions = {
            src: blackArray,
            ...getFloatingPointTextureOptions(gl, width, height),
        };

        this.initalTexture = twgl.createTexture(gl, textureOptions);

        this.uniforms = uniforms;
    }

    getOrCreateClip({id, pattern, group, mapping}) {
        if (this.clipsById.has(id)) {
            const clip = this.clipsById.get(id);
            return clip;
        }
        const {gl, model} = this;
        const runner = new RawPatternRunner(gl, model, pattern, group, mapping);
        const clip = {
            id,
            runner,
            pattern,
            group,
            mapping,
            time: 0,
            opacity: 0,
            blendMode: 1,
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
            clipsAfterUpdate.push(clip);
            removedClipIds.delete(clip.id);
        }

        for (const clipId of removedClipIds) {
            const clip = this.clipsById.get(clipId);
            clip.runner.detach();
        }
        this.clips = clipsAfterUpdate;
    }

    getTimesByClipId() {
        const out = {};
        for (const clip of this.clips) {
            out[clip.id] = clip.time;
        }
        return out;
    }

    playClip(clipId) {
        const clip = this.clipsById.get(clipId);
        if (!clip) {
            return;
        }
        clip.playing = true;
    }

    pauseClip(clipId) {
        const clip = this.clipsById.get(clipId);
        if (!clip) {
            return;
        }
        clip.playing = false;
    }

    stopClip(clipId) {
        const clip = this.clipsById.get(clipId);
        if (!clip) {
            return;
        }
        clip.playing = false;
        const {pattern, group, mapping} = clip;
        const {gl, model} = this;
        clip.runner.detach();
        clip.runner = new RawPatternRunner(gl, model, pattern, group, mapping);
        clip.time = 0;
        clip.playing = false;
    }

    step(pixels=null) {
        const activeLayers = [];
        for (const clip of this.clips) {
            if (!clip.playing) {
                continue;
            }
            const texture = clip.runner.step(clip.time);
            clip.time++;
            const {blendMode, opacity} = clip;
            activeLayers.push({texture, blendMode, opacity});
        }

        if (activeLayers.length === 0) {
            return;
        }

        let background = this.initialTexture;
        for (let i = 0; i < activeLayers.length; i++) {
            const {texture, blendMode, opacity} = activeLayers[i];
            this.uniforms.texBackground = background;
            this.uniforms.texForeground = texture;
            this.uniforms.blendMode = blendMode;
            this.uniforms.opacity = 1;
            const usePixels = (i === activeLayers.length-1);
            this.layerBlender.step(usePixels ? pixels : null);
            background = this.layerBlender.prevTexture();
        }
        return background;
    }
}
