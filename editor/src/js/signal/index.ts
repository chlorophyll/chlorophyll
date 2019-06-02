import store, {newgid, crud} from 'chl/vue/store';
import {OSCType} from '@/common/osc/osc_types';
import Signal from '@/common/osc/signal';

interface SignalBlob {
    name: string;
    address: string;
    args: Array<string | OSCType>;
    source: 'osc' | 'syphon';
}

store.registerModule('signal', {
    namespaced: true,
    state: {
        signals: {},
        signal_list: []
    },
    mutations: {
        ...crud(
            'signal',
            'signals',
            'signal_list',
            id => ({
                name: `Signal ${id}`,
                address: '',
                args: [],
                source: 'osc'
            })
        ),
    }
});

export function createNewSignal(name: string, address?, args?) {
    const signalBlob = {
        id: newgid(),
        name,
        address,
        args
    };
    store.commit('signal/create_signal', signalBlob);
}

export function saveSignal(signalBlob) {
    const signal = new Signal(signalBlob.address, signalBlob.args, signalBlob.name);
    return signal.serialize();
}

export function saveAllSignals() {
    // TODO
}

registerSaveField('signals', {
    // TODO
});

export const signalUtilsMixin = {
    // TODO
};
