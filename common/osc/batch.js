import assert from 'assert';
/*
 * Helper class for batching OSC messages. For example:
 *
 * bus.batch()
 *    .message('/foo', [...])
 *    .message('/bar', [...])
 *    .send()
 */
export default class MessageBatch {
  constructor(sendCallback) {
    assert.ok(sendCallback);

    this.packets = [];
    this.callback = sendCallback;
  }

  message(address, args) {
    assert.ok(String.isString(address));
    assert.ok(Array.isArray(args));

    this.packets.push({address, args});

    return this;
  }

  send() {
    if (this.packets.length === 0)
      throw new Error('Trying to send empty OSC message batch!');


    return this.callback(this.packets);
  }
}
