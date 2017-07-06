import Util from 'chl/util';

function binop(oper) {
    return function(a, b) {
        let lhs, rhs, val;

        if (a === undefined || b === undefined || !a.isUnit || !b.isUnit)
            return oper(a, b);

        lhs = a.convertTo(Units.Numeric);
        rhs = b.convertTo(Units.Numeric);
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
    set: function(obj, prop, value) {
        obj[prop] = value;

        value._unit_name = prop;

        value.prototype.serialize = function() {
            return this.val;
        };

        value.deserialize = function(property) {
            return new value(property);
        };
        Util.JSON.addType(prop, value);

        value.isUnit = true;
        value.prototype.isUnit = true;

        value.prototype.convertTo = function(constructor) {
            if (!constructor || !constructor._unit_name)
                return undefined;

            if (value == constructor)
                return new value(this.val);

            return new constructor(Util.map(
                this.val,
                value.low, value.high,
                constructor.low, constructor.high
            ));
        };

        value.prototype.valueOf = function() {
            return this.val;
        };

        value.prototype.toString = function() {
            return this.val.toString();
        };

        value.prototype.clone = function() {
            return new value(this.val);
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
