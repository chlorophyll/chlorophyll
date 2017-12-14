require("babel-register");

import { argv } from 'yargs';

import { readSavefile } from './restore';

import register_nodes from '@/common/nodes/registry';
import { PatternRunner } from '@/common/patterns';

import { setColorSpace } from '@/common/nodes/fastled/color';

import PixelPusherRegistry from 'pixelpusher-driver';

register_nodes();

setColorSpace('FastLED');

const controllers = new Array();

const controllerForStrip = new Map();


function addController(controller) {
    controllers.push(controller);

    for(let i = controllers.length - 1; i > 0 && controllers[i].controller_id < controllers[i-1].controller_id; i--) {
        let tmp = controllers[i];
        controllers[i] = controllers[i-1];
        controllers[i-1] = tmp;
    }
}

function runPattern(model, pattern, mapping) {
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
            for (let cstrip = 0; cstrip < controller.strips_attached; cstrip++) {
                controller.setStrip(cstrip, stripbufs[strip_idx]);
                strip_idx++;
            }
            controller.sync();
        }
    }
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
        registry.on('discovered', (controller) => {
            addController(controller);
            let strips_attached = 0;

            for (let controller of controllers) {
                strips_attached += controller.strips_attached;
            }

            if (strips_attached == state.model.num_strips)
                runPattern(state.model, pattern, mapping);
        });
        registry.start();
    }).catch((err) => {
        console.log(err);
    });
}

main();
