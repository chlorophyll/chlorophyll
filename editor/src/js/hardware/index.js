import store from 'chl/vue/store';

store.registerModule('hardware', {
    namespaced: true,
    state: {
        protocol: 'pixelpusher',
        settings: {},
    },
    mutations: {
        useProtocol(state, arg) {
            state.protocol = arg.protocol;
            switch (arg.protocol) {
                case 'pixelpusher':
                    state.settings = {};
                    break;
                case 'art-net':
                    state.settings = arg.settings;
                    break;
                default:
                    throw new Error(`unknown protocol: ${arg.protocol}`);
            }
        },
    },
});
