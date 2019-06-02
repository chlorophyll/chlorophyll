/*
 * OSC Signal class.
 *
 * A signal can be created to track the latest values received by an OSC
 * address.
 */
import _ from 'lodash';
import * as assert from 'assert';
import { input } from 'common/osc';
import * as OT from './osc_types';

export default class Signal {
    constructor(address, args, name) {
        this.oscTypes = args || [];
        this.graphTypes = this.oscTypes.map(OT.toGraphUnit);
        this.name = name || address;
        // TODO support other sources
        this.source = 'osc';

        this._address = address;
        this._currentValue = null;
        this._listener = null;
    }

    enable() {
        return this._startListener();
    }

    getValue() {
        if (this._currentValue === null) {
            if (this.graphTypes.length > 1)
                assert.fail('multiple signal args unimplemented');

            return OT.zeroValue(this.oscTypes[0]);
        }

        return this._currentValue;
    }

    update(address, args) {
        if (address === this._address && _.isEqual(args, this.oscTypes))
            return;

        // TODO let listener creation return an object which can be used to
        // update the listener, pause, or stop it.
        input.stop(this._address);

        if (address)
            this._address = address;

        if (args) {
            this.oscTypes = args;
            this.graphTypes = args.map(OT.toGraphUnit);
        }
        this._startListener();
    }

    _startListener() {
        if (this._listener) {
            console.warn(`SIGNAL: restarting listener for ${this._address}`);
            this._stopListener();
        }

        this._listener = input.listen(
            this._address,
            this.oscTypes,
            payload => {
                this._currentValue = payload[0];
            }
        );
    }

    _stopListener() {
        if (!this._listener)
            return;

        this._listener.stop();
        this._listener = null;
    }

    get ident() {
        return `osc_signal_${this.node.id}`;
    }

    get shortName() {
        return this.address.split('/').pop();
    }

    set address(addr) {
        if (addr === this._address)
            return;

        this.update(addr, null);
    }

    get address() {
        return this._address;
    }

    set args(args) {
        if (!args)
            args = [];

        if (_.isEqual(args, this.oscTypes))
            return;

        this.update(null, args);
    }

    get args() {
        return this.oscTypes;
    }

    serialize() {
        return {
            name: this.name,
            address: this._address,
            args: this.oscTypes,
            source: this.source
        };
    }

    static deserialize(attrs) {
        return new Signal(attrs.address, attrs.args, attrs.name);
    }
}
