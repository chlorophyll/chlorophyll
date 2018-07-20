import osc from 'osc';
import UrlPattern from 'url-pattern';

/*
 * Handles OSC message delivery etc.
 */
export default class OSCBus {
  constructor() {
    this.listeners = {};
  }

  /*
   * Any asynchronous setup necessary. To be called before any other methods.
   */
  async init() {
  }

  /*
   * Register a handler to listen to an OSC address or pattern.
   */
  async listen(address, spec) {
  }

  /*
   * Send a message, routing to the appropriate destination(s).
   */
  async send(address, payload) {
  }

  /*
   * Send a message to be executed in the future at the given time.
   */
  async schedule(address, payload, timestamp) {
  }

  /*
   * Remove all listeners matching the address or pattern.
   */
  stop(address) {
  }

  /*
   * Teardown the bus, removing all registered listeners & inflight events.
   */
  destroy() {
  }
}
