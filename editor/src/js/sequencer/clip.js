/* eslint-disable */
import store from 'chl/vue/store';
import { registerSaveField } from 'chl/savefile';

export default class Clip {
  constructor(attrs) {
    this.id = attrs.id;
    this.name = attrs.name || `clip-${this.id}`;
    /*
     * list of { mapping, pattern } describing a pattern to apply for each
     * mapping in the clip.
     */
    this.assigned_patterns = attrs.assignments || [];
  }

  static fetch(id) {
    return new Clip(store.state.seq.clips[id]);
  }

  /*
   * Preview an clip, executing & displaying all component patterns.
   */
  runPreview() {
  }

  /*
   * Stop running the current clip, if one exists.
   */
  stopPreview() {
  }

  /*
   * Determine whether the pattern->mapping assignment is valid.
   * In a valid assignment:
   *
   * 1. There are no unpaired patterns or mappings (null->null is ignored).
   * 2. Mappings are mutually exclusive.
   * 3. Each pattern's input type is supported by its mapping.
   *
   * Returns true if valid and false otherwise.
   */
  validate() {
  }

  /*
   * Create OSC messages representing this clip's timing & parameters
   */
  toOsc() {
  }

  /*
   * Create instances of all patterns used and configure them
   */
  fetchPatterns() {
  }
}
