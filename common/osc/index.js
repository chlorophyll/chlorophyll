import osc from 'osc';
import UrlPattern from 'url-pattern';

/*
 * Handles OSC message delivery, logging, error reporting
 */
export default class OSCBus {
  constructor() {
    this.listeners = {};
  }

  send(message) {
  }

  listen(address) {
  }
}

/*
 * Represents a particular type of OSC message.
 *
 * Can be invoked to generate and send an OSC-formatted message object as a
 * regular function call.
 */
export class Message {
  constructor(address, args) {
    // TODO: provide a way to format the destination address by parameters
    this.urlPattern = new UrlPattern(base_address);
    this.args = args;
  }

  create(params) {
  }

  createBundle(params_list) {
  }
}
