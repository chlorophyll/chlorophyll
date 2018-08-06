import osc from 'osc';

/*
 * We unfortunately can't use ES6 classes here because osc Port is written
 * as an old-style functional class
 */
export default function LocalPort(options) {};

const p = LocalPort.prototype = Object.create(osc.Port.prototype);
p.constructor = LocalPort;

p.open = function() {
  this.emit('ready');
  this.emit('open');
};

p.sendRaw = function(encoded) {
  this.emit('data', encoded, {source: 'local'});
};
