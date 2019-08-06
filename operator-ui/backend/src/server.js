import _ from 'lodash';
import sharp from 'sharp';
import { argv } from 'yargs';
import chalk from 'chalk';
import * as path from 'path';
import * as os from 'os';
import * as realtime from './realtime';
import tmp from 'tmp-promise';
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
let patternRunner;

let state;
let previewsByPatternId;

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
    patternRunner.stop();
    isPlaying = false;
    timer.clearInterval();
}

async function makePreviewAsync(pattern, mapping) {
    console.log(`generating preview for ${pattern.name}`);
    const model = state.model;
    const groupId = state.group_list[0];
    const group = state.groups[groupId];

    try {
        const runner = new PatternRunner(gl, model, pattern, group, mapping);

        const w = model.textureWidth;
        const textureSize = w * w * 4;
        const pixels = new Float32Array(textureSize);
        runner.step(0, pixels);
        const tmpFile = await tmp.file();

        const buf = Buffer.alloc(w*w*3);
        let ptr = 0;
        for (let i = 0; i < pixels.length; i++) {
            if (i % 4 === 3) continue;
            buf[ptr] = pixels[i]*255;
            ptr++;
        }

        await sharp(buf, {
            raw: {
                width: w,
                height: w,
                channels: 3,
            }
        }).png().toFile(tmpFile.path);
        return {
            patternId: pattern.id,
            mappingId: mapping.id.toString(),
            path: tmpFile.path,
        };
    } catch (e) {
        console.log(e);
        return null;
    }
}

async function makeAllPreviewsAsync() {
    console.log('Generating previews... (this make take a while)');
    const mappingsByType = _.groupBy(_.values(state.mappings), m => m.type);

    console.log(mappingsByType);

    const previewPromises = _.flatten(_.values(state.patterns).map(pattern => {
        const mappings = mappingsByType[pattern.mapping_type] || [];
        return mappings.map(mapping => makePreviewAsync(pattern, mapping));
    }));

    const previews = _.compact(await Promise.all(previewPromises));

    previewsByPatternId = _.groupBy(previews, preview => preview.patternId);
    console.log('Ready');
}

function runPattern(pattern, group, mapping) {
    const model = state.model;
    isPlaying = true;
    patternRunner = new PatternRunner(gl, model, pattern, group, mapping);
    let time = 0;

    const w = model.textureWidth;

    const textureSize = w * w * 4;

    let pixels = new Float32Array(textureSize);
    let prevPixels = new Float32Array(textureSize);

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

    patternRunner.start();
    runAnimation(frame);
}

const filename = argv._[0];


async function init() {
    state = await readSavefile(filename);
    const realtimeState = await realtime.initAsync({
        globalBrightness: 100,
    });

    await makeAllPreviewsAsync();

    state.patterns = _.pickBy(state.patterns, pattern => previewsByPatternId[pattern.id] !== undefined);

    state.patternOrder = state.patternOrder.filter(patternId => previewsByPatternId[patternId] !== undefined);

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

    const result = {
        ...state,
        model: state.model.model_info,
    };

    res.json(result);
});

app.get('/api/preview/:patternId/:mappingId', (req, res) => {
    const {patternId, mappingId} = req.params;
    const previews = previewsByPatternId[patternId];
    if (!previews) {
        res.status(404).send('Not found');
        return;
    }
    const preview = previews.find(preview => preview.mappingId === mappingId);
    if (!preview) {
        res.status(404).send('Not found');
    }
    res.type('png').sendFile(preview.path);
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

const server = app.listen(port, () => {
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


