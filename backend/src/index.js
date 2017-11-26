require("babel-register");

import { argv } from 'yargs';

import { readSavefile } from './restore';

import register_nodes from '@/common/nodes/registry';
import { PatternRunner } from '@/common/patterns';

import { setColorSpace } from '@/common/nodes/fastled/color';

import PixelPusherRegistry from 'pixelpusherjs';

register_nodes();

setColorSpace('FastLED');

function runPattern(controller, model, pattern, mapping) {
    console.log('trying to run pattern');
    console.log(model.strip_offsets);
    console.log(model.num_pixels);
    let patternRunner = new PatternRunner(model, pattern, mapping);
    let time = 0;

    let curbuf = new Buffer(model.num_pixels*3);
    let prevbuf = new Buffer(model.num_pixels*3);

    let frame = () => {
        [prevbuf, curbuf] = [curbuf, prevbuf];
        patternRunner.getFrame(prevbuf, curbuf, time);
        time++;
        let stripbufs = model.getStripBuffers(curbuf);
        for (let strip = 0; strip < stripbufs.length; strip++) {
            controller.setStrip(strip, stripbufs[strip]);
        }
        controller.sync();
    }

    setInterval(frame, 1000/60);
}

function testPattern(controller) {
    let cur = 0;
    let num_pixels = 150;
    let channel = 0;

    let frame = () => {
        let buf = new Buffer(num_pixels*3);
        for (let i = 0; i < num_pixels; i++) {
                buf[i*3+0] = 0x00;
                buf[i*3+1] = 0x00;
                buf[i*3+2] = 0x00;
            if (i == cur) {
                buf[i*3 + channel] = 0xff;
            }
        }
        controller.setStrip(0, buf);
        controller.sync();
        cur = (cur+1) % num_pixels;
        if (cur == 0) {
            channel = (channel + 1) % 3;
        }
    }
    //frame();
    setInterval(frame, 1000/60);
}

function main() {
    let registry = new PixelPusherRegistry();

    if (argv.command == 'off') {
        registry.on('discovered', (controller) => {
            for (let strip = 0; strip < 4; strip++) {
                controller.setStrip(strip, new Buffer(150*3));
            }
            controller.sync();
        });
        registry.start();
        return;
    }

    if (argv.command == 'test') {
        registry.on('discovered', testPattern);
        registry.start();
        return;
    }


    readSavefile(argv.filename).then((state) => {
        let pattern = undefined;
        let mapping = undefined;

        for (let id in state.patterns) {
            let obj = state.patterns[id];
            if(obj.name == argv.pattern) {
                pattern = obj;
                break;
            }
        }

        if (pattern === undefined) {
            console.log(`Unknown pattern ${argv.pattern}`);
            return;
        }

        for (let id in state.mappings) {
            let obj = state.mappings[id];
            if (obj.name == argv.mapping) {
                mapping = obj;
                break;
            }
        }

        if (mapping === undefined) {
            console.log(`Unknown mapping ${argv.mapping}`);
            return;
        }
        registry.on('discovered',
            (controller) => runPattern(controller, state.model, pattern, mapping));
        registry.start();
    }).catch((err) => {
        console.log(err);
    });
}

main();
