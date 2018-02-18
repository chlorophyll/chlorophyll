<template>
    <div class="tracker-container">
    <div class="tracker-layers">
        <template v-for="(track, index) in tracks">
            <div :style="trackOffsetStyle(index)">{{ track.settings.name }}</div>
        </template>
    </div>
    <div class="tracks" ref="tracks">
        <svg ref="canvas">
            <g ref="container">
            <g>
            <template v-for="[pos, {opacity, classed}] in visible_ticks">
                <line :x1="pos" :x2="pos"
                      :y1="0"   :y2="height"
                      :style="{ 'opacity': opacity }"
                      :class="[classed]"
                      class="tick" />
            </template>
            </g>
            <template v-for="(track, index) in tracks">
                <sequencer-track
                    :scale="scale"
                    :transform="trackOffsetTranslation(index)"
                    :settings="track.settings"
                    :clips="track.clips" />
            </template>
            </g>
        </svg>
    </div>
    </div>
</template>

<script>
/* eslint-disable */
import * as d3 from 'd3';
import Util from 'chl/util';
import Const from 'chl/const';
import SequencerTrack from './track';

const DISPLAY_THRESHOLD = 10;

function frame(interval) {
    return {interval, classed: 'tick-frame'};
}

function seconds(inp) {
    const interval = inp*60;
    return {interval, classed: 'tick-seconds'};
}

function minutes(inp) {
    const interval = inp*60*60;
    return {interval, classed: 'tick-minutes'};
}

const tick_intervals = [
    ...[1, 15, 30].map(frame),
    ...[1, 5, 10, 15, 30, 60].map(seconds),
    ...[5, 15].map(minutes),
].reverse();


const initial_domain = [0, 60];

export default {
    name: 'tracker',
    components: { SequencerTrack },
    data() {
        return {
            width: 0,
            height: 0,
            domain: [...initial_domain],
            tracks: [
                {
                    settings: {
                        name: 'test',
                    },
                    clips: [
                        {
                            start: 0,
                            duration: 5
                        },
                        {
                            start: 6,
                            duration: 10,
                        }
                    ]
                },
                {
                    settings: {
                        name: 'test2',
                    },
                    clips: [
                        {
                            start: 1,
                            duration: 3
                        },
                        {
                            start: 6,
                            duration: 10,
                        }
                    ]
                }
            ],
        };
    },
    mounted() {
        window.addEventListener('resize', this.resize);
        this.resize();
        const zoom = d3.zoom()
            .translateExtent([[0, -Infinity], [Infinity, Infinity]])
            .on('zoom', () => this.zoomed());
        d3.select(this.$refs.canvas).call(zoom);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.resize);
    },
    computed: {
        scale() {
            return d3.scaleLinear().domain([...this.domain]).range([0, this.width]);
        },
        range() {
            return this.scale.range();
        },

        visible_ticks() {
            if (this.width == 0) {
                return [];
            }
            let [start, end] = this.domain;
            let out = new Map();

            for (let { interval, classed } of tick_intervals) {
                let istart = Math.ceil(start / interval) * interval;
                let iend = Math.floor(end / interval) * interval;
                let diff = this.scale(istart+interval) - this.scale(istart);
                if (diff < DISPLAY_THRESHOLD) {
                    break;
                }

                let opacity = Util.map(diff, DISPLAY_THRESHOLD, this.width/2, 0.15, 1);
                if (opacity > 1) opacity = 1;

                if (opacity < 0.5) {
                    classed += ' tick-dotted';
                }

                let cur_ticks = d3.range(istart, iend+interval, interval).map(this.scale);

                for (let tick of cur_ticks) {
                    if (out.get(tick) === undefined) {
                        out.set(tick, { opacity, classed });
                    }
                }

            }
            return [...out.entries()];
        }
    },
    methods: {
        trackOffset(index) {
            return index * (Const.timeline_track_height + Const.timeline_track_padding);
        },
        trackOffsetStyle(index) {
            return {
                'top': `${this.trackOffset(index)}px`,
            };
        },
        trackOffsetTranslation(index) {
            return `translate(0, ${this.trackOffset(index)})`;
        },
        resize() {
            this.width = this.$refs.tracks.clientWidth;
            this.height = this.$refs.tracks.clientHeight;
            console.log(this.scale);
        },
        zoomed() {
            let t = d3.event.transform;

            const init_scale = d3.scaleLinear().rangeRound([0, this.width]).domain([...initial_domain]);
            this.domain = t.rescaleX(init_scale).domain();
        },
    }
};
</script>

<style scoped lang="scss">
@import './src/style/aesthetic.scss';

.tracker-container {
    width: 100%;
    height: 100%;
    display: flex;
}

.tracker-layers {
    flex: initial;
    width: 200px;
    height: 100%;
    position: relative;

    div {
        position: absolute;
    }
}

.tracks {
    flex-grow: 1;
    height: 100%;
    width: 100%;
    position: relative;
}

.tick {
    stroke: white;
}

.tick-dotted {
    stroke-dasharray: 1,2;
}

.tick-minutes {
    stroke-width: 2;
}

svg {
    width: 100%;
    height: 100%;
    background-color: $panel-bg;
    pointer-events: all;
    shape-rendering: crispEdges;
}
</style>
