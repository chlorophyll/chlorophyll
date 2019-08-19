import { ArtnetRegistry } from '@/common/hardware/artnet';
import { argv } from 'yargs';
import { readSavefile } from './restore';
import inquirer from 'inquirer';
import * as fs from 'fs';
const filename = argv._[0];

let client;

async function init() {
    let done;
    const state = await readSavefile(filename);
    const settings = state.hardware.settings[state.hardware.protocol];
    client = new ArtnetRegistry(state.model, settings);
    const panel = argv._[1];
    const output = `height-${panel}.json`;

    console.log(`i am outputting to ${output}`);
    let heights = [];
    try {
        const res = JSON.parse(fs.readFileSync(output));
        heights = res.heights;
    } catch (e) {
        console.log('error reading file, probably didnt exist');
    }

    let cur = heights.length;

    done = false;

    const strip = state.model.getStripByLabel(`${panel}_0`);
    const stripOffset = state.model.strip_offsets[strip];

    while (!done) {
        const curGuess = heights[cur];
        const answer = await inquirer.prompt([
            {
                name: 'guess',
                message: `Looking at column ${cur}. Current guess ${curGuess}. +n = add n, -n = subtract n, if no sign present, will overwrite.`
            }
        ]);
        let nextGuess;
        const v = parseInt(answer.guess);
        if (answer.guess[0] === '-') {
            nextGuess = curGuess + v;
        } else if (answer.guess[0] === '+') {
            nextGuess = curGuess + v;
        } else {
            nextGuess = v;
        }

        heights[cur] = nextGuess;

        console.log('generating frame');
        const frame = new Float32Array(state.model.textureWidth * state.model.textureWidth * 4);
        let ptr = stripOffset;

        function writePixel(pixelOffset, r, g, b) {
            frame[4*pixelOffset + 0] = r;
            frame[4*pixelOffset + 1] = g;
            frame[4*pixelOffset + 2] = b;
            frame[4*pixelOffset + 3] = 1;
        }
        function readPixel(pixelOffset) {
            console.log(
                frame[4*pixelOffset + 0],
                frame[4*pixelOffset + 1],
                frame[4*pixelOffset + 2],
                frame[4*pixelOffset + 3],
            );
        }

        for (let c = 0; c < heights.length; c++) {
            const height = heights[c];
            for (let i = 0; i < height; i++) {
                const r = c % 3 === 0 ? 1 : 0;
                const g = c % 3 === 1 ? 1 : 0;
                const b = c % 3 === 2 ? 1 : 0;
                writePixel(ptr, r, g, b);
                //readPixel(ptr);
                ptr++;
            }
        }

        ptr = stripOffset;
        for (let c = 0; c < heights.length; c++) {
            const height = heights[c];
            for (let i = 0; i < height; i++) {
                //readPixel(ptr);
                ptr++;
            }
        }

        client.sendFrame(frame);

        const confirm = await inquirer.prompt([{
            type: 'confirm',
            name: 'v',
            message: 'next?',
        }]);

        fs.writeFileSync(output, JSON.stringify({heights}));

        if (confirm.v) {
            cur++;
        }
    }

}
process.on('uncaughtException', function (err) {
    console.log(err);
    console.log(err.stack);
})

init().then('ok').catch(e => console.log(e));



