import _ from 'lodash';
import { argv } from 'yargs';
import chalk from 'chalk';
import * as path from 'path';
import * as os from 'os';
import express from 'express';
import Nanotimer from 'nanotimer';
import { readSavefile } from './restore';
import { checkFramebuffer } from '@/common/util/gl_debug';
import { createFromConfig } from '@/common/mapping';
import PatternRunner from '@/common/patterns/runner';
import PixelpusherClient from './hardware/pixelpusher';
import { ArtnetRegistry } from '@/common/hardware/artnet';

import * as WebGL from 'wpe-webgl';


const gl = WebGL.initHeadless();
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
console.log(gl.getParameter(gl.VERSION));

let isPlaying = false;
const app = express();
const port = 3000;
let group;
let client;

let state;
process.on('uncaughtException', function (err) {
    console.log(err);
    console.log(err.stack);
    process.exit(1);
})

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

function runPattern(pattern, group, mapping) {
    const model = state.model;
    isPlaying = true;
    const patternRunner = new PatternRunner(gl, model, pattern, group, mapping);
    let time = 0;

    const w = model.textureWidth;

    const textureSize = w * w * 4;

    let pixels = new Float32Array(textureSize);
    let prevPixels = new Float32Array(textureSize);

    const stream = new Writable();


    let curTime;

    const frame = () => {
        if (!curTime) {
            curTime = process.hrtime();
        }
        let readbuf = pixels;
        // artnet locked to 30fps
        if (state.hardware.protocol === 'artnet' && frame % 2 !== 0) {
            readbuf = null;
        }
        patternRunner.step(time, readbuf);
        [prevPixels, pixels] = [pixels, prevPixels];
        if (readbuf) {
            client.sendFrame(readbuf);
        }

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

export const filename = argv._[0];


async function init() {
    state = await readSavefile(filename);

    const settings = state.hardware.settings[state.hardware.protocol];
    switch (state.hardware.protocol) {
        case 'artnet':
            client = new ArtnetRegistry(state.model, settings);
            break;
        case 'pixelpusher':
            client = new PixelpusherClient(state.model, settings);
            break;
        default:
            throw new Error(`Unsupported client protocol ${state.hardware.protocol}`);
    }

    let group_id = state.group_list[0];
    group = state.groups[group_id];
}

function isReady() {
    return !!state;
}

function sendBlackFrame() {
    const w = state.model.textureWidth;
    const buf = new Float32Array(w * w * 4);
    client.sendFrame(buf);
}

init().catch((e) => {
    //console.log(chalk.red(e));
    console.log(chalk.red(e.stack));
    process.exit(1);
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/dist')))

app.get('/api/state', (req, res) => {
    if (!isReady()) {
        res.status(503).send({msg: 'not ready'});
        return;
    }

    res.json(state);
});


app.post('/api/start', (req, res) => {
    if (!isReady()) {
        res.status(503).send({msg: 'not ready'});
        return;
    }

    const {patternId, mappingId} = req.body;

    const pattern = state.patterns[patternId];
    const mapping = state.mappings[mappingId];

    if (isPlaying) {
        stopAnimation();
    }
    runPattern(pattern, group, mapping);

    res.send('ok');
});

app.post('/api/stop', (req, res) => {
    stopAnimation();
    sendBlackFrame();
    res.send('ok');
});
const ifaces = _.flatten(_.values(os.networkInterfaces()));
const external = ifaces.find(val => val.family === 'IPv4' && !val.internal);

app.listen(port, () => {
    console.log();
    console.log();
    console.log('App running at: ');
    console.log(    ` -   local:   ${chalk.cyan.bold(`http://localhost:${port}/`)}`);
    if (external) {
        console.log(` - Network:   ${chalk.cyan.bold(`http://${external.address}:${port}/`)}`);
    }
    console.log();
    console.log();
});
