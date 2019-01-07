import _ from 'lodash';
import * as assert from 'assert';
import { addSerializableType } from './serialization';

export default class Enum {
    readonly _tag = 'Enum';
    public value;
    readonly enumValues;
    readonly descriptions;

    constructor(enumValues, value, descriptions) {
        assert.ok(_.isArray(enumValues));
        assert.ok(enumValues.includes(value));

        this.value = value;
        this.enumValues = enumValues;
        this.descriptions = _.isArray(descriptions) ? descriptions : null;
    }

    valueOf() {
        return this.value;
    }

    toString() {
        return _.isString(this.value) ? this.value : this.value.toString();
    }

    serialize() {
        return {
            value: this.value,
            enumValues: this.enumValues,
            descriptions: this.descriptions
        };
    }

    static deserialize({enumValues, value, descriptions}) {
        return new Enum(enumValues, value, descriptions);
    }
}

addSerializableType(Enum, 'Enum');
