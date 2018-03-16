import { addSerializableType } from '@/common/util/serialization';
import * as glsl from '@/common/glsl';
import { Compilation } from '@/common/graphlib/compiler';

function mapValue(value, fromLow, fromHigh, toLow, toHigh) {
    return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
}

function binop(oper) {
    return function(a, aUnit, b, bUnit) {

        let lhs = Units.convert(a, aUnit, Units.Numeric);
        let rhs = Units.convert(b, bUnit, Units.Numeric);

        return oper(lhs, rhs);

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

    convert(val, fromUnit, toUnit) {
        let [fromLow, fromHigh] = fromUnit.range;
        let [toLow, toHigh] = toUnit.range;

        let out = mapValue(val, fromLow, fromHigh, toLow, toHigh);

        return toUnit.create(out);
    },

    compile(val, fromUnit, toUnit) {
        let [fromLow, fromHigh] = fromUnit.range.map(glsl.Const);
        let [toLow, toHigh] = toUnit.range.map(glsl.Const);

        return glsl.FunctionCall('mapValue', [val, fromLow, fromHigh, toLow, toHigh]);
    }

};

let Units = new Proxy(_Units, {
    set: function(obj, prop, value) {
        obj[prop] = value;

        // backwards compatibility
        let Serializer = class extends Number {
            serialize() {
                return this;
            }

            static deserialize() {
                return value.create(this);
            }
        };

        addSerializableType(prop, Serializer);
        return true;
    }
});

class RangeType {
    constructor(low, high, create) {
        this.range = [low, high];
        this.create = create || ((val) => val);
        this.isUnit = true;
    }
};

Units.Numeric = new RangeType(0, 1);
Units.Percentage = new RangeType(0, 1);
Units.UInt8 = new RangeType(0, 0xff, (val) => val & 0xff);

Units.Distance = new RangeType(-1, 1);
Units.Angle = new RangeType(0, 2*Math.PI);

/*
Compilation.toplevel(
    glsl.FunctionDecl('float', 'mapValue', [
        glsl.Variable('float', 'value'),
        glsl.Variable('float', 'fromLow'), glsl.Variable('float', 'fromHigh'),
        glsl.Variable('float', 'toLow'), glsl.Variable('float', 'toHigh'),
    ], [
        glsl.Return(glsl.BinOp(
            glsl.BinOp(
                glsl.BinOp(glsl.Ident('value'), '-', glsl.Ident('fromLow')),
                '*',
                glsl.BinOp(
                    glsl.BinOp(glsl.Ident('toHigh'), '-', glsl.Ident('toLow')),
                    '/',
                    glsl.BinOp(glsl.Ident('fromHigh'), '-', glsl.Ident('fromLow'))
                )
            ),
            '+',
            glsl.Ident('toLow'))
        )
    ]));
*/

Compilation.toplevel(`
float mapValue(in float value,
               in float fromLow, in float fromHigh,
               in float toLow, in float toHigh) {
    return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
}
`);
export default Units;
