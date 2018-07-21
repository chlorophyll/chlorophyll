import OSCBus from './bus';

export const playback = new OSCBus('playback');
export const config = new OSCBus('config');

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
 * bus.listen('/foo', {color: 'r', data: 'b'}, payload => {
 *   doSomeStuff(payload.color, payload.data);
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
 * bus.send('/some/full/url', payload);
 * bus.sendMulti([
 *   {
 *     address: '/some/url',
 *     payload: [1]
 *   }, {
 *     address: '/other/url',
 *     payload: [1,'abc']
 *   }
 * ]);
 *
 *
 * bus.schedule('/foo', payload, Date.now() + 5000);
 */
