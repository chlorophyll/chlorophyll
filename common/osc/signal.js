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
        this.oscTypes = args;
        this.graphTypes = args.map(Signal.oscToGraphType);

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
        return `osc_signal_${this.node.id}`;
    }

    get shortName() {
        return this.address.split('/').pop();
    }

    getValue() {
        return this._currentValue;
    }
}
