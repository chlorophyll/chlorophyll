import express from 'express';
import child_process from 'child_process';
import * as path from 'path';
import chalk from 'chalk';
import * as address from 'address';

const child = path.join(__dirname, 'mapper_child.js');
const l = console.log;
console.log = (...args) => l('parent', ...args);
const app = express();
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
const panels = ['test'];
async function initMappers() {
    const pending = [];
    for (const panel of panels) {
        const proc = child_process.fork(child, [panel]);
        mappers[panel] = {proc};
        const onReady = new Promise((resolve, reject) => {
            proc.on('message', ({cmd, args}) => {
                console.log('cmd', cmd, args);
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
    res.json({guess: mapper.guess, col: mapper.col});
});

app.post('/api/:mapperName/increment', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        mapper.proc.send({cmd: 'increment', args: 1});
        delay(() => res.json({guess: mapper.guess, col: mapper.col}));
    }
});

app.post('/api/:mapperName/decrement', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        mapper.proc.send({cmd: 'increment', args: -1});
        delay(() => res.json({guess: mapper.guess, col: mapper.col}));
    }
});

app.post('/api/:mapperName/prev', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        mapper.proc.send({cmd: 'prev'});
        delay(() => res.json({guess: mapper.guess, col: mapper.col}));
    }
});

app.post('/api/:mapperName/next', (req, res) => {
    const mapper = mappers[req.params.mapperName];
    if (!mapper) {
        res.status(404).send('');
    } else {
        mapper.proc.send({cmd: 'next'});
        delay(() => res.json({guess: mapper.guess, col: mapper.col}));
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
