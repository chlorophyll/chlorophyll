/*
 * Standard OSC type enumeration
 */
import osc from 'osc';

export default {
  int32:    (v) => ({ type: 'i', value: v}),
  int64:    (v) => ({ type: 'h', value: v}), // WARNING ints > 2^53 are unsafe
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
