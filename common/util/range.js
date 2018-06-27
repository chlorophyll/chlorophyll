import { addSerializableType } from './serialization';

import { Compilation } from '@/common/graphlib/compiler';

export default class Range {
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
        return [this.min, this.max];
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

addSerializableType('Range', Range);

Compilation.registerType('Range', Range);
