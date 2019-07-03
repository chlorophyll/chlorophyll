import store, {newgid, crud} from 'chl/vue/store';
import Signal from '@/common/osc/signal';
import {registerSaveField} from 'chl/savefile';
import {restoreAll} from '@/common/util/serialization';

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
        restore(state, signals) {
            const {resourcesById, idList} = restoreAll(signals);
            state.signals = resourcesById;
            state.signal_list = idList;
        }
    },
    getters: {
        signal_list(state) {
            return state.signal_list.map(id => state.signals[id]);
        },
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

export function saveAllSignals() {
    return store.getters['signal/signal_list'].map(blob => {
        const signal = new Signal(blob);
        return signal.serialize();
    });
}

registerSaveField('signals', {
    save() {
        return saveAllSignals();
    },
    restore(signals) {
        store.commit('signal/restore', signals);
    }
});

export const signalUtilsMixin = {
    getSignal(id) {
        if (id in this.$store.state.signal.signals)
            return this.$store.state.signal.signals[id];
        else
            return null;
    }
};
