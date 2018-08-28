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


export default {
    name: 'plotter',
    props: ['samples', 'sampleDomain', 'width', 'height'],
    data() {
        const x_scale = d3.scaleLinear().rangeRound([0, this.width])
                                        .domain(this.sampleDomain);

        const y_scale = d3.scaleLinear().rangeRound([this.height, 0])
                                        .domain([0, 1]);
        return {
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
        samples() {
            this.redraw();
        }
    },
    methods: {
        zoomed() {
            let t = d3.event.transform;

            const x_init = d3.scaleLinear().rangeRound([0, this.width])
                                           .domain(this.sampleDomain);

            this.x_scale.domain(t.rescaleX(x_init).domain());
            this.redraw();
        },
        redraw() {
            const x_axis = d3.axisBottom(this.x_scale).tickSize(-this.height);
            const y_axis = d3.axisLeft(this.y_scale).tickSize(this.width);

            d3.select(this.$refs.y_axis).call(y_axis);
            d3.select(this.$refs.x_axis).call(x_axis);

            d3.select(this.$refs.path).datum(this.samples).attr('d', this.line);
        },
        resetZoom() {
            d3.select(this.$refs.g)
              .transition()
              .duration(100)
              .call(this.zoom.transform, d3.zoomIdentity);
        }
    },

    mounted() {
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
