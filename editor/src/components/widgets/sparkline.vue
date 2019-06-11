<template>
    <div :style="box" class="sparkline">
        <svg :width="width" :height="height">
            <template v-for="bar in bars">
                <rect class="bar"
                      :x="bar.x"
                      :y="bar.y"
                      :height="bar.height"
                      :width="barWidth"
                      />
            </template>
        </svg>
    </div>
</template>

<script>
import * as d3 from 'd3';

export default {
    name: 'sparkline',
    props: ['samples', 'width', 'height'],

    computed: {
        box() {
            return {
                'width': `${this.width}px`,
                'height': `${this.height}px`,
            };
        },

        bars() {
            return this.samples.map((value, t) => {
                const x = this.xScale(t);
                const y = this.yScale(value);

                const height = this.height - y;

                return {
                    x,
                    y,
                    height,
                };
            });
        },


        xScale() {
            return d3.scaleBand()
                     .domain(this.samples.map((d,t) => t))
                     .range([0, this.width])
                     .padding(0.1);
        },

        max() {
            return d3.max(this.samples);
        },

        yScale() {
            return d3.scaleLinear().domain([0, this.max]).range([this.height, 0]);
        },
        barWidth() {
            return this.xScale.bandwidth();
        },
    },
}
</script>

<style scoped lang="scss">
@import "~@/style/aesthetic.scss";
.bar {
    fill: $highlight;
}

div {
    margin-left: 5px;
    margin-right: 5px;
}
</style>
