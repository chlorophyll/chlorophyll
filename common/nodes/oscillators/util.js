import { addSerializableType } from '@/common/util/serialization';
import { Compilation } from '@/common/graphlib/compiler';
import _ from 'lodash';

export default class Frequency {
    constructor(hz, display_qty='hz') {
        this.frequency = hz;
        this.display_qty = display_qty;
    }

    serialize() {
        return {frequency: this.frequency, display_qty: this.display_qty};
    }

    get bpm() {
        return this.frequency * 60;
    }

    set bpm(val) {
        this.frequency = val/60;
    }

    get sec() {
        return 1 / this.frequency;
    }

    set sec(val) {
        this.frequency = 1 / val;
    }

    get hz() {
        return this.frequency;
    }

    set hz(val) {
        this.frequency = val;
    }

    static declare() {
        return {
            type: 'float',
        };
    }

    static deserialize(val) {
        if (_.isNumber(val)) {
            return new Frequency(val);
        } else {
            const {frequency, display_qty} = val;
            return new Frequency(frequency, display_qty);
        }
    }

    get quantities() {
        return ['hz', 'sec', 'bpm'];
    }

    valueOf() {
        return this.hz;
    }
    current() {
        return this[this.display_qty];
    }

    setCurrent(val) {
        this[this.display_qty] = val;
    }

    toString() {
        const val = this.current();
        return `${val} ${this.display_qty}`;
    }
};

addSerializableType('Frequency', Frequency);
Compilation.registerType('Frequency', Frequency);
