/*
 * OSC Signal class.
 *
 * A signal can be created to track the latest values received by an OSC
 * address.
 */
import _ from 'lodash';
import * as assert from 'assert';
import Units from '../units';
import { input } from '.';

// TODO(cwill) export this from osc/osc_types
const typeMap = {
    f: {
        unit: Units.Numeric,
        zeroValue: 0
    },
    r: {
        unit: 'CRGB',
        zeroValue: [0, 0, 0]
    }
};

export default class Signal {
    constructor(node, address, args) {
        this.node = node;
        this.oscTypes = args || [];
        this.graphTypes = this.oscTypes.map(Signal.oscToGraphType);

        this._address = address;
        this._currentValue = null;
        this._listener = null;

        this._startListener();

        // Clean up the OSC listener if the node is removed.
        this.node.graph.addEventListener('node-removed', event => {
            if (!event.node || event.node.id !== this.node.id)
                return;

            this._stopListener();
        });
    }

    static oscToGraphType(ot) {
        return typeMap[ot] ? typeMap[ot].unit : null;
    }

    getValue() {
        if (this._currentValue === null) {
            if (this.graphTypes.length > 1)
                assert.fail('multiple signal args unimplemented');

            const zero = typeMap[this.oscTypes[0]].zeroValue;
            return zero;
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
            this.graphTypes = args.map(Signal.oscToGraphType);
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
}
