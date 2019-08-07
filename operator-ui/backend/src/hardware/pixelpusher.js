import _ from 'lodash';
import PixelPusherRegistry from 'pixelpusher-driver';
import pushPixels from '@/common/hardware/pixelpusher';

export default class PixelpusherClient {
    constructor(model, hardwareSettings) {
        this.model = model;
        this.globalBrightness = 1;
        this.controllers = [];
        this.registry = new PixelPusherRegistry();
        this.registry.on('discovered', this.addController.bind(this));
        this.registry.on('pruned', this.removeController.bind(this));
        this.registry.start();
    }
    setGlobalBrightness(val) {
        this.globalBrightness = val;
    }

    addController(controller) {
        controller.applyCorrection = x => x;
        this.controllers.push(controller);
        _.sortBy(this.controllers, 'controller_id');
    }

    removeController(controller) {
        this.controllers = this.controllers.filter(c => c.id !== controller.controller_id);
    }

    sendFrame(frame) {
        pushPixels(this.model, this.controllers, frame, this.globalBrightness);
    }
}
