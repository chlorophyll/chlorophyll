var ObjectComponent = require('../core/ObjectComponent');
var Node = require('../core/document/Node');
var NumberInput_Internal = require('./NumberInput_Internal');
var CSS = require('../core/document/CSS');

var Event_         = require('../core/event/Event'),
    ComponentEvent = require('../core/ComponentEvent');

var DEFAULT_STEP = 1.0,
    DEFAULT_DP   = 2;

function Range(parent, object, value, params) {
    ObjectComponent.apply(this,arguments);

    params          = params          || {};
    params.onChange = params.onChange || this._onChange;
    params.step     = params.step || DEFAULT_STEP;
    params.dp       = (params.dp != null) ? params.dp : DEFAULT_DP;

    this._onChange  = params.onChange;

    var step = this._step = params.step,
        dp   = this._dp   = params.dp;

    //FIXME: history push pop

    var labelMin = new Node();
    var inputMin = this._inputMin = new NumberInput_Internal(step,dp, this.pushHistoryState.bind(this),
                                                                         this._onInputMinChange.bind(this));

    var labelMax = new Node();
    var inputMax = this._inputMax = new NumberInput_Internal(step,dp, this.pushHistoryState.bind(this),
                                                                         this._onInputMaxChange.bind(this));

    var labelMinWrap = new Node().setStyleClass(CSS.Wrap),
        inputMinWrap = new Node().setStyleClass(CSS.Wrap),
        labelMaxWrap = new Node().setStyleClass(CSS.Wrap),
        inputMaxWrap = new Node().setStyleClass(CSS.Wrap);

    labelMin.setStyleClass(CSS.Label).setProperty('innerHTML', 'MIN');
    labelMax.setStyleClass(CSS.Label).setProperty('innerHTML', 'MAX');

    var values = this._obj[this._key];

    inputMin.setValue(values[0]);
    inputMax.setValue(values[1]);

    var wrap = this._wrapNode;

    labelMinWrap.addChild(labelMin);
    inputMinWrap.addChild(inputMin.getNode());
    labelMaxWrap.addChild(labelMax);
    inputMaxWrap.addChild(inputMax.getNode());

    wrap.addChild(labelMinWrap);
    wrap.addChild(inputMinWrap);
    wrap.addChild(labelMaxWrap);
    wrap.addChild(inputMaxWrap);
}
Range.prototype = Object.create(ObjectComponent.prototype);
Range.prototype.constructor = Range;

Range.prototype._onInputChange = function () {
    this.dispatchEvent(new Event_(this, ComponentEvent.VALUE_UPDATED, null));
    this._onChange();
};

Range.prototype._updateValueMin = function () {
    var values = this._obj[this._key];

    var inputMin = this._inputMin,
        inputValue = inputMin.getValue();

    if (inputValue >= this._inputMax.getValue()) {
        inputMin.setValue(values[0]);
        return;
    }
    values[0] = inputValue;

};

Range.prototype._updateValueMax = function () {
    var values = this._obj[this._key];

    var inputMax = this._inputMax,
        inputValue = inputMax.getValue();

    if (inputValue <= this._inputMin.getValue()) {
        inputMax.setValue(values[1]);
        return;
    }
    values[1] = inputValue;
};


Range.prototype.onValueUpdate = function (e) {
    if (e.data.origin == this){
        return;
    }
    if (e.data.origin == null) {
    }
    var o = this._obj,k = this._key;
    this._inputMin.setValue(o[k][0]);
    this._inputMax.setValue(o[k][1]);
};

Range.prototype.setValue = function(value){
    var o = this._obj,k = this._key;
    o[k][0] = value[0];
    o[k][1] = value[1];
    this.dispatchEvent(new Event_(this,ComponentEvent.VALUE_UPDATED,null));
};

Range.prototype._onInputMinChange = function () {
    this._updateValueMin();
    this._onInputChange();
};

Range.prototype._onInputMaxChange = function () {
    this._updateValueMax();
    this._onInputChange();
};

module.exports = Range;