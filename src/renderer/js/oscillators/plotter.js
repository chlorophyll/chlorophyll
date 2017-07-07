import * as d3 from 'd3';

export default function OscillatorPlotter(oscElement, options) {
    let margin = {top: 20, right: 20, bottom: 20, left: 20};

    let elWidth = options.width || 200;
    let elHeight = options.height || 200;

    let width = elWidth - margin.left - margin.right;
    let height = elHeight - margin.top - margin.bottom;

    let svg = d3.select(oscElement).append('svg');

    svg.attr('width', elWidth)
       .attr('height', elHeight);
    let g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    let x = d3.scaleLinear().rangeRound([0, width]);
    let y = d3.scaleLinear().rangeRound([height, 0]);
    let line = d3.line()
        .x(function(d) { return x(d.x); })
        .y(function(d) { return y(d.y); });

    this.plot = function(oscillator) {
        g.selectAll('*').remove();
        let sample = 3;
        let data = d3.range(0, sample, oscillator.properties.frequency.sec / 100)
            .map(function(t) {
                return {x: t, y: oscillator.value(t)};
            });

        x.domain([0, sample]);
        y.domain([0, 1]);

        g.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x).tickSize(-height))
            .selectAll('.tick, .tick line')
            .attr('stroke', '#555')
            .attr('stroke-opacity', '0.7');

        g.append('g')
            .attr('transform', 'translate(' + width + ', 0)')
            .call(d3.axisLeft(y).tickSize(width))
            .selectAll('.tick, .tick line')
            .attr('stroke', '#555')
            .attr('stroke-opacity', '0.7');

        g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
            .attr('stroke-width', 2)
            .attr('d', line);
    };
}
