import Vue from 'vue';
import { PatternRunner } from 'chl/patterns/runner';
import { currentModel } from 'chl/model';

import {pushPixels, pushBlackFrame} from 'chl/hardware/pixelpusher';

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
            const pixelBuffers = [
                new Float32Array(currentModel.num_pixels * 4),
                new Float32Array(currentModel.num_pixels * 4),
            ];
            return (time) => {
                const pixels = this.pushToHardware ? pixelBuffers[time % 2] : null;
                const current = this.runner.step(time, pixels);
                currentModel.setFromTexture(current);
                if (this.pushToHardware) {
                    pushPixels(currentModel, pixels);
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
                pushBlackFrame(currentModel);
            }
        },
    },

    render() {},

    methods: {
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
                pushBlackFrame(currentModel);
            }
        }
    }
});
