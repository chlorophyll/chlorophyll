import Vue from 'vue';
import { PatternRunner } from 'chl/patterns/runner';
import { currentModel } from 'chl/model';

export const RunState = {
    Stopped: 0,
    Running: 1,
    Paused: 2,
};

export const PatternPreview = Vue.component('pattern-preview', {
    props: ['pattern', 'mapping', 'group', 'runstate'],
    data() {
        return {
            time: 0,
            request_id: null,
            runner: null,
        };
    },

    computed: {
        step() {
            return (time) => {
                const current = this.runner.step(time);
                currentModel.setFromTexture(current);
            };
        },
        running() {
            return this.runstate == RunState.Running;
        },
        runnerParams() {
            return {
                pattern: this.pattern,
                group: this.group,
                mapping: this.mapping,
            };
        },
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
        runnerParams(newval) {
            this.createRunner();
        }
    },

    render() {},

    methods: {
        run() {
            if (!this.runner) {
                this.createRunner();
            }
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
        },
        createRunner() {
            const {pattern, group, mapping} = this;
            this.runner = new PatternRunner(currentModel, pattern, group, mapping);
        }
    }
});
