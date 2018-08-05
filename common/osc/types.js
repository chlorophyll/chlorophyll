/*
 * Standard OSC type enumeration
 *
 * For constructing messages to be sent. e.g.
 *
 * import ot from 'common/osc/types';
 * bus.send('/foo', [ot.string('hello'), ot.int32(100), ot.color(0, 255, 0, 0.5));
 *
 * Quick reference:
 *
 * Numeric types
 *
 *  i  int32
 *  h  int64
 *  c  char
 *  f  float32
 *
 * Bufferlike types
 *
 *  s  string
 *  b  buffer
 *  m  midi packet
 *
 * Special values
 *
 *  r  rgba color
 *  t  OSC timetag
 *
 * Unit types
 *
 *  T  true
 *  F  false
 *  N  null
 *  I  impulse
 *
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
