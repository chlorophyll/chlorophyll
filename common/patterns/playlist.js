import RawPatternRunner from '@/common/patterns/runner';
import Crossfader from '@/common/patterns/crossfade';

export default class PlaylistRunner {
    constructor(gl, model, group, mapping, playlistItems, crossfadeDuration) {
        this.gl = gl;
        this.model = model;
        this.group = group;
        this.mapping = mapping;
        this.playlistItems = playlistItems;
        this.crossfadeDuration = crossfadeDuration;

        this.curIndex = 0;
        this.curTime = 0;

        this.curRunner = this.makeRunner(0);
        this.nextRunner = this.makeRunner(this.nextIndex);
        this.crossfader = new Crossfader(gl, model.num_pixels, 1, crossfadeDuration);
    }

    get nextIndex() {
        return (this.curIndex + 1) % this.playlistItems.length;
    }

    makeRunner(index) {
        const { pattern } = this.playlistItems[index];
        const {gl, model, group, mapping} = this;

        return new RawPatternRunner(gl, model, pattern, group, mapping);
    }

    step() {
        const durationSec = this.playlistItems[this.curIndex].duration;
        const duration = durationSec * 60;

        const crossfadeStart = duration - this.crossfadeDuration;
        const crossfadeEnd = duration;
        let texture;

        const nextTime = this.curTime - crossfadeStart;

        if (this.curTime < crossfadeStart) {
            texture = this.curRunner.step(this.curTime);
        } else if (this.curTime < crossfadeEnd) {
            const source = this.curRunner.step(this.curTime);
            const target = this.nextRunner.step(this.nextTime);
            texture = this.crossfader.step(nextTime, source, target);
        } else {
            this.curIndex = this.nextIndex;
            this.curRunner.detach();
            this.curRunner = this.nextRunner;
            this.curTime = nextTime;
            this.nextRunner = this.makeRunner(this.nextIndex);
            texture = this.curRunner.step(this.curTime);
        }
        this.curTime++;
        return texture;
    }
}
