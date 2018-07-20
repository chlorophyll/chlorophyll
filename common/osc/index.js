import OSCBus from './bus';

export const bus = new OSCBus();

// To be run on startup to start connections
export default async function init() {
  return await bus.init();
}

/*
 * ## Interface usage examples
 *
 * // default behavior: type list -> array
 *
 * bus.listen('/url/pattern/*', ['t', 'i', 'r']).then(payload => {
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
 * bus.listen('/foo', {color: 'r', data: 'b'}).then(payload => {
 *   doSomeStuff(payload.color, payload.data);
 * });
 *
 *
 * // or, with typechecking omitted:
 * bus.listen('/foo').then(payload => {
 *   const someString = payload[0];
 *   assert(String.isString(someString));
 *
 *   doSomeStuff(payload[0]);
 * });
 *
 *
 * // Using promises means we can have control flow that blocks waiting for an event:
 *
 * const payload = await bus.listen('/start');
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
