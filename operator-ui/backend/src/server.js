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
import Pattern from './patterns';
import Playlist from './playlist';

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
let realtimeState;
let playlist;

const patternsById = {};

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

function runPattern(pattern, group, mapping) {
    const patternManager = patternsById[pattern.id];
    patternRunner = patternManager.getRunner(group, mapping, true);
    const model = state.model;
    isPlaying = true;
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
        if (state.hardware.protocol === 'artnet' && time % 2 !== 0) {
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

async function generatePatternInfo() {
    const mappingsByType = _.groupBy(_.values(state.mappings), m => m.type);
    for (const pattern of _.values(state.patterns)) {
        try {
            const patternManager = new Pattern(gl, state, pattern);
            patternsById[pattern.id] = patternManager;
        } catch (e) {
            console.log(`pattern ${pattern.name} did not compile`);
        }
    }
}

function updatePlaylist(op, source) {
    const {data} = realtimeState;
    if (!source) {
        playlist.setItems(data.playlist);
    }
}

function runPlaylist(index) {
    if (playlist.items.length === 0) {
        return;
    }

    if (playlist.activeItem !== null) {
        playlist.setTargetIndex(index);
        return;
    }
    const model = state.model;
    const w = model.textureWidth;

    const textureSize = w * w * 4;

    let pixels = new Float32Array(textureSize);
    let prevPixels = new Float32Array(textureSize);
    let curTime;
    let frames = 0;
    const frame = () => {
        if (!curTime) {
            curTime = process.hrtime();
        }
        let readbuf = pixels;
        // artnet locked to 30fps
        if (state.hardware.protocol === 'artnet' && frames % 2 !== 0) {
            readbuf = null;
        }

        playlist.step(readbuf);
        const activeTime = Math.floor(playlist.activeItemTime / 60);
        const targetTime = Math.floor(playlist.targetItemTime / 60);
        const {timeInfo} = realtimeState.data;
        if (activeTime !== timeInfo.activeTime) {
            realtimeState.submitOp({
                p: ['timeInfo', 'activeTime'],
                oi: activeTime,
            });
        }
        if (targetTime !== timeInfo.targetTime) {
            realtimeState.submitOp({
                p: ['timeInfo', 'targetTime'],
                oi: targetTime,
            });
        }

        [prevPixels, pixels] = [pixels, prevPixels];
        if (readbuf) {
            client.sendFrame(readbuf);
        }
        if (frames > 0 && frames % 300 === 0) {
            const diff = process.hrtime(curTime);
            const ns = diff[0] * 1e9 + diff[1];
            const fpns = 300 / ns;
            const fps = fpns * 1e9;
            console.info(`${fps.toFixed(1)} fps`);
            curTime = process.hrtime();
        }
        frames++;
    }

    playlist.start(index);
    runAnimation(frame);
}

function stopPlaylist() {
    playlist.stop();
    timer.clearInterval();
}


async function init() {
    state = await readSavefile(filename);
    realtimeState = await realtime.initAsync({
        globalBrightness: 100,
        intensity: 100,
        bpm: 120,
        color1: '#0000ff',
        color2: '#00ff00',
        fader1: 0,
        fader2: 0,
        playlist: [],
        timeInfo: {
            activeItemId: null,
            targetItemId: null,
            activeTime: 0,
            targetTime: 0,
        },
    });


    await generatePatternInfo();
    playlist = new Playlist(gl, state.model, patternsById, 10*60);
    playlist.on('target-changed', () => {
        const val = playlist.targetItem ? playlist.targetItem.id : null;
        realtimeState.submitOp({
            p: ['timeInfo', 'targetItemId'],
            oi: val,
        });
    });
    playlist.on('active-changed', () => {
        const val = playlist.activeItem ? playlist.activeItem.id : null;
        realtimeState.submitOp({
            p: ['timeInfo', 'activeItemId'],
            oi: val,
        });
    });

    realtimeState.on('op', updatePlaylist);

    state.patternOrder = state.patternOrder.filter(patternId => patternsById[patternId]);

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
    realtimeState.on('op', () => {
        const globalBrightness = realtimeState.data.globalBrightness / 100;
        client.setGlobalBrightness(globalBrightness);
    });

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
        realtime: realtimeState.data,
    };

    res.json(result);
});

app.get('/api/preview/:patternId/:mappingId.png', (req, res) => {
    const {patternId, mappingId} = req.params;
    const patternManager = patternsById[patternId];
    const mapping = state.mappings[mappingId];
    if (!mapping) {
        res.status(404).send('Not found');
    }
    patternManager.getStaticPreviewAsync(mapping).then(path =>
        res.type('png').sendFile(path)
    ).catch(err => res.status(404).send('Not found'));
});

app.get('/api/preview/:patternId/:mappingId.mp4', (req, res) => {
    const {patternId, mappingId} = req.params;
    const patternManager = patternsById[patternId];
    const mapping = state.mappings[mappingId];
    if (!mapping) {
        console.log("couldn't find mapping id");
        res.status(404).send('Not found');
    }
    patternManager.getAnimatedPreviewAsync(mapping).then(path =>
        res.type('video/mp4').sendFile(path)
    ).catch(err => {
        console.log('err', err);
        res.status(404).send('Not found')
    });
});

app.post('/api/playlist/start', (req, res) => {
    const index = req.body.index || 0;
    console.log('running playlist', index);
    runPlaylist(index);
    res.send('ok');
});

app.post('/api/playlist/next', (req, res) => {
    playlist.next();
    res.send('ok');
});

app.post('/api/playlist/prev', (req, res) => {
    playlist.prev();
    res.send('ok');
});

app.post('/api/playlist/stop', (req, res) => {
    stopPlaylist();
    sendBlackFrame();
    res.send('ok');
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

app.post('/api/newgid', (req, res) => {
    const gid = state.next_guid;
    state.next_guid++;
    console.log(gid);
    res.json({gid});
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

realtime.listen(server);
