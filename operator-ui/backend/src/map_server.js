import express from 'express';
import child_process from 'child_process';
import * as path from 'path';
import chalk from 'chalk';
import * as address from 'address';
import { argv } from 'yargs';
const dataDir = path.resolve(process.cwd(), argv.dataDir || '');
const isEditor = false;
const child = path.join(__dirname, 'mapper_child.js');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../mapper/dist')))
const port = 3333;
function storage(panel) {
    return `height-${panel}.json`;
}

const mappers = {};
//const panels = [];
//for (const side of ['left', 'right']) {
//    for (let num = 1; num <= 4; num++) {
//        const panel = `wing_${side}_${num}`;
//        panels.push(panel);
//    }
//}
//
const panels = [
    'controller_left_1',
    'controller_left_2',
    'controller_left_3',
    'controller_right_1',
    'controller_right_2',
    'controller_right_3'
];

async function initMappers() {
    const pending = [];
    for (const panel of panels) {
        const proc = child_process.fork(child, [panel, dataDir, isEditor]);
        mappers[panel] = {proc};
        const onReady = new Promise((resolve, reject) => {
            proc.on('message', ({cmd, args}) => {
                if (cmd === 'error') {
                    reject(args);
                } else if (cmd === 'ready') {
                    mappers[panel].guess = args.guess;
                    mappers[panel].col = args.col;
                    resolve();
                } else if (cmd === 'guess') {
                    mappers[panel].guess = args;
                } else if (cmd === 'col') {
                    mappers[panel].col = args;
                } else if (cmd === 'mode') {
                    mappers[panel].mode = args.mode;
                    mappers[panel].guess = args.guess;
                    mappers[panel].col = args.col;
                } else if (cmd === 'frame' && isEditor) {
                    process.send({cmd, args});
                }
            });
            proc.send({cmd: 'init'});
        });
        pending.push(onReady);
    }
    await Promise.all(pending);
}

function delay(cb) {
    setTimeout(cb, 50);
}

app.get('/api/panels', (req, res) => {
    res.json({panels});
});

app.get('/api/:mapperName', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        res.json({guess: mapper.guess, col: mapper.col, mode: mapper.mode});
    }
});

app.post('/api/:mapperName/setMode', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        mapper.proc.send({cmd: 'mode', args: req.body.mode});
        delay(() => res.json({guess: mapper.guess, col: mapper.col, mode: mapper.mode}));
    }
});
app.post('/api/:mapperName/increment', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        mapper.proc.send({cmd: 'increment', args: 1});
        delay(() => res.json({guess: mapper.guess, col: mapper.col, mode: mapper.mode}));
    }
});

app.post('/api/:mapperName/decrement', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        mapper.proc.send({cmd: 'increment', args: -1});
        delay(() => res.json({guess: mapper.guess, col: mapper.col, mode: mapper.mode}));
    }
});

app.post('/api/:mapperName/setGuess', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        mapper.proc.send({cmd: 'setGuess', args: req.body.guess});
        delay(() => res.json({guess: mapper.guess, col: mapper.col, mode: mapper.mode}));
    }
});


app.post('/api/:mapperName/prev', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        mapper.proc.send({cmd: 'prev'});
        delay(() => res.json({guess: mapper.guess, col: mapper.col, mode: mapper.mode}));
    }
});

app.post('/api/:mapperName/next', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        mapper.proc.send({cmd: 'next'});
        delay(() => res.json({guess: mapper.guess, col: mapper.col, mode: mapper.mode}));
    }
});
process.on('uncaughtException', function (err) {
    console.log('uncaught');
    console.log(err);
    console.log(err.stack);
    process.exit(1);
})
initMappers().then(() => {
    const external = address.ip();
    app.listen(port, () => {
        console.log();
        console.log();
        console.log('App running at: ');
        console.log(    ` -   local:   ${chalk.cyan.bold(`http://localhost:${port}/`)}`);
        if (external) {
            console.log(` - Network:   ${chalk.cyan.bold(`http://${external}:${port}/`)}`);
        }
        console.log();
        console.log();
    });
}).catch(e => console.log(e));


process.on('exit', () => {
    for (const {proc} of Object.values(mappers)) {
        proc.kill();
    }
});