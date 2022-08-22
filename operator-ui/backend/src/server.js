import _ from 'lodash';
import * as yargs from 'yargs';
import chalk from 'chalk';
import * as os from 'os';
import * as path from 'path';
import * as address from 'address';
import * as realtime from './realtime';
import tmp from 'tmp-promise';
import express from 'express';
import Nanotimer from 'nanotimer';
import { readSavefile, writeSavefile } from './restore';
import { checkFramebuffer } from '@/common/util/gl_debug';
import { createFromConfig } from '@/common/mapping';
import PatternRunner from '@/common/patterns/runner';
import PixelpusherClient from './hardware/pixelpusher';
import { ArtnetRegistry } from '@/common/hardware/artnet';
import Pattern from './patterns';
import PlaylistRunner, { createPlaylist } from './playlist';
import { input } from '@/common/osc';
import ot from '@/common/osc/osc_types';

import * as WebGL from 'wpe-webgl';

const argv = yargs
  .usage('USAGE: $0 [options] <project-filepath.chl>')
  .option('a', {
    alias: 'autostart',
    type: 'boolean',
    default: false,
    describe: 'Immediately start playing the selected playlist, or the first found if none is specified.'
  })
  .option('p', {
    alias: 'port',
    type: 'number',
    default: 3000,
    describe: 'Port for operator UI webserver'
  })
  .check(argv => argv._.length === 1)
  .argv;

let port = argv.port || 3000;
let filename = path.resolve(argv._[0]);

let group;
let client;
let patternRunner;
let playlistRunner;

let isPlaying = false;
let state;
let realtimeState;
let patternsById = {};

const app = express();

const gl = WebGL.initHeadless();
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
gl.pixelStorei(gl.PACK_ALIGNMENT, 1);

console.log(`GL version: ${gl.getParameter(gl.VERSION)}`);

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
        playlistRunner.shuffleMode = data.shuffleMode;
        playlistRunner.hold = data.hold;
        playlistRunner.setItems(data.playlist);

        state.playlistsById[state.activePlaylistId] = {
            items: data.playlist,
            name: data.playlistName,
            id: state.activePlaylistId,
        };

        writeSavefile(filename, state);
    }
}

function runPlaylist(index) {
    if (playlistRunner.items.length === 0) {
        return;
    }

    if (playlistRunner.activeItem !== null) {
        playlistRunner.setTargetIndex(index);
        return;
    }
    const model = state.model;
    const w = model.textureWidth;

    const textureSize = w * w * 4;

    let pixels = new Float32Array(textureSize);
    let prevPixels = new Float32Array(textureSize);
    let curTime;
    let frames = 0;
    let sample = 0;
    const frame = () => {
        if (!curTime) {
            curTime = process.hrtime();
        }
        let readbuf = pixels;
        // artnet locked to 30fps
        if (state.hardware.protocol === 'artnet' && frames % 2 !== 0) {
            readbuf = null;
        }

        playlistRunner.step(readbuf);
        const activeTime = Math.floor(playlistRunner.activeItemTime / 60);
        const targetTime = Math.floor(playlistRunner.targetItemTime / 60);
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

        //[prevPixels, pixels] = [pixels, prevPixels];
        if (readbuf) {
            client.sendFrame(readbuf);
        }
        if (frames > 0 && frames % 300 === 0) {
            const diff = process.hrtime(curTime);
            const ns = diff[0] * 1e9 + diff[1];
            const fpns = 300 / ns;
            const fps = fpns * 1e9;
            realtimeState.submitOp({
                p: ['fpsAvg'],
                oi: fps,
            });
            console.info(`${fps.toFixed(1)} fps`);
            curTime = process.hrtime();
        }
        frames++;
    }

    playlistRunner.start(index);
    runAnimation(frame);
}

async function stopPlaylist() {
    await playlistRunner.stop();
    timer.clearInterval();
}

function activatePlaylist(playlistId, refresh = false) {
  if (state.activePlaylistId === playlistId && !refresh) {
    return;
  }
  const playlist = state.playlistsById[playlistId];
  state.activePlaylistId = playlistId;
  playlistRunner.setItems(playlist.items);

  realtimeState.submitOp({
    p: ['playlist'],
    oi: playlist.items,
  });

  realtimeState.submitOp({
    p: ['playlistId'],
    oi: playlistId,
  });

  realtimeState.submitOp({
    p: ['playlistName'],
    oi: playlist.name,
  });

  realtimeState.submitOp({
    p: ['hold'],
    oi: false,
  });
}

