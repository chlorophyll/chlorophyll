import { ArtnetRegistry } from '@/common/hardware/artnet';
import * as fs from 'fs';
import { readSavefile } from './restore';
import { argv } from 'yargs';
import * as path from 'path';
let mapper, counter, columns, mode;

const l = console.log;
const dataDir = argv._[1];
const isEditor = false;
const colors = [
    [1.00, 0.00, 0.00],
    [0.60, 0.40, 0.00],
    [0.00, 1.00, 0.00],
    [0.00, 0.50, 0.50],
    [0.00, 0.00, 1.00],
];
//console.log(dataDir);

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

class EditorClient {
    constructor(model) {
        this.model = model;
    }
    sendFrame(frame) {
        const strips = {};
        this.model.forEach((strip, i) => {
            if (strips[strip] === undefined) {
                strips[strip] = [];
            }
            const c = [
                frame[4*i+0],
                frame[4*i+1],
                frame[4*i+2],
            ];
            strips[strip].push(c);
        });
        process.send({cmd: 'frame', args: strips});
    }
}

class Counter {
    constructor(panel, state) {
        this.state = state;
        this.panel = panel;
        const settings = state.hardware.settings[state.hardware.protocol];
        if (isEditor) {
            this.client = new EditorClient(state.model);
        } else {
            this.client = new ArtnetRegistry(state.model, settings);
        }
        this.counts = [];
        this.output = pixelCounts(panel);
        this.history = history(panel);
        try {
            const res = JSON.parse(fs.readFileSync(this.output));
            this.counts = res.counts;
        } catch (e) {
            console.log('error reading file, probably didnt exist');
        }
        this.cur = this.counts.length;
        this.frame = new Float32Array(state.model.num_pixels * 4);
        this.initGuess();
    }

    initGuess() {
        const {counts, cur} = this;
        if (counts[cur] === undefined || counts[cur] === null) {
            counts[cur] = 300;
        }
    }

    makeGuess(nextGuess) {
        if (nextGuess !== null && nextGuess !== undefined) {
            this.counts[this.cur] = nextGuess;
        }
        process.send({cmd: 'guess', args: this.curGuess});
        this.confirm();
    }

    confirm() {
        fs.writeFileSync(this.output, JSON.stringify({counts: this.counts}));
        fs.appendFileSync(this.history, JSON.stringify({counts: this.counts})+'\n');
    }

    get curGuess() {
        return this.counts[this.cur];
    }

    writeStrip(strip, r, g, b) {
        const count = this.counts[strip] || 300;
        const offset = this.state.model.strip_offsets[strip];
        for (let i = 0; i < count; i++) {
            writePixel(this.frame, offset + i, r, g, b);
        }
    }

    showFrame() {
        // console.log('showing frame with highlight on', this.cur);
        // console.log('curGuess = ', this.curGuess);
        for (let i = 0; i < this.frame.length; i++) {
            this.frame[i] = 0;
        }
        const offset = this.state.model.strip_offsets[this.cur];

        this.writeStrip(this.cur, 1, 1, 1);
        writePixel(this.frame, offset + this.curGuess - 1, 0, 1, 0);
        for (let i = 0; i < 3; i++) {
            writePixel(this.frame, offset + this.curGuess + i, 1, 0, 0);
        }

        if (this.cur+1 < this.state.model.num_strips) {
            this.writeStrip(this.cur+1, 0, 0, 1);
        }
        this.client.sendFrame(this.frame);
    }
    setCol(nextCol) {
        this.cur = nextCol;
        process.send({cmd: 'col', args: this.cur});
        if (this.curGuess === undefined) {
            console.log('making guess for new column');
            this.makeGuess(300);
        } else {
            process.send({cmd: 'guess', args: this.curGuess});
        }
    }
}

class Columns {
    constructor(panel, state) {
        this.state = state;
        this.panel = panel;
        const settings = state.hardware.settings[state.hardware.protocol];
        if (isEditor) {
            this.client = new EditorClient(state.model);
        } else {
            this.client = new ArtnetRegistry(state.model, settings);
        }
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
        this.frame = new Float32Array(state.model.num_pixels * 4);
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
        //console.log('showing frame with highlight on', this.cur);
        //console.log('curGuess = ', this.curGuess);
        const highlight = this.cur;
        for (let i = 0; i < this.frame.length; i++) {
            this.frame[i] = 0;
        }
        let strip = 0;
        let ptr = 0;
        let stripPtr = 0; // index within the current strip
        let tmp;

        const bright = isEditor ? 1 : 0.4;

        for (let c = 0; c < heights.length; c++) {
            const height = heights[c];
            if (c === highlight) {
                tmp = ptr;
            }
            let [r, g, b] = colors[c % colors.length];
            if (height > 500) {
                r = 0;
                g = 0;
                b = 0;
            }
            for (let i = 0; i < height; i++) {
                if (c === highlight) {
                    writePixel(frame, ptr, bright, bright, bright);
                } else {
                    writePixel(frame, ptr, r * bright, g * bright, b * bright);
                }
                // readPixel(frame, ptr);
                ptr++;
                stripPtr++;
                if (strip < counter.counts.length && stripPtr === counter.counts[strip]) {
                    strip++;
                    stripPtr = 0;
                    ptr = this.state.model.strip_offsets[strip];
                }
            }
            if (c === highlight) {
                tmp = ptr;
            }
        }

        writePixel(frame, tmp, 1, 0, 1);
        this.client.sendFrame(frame);
    }

    setCol(nextCol) {
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

function pixelCounts(panel) {
    return path.join(dataDir, `counts-${panel}.json`);
}
function history(panel) {
    return path.join(dataDir, `history-${panel}.log`);
}
async function init() {
    const panel = argv._[0];
    const state = await readSavefile(filename(panel), false);
    counter = new Counter(panel, state);
    columns = new Columns(panel, state);
    setMode('count');

    // Refresh automatically at 4fps in case of collisions
    if (!isEditor) {
        const frameTick = () => {
            mapper.showFrame();
            setTimeout(frameTick, 250);
        };
        frameTick();
    } else {
        mapper.showFrame();
    }
}

function setMode(m) {
    mode = m;
    mapper = mode === 'count' ? counter : columns;
    process.send({cmd: 'mode', args: {
        guess: mapper.curGuess,
        col: mapper.cur,
        mode,
    }});
}

process.on('message', ({cmd, args}) => {
    if (cmd === 'init') {
        init()
            .then(() => {
                process.send({cmd: 'ready', args: {
                    guess: mapper.curGuess,
                    col: mapper.cur,
                    mode,
                }});
            })
            .catch(e => process.send({cmd: 'error', args: e.stack}));
    } else {
        let nextGuess = null;
        let nextCol = mapper.cur;

        switch (cmd) {
            case 'mode': {
                setMode(args);
                break;
            }
            case 'increment': {
                nextGuess = mapper.curGuess + args;
                if (nextGuess < 0)
                    nextGuess = null;
                break;
            }
            case 'setGuess': {
                nextGuess = args;
                break;
            }
            case 'prev': {
                if (mapper.cur > 0)
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

process.on('uncaughtException', (err) => {
    console.log(err);
    console.log(err.stack);
    process.exit(1);
});
