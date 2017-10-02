import Util from 'chl/util';

import { addSerializableType } from '@/common/util/serialization';

function binop(oper) {
    return function(a, b) {

        if (a === undefined || b === undefined || !a.isUnit || !b.isUnit)
            return oper(a, b);

        let lhs = a.convertTo(Units.Numeric);
        let rhs = b.convertTo(Units.Numeric);
        return new Units.Numeric(oper(lhs, rhs));
    };
};

let _Units = {
    Operations: {
        add: binop(function(a, b) { return a+b; }),
        sub: binop(function(a, b) { return a-b; }),
        mul: binop(function(a, b) { return a*b; }),
        div: binop(function(a, b) { return a/b; }),
        mod: binop(function(a, b) { return a%b; }),
    },
};

let Units = new Proxy(_Units, {
    set: function(obj, prop, Value) {
        obj[prop] = Value;

        Value._unit_name = prop;

        Value.prototype.serialize = function() {
            return this.val;
        };

        Value.deserialize = function(property) {
            return new Value(property);
        };
        addSerializableType(prop, Value);

        Value.isUnit = true;
        Value.prototype.isUnit = true;

        Value.prototype.convertTo = function(Constructor) {
            if (!Constructor || !Constructor._unit_name)
                return undefined;

            if (Value == constructor)
                return new Value(this.val);

            return new Constructor(Util.map(
                this.val,
                Value.low, Value.high,
                Constructor.low, Constructor.high
            ));
        };

        Value.prototype.valueOf = function() {
            return this.val;
        };

        Value.prototype.toString = function() {
            return this.val.toString();
        };

        Value.prototype.clone = function() {
            return new Value(this.val);
        };

        return true;
    }
});

function RangeType(low, high, constructor) {
    constructor.low = low;
    constructor.high = high;
    return constructor;
}

/* eslint-disable no-invalid-this */

Units.Numeric = RangeType(0, 1, function(val) {
    this.val = val;
});

Units.Percentage = RangeType(0, 1, function(val) {
    this.val = val;
});

Units.UInt8 = RangeType(0, 0xff, function(val) {
    this.val = val & 0xff;
});
Units.UInt8.isIntegral = true;

Units.Distance = RangeType(-1, 1, function(val) {
    this.val = val;
});

Units.Angle = RangeType(0, 2*Math.PI, function(val) {
    this.val = val;
});
export default Units;
