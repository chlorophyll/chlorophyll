import Util from 'chl/util';

export default class Frequency {
    constructor(hz) {
        this.frequency = hz;
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

    toString() {
        return `${this.hz} hz`;
    }
};

Util.JSON.addType('Frequency', Frequency);
