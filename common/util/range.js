import { addSerializableType } from './serialization';

export default class Range {
    constructor(min, max, lower, upper) {
        this.min = min;
        this.max = max;
        this.lower = lower;
        this.upper = upper;
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
