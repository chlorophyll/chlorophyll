import RawPatternRunner from '@/common/patterns/runner';
import Crossfader from '@/common/patterns/crossfade';

export default class PlaylistRunner {
    constructor({gl, model, playlistItems, crossfadeDuration, onCurrentChanged}) {
        this.gl = gl;
        this.model = model;
        this.playlistItems = playlistItems;
        this.crossfadeDuration = crossfadeDuration;
        this.onCurrentChanged = onCurrentChanged;

        this._curIndex = undefined;
        this._curRunner = undefined;
        this.nextRunner = undefined;

        this.setCurrentRunner(0);
        this.curTime = 0;
        this.crossfader = new Crossfader(gl, model.num_pixels, 1, crossfadeDuration);
    }

    get nextIndex() {
        return (this.curIndex + 1) % this.playlistItems.length;
    }

    get nextId() {
        if (this.playlistItems.length > 0) {
            return this.playlistItems[this.nextIndex].id;
        } else {
            return undefined;
        }
    }

    updateCurrentIndex(val, detach=true) {
        this.curIndex = val;
        this.curId = this.playlistItems[val].id;
        if (detach && this.nextRunner) {
            this.nextRunner.detach();
        }
        this.nextRunner = this.makeRunner(this.nextIndex);
        if (this.onCurrentChanged) {
            this.onCurrentChanged(val, this.curTime / 60);
        }
    }

    get curRunner() {
        return this._curRunner;
    }
    set curRunner(runner) {
        if (this._curRunner) {
            this._curRunner.detach();
        }
        this._curRunner = runner;
    }

    setCurrentRunner(index) {
        if (this.playlistItems.length > 0) {
            this.curTime = 0;
            this.curRunner = this.makeRunner(index);
            this.updateCurrentIndex(index);
        }
    }

    onPlaylistChanged(allItems) {
        const playlistItems = allItems.filter(item => item.mapping !== null);

        const newCurIndex = playlistItems.findIndex(item => item.id === this.curId);
        const newNextIndex = (playlistItems[newCurIndex] + 1) % playlistItems.length;

        const oldNextId = this.nextId;

        this.playlistItems = playlistItems;

        if (newCurIndex === -1) {
            this.setCurrentRunner(0);
            return {shouldStop: true};
        } else if (newCurIndex !== this.curIndex) {
            this.updateCurrentIndex(newCurIndex);
        } else if (oldNextId !== this.nextId) {
            this.nextRunner = this.makeRunner(this.nextIndex);
        }
        return {shouldStop: false};
    }

    makeRunner(index) {
        const { pattern, group, mapping, id } = this.playlistItems[index];
        const {gl, model} = this;

        return new RawPatternRunner(gl, model, pattern, group, mapping);
    }

    previous() {
        const len = this.playlistItems.length;
        const previous = (this.curIndex - 1 + len) % len;
        this.setCurrentRunner(previous);
    }

    next() {
        this.setCurrentRunner(this.nextIndex);
    }

    step(pixels=null) {
        if (this.playlistItems.length === 0) {
            return;
        }
        const durationSec = this.playlistItems[this.curIndex].duration;
        const duration = durationSec * 60;

        const crossfadeStart = duration - this.crossfadeDuration;
        const crossfadeEnd = duration;
        let texture;

        const nextTime = this.curTime - crossfadeStart;

        if (this.playlistItems.length === 1) {
            texture = this.curRunner.step(this.curTime);
            if (this.curTime > crossfadeEnd) {
                this.curTime = 0;
            }
        } else {
            if (this.curTime < crossfadeStart) {
                texture = this.curRunner.step(this.curTime, pixels);
            } else if (this.curTime < crossfadeEnd) {
                const source = this.curRunner.step(this.curTime);
                const target = this.nextRunner.step(nextTime);
                texture = this.crossfader.step(nextTime, source, target, pixels);
            } else {
                this.curRunner = this.nextRunner;
                this.updateCurrentIndex(this.nextIndex, false);
                this.curTime = nextTime;
                texture = this.curRunner.step(this.curTime, pixels);
            }
        }
        this.curTime++;
        return {curTime: this.curTime / 60, texture};
    }
}
