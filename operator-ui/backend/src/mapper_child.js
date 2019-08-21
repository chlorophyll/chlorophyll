import { ArtnetRegistry } from '@/common/hardware/artnet';
import * as fs from 'fs';
import { readSavefile } from './restore';
import { argv } from 'yargs';
import * as path from 'path';
let mapper;

const l = console.log;
const dataDir = argv._[1];
console.log(dataDir);

//console.log = () => null; //(...args) => l('child', ...args);
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

class Mapper {
    constructor(panel, state) {
        this.state = state;
        this.panel = panel;
        const settings = state.hardware.settings[state.hardware.protocol];
        this.client = new ArtnetRegistry(state.model, settings);
        this.heights = [];
        this.output = storage(panel);
        this.history = history(panel);
        try {
            const res = JSON.parse(fs.readFileSync(this.output));
            this.heights = res.heights;
        } catch (e) {
            console.log('error reading file, probably didnt exist');
        }
        this.cur = this.heights.length;
        this.frame = new Float32Array(state.model.textureWidth * state.model.textureWidth * 4);
        this.initGuess();
    }

    initGuess() {
        const {heights, cur} = this;
        if (heights[cur] === undefined || heights[cur] === null) {
            if (cur > 0)
                heights[cur] = heights[cur - 1];
            else
                heights[cur] = 1;
        }
    }

    makeGuess(nextGuess) {
        if (nextGuess !== null && nextGuess !== undefined) {
            this.heights[this.cur] = nextGuess;
        }
        fs.writeFileSync(this.output, JSON.stringify({heights: this.heights}));
        fs.appendFileSync(this.history, JSON.stringify({heights: this.heights})+'\n');
        process.send({cmd: 'guess', args: this.curGuess});
    }

    get curGuess() {
        return this.heights[this.cur];
    }

    showFrame() {
        const {frame, heights} = this;
        console.log('showing frame with highlight on', this.cur);
        console.log('curGuess = ', this.curGuess);
        const highlight = this.cur;
        for (let i = 0; i < this.frame.length; i++) {
            this.frame[i] = 0;
        }
        let ptr = 0;
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

        writePixel(frame, tmp + heights[highlight], 1, 0, 1);
        this.client.sendFrame(frame);
    }
    setCol(nextCol) {
        console.log('setCol', nextCol);
        this.cur = nextCol;
        process.send({cmd: 'col', args: this.cur});
        if (this.curGuess === undefined) {
            console.log('making guess for new column');
            this.makeGuess(this.heights[this.cur-1]);
        } else {
            process.send({cmd: 'guess', args: this.curGuess});
        }
    }
}

function filename(panel) {
    return path.join(dataDir, `${panel}.chl`);
}

function storage(panel) {
    return path.join(dataDir, `height-${panel}.json`);
}
function history(panel) {
    return path.join(dataDir, `history-${panel}.log`);
}
async function init() {
    const panel = argv._[0];
    console.log('init', panel);
    const state = await readSavefile(filename(panel), false);
    mapper = new Mapper(panel, state);
    mapper.showFrame();
}
process.on('uncaughtException', function (err) {
    console.log(err);
    console.log(err.stack);
    process.exit(1);
})
console.log('got here');

process.on('message', ({cmd, args}) => {
    if (cmd === 'init') {
        init()
            .then(() => {
                process.send({cmd: 'ready', args: {
                    guess: mapper.curGuess,
                    col: mapper.cur,
                }});
            })
            .catch(e => process.send({cmd: 'error', args: e.stack}));
    } else {
        let nextGuess = null;
        let nextCol = mapper.cur;

        switch (cmd) {
            case 'increment': {
                nextGuess = mapper.curGuess + args;
                break;
            }
            case 'prev': {
                nextCol = mapper.cur - 1;
                break;
            }
            case 'next': {
                nextCol = mapper.cur + 1;
                break;
            }
        }

        if (nextGuess !== null && nextGuess !== undefined) {
            mapper.makeGuess(nextGuess);
        }
        mapper.setCol(nextCol);
        mapper.showFrame();
    }
});


process.on('uncaughtException', function (err) {
    console.log(err);
    console.log(err.stack);
    process.exit(1);
});
