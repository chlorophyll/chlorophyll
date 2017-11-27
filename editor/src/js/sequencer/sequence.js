import Clip from './clip';
import store from 'chl/vue/store';
import { registerSaveField } from 'chl/savefile';

export default class Sequence {
  constructor(attrs) {
    this.clip_ids = attrs.clips;
    this.name = attrs.name;

    this.clips = [];
  }

  fetchClips() {
    this.clips = this.clip_ids.map((id) => {
      const attrs = store.seq.clips[id];
      return new Clip(attrs);
    });
  }

  previewSequence() {
    fetchClips();
    // take control of the viewport
    // get OSC defs from each clip
    // generate a stream of osc messages
    // create pattern instances
    // asynchronously run pattern frames from osc commands
  }
}
