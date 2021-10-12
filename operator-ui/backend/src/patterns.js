import _ from 'lodash';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegBin from 'ffmpeg-static';
import {Readable} from 'stream';
import tmp from 'tmp-promise';
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import fs from 'fs';
import PatternRunner from '@/common/patterns/runner';

ffmpeg.setFfmpegPath(ffmpegBin.path);

const previewDir = path.join(os.homedir(), '.chlorophyll-previews');

class FrameStream extends Readable {
  constructor(model, runner, duration, options) {
    super(options);
    this.runner = runner;
    this.model = model;

    const w = model.textureWidth;
    this.textureSize = w * w * 4;
    this.pixels = new Float32Array(this.textureSize);

    this.time = 0;
    this.duration = duration;
  }

  _read() {
    while (this.time < this.duration) {
      this.runner.step(this.time, this.pixels);
      this.time++;
      const w = this.model.textureWidth;
      const buf = Buffer.alloc(w*w*3);
      let ptr = 0;
      for (let i = 0; i < this.pixels.length; i++) {
        if (i % 4 === 3) continue;
        buf[ptr] = this.pixels[i]*255;
        ptr++;
      }

      if (!this.push(buf)) {
        break;
      }
    }
    if (this.time >= this.duration) {
      this.push(null);
    }
  }
}

export default class Pattern {
  constructor(gl, state, pattern) {
    this.model = state.model;
    const groupId = state.group_list[0];
    this.group = state.groups[groupId];
    this.pattern = pattern;
    this.gl = gl;

    const firstMapping = _.values(state.mappings).find(m => m.type == pattern.mapping_type);


    this.runnersByMappingId = {};

    this.animatedPreviewsByMappingId = {};
    this.defaultRunner = this.getRunner(this.group, firstMapping);
    this.defaults = {
      mappingId: firstMapping.id,
      groupId: this.group.id,
    };
  }

  getRunner(groups, mapping, reset = false) {
    groups = _.isArray(groups) ? groups : [groups];
    if (this.runnersByMappingId[mapping.id]) {
      const runner = this.runnersByMappingId[mapping.id];
      if (reset) {
        runner.updatePixels(groups, mapping);
      }
      return this.runnersByMappingId[mapping.id];
    } {
      const {gl, model, pattern} = this;
      const runner = new PatternRunner(gl, model, pattern, groups, mapping);
      this.runnersByMappingId[mapping.id] = runner;
      return runner;
    }
  }

  async getStaticPreviewAsync(mapping) {
    const hasher = crypto.createHash('sha256');
    hasher.update(JSON.stringify({pattern: this.pattern, mapping: mapping.id}));
    const patternHash = hasher.digest('hex');
    const previewPath = path.join(previewDir, `${patternHash}.png`);
    try {
      if (fs.existsSync(previewPath)) {
        return previewPath;
      }

      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir);
      }

      const runner = this.getRunner(this.group, mapping);
      const w = this.model.textureWidth;
      const textureSize = w * w * 4;
      const pixels = new Float32Array(textureSize);

      runner.step(0, pixels);

      const buf = Buffer.alloc(w*w*3);
      let ptr = 0;
      for (let i = 0; i < pixels.length; i++) {
        if (i % 4 === 3) continue;
        buf[ptr] = pixels[i]*255;
        ptr++;
      }

      await sharp(buf, {
        raw: {
          width: w,
          height: w,
          channels: 3,
        }
      }).png().toFile(previewPath);

      return previewPath;
    } catch (e) {
      console.log('error', e);
      return null;
    }
  }

  async getAnimatedPreviewAsync(mapping) {
    if (this.animatedPreviewsByMappingId[mapping.id]) {
      return this.animatedPreviewsByMappingId[mapping.id];
    }

    const runner = this.getRunner(this.group, mapping);
    const framestream = new FrameStream(this.model, runner, 10*60);
    const w = this.model.textureWidth;
    const tmpFile = await tmp.file();
    const quality = w > 500 ? 23 : 3;
    return new Promise((resolve, reject) => {
      console.log('starting ffmpeg');
      const cmd = ffmpeg(framestream)
        .inputOption('-vcodec', 'rawvideo')
        .inputOption('-video_size', `${w}x${w}`)
        .inputOption('-pix_fmt', 'rgb24')
        .inputOption('-framerate', '60')
        .videoFilter('pad=ceil(iw/2)*2:ceil(ih/2)*2')
        .output(tmpFile.path)
        .videoCodec('libx264')
        .outputOption('-pix_fmt', 'yuv420p')
        .outputFormat('mp4')
        .outputOption('-profile:v', 'high')
        .outputOption('-level', '4.2')
        .outputOption('-crf', quality)
        .outputOption('-tune animation')
        .on('start', cmd => console.log(cmd))
        .on('end', () => {
          console.log('end', tmpFile.path);
          this.animatedPreviewsByMappingId[mapping.id] = tmpFile.path;
          resolve(tmpFile.path);
        })
        .on('error', (err, stdout, stderr) => {
          console.log(stdout, stderr);
          reject(err);
        })
        .run();
    });
  }
}
