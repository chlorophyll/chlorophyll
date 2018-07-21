import osc from 'osc';

import LocalPort from './transport_local';

/*
 * Handles OSC message delivery etc.
 */
export default class OSCBus {
  constructor(domain) {
    this.domain = domain;
    this.pubsubPattern = `${domain}:*`;

    this.listeners = {
      children: {},
      listeners: {}
    };

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
   * If multiple listeners match an incoming message, they will be applied
   * most-general first (so '/foo/*' is executed before '/foo/bar/3').
   */
  listen(address, spec, callback) {
    const parts = address.split('/').map(addressPartToGlob);

    // Register the new callback.
    let level = this.listeners;
    parts.forEach((part, i) => {
      if (i < parts.length - 1) {
        let record = level.children[part];
        if (!record) {
          record = {
            listeners: {}
            children: {}
          };
          level.children[part] = record;
        }
        level = level.children[part];
      } else {
        // Reached the last node, record the listener
        if (!level.listeners[part])
          level.listeners[part] = [];
        level.listeners[part].push({address, spec, callback});
      }
    });
  }

  /*
   * Send a message, routing to the appropriate destination(s).
   */
  send(address, payload) {
  }

  /*
   * Send a message to be executed in the future at the given time.
   */
  schedule(address, payload, timestamp) {
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

let lastUsedPort = 57120;
function getTCPPort() {
  lastUsedPort++
  return lastUsedPort;
}

function addressPartToGlob(part) {
  // All OSC patterns match standard globs except for {foo,bar}
  // which become +(foo|bar) in standard glob terms
  if (!/{.*}/.test(part))
    return part;

  return part
    .replace('{', '+(')
    .replace('}', ')')
    .replace(',', '|');
}
