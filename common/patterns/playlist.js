import RawPatternRunner from '@/common/patterns/runner';
import Crossfader from '@/common/patterns/crossfade';

export default class PlaylistRunner {
    constructor({gl, model, group, mapping, playlistItems, crossfadeDuration, onCurrentChanged}) {
        this.gl = gl;
        this.model = model;
        this.group = group;
        this.mapping = mapping;
        this.playlistItems = playlistItems;
        this.crossfadeDuration = crossfadeDuration;
        this.onCurrentChanged = onCurrentChanged;

        this._curIndex = undefined;

        this.setCurrent(0);
        this.crossfader = new Crossfader(gl, model.num_pixels, 1, crossfadeDuration);
    }

    get nextIndex() {
        return (this.curIndex + 1) % this.playlistItems.length;
    }

    set curIndex(val) {
        this._curIndex = val;
        if (this.onCurrentChanged) {
            this.onCurrentChanged(val);
        }
    }

    get curIndex() {
        return this._curIndex;
    }

    setCurrent(index) {
        if (this.curRunner) {
            this.curRunner.detach();
        }
        if (this.nextRunner) {
            this.nextRunner.detach();
        }
        if (this.playlistItems.length > 0) {
            this.curIndex = index;
            this.curTime = 0;
            this.curRunner = this.makeRunner(index);
            this.curId = this.playlistItems[index].id;
            this.nextRunner = this.makeRunner(this.nextIndex);
            this.nextId = this.playlistItems[this.nextIndex].id;
        }
    }


    onPlaylistChanged(evt, playlistItems) {
        this.playlistItems = playlistItems;
        const newCurIndex = this.playlistItems.indexOf(this.curId);
        if (newCurIndex === -1) {
            this.setCurrent(0);
            return {shouldStop: true, curIndex: this.curIndex};
        } else {
            this.curIndex = newCurIndex;
            if (this.nextRunner) {
                this.nextRunner.detach();
                this.nextRunner = this.makeRunner(this.nextIndex);
                this.nextId = this.playlistItems[this.nextIndex].id;
            }
        }
    }

    makeRunner(index) {
        const { pattern, id } = this.playlistItems[index];
        const {gl, model, group, mapping} = this;

        return new RawPatternRunner(gl, model, pattern, group, mapping);
    }

    step() {
        if (this.playlistItems.length === 0) {
            return;
        }
        const durationSec = this.playlistItems[this.curIndex].duration;
        const duration = durationSec * 60;

        const crossfadeStart = duration - this.crossfadeDuration;
        const crossfadeEnd = duration;
        let texture;

        const nextTime = this.curTime - crossfadeStart;

        if (this.curTime < crossfadeStart) {
            texture = this.curRunner.step(this.curTime);
        } else if (this.curTime < crossfadeEnd && this.playlistItems.length > 1) {
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
        const {curTime} = this;
        return {curTime, nextTime, texture};
    }
}
