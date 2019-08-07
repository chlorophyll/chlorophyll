<template>
<v-btn @mousedown="tap">tap</v-btn>
</template>

<script>
export default {
    name: 'tempo-tap',
    props: ['value'],
    data() {
        return {
            startTime: null,
            beatTimes: [],
            xsum: 0,
            xxsum: 0,
            ysum: 0,
            yysum: 0,
            xysum: 0,
        };
    },
    watch: {
        value(v) {
          if (Math.abs(v-this.tempo) > 10 && this.beatCount > 2) {
                this.reset();
            }
        },
        tempo() {
            this.$emit('input', this.tempo);
        },
    },
    computed: {
        beatCount() {
            return this.beatTimes.length;
        },
        xx() {
            if (this.beatCount < 2) return 0;
            return this.beatCount * this.xxsum - this.xsum * this.xsum;
        },
        yy() {
            if (this.beatCount < 2) return 0;
            return this.beatCount * this.yysum - this.ysum * this.ysum;
        },
        xy() {
            if (this.beatCount < 2) return 0;
            return this.beatCount * this.xysum - this.xsum * this.ysum;
        },
        period() {
            if (this.beatCount < 2) return 0;
            return (this.beatCount * this.xysum - this.xsum * this.ysum) / this.xx;
        },
        offset() {
            if (this.beatCount < 2) return 0;
            return (this.ysum * this.xxsum - this.xsum * this.xysum) / this.xx;
        },
        tempo() {
            if (this.beatCount < 2) return this.value;
            return (60*1000) / this.period;
        },
    },
    methods: {
        reset() {
            this.startTime = null;
            this.beatTimes = [];
            this.xsum = 0;
            this.xxsum = 0;
            this.ysum = 0;
            this.yysum = 0;
            this.xysum = 0;
        },
        tap() {
            this.countBeat(Date.now());
        },
        countBeat(currTime) {
            if (this.startTime === null) {
                this.startTime = currTime;
            }
            const x = this.beatTimes.length;
            const y = currTime - this.startTime;

            this.beatTimes.push(y);

            this.xsum += x;
            this.xxsum += x*x;
            this.ysum += y;
            this.yysum += y*y;
            this.xysum += x*y;
        },
    },
};
</script>

