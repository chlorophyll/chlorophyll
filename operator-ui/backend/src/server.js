import _ from 'lodash';
import express from 'express';
import Nanotimer from 'nanotimer';
import { readSavefile } from './restore';
import { checkFramebuffer } from '@/common/util/gl_debug';
import { createFromConfig } from '@/common/mapping';
import PatternRunner from '@/common/patterns/runner';
import PlaylistRunner from '@/common/patterns/playlist';

import PixelPusherRegistry from 'pixelpusher-driver';

import * as WebGL from 'wpe-webgl';


const gl = WebGL.initHeadless();
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
console.log(gl.getParameter(gl.VERSION));

let isPlaying = false;
const app = express();
const port = 3000;

const controllers = [];

function addController(controller) {
    controller.applyCorrection = (x) => x;
    controllers.push(controller);
    _.sortBy(controllers, 'controller_id');
}

const timer = new Nanotimer();

function runAnimation(cb) {
    timer.setInterval(() => {
        cb();
        WebGL.nextFrame();
    }, [], '16666667n');
}

function stopAnimation() {
    isPlaying = false;
    timer.clearInterval();
}


function pushPixels(model, stripBufs) {
    let ptr = 0;
    let strip = 0;
    for (const controller of controllers) {
        for (let cstrip = 0; strip < model.num_strips && cstrip < controller.strips_attached; cstrip++) {
            controller.setStrip(cstrip, stripBufs[strip]);
            strip++;
        }
        controller.sync();
    }
}

function pushBlackFrame(model) {
    const pixels = new Float32Array(model.num_pixels * 4);
    const stripBufs = makeStripBufs(model, pixels);

    pushPixels(model, stripBufs);
}

function makeStripBufs(model, pixels) {
    const stripBufs = [];
    let ptr = 0;
    for (let strip = 0; strip < model.num_strips; strip++) {
        const buf = model.makeStripBuffer(strip);
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

function runPattern(model, pattern, group, mapping) {
    isPlaying = true;
    console.log('trying to run pattern');
    console.log(model.strip_offsets);
    console.log(model.num_pixels);
    console.log(`number of pushers: ${controllers.length}`);
    const patternRunner = new PatternRunner(gl, model, pattern, group, mapping);
    let time = 0;

    let pixels = new Float32Array(model.num_pixels * 4);
    let prevPixels = new Float32Array(model.num_pixels * 4);

    let diff = false;

    let curTime;
    let prevStripBufs = undefined;

    const frame = () => {
        if (!curTime) {
            curTime = process.hrtime();
        }
        patternRunner.step(time, pixels);
        const stripBufs = makeStripBufs(model, pixels);
        prevStripBufs = stripBufs;
        [prevPixels, pixels] = [pixels, prevPixels];

        pushPixels(model, stripBufs);
        if (time > 0 && time % 300 === 0) {
            const diff = process.hrtime(curTime);
            const ns = diff[0] * 1e9 + diff[1];
            const fpns = 300 / ns;
            const fps = fpns * 1e9;
            console.info(`frame ${time} ${fps.toFixed(1)} fps`);
            curTime = process.hrtime();
        }
        time++;
    };

    runAnimation(frame);
}

const filename = '/Users/rpearl/Dropbox/chlorophyll-dragon/Chrysanthemum.chl';
const registry = new PixelPusherRegistry();

let group;

let state;

async function init() {
    state = await readSavefile(filename);

    let group_id = state.group_list[0];
    group = state.groups[group_id];
}

function isReady() {
    if (!state) {
        return false;
    }
    let stripsAttached = 0;
    for (let controller of controllers) {
        stripsAttached += controller.strips_attached;
    }
    return stripsAttached === state.model.num_strips;
}

registry.on('discovered', (controller) => {
    addController(controller);
});

registry.start();

init().then(() => console.log('initialized')).catch((e) => console.log(e));

app.use(express.json());

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/api/start', (req, res) => {
    if (!isReady()) {
        res.status(503).send({msg: 'not ready'});
    }

    const {patternId, mappingId} = req.body;

    const pattern = state.patterns[patternId];
    const mapping = state.mappings[mappingId];

    if (isPlaying) {
        stopAnimation();
    }
    runPattern(state.model, pattern, group, mapping);

    res.send('ok');
});

app.post('/api/stop', (req, res) => {
    stopAnimation();
    pushBlackFrame(state.model);
    res.send('ok');
});


app.listen(port, () => console.log(`backend listening on port ${port}!`))
