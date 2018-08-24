/*
 * OSC Signal class.
 *
 * A signal can be created to track the latest values received by an OSC
 * address.
 */
import Units from '@/common/units';
import { input } from '@/common/osc';

export default class Signal {
    constructor(node, address, args) {
        this.node = node;
        this.oscTypes = args || [];
        this.graphTypes = this.oscTypes.map(Signal.oscToGraphType);

        this._address = address;
        this._currentValue = null;

        this._startListener();

        // Clean up the OSC listener if the node is removed.
        this.node.graph.addEventListener('node-removed', event => {
            if (event.node && event.node.id === this.node.id)
                input.stop(this._address);
        });
    }

    static oscToGraphType(ot) {
        // TODO(cwill) export this from osc/types
        const typeMap = {
            f: Units.Numeric,
            r: Units.CRB
        };

        return typeMap[ot] || null;
    }

    getValue() {
        return this._currentValue;
    }

    update(address, args) {
        if (address === this._address && _.isEqual(args, this.oscTypes))
            return;

        // TODO let listener creation return an object which can be used to
        // update the listener, pause, or stop it.
        input.stop(this._address);

        if (address)
            this._address = addr;

        if (args) {
            this.oscTypes = args;
            this.graphTypes = args.map(Signal.oscToGraphType);
        }
        this._startListener();
    }

    _startListener() {
        input.listen(this._address, this.oscTypes, payload => {
            this._currentValue = payload[0];
        });
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
