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

export enum OSCType {
  INT32 = 'i',
  INT64 = 'h',
  FLOAT32 = 'f',
  STRING = 's',
  CHAR = 'c',
  TRUE = 'T',
  FALSE = 'F',
  NULL = 'N',
  IMPULSE = 'I',
  BLOB = 'b',
  MIDI = 'm',
  COLOR = 'r',
  TIME = 't',
}

export type TypeTag = 'i' | 'h' | 'f' | 's' | 'c' | 'T' | 'F' | 'N' | 'I' | 'b' | 'm' | 'r' | 't';
export type TimeTag = [number, number];
export interface Value {
  type: TypeTag;
  value?: any;
}
// May take a wide variety of inputs but must have at least one
type TypeConstructor = (v: any, ...vs: any[]) => Value;

const typeConstructors: {[t: string]: TypeConstructor} = {
  INT32:    (v) => ({ type: 'i', value: v}),
  INT64:    (v) => {
    if (v > Number.MAX_SAFE_INTEGER)
      throw new Error('integers > 2^53 are not safe for int64 type!');

    return {type: 'h', value: v};
  },

  FLOAT32:  (v) => ({ type: 'f', value: v}),
  STRING:   (v) => ({ type: 's', value: v}),
  CHAR:     (v) => ({ type: 'c', value: v}),
  TRUE:     (v) => ({ type: 'T', value: true}),
  FALSE:    (v) => ({ type: 'F', value: false}),
  NULL:     (v) => ({ type: 'N', value: null}),
  IMPULSE:  (v) => ({ type: 'I' }),

  BLOB:     (v) => ({ type: 'b', value: Buffer.from(v)}),
  MIDI:     (v) => ({ type: 'm',  value: Buffer.from(v)}),
  COLOR:    (r, g, b, a) => ({ type: 'r', value: {r, g, b, a}}),
  TIME:     (s, now) => ({ type: 't', value: osc.timeTag(s, now)})
};

export default typeConstructors;
