import assert from 'assert';
import minimatch from 'minimatch';
import osc from 'osc';

import LocalPort from './transport_local';


/*
 * Handles OSC message delivery etc.
 */
export default class OSCBus {
  constructor(domain) {
    this.domain = domain;
    this.pubsubPattern = `${domain}:*`;

    this.listeners = new Map();

    const tcpPort = getTCPPort();
    this.ports = {
      local: new LocalPort(),

      tcp: new osc.TCPSocketPort({
        localAddress: "0.0.0.0",
        localPort: tcpPort;
      })
    };
    console.log(`OSC TCP listener initialized on localhost:${tcpPort}`);

    Object.entries(this.ports).forEach([name, port] => {
      port.on('message', this._recv);
    });
  }

  /*
   * Receive a packet, route it, call callbacks
   */
  _recv(message, timeTag, info) {
    console.log(`Received OSC message from ${info.source} at ${timeTag}`);
  }

  /*
   * Register a handler to listen to an OSC address or pattern.
   *
   * If multiple handlers are installed, they will be run in insertion order.
   */
  listen(address, spec, cb) {
    if (!this.listeners.has(address))
      this.listeners.set(address, []);

    // Register the new callback.
    const route = this.listeners.get(address);
    route.push({
      patterns: address.split('/').map(addressPartToRegExp),
      spec: spec,
      callback: cb
    });
  }

  /*
   * Send a message, routing to the appropriate destination(s).
   */
  send(address, payload) {
    const parts = address.split('/');
    this.listeners.values().forEach(listener => {
      // TODO check each regex part
      // Check spec
      // call callback
    });
  }

  /*
   * Send a message to be executed in the future at the given time.
   */
  schedule(address, payload, timestamp) {
  }

  /*
   * Remove all listeners for the given pattern.
   */
  stop(address) {
    return this.listeners.delete(address);
  }

  /*
   * Teardown the bus, removing all registered listeners & inflight events.
   */
  destroy() {
    this.listeners = [];
    Object.values(this.ports).forEach(port => {
      if (port.close)
        port.close();
    });
  }
}

let lastUsedPort = 57120;
function getTCPPort() {
  lastUsedPort++
  return lastUsedPort;
}

function addressPartToRegExp(part) {
  // TODO use minimatch toRegexp
  
}
