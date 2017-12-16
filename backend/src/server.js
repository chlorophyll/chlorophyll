require("babel-register");

import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import path from 'path';
import * as WebSocket from 'ws';
import fs from 'fs';

import { argv } from 'yargs';

import PixelPusherRegistry from 'pixelpusher-driver';

import { readSavefile } from './restore';
import { PatternRunner } from '@/common/patterns';
import { setColorSpace } from '@/common/nodes/fastled/color';

import register_nodes from '@/common/nodes/registry';
register_nodes();

// server stuff
const app = express();
const server = http.Server(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};
//
let savedSequence = null;

// pixelpusher stuff
let registry = new PixelPusherRegistry();
let controllers = [];
let strips_attached = 0;
let saveState = null;

function addController(controller) {
    controllers.push(controller);
    controllers.sort((a, b) => {
        if (a.group_id == b.group_id) {
            return a.controller_id - b.controller_id;
        } else {
            return a.group_id - b.group_id;
        }
    });
}

function removeController(controller) {
    let index = controllers.findIndex((el) => el == controller);
    if (index == -1)
        return;
    controllers.splice(index, 1);
}

let frameInterval = undefined;

function runPattern(pattern, mapping) {
    stopPattern();
    let model = saveState.model;
    console.log('trying to run pattern');
    console.log(model.strip_offsets);
    console.log(model.num_pixels);
    console.log(`number of pushers: ${controllers.length}`);
    let patternRunner = new PatternRunner(model, pattern, mapping);
    let time = 0;

    let curbuf = new Buffer(model.num_pixels*3);
    let prevbuf = new Buffer(model.num_pixels*3);

    let frame = () => {
        [prevbuf, curbuf] = [curbuf, prevbuf];
        patternRunner.getFrame(prevbuf, curbuf, time);
        time++;
        let stripbufs = model.getStripBuffers(curbuf);
        let strip_idx = 0;
        for (let controller of controllers) {
            for (let cstrip = 0; cstrip < controller.strips_attached && strip_idx < model.num_strips; cstrip++) {
                controller.setStrip(cstrip, stripbufs[strip_idx]);
                strip_idx++;
            }
            controller.sync();
        }
    }
    frameInterval = setInterval(frame, 1000/60);
}

function runPatternSequence(sequence, xfade) {
    if (sequence.length === 1)
        return runPattern(sequence[0].pattern, sequence[0].mapping);

    stopPattern();
    let model = saveState.model;
    console.log('trying to run pattern sequence');
    console.log(model.strip_offsets);
    console.log(model.num_pixels);
    console.log(`number of pushers: ${controllers.length}`);

    sequence = sequence.map((clip) => {
        return {
            ...clip,
            time: clip.time * 60,
            patternRunner: new PatternRunner(model, clip.pattern, clip.mapping)
        };
    });


    xfade = xfade * 60;

    let timeA = 0;
    let timeB = 0;
    let patternA_idx = 0;
    let patternB_idx = 1;

    let curbufA = new Buffer(model.num_pixels*3);
    let prevbufA = new Buffer(model.num_pixels*3);
    let curbufB = new Buffer(model.num_pixels*3);
    let prevbufB = new Buffer(model.num_pixels*3);
    let mixbuf = new Buffer(model.num_pixels*3);

    let frame = () => {
        if (timeA >= sequence[patternA_idx].time) {
            timeA = timeB;
            curbufA = curbufB;
            prevbufA = prevbufB;
            patternA_idx = patternB_idx;

            timeB = 0;
            curbufB = new Buffer(model.num_pixels*3);
            prevbufB = new Buffer(model.num_pixels*3);
            patternB_idx = (patternB_idx + 1) % sequence.length;
        }
        const runnerA = sequence[patternA_idx].patternRunner;
        const lengthA = sequence[patternA_idx].time;

        const runnerB = sequence[patternB_idx].patternRunner;
        const lengthB = sequence[patternB_idx].time;

        let displaybuf;
        [prevbufA, curbufA] = [curbufA, prevbufA];
        runnerA.getFrame(prevbufA, curbufA, timeA);
        timeA++;
        if (timeA <= (lengthA - xfade)) {
            // Just run the one pattern
            displaybuf = curbufA;
            //console.log(`running A ${timeA} ${lengthA}`);
        } else {
            // Currently crossfading - run both patterns and mix
            [prevbufB, curbufB] = [curbufB, prevbufB];
            runnerB.getFrame(prevbufB, curbufB, timeB);
            timeB++;
            const remaining = (lengthA - timeA);
            const fadePercent = remaining / xfade;
            for (let i = 0; i < mixbuf.length; i++) {
                mixbuf[i] = Math.floor((curbufA[i] * fadePercent) + (curbufB[i] * (1 - fadePercent)));
            }
            displaybuf = mixbuf;
        }


        let stripbufs = model.getStripBuffers(displaybuf);
        let strip_idx = 0;
        for (let controller of controllers) {
            for (let cstrip = 0; cstrip < controller.strips_attached; cstrip++) {
                controller.setStrip(cstrip, stripbufs[strip_idx]);
                strip_idx++;
            }
            controller.sync();
        }
    }
    frameInterval = setInterval(frame, 1000/60);
}

