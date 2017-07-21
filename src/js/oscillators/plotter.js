import * as d3 from 'd3';

export default function OscillatorPlotter(oscElement, oscillator, options) {
    let margin = {top: 20, right: 20, bottom: 20, left: 20};

    let elWidth = options.width || 200;
    let elHeight = options.height || 200;

    let width = elWidth - margin.left - margin.right;
    let height = elHeight - margin.top - margin.bottom;

    let svg = d3.select(oscElement).append('svg');

    svg.attr('width', elWidth)
       .attr('height', elHeight);
    let g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    let xScale = d3.scaleLinear().rangeRound([0, width]);
    let xInit = d3.scaleLinear().rangeRound([0, width]);
    let yScale = d3.scaleLinear().rangeRound([height, 0]);

    let sample = 3; /* seconds */

    xScale.domain([0, sample]);
    xInit.domain([0, sample]);
    yScale.domain([0, 1]);

    let line = d3.line()
        .x(function(d) { return xScale(d.x); })
        .y(function(d) { return yScale(d.y); });

    let zoom = d3.zoom().on('zoom', zoomed);
    g.call(zoom);

    function reset() {
        g.transition().duration(100).call(zoom.transform, d3.zoomIdentity);
    }

    g.on('dblclick.zoom', reset);

    function data() {
        let [start, end] = xScale.domain();
        return d3.range(start, end, (end-start)/300).map(function(t) {
            return {x: t, y: oscillator.value(t) };
        });
    }

    function zoomed() {
        let t = d3.event.transform;
        xScale.domain(t.rescaleX(xInit).domain());
        self.x_axis.call(d3.axisBottom(xScale).tickSize(-height));
        self.x_axis.selectAll('.tick, .tick line')
              .attr('stroke', '#555')
              .attr('stroke-opacity', '0.7');
        self.path.datum(data()).attr('d', line);
    }

    this.plot = function() {
        g.selectAll('*').remove();

        self.x_axis = g.append('g')
                       .attr('transform', 'translate(0,' + height + ')')
                       .call(d3.axisBottom(xScale).tickSize(-height));

        x_axis.selectAll('.tick, .tick line')
              .attr('stroke', '#555')
              .attr('stroke-opacity', '0.7');

        g.append('g')
            .attr('transform', 'translate(' + width + ', 0)')
            .call(d3.axisLeft(yScale).tickSize(width))
            .selectAll('.tick, .tick line')
            .attr('stroke', '#555')
            .attr('stroke-opacity', '0.7');

        self.path = g.append('path')
                     .datum(data())
                     .attr('fill', 'none')
                     .attr('stroke', 'steelblue')
                     .attr('stroke-linejoin', 'round')
                     .attr('stroke-linecap', 'round')
                     .attr('stroke-width', 2)
                     .attr('d', line);

    };
};
