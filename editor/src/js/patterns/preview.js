import Vue from 'vue';
import Const from 'chl/const';
import { ArtnetRegistry } from '@/common/hardware/artnet';
import { PatternRunner } from 'chl/patterns/runner';
import { currentModel } from 'chl/model';

// import {pushPixels, pushBlackFrame} from 'chl/hardware/pixelpusher';

export const RunState = {
    Stopped: 0,
    Running: 1,
    Paused: 2,
};

export const PatternPreview = Vue.component('pattern-preview', {
    props: ['pattern', 'mapping', 'group', 'runstate', 'pushToHardware'],
    data() {
        return {
            time: 0,
            request_id: null,
            fpsSampleStartTime: null,
            framesForSample: 0,
        };
    },

    computed: {
        step() {
            const width = Math.ceil(Math.sqrt(currentModel.num_pixels));
            const pixelBuffers = [
                new Float32Array(width * width * 4),
                new Float32Array(width * width * 4),
            ];
            return (time) => {
                const pixels = this.pushToHardware ? pixelBuffers[time % 2] : null;
                const current = this.runner.step(time, pixels);
                currentModel.setFromTexture(current);
                if (this.pushToHardware) {
                    this.artnetClient.sendFrame(pixels);
                    // pushPixels(currentModel, pixels);
                }
            };
        },
        running() {
            return this.runstate == RunState.Running;
        },

        runner() {
            const {pattern, group, mapping} = this;
            return new PatternRunner(currentModel, pattern, group, mapping);
        },

        artnetClient() {
            // Universe, channel, number of pixels
            const legConfig = [
                [1, 1, 452]
            ];
            /*
            const wingMapping = _.range(13).map(strip => ({
                controller: {host: '192.168.31.215'},
                strip: strip+4,
                startUniverse: strip*3,
                startChannel: 0,
            }));
            */

            const legMapping = legConfig.map(([univ, channel, _unused], i) => ({
                controller: {host: '192.168.1.241'},
                strip: i,
                startUniverse: univ-1,
                startChannel: channel-1,
            }));
            // hacks hacks hacks
            const registry = new ArtnetRegistry(currentModel, [
                ...legMapping // , ...wingMapping
            ]);
            console.log(registry);
            return registry;

            //    ...stripMapping({host: '192.168.7.88'})
            //    //...stripMapping({host: '127.0.0.1'})
            // ]);
        },
    },

    beforeDestroy() {
        this.stop();
    },

    watch: {
        runstate(newval) {
            switch (newval) {
                case RunState.Stopped:
                    this.stop();
                    break;
                case RunState.Paused:
                    this.pause();
                    break;
                case RunState.Running:
                    this.start();
                    break;
            }
        },

        pushToHardware(newval) {
            if (!newval && this.runstate !== RunState.Stopped) {
                this.pushBlackFrame();
            }
        },
    },

    render() {},

    methods: {
        pushBlackFrame() {
            const width = Math.ceil(Math.sqrt(currentModel.num_pixels));
            const pixels = new Float32Array(width * width * 4);
            this.artnetClient.sendFrame(pixels);
        },
        countFps(timestamp) {
            this.framesForSample++;
            if (!this.fpsSampleStartTime) {
                this.fpsSampleStartTime = timestamp;
            } else {
                const d = timestamp - this.fpsSampleStartTime;
                if (d > Const.fps_sample_interval) {
                    const fps = 1000*(this.framesForSample-1) / d;
                    this.$emit('fps-sample-updated', fps);
                    this.resetFpsCounter();
                }
            }
        },
        resetFpsCounter() {
            this.fpsSampleStartTime = null;
            this.framesForSample = null;
        },
        run(timestamp) {
            this.step(this.time);
            this.countFps(timestamp);
            this.time++;
            if (this.running)
                this.request_id = window.requestAnimationFrame((timestamp) => this.run(timestamp));
        },
        start() {
            currentModel.display_only = true;
            this.run();
        },
        pause() {
            this.resetFpsCounter();
            if (this.request_id !== null) {
                window.cancelAnimationFrame(this.request_id);
            }
            this.request_id = null;
        },
        stop() {
            this.pause();
            currentModel.display_only = false;
            this.time = 0;
            if (this.pushToHardware) {
                this.pushBlackFrame();
            }
        }
    }
});
