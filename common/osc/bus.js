import _ from 'lodash';
import assert from 'assert';
import {Minimatch} from 'minimatch';
import osc from 'osc';

import LocalPort from './transport_local';
import MessageBatch from './batch.js';
import ot from './types';

/*
 * Handles OSC message delivery etc.
 */
export default class OSCBus {
  constructor(domain) {
    assert.ok(_.isString(domain));

    this.domain = domain;
    this.pubsubPattern = `${domain}:*`;

    this.listeners = new Map();
    this.nReady = 0;

    const udpPort = getOpenPort();
    console.log(`OSC Bus (${this.domain}): using localhost:${udpPort}`);
    this.ports = {
      local: new LocalPort({metadata: true}),

      udp: new osc.UDPPort({
        localAddress: '0.0.0.0',
        localPort: udpPort,
        metadata: true,
      })
    };

    Object.entries(this.ports).forEach(([name, port]) => {
      port.on('ready', () => {
        console.log(`OSC Bus (${this.domain}): ${name} port opened.`);
        this.nReady++;
      });
      port.on('message', (message, timeTag, info) => {
        return this._recv(message, timeTag, info);
      });
      port.on('error', error => {
        console.error(`OSC Bus (${this.domain}) ERROR:`, error);
      });

      port.open();
    });
  }

  get ready() {
    return (this.nReady === this.listeners.size);
  }

  /*
   * Receive a packet, route it, call callbacks
   */
  _recv(message, timeTag, info) {
    console.log(`OSC Bus: Received OSC message:`, message);

    const parts = message.address.split('/').slice(1);
    this.listeners.forEach((addressListeners, addr) => {

      addressListeners.forEach(listener => {
        if (listener.patterns.length !== parts.length)
          return;

        if (!listener.patterns.every((pattern, i) => pattern.test(parts[i])))
          return;

        console.log(`OSC Bus: routing message to ${addr}`);
        console.log('OSC Bus: spec', listener.spec, 'args', message.args);
        const args = parseArguments(listener.spec, message.args);
        listener.callback(args, timeTag, message.address);
      });
    });
  }

  /*
   * Register a handler to listen to an OSC address or pattern.
   *
   * If multiple handlers are installed, they will be run in insertion order.
   */
  listen(address, spec, cb) {
    assert.ok(_.isString(address));
    assert.ok(cb);

    if (address[0] !== '/')
      throw new Error('OSC address pattern must start with a / character');

    if (!this.listeners.has(address))
      this.listeners.set(address, []);

    let parts = address.split('/');
    parts.shift(); // Remove leading empty path

    // Register the new callback.
    const route = this.listeners.get(address);
    route.push({
      patterns: parts.map(addressPartToRegExp),
      spec: toCanonicalSpec(spec),
      callback: cb,
    });
  }

  /*
   * Send a message, routing to the appropriate destination(s).
   */
  send(address, args, timeTag) {
    assert.ok(_.isString(address));

    // Only use the local port for now
    const port = this.ports.local;
    const message = {address, args};

    port.send({
      timeTag: timeTag || osc.timeTag(),
      packets: [message],
    });
  }

  batch(timeTag) {
    const port = this.ports.local;

    return new MessageBatch(packets => port.send({
      timeTag: timeTag || osc.timeTag(),
      packets: packets,
    }));
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
function getOpenPort() {
  lastUsedPort++;
  return lastUsedPort;
}

function addressPartToRegExp(part) {
  const mm = new Minimatch(part, {
    noglobstar: true,
    dot: true,
    noext: true,
    nocomment: true,
  });

  const partRegexp = mm.makeRe();
  if (!partRegexp)
    throw new Error(`Invalid address pattern: ${part}`);

  return partRegexp;
}

function parseArguments(argSpec, rawArgs) {
  if (!argSpec)
    return toValues(rawArgs);

  const values = rawArgs.map((arg, i) => parseSingleArg(argSpec.types[i], arg));
  if (argSpec.format === 'array')
    return values;

  const kwValues = {};
  values.forEach((val, i) => {
    kwValues[argSpec.types[i].name] = val;
  });
  return kwValues;
}

function toValues(args) {
  return args.map(arg => {
    if (_.isArray(arg))
      return toValues(arg);

    return arg.value;
  });
}

function parseSingleArg(spec, arg) {
  const expectArr = Array.isArray(spec.type);
  const isArr = Array.isArray(arg);
  if (expectArr !== isArr) {
    return null;
  }

  // Recurse for array arguments
  if (isArr)
    return arg.map((subArg, i) => parseSingleArg({ type: spec.type[i] }, arg));

  // untyped / null argument: match any type.
  if (!spec || !spec.type || !arg.type || arg.type === ot.NULL)
    return arg.value;

  if (spec.type !== arg.type)
    throw new Error(`Type mismatch on OSC message, expected ${spec.type} but got ${arg.type}`);

  return arg.value;
}

function toCanonicalSpec(spec) {
  if (!spec)
    return null;

  const format = Array.isArray(spec) ? 'array' : 'keyword';

  // TODO handle nested arrays
  let types;
  if (format === 'array') {
    types = spec.map(type => ({name: null, type}));
  } else {
    const lex = Object.keys(spec).sort();
    types = lex.map(key => ({name: key, type: spec[key]}));
  }

  return {format, types};
}
