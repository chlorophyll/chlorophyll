import { addSerializableType } from './serialization';

import { Compilation } from '../graphlib/compiler';

export default class Range {
    readonly _tag = 'Range';
    public min;
    public max;
    public lower;
    public upper;

    constructor(min, max, lower, upper) {
        this.min = min;
        this.max = max;
        this.lower = lower;
        this.upper = upper;
    }

    static declare() {
        return {
            type: 'vec2',
        };
    }

    valueOf() {
        return Float32Array.from([this.lower, this.upper]);
    }

    toString() {
        return `${this.lower.toFixed(2)} - ${this.upper.toFixed(2)}`;
    }

    serialize() {
        const { min, max, lower, upper } = this;
        return { min, max, lower, upper };
    }

    static deserialize({min, max, lower, upper}) {
        return new Range(min, max, lower, upper);
    }
}

addSerializableType(Range, 'Range');

Compilation.registerType('Range', Range);
