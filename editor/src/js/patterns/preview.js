import Vue from 'vue';
import _ from 'lodash';
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
            // hacks hacks hacks
            const stripMapping = controller => _.range(32).map(i => ({
                controller,
                strip: i,
                startUniverse: 3*i,
                startChannel: 0,
            }));
            return new ArtnetRegistry(currentModel, [
                ...stripMapping({host: '127.0.0.1'})
            ]);
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
        run() {
            this.step(this.time);
            this.time++;
            if (this.running)
                this.request_id = window.requestAnimationFrame(() => this.run());
        },
        start() {
            currentModel.display_only = true;
            this.run();
        },
        pause() {
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
