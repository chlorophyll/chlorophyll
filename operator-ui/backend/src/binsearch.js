import { ArtnetRegistry } from '@/common/hardware/artnet';
import { argv } from 'yargs';
import { readSavefile } from './restore';
import inquirer from 'inquirer';
import * as fs from 'fs';

const filename = argv._[0];
const output = argv._[1];

let client;

let counts = [];

async function findCount(state, strip, count) {
    const frame = new Float32Array(state.model.textureWidth * state.model.textureWidth * 4);
    count = count || 300;

    while (true) {
        const frame = new Float32Array(state.model.textureWidth * state.model.textureWidth * 4);
        const stripOffset = state.model.strip_offsets[strip];

        for (let i = 0; i < count; i++) {
            writePixel(frame, stripOffset+i, 0.4, 0, 0);
        }
        writePixel(frame, stripOffset+count-1, 0, 0.4, 0);
        client.sendFrame(frame);

        const answer = await inquirer.prompt([
            {
                name: 'delta',
                message: `count: ${count}. delta? (0 = stop)`,
                default: 0,
                type: 'number'
            }
        ]);

        const newVal = count + answer.delta;
        if (newVal === count) {
            return count;
        }
        count = newVal;
    }
}

async function init() {
    let done;
    const state = await readSavefile(filename);
    const settings = state.hardware.settings[state.hardware.protocol];
    client = new ArtnetRegistry(state.model, settings);
    try {
        const saved = JSON.parse(fs.readFileSync(output));
        counts = saved.counts;
    } catch (e) {
        // no-op
    }
    const nstrips = state.model.num_strips;
    for (let strip = 0; strip < nstrips; strip++) {
        counts.push(await findCount(state, strip, counts[strip]));
        fs.writeFileSync(output, JSON.stringify({counts}));
    }
    console.log('done');

}

function writePixel(frame, pixelOffset, r, g, b) {
    frame[4*pixelOffset + 0] = r;
    frame[4*pixelOffset + 1] = g;
    frame[4*pixelOffset + 2] = b;
    frame[4*pixelOffset + 3] = 1;
}

function readPixel(frame, pixelOffset) {
    console.log(
        frame[4*pixelOffset + 0],
        frame[4*pixelOffset + 1],
        frame[4*pixelOffset + 2],
        frame[4*pixelOffset + 3],
    );
}

process.on('uncaughtException', function (err) {
    console.log(err);
    console.log(err.stack);
})

init().then(() => process.exit(0)).catch(e => console.log(e));



