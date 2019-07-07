import store from 'chl/vue/store';
import { registerSaveField } from 'chl/savefile';

store.registerModule('hardware', {
    namespaced: true,
    state: {
        protocol: 'artnet',
        settings: {
            pixelpusher: defaultConfig('pixelpusher'),
            artnet: defaultConfig('artnet'),
        }
    },

    getters: {
        activeHardwareSettings(state) {
            return state.settings[state.protocol];
        },

        activeProtocol(state) {
            return state.protocol;
        },
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

        restore(state, blob) {
            if (blob.protocol)
                state.protocol = blob.protocol;

            if (blob.settings)
                state.settings = blob.settings;
        },

        clear(state) {
            state.protocol = 'artnet';
            state.settings = {
                pixelpusher: defaultConfig('pixelpusher'),
                artnet: defaultConfig('artnet'),
            };
        },
    },
});

function defaultConfig(protocol) {
    switch (protocol) {
        case 'pixelpusher':
            return {};

        case 'artnet':
            return [{
                controller: {
                    host: '192.168.1.241'
                },
                strip: 0,
                startUniverse: 0,
                startChannel: 0,
            }];

        default:
            return {};
    }
}

registerSaveField('hardwareSettings', {
    save() {
        return {...store.state.hardware};
    },

    restore(hardwareSettings) {
        if (!hardwareSettings)
            return;

        store.commit('hardware/restore', hardwareSettings);
    },
});
