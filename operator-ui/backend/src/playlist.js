import EventEmitter from 'events';
import Crossfader from '@/common/patterns/crossfade';

// there is the notion of the "active" item and the "target" item.
// most of the time they are the same.
// when they are different, step will crossfade between them.
//
// in normal operation, when the active item is nearing the end of its duration,
// the target item will be the next item in the queue.
//
// when the target item is deleted from the queue, the target item will become
// the next item that still exists in the queue. the active item stays around until it completes.
// when you go prev() you set target to active's prev
// when you go next() you set target to active's next
export default class Playlist extends EventEmitter {
  constructor(gl, model, patternsById, crossfadeDuration) {
    super();
    this.gl = gl;
    this.model = model;
    this.crossfadeDuration = crossfadeDuration;

    const w = model.textureWidth;

    this.crossfader = new Crossfader(gl, w, w, crossfadeDuration);

    this.patternsById = patternsById;

    this.activeItemTime = 0;
    this.targetItemTime = 0;


    this.activeItem = null;
    this._targetItem = null;

    this.indexesById = {};
    this.items = [];
  }

  get targetItem() {
    return this._targetItem;
  }

  set targetItem(val) {
    if (!this._targetItem || this._targetItem.id !== val.id) {
      this._targetItem = val;
      this.emit('target-changed', val);
    }
  }

  get visibleTime() {
    const frames = this.targetId === this.activeItem.id ? this.activeItemTime : this.targetItemTime;
    return Math.floor(frames / 60);
  }

  setItems(items) {
    const newItemIds = new Set(items.map(item => item.id));

    if (this.activeItem !== null) {
      let newTargetItem = null;

      const curTargetIndex = this.indexesById[this.targetItemId];

      for (let offset = 0; offset < this.items.length; offset++) {
        const potentialIndex = (curTargetIndex + offset) % this.items.length;
        const item = this.items[potentialIndex];
        if (newItemIds.has(item.id)) {
          newTargetItem = item;
          break;
        }
      }
      if (newTargetItem === null) {
        newTargetItem = items[0];
      }

      this.targetItem = newTargetItem;
    }


    const newIndexesById = {};
    for (let i = 0; i < items.length; i++) {
      newIndexesById[items[i].id] = i;
    }

    this.indexesById = newIndexesById;
    this.items = items;
  }

  start(index = 0) {
    this.activeItem = this.items[index];
    this.targetItem = this.items[index];
  }

  stop() {
    const activeRunner = this.getRunner(this.activeItem);
    activeRunner.stop();
    if (this.targetItem.id !== this.activeItem.id) {
      const targetRunner = this.getRunner(this.targetItem);
      targetRunner.stop();
    }
  }

  getRunner(item) {
    const patternId = item.patternId;
    const pattern = this.patternsById[patternId];
    return pattern.defaultRunner;
  }

  stepRunner(item, time, pixels=null) {
    const runner = this.getRunner(item);
    if (time === 0) {
      runner.start();
    }
    const texture = runner.step(time, pixels);
    return texture;
  }



  step(pixels = null) {
    const activeDurationSec = this.activeItem.duration;
    const activeDuration = activeDurationSec * 60;

    let texture;
    if (this.activeItem.id === this.targetItem.id) {
      texture = this.stepRunner(this.activeItem, this.activeItemTime, pixels);
      this.activeItemTime++;
      this.targetItemTime++;

      // normal operation: reached the end of duration. next step will start xfade.
      if (this.activeItemTime === activeDuration - this.crossfadeDuration) {
        const activeIndex = this.indexesById[this.activeItem.id];
        const nextIndex = (activeIndex + 1) % this.items.length;
        this.targetItem = this.items[nextIndex];
        this.targetItemTime = 0;
      }
    } else {
      const source = this.stepRunner(this.activeItem, this.activeItemTime);
      const target = this.stepRunner(this.targetItem, this.targetItemTime);
      this.activeItemTime++;
      this.targetItemTime++;
      texture = this.crossfader.step(this.targetItemTime, source, target, pixels);

      if (this.targetItemTime > this.crossfadeDuration) {
        this.getRunner(this.activeItem).stop();
        this.activeItem = this.targetItem;
        this.activeItemTime = this.targetItemTime;
      }
    }
  }
}

