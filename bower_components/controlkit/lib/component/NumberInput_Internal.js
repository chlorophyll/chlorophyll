var EventDispatcher = require('../core/event/EventDispatcher'),
    NodeEvent = require('../core/document/NodeEvent');
var Node      = require('../core/document/Node');

var PRESET_SHIFT_MULTIPLIER  = 10;
var NUM_REGEX = /^-?\d*\.?\d*$/;

var setCaretPos = null,
    selectAll = null;

function inputSetValue(input,value){
    input.setProperty('value',value);
    input.dispatchEvent(new Event('input'));
}

NumberInput_Internal = function (stepValue, dp, onBegin, onChange, onFinish, onError) {
    EventDispatcher.apply(this, null);

    this._value = 0;
    this._valueStep = stepValue;
    this._valueDp   = dp;

    this._onBegin = onBegin || function (){};
    this._onChange = onChange || function () {};
    this._onFinish = onFinish || function() {};
    this._onError = onError || function() {};

    this._keyCode = null;
    this._caretOffset = 0;

    var input = this._input = new Node('text');
        input.setProperty('value', this._value);

    input.addEventListener('input',this._onInput.bind(this));
    input.addEventListener('keydown',this._onKeydown.bind(this));

    if(!setCaretPos){
        if(input.getElement().setSelectionRange){
            setCaretPos = function(input,pos){
                input.getElement().setSelectionRange(pos,pos);
            };
            selectAll = function(input){
                input.getElement().setSelectionRange(0,input.getProperty('value').length);
            };
        } else {
            setCaretPos = function(input,pos){
                var range = input.getElement().createTextRange();
                    range.collapse(true);
                    range.moveEnd('character',pos);
                    range.moveStart('character',pos);
                    range.select();
            };
            selectAll = function(input){
                var range = input.getElement().createTextRange();
                    range.collapse(true);
                    range.moveStart('character',0);
                    range.moveEnd('character',input.getProperty('value').length);
                    range.select();
            }
        }
    }
};
NumberInput_Internal.prototype = Object.create(EventDispatcher.prototype);
NumberInput_Internal.prototype.constructor = NumberInput_Internal;

NumberInput_Internal.prototype._setValue = function(value){
    var prefix =  ((value = +value) || 1 / value) < 0 && value == 0 ? '-' : ''; //-0
        value = Number(value).toFixed(this._valueDp);
    this._input.setProperty('value',prefix + value);
    this._value = Number(value);
};

NumberInput_Internal.prototype._onInput = function(){
    var input = this._input,
        value = input.getProperty('value'),
        start = input.getProperty('selectionStart'),
        dp    = this._valueDp;

    var first = value[0];

    if(value == ''){
        value = 0;
    } else if(first === '.'){
        value = '0' + value;
    }

    if(!NUM_REGEX.test(value) || value == '-'){
        input.setProperty('value',this._value.toFixed(dp));
        setCaretPos(input,Math.max(--start,0));
        this._onError(this._keyCode);
        return;
    }
    this._onBegin(this._value);
    this._setValue(value);
    setCaretPos(input,start - this._caretOffset);
    this._onChange();
};

NumberInput_Internal.prototype._onKeydown = function(e){
    var keyCode = this._keyCode = e.keyCode;

    if(keyCode == 13){
        this._onFinish();
        e.preventDefault();
        return;
    }

    var input  = this._input,
        value  = input.getProperty('value');
    var start  = input.getProperty('selectionStart'),
        end    = input.getProperty('selectionEnd');
    var length = value.length;

    var isBackspaceDelete = keyCode == 8 || keyCode == 45,
        isMetaKey = e.metaKey,
        isCtrlKey = e.ctrlKey,
        isLeft = keyCode == 37,
        isRight = keyCode == 39,
        isLeftRight = isLeft || isRight,
        isShift = e.shiftKey,
        isUpDown = keyCode == 38 || keyCode == 40,
        isSelectAll = (isMetaKey || isCtrlKey) && keyCode == 65,
        isRangeSelected = start != end,
        isAllSelected = start == 0 && end == length,
        isMinus = keyCode == 189;

    var indexDecimalMark = value.indexOf('.');

    this._caretOffset = 0;

    //prevent cmd-z || ctrl-z
    if((isMetaKey || isCtrlKey) && keyCode == 90){
        e.preventDefault();
        return;
    }
    //select all cmd+a || ctrl+a
    if(isSelectAll){
        selectAll(input);
        e.preventDefault();
        return;
    }
    //everything is selected
    if(isAllSelected) {
        if (isMinus) {
            //set negative zero, as starting point for negative number
            inputSetValue(input, '-0');
            //set caret after  '-'
            setCaretPos(input, 1);
        } else {
            //delete number / replace / ignore
            inputSetValue(input, isBackspaceDelete ? 0 : String.fromCharCode(keyCode));
            //jump to start <--> end
            setCaretPos(input, isLeft ? start : end);
        }
        e.preventDefault();
        return;
    }
    //jump over decimal mark
    if(isBackspaceDelete && (start-1 == indexDecimalMark)){
        setCaretPos(input,start-1);
        return;
    }
    // 0|. enter first dp without jumping over decimal mark
    if(!isLeftRight && (value[0] == '0' && start == 1)){
        setCaretPos(input,1);
        this._caretOffset = 1;
        return;
    }
    //increase / decrease number by (step up / down) * multiplier on shift down
    if(isUpDown){
        var step = (isShift ? PRESET_SHIFT_MULTIPLIER : 1) * this._valueStep,
            mult = keyCode == 38 ? 1.0 : -1.0;
        inputSetValue(input,Number(value) + (step * mult));
        setCaretPos(input,start);
        e.preventDefault();
        return;
    }
    //range selected, not in selection process
    if(isRangeSelected && !(isShift && isLeftRight)){
        //jump to start <--> end
        if(isLeftRight){
            setCaretPos(input,isLeft ? start : end);
        } else { //replace complete range, not just parts
            value = value.substr(0,start) + String.fromCharCode(keyCode) + value.substr(end,length-end);
            inputSetValue(input,value);
            setCaretPos(input,end);
        }
        e.preventDefault();
        return;
    }
    //caret within fractional part, not moving caret, selecting, deleting
    if(!isShift && !isLeftRight && !isBackspaceDelete && (start > indexDecimalMark && start < length)){
        value = value.substr(0,start) + String.fromCharCode(keyCode) + value.substr(start+1,length-1);
        inputSetValue(input,value);
        setCaretPos(input,Math.min(start+1,length-1));
        e.preventDefault();
        return;
    }
    //caret at end of number, do nothing
    if(!isBackspaceDelete && !isLeftRight && !isUpDown && start >= length){
        e.preventDefault();
    }
};

NumberInput_Internal.prototype.getValue = function () {
    return this._value;
};

NumberInput_Internal.prototype.setValue = function (n) {
    this._setValue(n);
};

NumberInput_Internal.prototype.getNode = function () {
    return this._input;
};

module.exports = NumberInput_Internal;
