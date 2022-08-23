<template>
<v-btn @mousedown="tap" style="touch-action: manipulation">tap</v-btn>
</template>

<script>
const MS_UNTIL_CHAIN_RESET = 2000;
const SKIPPED_TAP_THRESHOLD_LOW = 1.75;
const SKIPPED_TAP_THRESHOLD_HIGH = 2.75;
const TOTAL_TAP_VALUES = 5;
export default {
    name: 'tempo-tap',
    props: ['value'],
    data() {
        return {
            buttonDown: false,
            beatMs: 500,
            tapDurations: new Array(TOTAL_TAP_VALUES).fill(0),
            lastTapMs: 0,
            lastTapSkipped: false,
            tapDurationIndex: 0,
            tapsInChain: 0,
        };
    },
    watch: {
        bpm(v) {
            this.$emit('input', v);
        },
        value(v) {
            if (v !== this.bpm) {
                this.resetTapChain(new Date().getTime());
                this.beatMs = 60000/v;
            }
        },
    },
    computed: {
        bpm() {
            return 60000/this.beatMs;
        },
    },
    methods: {
        tap() {
            const ms = new Date().getTime();

            if (this.lastTapMs + MS_UNTIL_CHAIN_RESET < ms) {
                this.resetTapChain(ms);
            }

            const newBeatMs = this.doTap(ms);
            if (newBeatMs !== -1) {
                this.beatMs = newBeatMs;
            }
        },
        resetTapChain(ms) {
            console.log('reset');
            this.tapsInChain = 0;
            this.tapDurationIndex = 0;
            this.resetMs = ms;
            for (let i =0 ;i < TOTAL_TAP_VALUES; i++) {
                this.tapDurations[i] = 0;
            }
        },

        getAverageTapDuration(ms) {
            const count = Math.min(this.tapsInChain - 1, TOTAL_TAP_VALUES);
            let total = 0;
            for (let i = 0; i < count; i++) {
                total += this.tapDurations[i];
            }
            return Math.floor(total / count);
        },


        doTap(ms) {
            this.tapsInChain++;
            if (this.tapsInChain === 1) {
                this.lastTapMs = ms;
                return -1;
            }

            let duration = ms - this.lastTapMs;

            if (this.tapsInChain > 1 && !this.lastTapSkipped && duration > this.beatMs * SKIPPED_TAP_THRESHOLD_LOW && duration < this.beatMs * SKIPPED_TAP_THRESHOLD_HIGH) {
                duration = Math.floor(duration * 0.5);
                this.lastTapSkipped = true;
            } else {
                this.lastTapSkipped = false;
            }

            this.tapDurations[this.tapDurationIndex] = duration;
            this.tapDurationIndex++;
            if (this.tapDurationIndex === this.tapDurations.length) {
                this.tapDurationIndex = 0;
            }


            const newBeatMs = this.getAverageTapDuration(ms);
            this.lastTapMs = ms;
            return newBeatMs;
        }
    },
};
</script>
