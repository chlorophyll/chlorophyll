/*
 * OSC Signal class.
 *
 * A signal can be created to track the latest values received by an OSC
 * address.
 */
import { input } from '.';

export default class Signal {
    constructor(node, address, args) {
        this.node = node;
        this.oscTypes = args;
        this.graphTypes = args.map(arg => Signal.typeMap[arg]);

        this._address = address;
        this._currentValue = null;

        this._startListener();
    }

    _startListener() {
        input.listen(this._address, this.oscTypes, payload => {
            this._currentValue = payload[0];
        });
    }

    set address(addr) {
        input.stop(this._address);
        this._address = addr;
        this._startListener();
    }

    get address() {
        return this._address;
    }

    get ident() {
        return `osc_signal_${node.id}`;
    }

    get shortName() {
        return this.address.split('/').pop();
    }

    getValue() {
        return this._currentValue;
    }
}

Signal.typeMap = {
    f: Units.Numeric,
    r: Units.CRGB
};
