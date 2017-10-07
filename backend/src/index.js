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

function main() {
    let registry = new PixelPusherRegistry();

    if (argv.command == 'off') {
        registry.on('discovered', (controller) => {
            for (let strip = 0; strip < 4; strip++) {
                controller.setStrip(strip, new Buffer(68*3));
            }
            controller.sync();
        });
        registry.start();
        return;
    } else if (argv.command == 'test') {
        registry.on('discovered', (controller) => {
            let strip = 0;
            let buf = Buffer.alloc(68*3);
            for (let i = 0; i < 68; i++) {
                buf[3*i+0] = 0;
                buf[3*i+1] = 0x44;
                buf[3*i+2] = 0;
            }
            controller.setStrip(strip, buf);
            controller.sync();
        });
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
