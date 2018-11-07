// Script 3
// Data Visualization III - Stacked Bar Chart

var w = .97*window.innerWidth,
	margin = {top: 10, right: 156, bottom: 100, left: 50},
	width = 900 - margin.left - margin.right,
	height = 300 - margin.top - margin.bottom;

var xscale = d3.scaleBand()
               .range([0, width]);

var yscale = d3.scaleLinear()
	       .range([height, 0]);

var colors = d3.scaleOrdinal()
		       .range(["hsl(190, 69%, 65%)",
					   "hsl(177, 69%, 65%)", 
					   "hsl(144, 69%, 65%)", 
					   "hsl(100, 69%, 65%)", 
					   "hsl(47, 69%, 65%)",
					   "hsl(28, 69%, 65%)",
					   "hsl(0, 100%, 50%)"]);


var xaxis = d3.axisBottom(xscale);

var yaxis = d3.axisLeft(yscale)
			  .tickFormat(d3.format(".0%")); // **

var stackedBarSVG = d3.select("#stacked-bar-chart")
	.attr( "width", width + margin.left + margin.right)
	.attr( "height", height + margin.top + margin.bottom)
	.attr("preserveAspectRatio", "xMinYMin meet")
	.call(responsivefy)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// load and handle the data
d3.tsv("assets/data/data.tsv", function(error, data) {

	// rotate the data
	var categories = d3.keys(data[0]).filter(function(key) { return key !== "state" && key !== "National"; });
	var parsedata = categories.map(function(name) { return { "state": name }; });
	data.forEach(function(d) {
		parsedata.forEach(function(pd) {
			pd[d["state"]] = d[pd["state"]];
		});
	});

	// map column headers to colors (except for 'state' and 'Base: All Respondents')
	colors.domain(d3.keys(parsedata[0]).filter(function(key) { return key !== "state" && key !== "Base: All Respondents"; }));

	// add a 'responses' parameter to each row that has the height percentage values for each rect
	parsedata.forEach(function(pd) {
		var y0 = 0;
		// colors.domain() is an array of the column headers (text)
		// pd.responses will be an array of objects with the column header
		// and the range of values it represents
		pd.responses = colors.domain().map(function(response) {
			var responseobj = {response: response, y0: y0, yp0: y0};
			y0 += +pd[response];
			responseobj.y1 = y0;
			responseobj.yp1 = y0;
			return responseobj;
		});
		// y0 is now the sum of all the values in the row for this category
		// convert the range values to percentages
		pd.responses.forEach(function(d) { d.yp0 /= y0; d.yp1 /= y0; });
		// save the total
		pd.totalresponses = pd.responses[pd.responses.length - 1].y1;
	});

	// sort by the value in 'Right Direction'
	// parsedata.sort(function(a, b) { return b.responses[0].yp1 - a.responses[0].yp1; });

	// ordinal-ly map categories to x positions
	xscale.domain(parsedata.map(function(d) { return d.state; }));

	// add the x axis and rotate its labels
	stackedBarSVG.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xaxis)
		.selectAll("text")
		.attr("y", 5)
		.attr("x", 7)
		.attr("dy", ".35em")
		.attr("transform", "rotate(65)")
		//.style("font-size","1vw")
		.style("text-anchor", "start");

	// add the y axis
	stackedBarSVG.append("g")
		.attr("class", "y axis")
		.call(yaxis);

	// create stackedBarSVG groups ("g") and place them
	var category = stackedBarSVG.selectAll(".category")
		.data(parsedata)
		.enter().append("g")
		.attr("class", "category")
		.attr("transform", function(d) { return "translate(" + xscale(d.state) + ",0)"; });

	// draw the rects within the groups
	category.selectAll("rect")
		.data(function(d) { return d.responses; })
		.enter().append("rect")
		.attr("width", xscale.bandwidth())
		.attr("y", function(d) { return yscale(d.yp1); })
		.attr("height", function(d) { return yscale(d.yp0) - yscale(d.yp1); })
		.style("fill", function(d) { return colors(d.response); });

	// position the legend elements
	var legend = stackedBarSVG.selectAll(".legend")
		.data(colors.domain())
		.enter().append("g")
		.attr("class", "legend")
		.attr("transform", function(d, i) { return "translate(30," + (30+(i * 14)) + ")"; });

	legend.append("rect")
		.attr("x", width - 12)
		.attr("width", 12)
		.attr("height", 12)
		.style("fill", colors);

	legend.append("text")
		.attr("x", width + 5)
		.attr("y", 5)
		.attr("dy", ".35em")
		.style("text-anchor", "start")
		.text(function(d) { return d; });

	// animation
	d3.selectAll("#stack-form input").on("change", handleFormClick);

	function handleFormClick() {
		if (this.value === "bypercent") {
			transitionPercent();
		} else {
			transitionCount();
		}
	}

	// transition to 'percent' presentation
	function transitionPercent() {
		// reset the yscale domain to default
		yscale.domain([0, 1]);

		// create the transition
		var trans = stackedBarSVG.transition().duration(250);

		// transition the bars
		var categories = trans.selectAll(".category");
		categories.selectAll("rect")
			.attr("y", function(d) { return yscale(d.yp1); })
			.attr("height", function(d) { return yscale(d.yp0) - yscale(d.yp1); });

		// change the y-axis
		// set the y axis tick format
		yaxis.tickFormat(d3.format(".0%"));
		stackedBarSVG.selectAll(".y.axis").call(yaxis);
	}

	// transition to 'count' presentation
	function transitionCount() {
		// set the yscale domain
		yscale.domain([0, d3.max(parsedata, function(d) { return d.totalresponses; })]);

		// create the transition
		var transone = stackedBarSVG.transition()
			.duration(250);

		// transition the bars (step one)
		var categoriesone = transone.selectAll(".category");
		categoriesone.selectAll("rect")
			.attr("y", function(d) { return this.getBBox().y + this.getBBox().height - (yscale(d.y0) - yscale(d.y1)) })
			.attr("height", function(d) { return yscale(d.y0) - yscale(d.y1); });

		// transition the bars (step two)
		var transtwo = transone.transition()
			.delay(350)
			.duration(350)
			.ease(d3.easeBounce);
		var categoriestwo = transtwo.selectAll(".category");
		categoriestwo.selectAll("rect")
			.attr("y", function(d) { return yscale(d.y1); });

		// change the y-axis
		// set the y axis tick format
		yaxis.tickFormat(d3.format(".2s"));
		stackedBarSVG.selectAll(".y.axis").call(yaxis);
	}
});

d3.select(self.frameElement).style("height", (height + margin.top + margin.bottom) + "px");
