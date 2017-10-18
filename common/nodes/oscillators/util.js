import { addSerializableType } from '@/common/util/serialization';

export default class Frequency {
    constructor(hz) {
        this.frequency = hz;
        this.display_qty = 'hz';
    }

    serialize() {
        return this.frequency;
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

    static deserialize(hz) {
        return new Frequency(hz);
    }

    get quantities() {
        return ['hz', 'sec', 'bpm'];
    }

    valueOf() {
        return this[this.display_qty];
    }

    setCurrent(val) {
        this[this.display_qty] = val;
    }

    toString() {
        const val = this.valueOf();
        return `${val} ${this.display_qty}`;
    }
};

addSerializableType('Frequency', Frequency);
