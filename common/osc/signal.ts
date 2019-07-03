/*
 * OSC Signal class.
 *
 * A signal can be created to track the latest values received by an OSC
 * address.
 */
import _ from 'lodash';
import slugify from 'slugify';
import * as assert from 'assert';
import * as OT from './osc_types';
import * as T from '../types';
import { input } from './index';

export interface SignalBlob {
    id?: number;
    name: string;
    address: string;
    args: Array<string>;
    source: 'osc';
}

export default class Signal {
    id: number;
    oscTypes: Array<OT.OSCType>;
    graphTypes: Array<T.GraphUnit>;
    name: string;
    source: 'osc';

    private _address: string;
    private _currentValue: any;
    private _listener;

    constructor(attrs: SignalBlob) {
        this.id = attrs.id;
        this.oscTypes = [];
        if (attrs.args)
            this.oscTypes = attrs.args.map(t => OT.OSCType[t]);

        this.graphTypes = this.oscTypes.map(OT.toGraphUnit);
        this.name = attrs.name || attrs.address;
        // TODO support other sources
        this.source = 'osc';

        this._address = attrs.address;
        this._currentValue = null;
        this._listener = null;
    }

    enable() {
        return this._startListener();
    }

    disable() {
        return this._stopListener();
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

        this._stopListener();

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
        return `osc_signal_${this.id || slugify(this.name) || slugify(this._address)}`;
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

    set args(args: Array<string>) {
        if (!args)
            args = [];

        const newArgs = args.map(t => OT.OSCType[t]);
        if (_.isEqual(newArgs, this.oscTypes))
            return;

        this.update(null, args);
    }

    get args() {
        return this.oscTypes;
    }

    get enabled() {
        return Boolean(this._listener);
    }

    serialize(): SignalBlob {
        return {
            id: this.id,
            name: this.name,
            address: this._address,
            args: this.oscTypes.map(t => OT.OSCType[t]),
            source: this.source
        };
    }

    static deserialize(attrs: SignalBlob) {
        return new Signal(attrs);
    }
}
