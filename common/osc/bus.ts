import _ from 'lodash';
import * as assert from 'assert';
import {Minimatch} from 'minimatch';
import * as osc from 'osc';

import LocalPort from './transport_local';
import UDPPort from './transport_udp';
import MessageBatch from './batch.js';
import * as OT from './osc_types';

// TODO more detailed type for OSC arguments
type MessageArgs = Array<any> | {[arg: string]: any};

interface ArgSpec {
  name: string | null;
  type: OT.TypeTag;
}

interface ExpectedArgs {
  format: 'array' | 'keyword';
  types: Array<ArgSpec>;
}

interface Listener {
  id: number;
  address: string;
  patterns: Array<RegExp>;
  spec: ExpectedArgs;
  callback(args: MessageArgs, tt: OT.TimeTag, addr: string);
}

interface OSCPacket {
  address: string;
  args: OT.Value;
}

interface SingleMessage {
  timeTag: OT.TimeTag;
  args: OSCPacket;
}

interface BundledMessage {
  timeTag: OT.TimeTag;
  packets: Array<OSCPacket>;
}

type OSCMessage = SingleMessage | BundledMessage;

type EventCallback = (...args: any[]) => void;
interface OSCPort {
  new(object);
  open();
  on(event: string, cb: EventCallback);
  send(m: OSCMessage);
  close?();
}

/*
 * Handles OSC message delivery etc.
 */
export default class OSCBus {
  readonly domain: string;
  readonly pubsubPattern: string;

  private ports: {[name: string]: OSCPort};
  private listeners: Map<string, Array<Listener>>;
  private nReady;

  public ids = idGenerator();

  constructor(domain) {
    this.domain = domain;
    this.pubsubPattern = `${domain}:*`;

    this.listeners = new Map();
    this.nReady = 0;

    const udpPort = getOpenPort();
    console.log(`OSC Bus (${this.domain}): using localhost:${udpPort}`);
    this.ports = {
      local: new LocalPort({metadata: true}),

      udp: new UDPPort({
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
    return this.nReady === Object.keys(this.ports).length;
  }

  /*
   * Receive a packet, route it, call callbacks
   */
  _recv(message, timeTag, info) {
    //console.log(`OSC Bus: Received OSC message:`, message);

    const parts = message.address.split('/').slice(1);
    this.listeners.forEach((addressListeners, addr) => {

      addressListeners.forEach(listener => {
        if (listener.patterns.length !== parts.length)
          return;

        if (!listener.patterns.every((pattern, i) => pattern.test(parts[i])))
          return;

        //console.log(`OSC Bus: routing message to ${addr}`);
        //console.log('OSC Bus: spec', listener.spec, 'args', message.args);
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
    const handle = new ListenerHandle(this, {
      address: address,
      patterns: parts.map(addressPartToRegExp),
      spec: toCanonicalSpec(spec),
      callback: cb,
    })
    route.push(handle);

    return handle;
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
  stopAll(address) {
    return this.listeners.delete(address);
  }

  stop(listener: ListenerHandle) {
    this.listeners.get(listener.address)
  }

  /*
   * Teardown the bus, removing all registered listeners & inflight events.
   */
  destroy() {
    this.listeners = new Map();
    Object.values(this.ports).forEach(port => {
      if (port.close)
        port.close();
    });
  }
}

class ListenerHandle implements Listener {
  readonly id;
  readonly address;
  readonly patterns;
  readonly spec;
  readonly callback;

  private bus;

  constructor(bus, attrs) {
    this.bus = bus;
    this.patterns = attrs.patterns;
    this.address = attrs.address;
    this.spec = attrs.spec;
    this.callback = attrs.callback;
    this.id = `${bus.domain}:${bus.ids.next().value}`
  }

  stop() {
    this.bus.stop(this);
  }
}

function *idGenerator() {
  let next = 0;
  while (true)
    yield next++;
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
  if (!spec || !spec.type || !arg.type || arg.type === OT.OSCType.NULL)
    return arg.value;

  if (spec.type !== arg.type)
    throw new Error(`Type mismatch on OSC message, expected ${spec.type} but got ${arg.type}`);

  return arg.value;
}

function toCanonicalSpec(spec: Array<OT.TypeTag> | {[name: string]: OT.TypeTag}): ExpectedArgs {
  if (!spec)
    return null;

  // TODO handle nested arrays
  let types: Array<ArgSpec>;
  if (Array.isArray(spec)) {
    types = spec.map(type => ({name: null, type}));
  } else {
    const lex = Object.keys(spec).sort();
    types = lex.map(key => ({name: key, type: spec[key]}));
  }

  const format = Array.isArray(spec) ? 'array' : 'keyword';
  return {format, types};
}
