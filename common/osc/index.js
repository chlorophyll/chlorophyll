import osc from 'osc';
import UrlPattern from 'url-pattern';

/*
 * Handles OSC message delivery, logging, error reporting
 */
export default class OSCBus {
  constructor() {
    this.listeners = {};
  }

  addListener(url, args, callback) {
  }

  removeListener(url) {
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
    this.urlPattern = new UrlPattern(base_address);
    this.args = args;
  }

  create(params) {
  }

  createBundle(params_list) {
  }
}
