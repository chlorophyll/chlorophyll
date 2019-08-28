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
        if (heights[cur] === undefined || heights[cur] === null) {
            if (cur > 0)
                heights[cur] = heights[cur - 1];
            else
                heights[cur] = 1;
        }
        const curGuess = heights[cur];

        showFrame(state, stripOffset, heights, cur);

        const answer = await inquirer.prompt([
            {
                name: 'cmd',
                default: 'n',
                message: [
                    `Looking at column ${cur}. Current guess: ${curGuess}.`,
                    '+<n>   -> add n',
                    '-<n>   -> subtract n',
                    '<n>    -> set length to n',
                    'n(ext) -> go to next column',
                    'g<n>   -> go to column n',
                    '----------------------------',
                    '> '
                ].join('\n')
            }
        ]);
        let nextGuess = null;
        let nextCol = cur;
        if (!answer.cmd[0])
            continue;

        let v = parseInt(answer.cmd);
        switch (answer.cmd[0]) {
            case '-': {
                if (answer.cmd.length === 1)
                    v = -1;
                nextGuess = curGuess + v;
                break;
            }

            case '+': {
                if (answer.cmd.length === 1)
                    v = 1;
                nextGuess = curGuess + v;
                break;
            }
            case 'p': {
                nextCol = cur-1;
                break;
            }

            case 'g': {
                const goto = parseInt(answer.cmd.slice(1));
                if (!isNaN(goto))
                    nextCol = goto;
                break;
            }

            case 'n':
                nextCol = cur + 1;
                break;

            default: {
                if (!isNaN(v))
                    nextGuess = v;
                break;
            }
        }

        if (nextGuess !== null && nextGuess !== undefined)
            heights[cur] = nextGuess;

        fs.writeFileSync(output, JSON.stringify({heights}));

        cur = nextCol;
    }
}

function showFrame(state, stripOffset, heights, highlight) {
    console.log('generating frame');
    const frame = new Float32Array(state.model.textureWidth * state.model.textureWidth * 4);
    let ptr = stripOffset;
    let tmp;

    for (let c = 0; c < heights.length; c++) {
        const height = heights[c];
        if (c === highlight) {
          tmp = ptr;
        }
        let r = c % 3 === 0 ? 0.4 : 0;
        let g = c % 3 === 1 ? 0.4 : 0;
        let b = c % 3 === 2 ? 0.4 : 0;
        if (height > 500) {
            r = 0;
            g = 0;
            b = 0;
        }
        for (let i = 0; i < height; i++) {
            if (c === highlight) {
                writePixel(frame, ptr, 1, 1, 1);
            } else {
                writePixel(frame, ptr, r, g, b);
            }
            // readPixel(frame, ptr);
            ptr++;
        }
    }

    if (highlight === heights.length-1) {
      writePixel(frame, tmp + heights[highlight], 1, 0, 1);
    }

    ptr = stripOffset;
    for (let c = 0; c < heights.length; c++) {
        const height = heights[c];
        for (let i = 0; i < height; i++) {
            // readPixel(frame, ptr);
            ptr++;
        }
    }

    client.sendFrame(frame);
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

init().then('ok').catch(e => console.log(e));


