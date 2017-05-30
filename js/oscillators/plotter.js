function OscillatorPlotter(container, options) {
	var margin = {top: 20, right: 20, bottom: 20, left: 20};

	var elWidth = options.width || 200;
	var elHeight = options.height || 200;

	var width = elWidth - margin.left - margin.right;
	var height = elHeight - margin.top - margin.bottom;

	var svg = d3.select(container).append('svg');

	svg.attr('width', elWidth)
	   .attr('height', elHeight);
	var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var x = d3.scaleLinear().rangeRound([0, width]);
	var y = d3.scaleLinear().rangeRound([height, 0]);
	var line = d3.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); });

	this.plot = function(oscillator) {
		g.selectAll('*').remove();
		var sample = 3 /* seconds */;
		var data = d3.range(0, sample, oscillator.properties.frequency.sec / 100).map(function(t) {
			return {x: t, y: oscillator.value(t)}
		});

		x.domain([0, sample]);
		y.domain([0, 100]);

		g.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x).tickSize(-height))
			.selectAll(".tick, .tick line")
			.attr('stroke', '#555')
			.attr('stroke-opacity', '0.7');

		g.append("g")
			.attr("transform", "translate(" + width + ", 0)")
			.call(d3.axisLeft(y).tickSize(width))
			.selectAll(".tick, .tick line")
			.attr('stroke', '#555')
			.attr('stroke-opacity', '0.7');

		g.append("path")
			.datum(data)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 2)
			.attr("d", line);
	}
}
