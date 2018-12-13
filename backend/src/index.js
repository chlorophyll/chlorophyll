require("babel-register");
import { argv } from 'yargs';
import _ from 'lodash';

import { readSavefile } from './restore';
import { checkFramebuffer } from '@/common/util/gl_debug';
import register_nodes from '@/common/nodes/registry';
import PatternRunner from '@/common/patterns/runner';
import PlaylistRunner from '@/common/patterns/playlist';

import PixelPusherRegistry from 'pixelpusher-driver';

import * as WebGL from 'wpe-webgl';


const gl = WebGL.initHeadless();
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
console.log(gl.getParameter(gl.VERSION));

let isPlaying = false;

function requestAnimationFrame(cb) {
    return setTimeout(() => {
        cb();
        WebGL.nextFrame();
    }, 14);
}

register_nodes();

const controllers = new Array();

function addController(controller) {
    controller.applyCorrection = (x) => x;
    controllers.push(controller);
    _.sortBy(controllers, 'controller_id');
}


function pushPixels(model, stripBufs) {
    let ptr = 0;
    let strip = 0;
    for (const controller of controllers) {
        for (let cstrip = 0; strip < model.num_strips && cstrip < controller.strips_attached; cstrip++) {
            controller.setStrip(cstrip, stripBufs[strip]);
            strip++;
        }
        controller.sync();
    }
}

function makeStripBufs(model, pixels) {
    const stripBufs = [];
    let ptr = 0;
    for (let strip = 0; strip < model.num_strips; strip++) {
        const buf = model.makeStripBuffer(strip);
        for (let i = 0; i < buf.length; i++) {
            if (ptr % 4 == 3) {
                ptr++;
            }
            buf[i] = pixels[ptr++]*255;
        }
        stripBufs.push(buf);
    }
    return stripBufs;
}

function runPattern(model, pattern, group, mapping) {
    isPlaying = true;
    console.log('trying to run pattern');
    console.log(model.strip_offsets);
    console.log(model.num_pixels);
    console.log(`number of pushers: ${controllers.length}`);
    const patternRunner = new PatternRunner(gl, model, pattern, group, mapping);
    let time = 0;

    let pixels = new Float32Array(model.num_pixels * 4);
    let prevPixels = new Float32Array(model.num_pixels * 4);

    let diff = false;

    let curTime;
    let prevStripBufs = undefined;

    const frame = () => {
        if (!curTime) {
            curTime = process.hrtime();
        }
        patternRunner.step(time, pixels);
        const stripBufs = makeStripBufs(model, pixels);
        prevStripBufs = stripBufs;
        [prevPixels, pixels] = [pixels, prevPixels];

        pushPixels(model, stripBufs);
        if (time > 0 && time % 300 === 0) {
            const diff = process.hrtime(curTime);
            const ns = diff[0] * 1e9 + diff[1];
            const fpns = 300 / ns;
            const fps = fpns * 1e9;
            console.info(`frame ${time} ${fps.toFixed(1)} fps`);
            curTime = process.hrtime();
        }
        time++;
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}

function playPlaylist(model, runner) {
    isPlaying = true;
    let pixels = new Float32Array(model.num_pixels * 4);
    let prevPixels = new Float32Array(model.num_pixels * 4);
    let prevStripBufs = undefined;

    const frame = () => {
        runner.step(pixels);
        const stripBufs = makeStripBufs(model, pixels);
        prevStripBufs = stripBufs;
        [prevPixels, pixels] = [pixels, prevPixels];

        pushPixels(model, stripBufs);
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}

function runPlaylist(registry, state) {
    const model = state.model;
    const playlistItems = state.playlistItems.map(item => ({
        id: item.id,
        duration: item.duration,
        mapping: state.mappings[item.mapping],
        pattern: state.patterns[item.pattern],
        group: state.groups[item.group],
    }));
    const crossfadeDuration = 5*60;


    const runner = new PlaylistRunner({
        gl,
        model,
        playlistItems,
        crossfadeDuration,
    });

    registry.on('discovered', (controller) => {
        addController(controller);
        let strips_attached = 0;

        for (let controller of controllers) {
            strips_attached += controller.strips_attached;
        }

        if (strips_attached == model.num_strips && !isPlaying) {
            playPlaylist(model, runner);
        }
    });
    registry.start();
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

        if (argv.command == 'list-patterns') {
            for (const p of _.values(state.patterns)) {
                console.log(p.name);
            }
            return;
        }

        if (argv.playlist) {
            runPlaylist(registry, state);
        } else {
            for (const p of _.values(state.patterns)) {
                if(p.name == argv.pattern) {
                    pattern = p;
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

            let group_id = state.group_list[0];
            let group = state.groups[group_id];

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

                if (strips_attached >= state.model.num_strips && !isPlaying)
                    runPattern(state.model, pattern, group, mapping);
            });
            registry.start();
        }
    }).catch((err) => {
        console.log(err);
    });
}

main();
