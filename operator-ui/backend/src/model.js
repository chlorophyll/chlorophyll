import ModelBase from '@/common/model';

export default class Model extends ModelBase {
    constructor(json, groups) {
        super(json);
        this.groups = groups;
    }

    makeStripBuffer(strip) {
        let num_pixels = this.numPixelsInStrip(strip);
        return Buffer.alloc(3*num_pixels);
    }

    getGroupPixels(id) {
        let group = this.groups[id];
        return this.pixelPositions(group);
    }

    getStripBuffers(colorbuf) {
        let ptr = 0;

        let stripbufs = [];

        for (let strip = 0; strip < this.num_strips; strip++) {
            let buf = this.makeStripBuffer(strip);
            for (let i = 0; i < buf.length; i++) {
                buf[i] = colorbuf[ptr++];
            }
            stripbufs.push(buf);
        }

        return stripbufs;
    }
}
