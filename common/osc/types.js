/*
 * Standard OSC type enumeration
 */
import osc from 'osc';

export default {
  int32:    (v) => ({ type: 'i', value: v}),
  int64:    (v) => {
    if (v > Number.MAX_SAFE_INTEGER)
      throw new Error('Integers > 2^53 are not safe for int64 type!');

    return {type: 'h', value: v};
  },

  float32:  (v) => ({ type: 'f', value: v}),
  string:   (v) => ({ type: 's', value: v}),
  char:     (v) => ({ type: 'c', value: v}),
  true:     (v) => ({ type: 'T', value: true}),
  false:    (v) => ({ type: 'F', value: false}),
  null:     (v) => ({ type: 'N', value: null}),
  impulse:  (v) => ({ type: 'I' }),

  blob:     (v) => ({ type: 'b', value: Buffer.from(v)}),
  midi:     (v) => ({ type: 'm',  value: Buffer.from(v)}),
  color:    (r, g, b, a) => ({ type: 'r', value: {r, g, b, a}}),
  time:     (s, now) => ({ type: 't', value: osc.timeTag(s, now)})
};
