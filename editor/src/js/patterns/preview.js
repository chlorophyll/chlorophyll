import Vue from 'vue';
import Const from 'chl/const';
import { ArtnetRegistry } from '@/common/hardware/artnet';
import { PatternRunner } from 'chl/patterns/runner';
import { currentModel } from 'chl/model';
import { patternUtilsMixin } from 'chl/patterns';
import { mappingUtilsMixin } from 'chl/mapping';
import { ViewportMixin } from 'chl/viewport';

import * as pixelpusher from 'chl/hardware/pixelpusher';

export const RunState = {
    Stopped: 0,
    Running: 1,
    Paused: 2,
};

export const PatternPreview = Vue.component('pattern-preview', {
    props: [
        'patternId',
        'mappingId',
        'groupId',
        'runstate',
        'pushToHardware',
        'hardwareSettings',
        'hardwareProtocol',
    ],
    mixins: [
        mappingUtilsMixin,
        patternUtilsMixin,
        ViewportMixin,
    ],

    data() {
        return {
            time: 0,
            request_id: null,
            fpsSampleStartTime: null,
            framesForSample: 0,
            runner: this.makeRunner(),
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
                if (!this.running) {
                    return;
                }
                const pixels = this.pushToHardware ? pixelBuffers[time % 2] : null;
                const current = this.runner.step(time, pixels);
                currentModel.setFromTexture(current);
                if (this.pushToHardware) {
                    switch (this.hardwareProtocol) {
                        case 'artnet':
                            this.artnetClient.sendFrame(pixels);
                            break;
                        case 'pixelpusher':
                            pixelpusher.pushPixels(currentModel, pixels);
                            break;
                        default:
                            break;
                    }
                }
            };
        },
        running() {
            return this.runstate == RunState.Running;
        },
        pattern() {
            return this.getPattern(this.patternId);
        },
        group() {
            return this.getGroup(this.groupId);
        },
        mapping() {
            return this.getMapping(this.mappingId);
        },
        runnerParams() {
            return {
                mappingId: this.mappingId,
                patternId: this.patternId,
                groupId: this.groupId,
            };
        },
        artnetClient() {
            if (this.hardwareProtocol !== 'artnet')
                return null;

            const registry = new ArtnetRegistry(currentModel, this.hardwareSettings);
            console.log(registry);
            return registry;
        },
    },

    beforeDestroy() {
        this.stop();
    },

    watch: {
        runnerParams() {
            const runstate = this.runstate;
            this.stop();
            this.runner.detach();
            this.runner = this.makeRunner();
            if (runstate === RunState.Running) {
                this.start();
            }
        },
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
            switch (this.hardwareProtocol) {
                case 'pixelpusher': {
                    pixelpusher.pushBlackFrame(currentModel);
                    break;
                }

                case 'artnet': {
                    const width = currentModel.textureWidth;
                    const pixels = new Float32Array(width * width * 4);
                    this.artnetClient.sendFrame(pixels);
                    break;
                }

                default:
                    break;
            }
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
            this.mainViewport().playbackActive = true;
            this.runner.start();
            this.run();
        },
        pause() {
            this.runner.pause();
            this.resetFpsCounter();
            if (this.request_id !== null) {
                window.cancelAnimationFrame(this.request_id);
            }
            this.request_id = null;
        },
        stop() {
            this.pause();
            this.runner.stop();
            this.mainViewport().playbackActive = false;
            currentModel.display_only = false;
            this.time = 0;
            if (this.pushToHardware) {
                this.pushBlackFrame();
            }
        },
        makeRunner() {
            const pattern = this.getPattern(this.patternId);
            const group = this.getGroup(this.groupId);
            const mapping = this.getMapping(this.mappingId);
            return new PatternRunner(currentModel, pattern, group, mapping);
        }
    }
});
