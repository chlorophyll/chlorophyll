import _ from 'lodash';
import assert from 'assert';
import { addSerializableType } from './serialization';

export default class Enum {
    constructor(enumValues, value) {
        if (!enumValues.includes(value))
            throw new Error(`Invalid enum member: ${value}`);

        this.value = value;
        this.enumValues = enumValues;
    }

    static declare() {
        assert.fail('Plain enumerations cannot be compiled');
    }

    valueOf() {
        return this.value;
    }

    toString() {
        return _.isString(this.value) ? this.value : this.value.toString();
    }

    serialize() {
        return {
            value: this.value
            enumValues: this.enumValues
        };
    }

    static deserialize(enumValues, value) {
        return new Enum(enumValues, value);
    }
}

addSerializableType('Enum', Enum);