async function init() {
    state = await readSavefile(filename);
    const hasPlaylists = state.playlistOrder.length > 0;
    const playlistId = hasPlaylists ? state.playlistOrder[0] : createPlaylist(state);

    realtimeState = await realtime.initAsync({
        globalBrightness: 100,
        intensity: 100,
        bpm: 120,
        color1: '#0000ff',
        color2: '#00ff00',
        fader1: 0,
        fader2: 0,
        playlist: [],
        playlistId: null,
        playlistName: '',
        shuffleMode: false,
        hold: false,
        timeInfo: {
            activeItemId: null,
            targetItemId: null,
            activeTime: 0,
            targetTime: 0,
        },
        fpsAvg: 0,
    });



    await generatePatternInfo();
    playlistRunner = new PlaylistRunner(gl, state.model, patternsById, 10*60);
    playlistRunner.on('target-changed', () => {
        const val = playlistRunner.targetItem ? playlistRunner.targetItem.id : null;
        realtimeState.submitOp({
            p: ['timeInfo', 'targetItemId'],
            oi: val,
        });
    });
    playlistRunner.on('active-changed', () => {
        const val = playlistRunner.activeItem ? playlistRunner.activeItem.id : null;
        realtimeState.submitOp({
            p: ['timeInfo', 'activeItemId'],
            oi: val,
        });
    });
    activatePlaylist(playlistId);

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

    realtimeState.on('op', () => {
        const bpm = realtimeState.data.bpm;
        input.send('/chlorophyll/tempo', ot.FLOAT32(bpm));
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
    console.log(chalk.red(e));
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

    const serialized = _.pick(state, [
        'hardware',
        'mappings',
        'patterns',
        'patternOrder',
        'groups',
        'group_list',
        'playlistOrder',
        'playlistsById',
    ]);

    const result = {
        ...serialized,
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
    playlistRunner.next();
    res.send('ok');
});

app.post('/api/playlist/prev', (req, res) => {
    playlistRunner.prev();
    res.send('ok');
});

app.post('/api/playlist/stop', (req, res) => {
    stopPlaylist();
    res.send('ok');
});

app.post('/api/playlist/new', (req, res) => {
    if (playlistRunner.isPlaying) {
        res.status(400).json({id: null, msg: 'Cannot create playlists while playing'});
    } else {
        const id = createPlaylist(state);
        activatePlaylist(id);
        res.json({
            playlistsById: state.playlistsById,
            playlistOrder: state.playlistOrder,
        });
    }
});

app.post('/api/playlist/switch', (req, res) => {
    const {playlistId} = req.body;
    const targetPlaylist = state.playlistsById[playlistId];
    if (targetPlaylist.items.length === 0 && playlistRunner.isPlaying) {
        res.status(400).json({msg: 'Cannot switch to empty playlist while playing'});
    } else {
        activatePlaylist(playlistId);
        res.send('ok');
    }
});

app.post('/api/playlist/delete', (req, res) => {
  const {playlistId} = req.body;
  console.log(playlistId);
  if (state.activePlaylistId === playlistId && playlistRunner.isPlaying) {
    res.status(400).json({msg: 'Cannot delete active playlist while playing'});
  } else {
    if (state.playlistOrder.length === 1) {
      state.playlistsById[playlistId].items = [];
      activatePlaylist(playlistId);
    } else {
      delete state.playlistsById[playlistId];
      state.playlistOrder = state.playlistOrder.filter(id => id !== playlistId);
      activatePlaylist(state.playlistOrder[0]);
    }
    console.log(state.playlistsById);
    res.json({
      playlistsById: state.playlistsById,
      playlistOrder: state.playlistOrder,
    });
  }
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
    res.json({gid});
});

const external = address.ip();
const hostname = os.hostname();
const portString = port === 80 ? '' : `:${port}`;

const server = app.listen(port, () => {
    console.log();
    console.log();
    console.log('App running at: ');
    console.log(    ` -   local:   ${chalk.cyan.bold(`http://localhost:${port}/`)}`);
    if (external) {
        console.log(` - Network: by IP: ${chalk.cyan.bold(`http://${external}${portString}/`)}`);
        console.log(`      or hostname: ${chalk.cyan.bold(`http://${hostname}${portString}/`)}`);
    }
    console.log();
    console.log();
});

realtime.listen(server);

if (argv.autostart) {
  setTimeout(() => {
    const index = 0;
    console.log(`Auto-starting playlist ${0}`);
    runPlaylist(index);
  }, 5000);
}
