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
                    state.settings = {
                        ...state.settings,
                        pixelpusher: {},
                    };
                    break;
                case 'artnet':
                    state.settings = {
                        ...state.settings,
                        artnet: arg.settings,
                    };
                    break;
                default:
                    throw new Error(`unknown protocol: ${arg.protocol}`);
            }
        },

        updateSettings(state, settings) {
            state.settings = settings;
        },
    },
});
