// NOTE: chartRegion is var svg from common examples
var svgcontainer = _selection.selectAll("svg").data([_data]);

// If no svg, creates one
var gEnter = svgcontainer.enter().append("svg").append("g");

// Update the outer dimensions
svgcontainer.attr("width", chartWidth + margins.left + margins.right)
    .attr("height", chartHeight + margins.top + margins.bottom);

// Update the inner region
var innerRegion = svgcontainer.select("g")
    .attr("transform", "translate(" + margins.left + "," + margins.top + ")");
    
    
//the animation is in meters, and goes to 20m. we're currently at 2.8e-3 m / year and steadily increasing by 1.3e-5 m / year, so barring tipping points for percipitous sea level rise (*cough*, shutdown of the north atlantic, *couch*), and integrating on 