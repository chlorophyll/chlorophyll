import _ from 'lodash';
import * as assert from 'assert';

import * as T from './types';
import * as glsl from './glsl';
import { addSerializableType } from './util/serialization';
import { Compilation } from './graphlib/compiler';

Compilation.toplevel(`
float mapValue(in float value,
               in float fromLow, in float fromHigh,
               in float toLow, in float toHigh) {
    return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
}
`);

const Units: {[key: string]: T.GraphUnit} = {};
export default Units;

/*
 * Class for a representable type under the graph language.
 * Each instantiation is a new type (e.g. Angle), rather than a value of that
 * type (e.g. 1.5 radians).
 */
class GraphUnit {
    readonly isUnit = true;
    readonly _tag = null;
    readonly create = (val) => val;

    /*
     * By default, values are stored with no transformation.
     * Specify create/serialize functions to apply a transformation to values on
     * creation or when saving, respectively.
     */
    constructor(name: string, create?) {
        assert.ok(!Units[name]);

        if (create)
            this.create = create;

        this._tag = name;
        Units[name] = this;

        addSerializableType(this);
    }
};


class RangeUnit extends GraphUnit implements T.RangeUnit, T.Serializable {
    readonly isCastable = true;
    readonly range;

    constructor(name: string, low, high, create?) {
        super(name, create);
        this.range = [low, high];
    }

    castFrom(val: object, fromType: RangeUnit) {
        if (_.isEqual(fromType.range, this.range))
            return val;

        const [fromLow, fromHigh] = fromType.range.map(glsl.Const);
        const [toLow, toHigh] = this.range.map(glsl.Const);
        return glsl.FunctionCall('mapValue', [val, fromLow, fromHigh, toLow, toHigh]);
    }

    serialize() {
        return {
            name: this._tag,
            range: this.range
        }
    }

    static deserialize(blob) {
        // All usable vars are initialized on first run.
        // Throw warnings if we see any
        if (blob.name && !Units[blob.name]) {
            console.error(
                `Saw unfamiliar unit: ${blob.name}.`,
                `Valid units: ${Object.keys(Units)}`,
                'Corrupted or outdated save file?'
            );
        }
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
