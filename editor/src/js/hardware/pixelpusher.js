import store from 'chl/vue/store';
import PixelPusherRegistry from 'pixelpusher-driver';
import _ from 'lodash';

import pushPixelsCommon from '@/common/hardware/pixelpusher';

store.registerModule('pixelpushers', {
    namespaced: true,
    state: {
        controllers: [],
    },

    mutations: {
        addController(state, controller) {
            const insertIndex = _.sortedIndexBy(state.controllers, controller, 'id');
            state.controllers.splice(insertIndex, 0, controller);
        },
        removeController(state, controller) {
            const index = _.sortedIndexBy(state.controllers, controller, 'id');
            if (state.controllers[index] === controller) {
                state.controllers.splice(index, 1);
            }
        },
    },
});

const registry = new PixelPusherRegistry();

registry.on('discovered', controller => {
    controller.applyCorrection = (x) => x;
    store.commit('pixelpushers/addController', controller);
});

registry.on('pruned', controller => {
    store.commit('pixelpushers/removeController', controller);
});

registry.start();

export function pushPixels(model, pixels) {
    const controllers = store.state.pixelpushers.controllers;
    pushPixelsCommon(model, controllers, pixels);
}

export function pushBlackFrame(model) {
    const pixels = new Float32Array(model.num_pixels * 4);
    const controllers = store.state.pixelpushers.controllers;
    pushPixelsCommon(model, controllers, pixels);
}
