import osc from 'osc';

/*
 * We unfortunately can't use ES6 classes here because osc Port is written
 * as an old-style functional class
 */
export default const LocalPort = function (options) {
  this.emit('ready');
};

const p = LocalPort.prototype = Object.create(osc.Port.prototype);
p.constructor = LocalPort;

p.sendRaw = function (encoded) {
  this.emit('data', encoded, {source: 'local'});
};
