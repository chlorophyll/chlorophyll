import OSCBus from './bus';

export const playback = new OSCBus('playback');
export const config = new OSCBus('config');
export const input = new OSCBus('input');

// To be run on startup to start connections
export default async function init() {
  playback.init();
  config.init();
}

/*
 * ## Interface usage examples
 *
 * // default behavior: type list -> array
 *
 * bus.listen('/url/pattern/*', ['t', 'i', 'r'], payload => {
 *   const [time, val, color] = payload;
 *   // Rejects the promise at the OSC level to be handled as appropriate
 *   if (val < 0)
 *       throw new Error('failed event');
 *
 *   doSomeStuff();
 *   return;
 * });
 *
 *
 * // or, with arugment names annotated:
 *
 * bus.listen('/foo', {color: 'r', data: 'b'}, args => {
 *   doSomeStuff(args.color, args.data);
 * });
 *
 *
 * // or, with typechecking omitted:
 * bus.listen('/foo', payload => {
 *   const someString = payload[0];
 *   assert(String.isString(someString));
 *
 *   doSomeStuff(payload[0]);
 * });
 *
 *
 * // block control flow waiting for an event:
 *
 * const payload = bus.wait('/start');
 *
 *
 * bus.send('/some/full/url', args);
 * bus.batch(optionalOscTimetag)
 *   .message('/some/url', [ot.int32(1)])
 *   .message('/other/url', [ot.int32(1), ot.string('abc')])
 *   .send();
 *
 * bus.send('/foo', args, Date.now() + 5000);
 */
