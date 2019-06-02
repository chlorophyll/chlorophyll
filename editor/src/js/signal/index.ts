import store, {crud} from 'chl/vue/store';

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
            })
        ),
    }
});