function clearModel() {
    stopPattern();

    for (let controller of controllers) {
        let buffer = new Buffer(controller.pixels_per_strip*3);
        for (let cstrip = 0; cstrip < controller.strips_attached; cstrip++) {
            controller.setStrip(cstrip, buffer);
        }
        controller.sync();
    }
}

function stopPattern() {
    if (frameInterval !== undefined) {
        clearInterval(frameInterval);
    }
    frameInterval = undefined;
}

function stripsAttachedMessage() {
    return JSON.stringify({ 'strips-attached': strips_attached });
}

function updateStripsAttached() {
    strips_attached = 0;

    for (let controller of controllers) {
        strips_attached += controller.strips_attached;
    }
    console.log(`strips attached: ${strips_attached}`);

    wss.broadcast(stripsAttachedMessage());
}

function loadSequence() {
    try {
        const raw = fs.readFileSync('./saved_sequence.json');
        if (!raw) {
            console.log('No sequence found at ./saved_sequence.json');
            return null;
        }
        return JSON.parse(raw);
    } catch (err) {
        return null;
    }
}

function saveSequence(sequence) {
    const data = sequence ? JSON.stringify(sequence) : '';
    if (!data)
        return;

    fs.writeFile('./saved_sequence.json', data, (err) => {
        if (err)
            console.log('Failed to save sequence');
        else
            console.log('Saved seq to ./saved_sequence.json');
    });
}

function main() {
    readSavefile(argv.filename).then((state) => {
        saveState = state;
        registry.start();
        server.listen(8080);
    });
}

registry.on('discovered', (controller) => {
    addController(controller);
    updateStripsAttached();
});

registry.on('pruned', (controller) => {
    removeController(controller);
    updateStripsAttached();
});

app.use('/', express.static('ui/dist'));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/info', function(req, res) {
    let filename = argv.filename;
    let name = path.basename(filename, '.chl');

    let sequence = loadSequence();
    console.log(sequence);

    res.json({ name, sequence, ...saveState });
});

app.post('/play', function(req, res) {
    const clips = req.body.sequence;
    const xfade = req.body.xfade;
    console.log(clips);
    if (!clips || clips === []) {
        res.send('empty sequence!');
        return;
    }

    const sequence = clips.map(clip => {
      let pattern = saveState.patterns[clip.pattern_id];
      let mapping = saveState.mappings[clip.mapping_id];
      return {
          pattern,
          mapping,
          time: clip.time
      };
    });
    runPatternSequence(sequence, xfade);
    res.send('ok');
});

app.post('/save', function(req, res) {
    saveSequence(req.body);
});

app.post('/off', function(req, res) {
    clearModel();
    res.send('ok');
});

wss.on('connection', function connection(ws) {
    ws.send(stripsAttachedMessage());
});

main();

