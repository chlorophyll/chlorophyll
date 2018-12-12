import _ from 'lodash';
import * as assert from 'assert';

import * as T from './types';
import * as glsl from './glsl';
import { addSerializableType } from './util/serialization';
import { Compilation } from './graphlib/compiler';

function mapValue(value, fromLow, fromHigh, toLow, toHigh) {
    return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
}

const Units: {[key: string]: T.GraphUnit} = {};
export default Units;

/*
 * Class for a representable type under the graph language.
 * Each instantiation is a new type (e.g. Angle), rather than a value of that
 * type (e.g. 1.5 radians).
 */
class GraphUnit {
    readonly isUnit = true;
    readonly create = (val) => val;
    readonly serialize = (val) => val;
    readonly name = null;

    /*
     * By default, values are stored with no transformation.
     * Specify create/serialize functions to apply a transformation to values on
     * creation or when saving, respectively.
     */
    constructor(name: string, create?, serialize?) {
        assert.ok(!Units[name]);

        this.name = name;
        if (create)
            this.create = create;
        if (serialize)
            this.serialize = serialize;

        addSerializableType(name, {
            serialize: (val) => this.serialize(val),
            deserialize: (val) => this.create(val)
        });

        Units[name] = this;
    }
};


class RangeUnit extends GraphUnit implements T.RangeUnit {
    readonly isCastable = true;
    readonly range;

    constructor(name: string, low, high, create?) {
        super(name, create);
        this.range = [low, high];
    }

    castFrom(val: number, fromType: RangeUnit) {
        let [fromLow, fromHigh] = fromType.range;
        let [toLow, toHigh] = this.range;

        let out = mapValue(val, fromLow, fromHigh, toLow, toHigh);

        return this.create(out);
    }

    compile(val: number, fromType: RangeUnit) {
        if (_.isEqual(fromType.range, this.range))
            return val;

        const [fromLow, fromHigh] = fromType.range.map(glsl.Const);
        const [toLow, toHigh] = this.range.map(glsl.Const);
        return glsl.FunctionCall('mapValue', [val, fromLow, fromHigh, toLow, toHigh]);
    }
}

/*
 * Graph node type definitions
 */
Units.Numeric = new RangeUnit('Numeric', 0, 1);
Units.UInt8 = new RangeUnit('UInt8', 0, 0xff, (val: number) => val & 0xff);
Units.Angle = new RangeUnit('Angle', 0, 2*Math.PI);
Units.Distance = new RangeUnit('Distance', -1, 1); // TODO migrate to 0->1
// Utility Aliases
Units.Num = Units.Numeric;
Units.Percentage = Units.Numeric;

Compilation.toplevel(`
float mapValue(in float value,
               in float fromLow, in float fromHigh,
               in float toLow, in float toHigh) {
    return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
}
`);
