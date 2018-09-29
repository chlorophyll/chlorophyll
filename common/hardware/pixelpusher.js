import _ from 'lodash';

function makeStripBufs(model, pixels) {
    const stripBufs = [];
    let ptr = 0;
    for (let strip = 0; strip < model.num_strips; strip++) {
        const pixelsInStrip = model.numPixelsInStrip(strip);
        const buf = Buffer.alloc(3*pixelsInStrip);

        for (let i = 0; i < buf.length; i++) {
            if (ptr % 4 == 3) {
                ptr++;
            }
            buf[i] = pixels[ptr++]*255;
        }
        stripBufs.push(buf);
    }
    return stripBufs;
}

export default function pushPixels(model, controllers, pixels) {
    const allStripsAttached = _.sumBy(controllers, controller => controller.strips_attached);
    const numStrips = model.num_strips;
    if (allStripsAttached < numStrips) {
        return;
    }
    const stripBufs = makeStripBufs(model, pixels);
    let strip = 0;
    for (const controller of controllers) {
        const stripsAttached = controller.strips_attached;
        for (let cstrip = 0; strip < numStrips && cstrip < stripsAttached; cstrip++) {
            controller.setStrip(cstrip, stripBufs[strip]);
            strip++;
        }
        controller.sync();
    }
}
