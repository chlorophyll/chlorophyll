var History = require('./History');
var Component = require('./Component'),
    ComponentEvent = require('./ComponentEvent'),
    ObjectComponentNotifier = require('./ObjectComponentNotifier'),
    ComponentObjectError = require('./ComponentObjectError');
var Event_ = require('./event/Event');

function ObjectComponent(parent, obj, key, params) {
    if (obj[key] === undefined) {
        throw new ComponentObjectError(obj, key);
    }
    params = params || {};
    params.label = params.label || key;

    Component.apply(this, [parent, params.label]);

    this._obj = obj;
    this._key = key;
    this._onChange = function(){};

    ObjectComponentNotifier.get().addEventListener(ComponentEvent.UPDATE_VALUE, this, 'onValueUpdate');
    this.addEventListener(ComponentEvent.VALUE_UPDATED, ObjectComponentNotifier.get(), 'onValueUpdated');
}
ObjectComponent.prototype = Object.create(Component.prototype);
ObjectComponent.prototype.constructor = ObjectComponent;

//Override in Subclass
ObjectComponent.prototype.applyValue = function() {};
ObjectComponent.prototype.onValueUpdate = function (e) {};

ObjectComponent.prototype.pushHistoryState = function () {
    var obj = this._obj, key = this._key;
    History.get().pushState(obj, key, obj[key]);
};

ObjectComponent.prototype.setValue = function (value) {
    this._obj[this._key] = value;
    this.dispatchEvent(new Event_(this,ComponentEvent.VALUE_UPDATED,null));
};

ObjectComponent.prototype.getData = function(){
    var obj = {};
        obj[this._key] = this._obj[this._key];
    return obj;
};

module.exports = ObjectComponent;
