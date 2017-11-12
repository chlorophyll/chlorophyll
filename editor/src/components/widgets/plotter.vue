<template>
    <div :style="box" class="plotter">
    <svg ref="canvas" :width="width" :height="height">
        <g ref="g">
            <g ref="x_axis" :transform="`translate(0, ${this.height})`" />
            <g ref="y_axis" :transform="`translate(${this.width}, 0)`" />
            <path ref="path" class="path"/>
        </g>
    </svg>
    </div>
</template>

<script>

import * as d3 from 'd3';

const sample = 3; /* seconds */

export default {
    name: 'plotter',
    props: ['func', 'width', 'height'],
    data() {
        const x_scale = d3.scaleLinear().rangeRound([0, this.width])
                                        .domain([0, sample]);

        const y_scale = d3.scaleLinear().rangeRound([this.height, 0])
                                        .domain([0, 1]);
        return {
            zoom: d3.zoom().on('zoom', () => this.zoomed()),
            x_scale,
            y_scale,
        };
    },
    computed: {
        box() {
            return {
                'width': `${this.width}px`,
                'height': `${this.height}px`,
            };
        },
        line() {
            return d3.line().x((d) => this.x_scale(d.x))
                            .y((d) => this.y_scale(d.y));
        },
    },
    watch: {
        func() {
            this.redraw();
        }
    },
    methods: {
        points() {
            const [start, end] = this.x_scale.domain();
            const step = (end - start) / (sample*100);
            return d3.range(start, end, step).map((t) => ({x: t, y: this.func(t)}));
        },
        zoomed() {
            let t = d3.event.transform;

            const x_init = d3.scaleLinear().rangeRound([0, this.width])
                                           .domain([0, sample]);

            this.x_scale.domain(t.rescaleX(x_init).domain());
            this.redraw();
        },
        redraw() {
            const x_axis = d3.axisBottom(this.x_scale).tickSize(-this.height);
            const y_axis = d3.axisLeft(this.y_scale).tickSize(this.width);

            d3.select(this.$refs.y_axis).call(y_axis);
            d3.select(this.$refs.x_axis).call(x_axis);

            d3.select(this.$refs.path).datum(this.points()).attr('d', this.line);
        },
        resetZoom() {
            d3.select(this.$refs.g)
              .transition()
              .duration(100)
              .call(this.zoom.transform, d3.zoomIdentity);
        }
    },

    mounted() {
        const g = d3.select(this.$refs.g);
        g.call(this.zoom);
        g.on('dblclick.zoom', () => this.resetZoom());
        this.redraw();
    }
};

</script>

<style scoped>

div {
    margin: 0 auto;
    position: relative;
}

svg {
    margin-left: 2px;
    margin-top: 2px;
    width: calc(100%-2px);
    height: calc(100%-2px);
}

</style>
