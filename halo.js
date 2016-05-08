/* GLOBAL VARIABLES */
// loading data in
var dataset,
    source = "data/test.json";

// derived data
var total_energy;

// settings
var margin = {top: 40, right: 40, bottom: 40, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    bubbles_diameter = height / 2,
    xshift = width / 2 - bubbles_diameter / 2,
    yshift = height / 2 - bubbles_diameter / 2,
    color = d3.scale.category10(), // associated with geographic division
    bubble_padding = 5.5,
    format = d3.format(",g"), // text numbers format
    pack_sort_threshhold = 100000000; // sorting bubbles by mixed sizes

// button slicing
var slice = 2012;

// svg canvass
// http://bl.ocks.org/mbostock/3019563
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// pack layout
var bubble = d3.layout.pack()
    // Should sort by location
    .sort(null)
    // mixed-size bubble sorting
    // http://stackoverflow.com/questions/24336898/
    // .sort(function(a, b) {
    //     var th = pack_sort_threshhold;
    //     if ((a.value > th) && (b.value > th))
    //         return -(a.value - b.value);
    //     else return -1;
    // })
    .size([bubbles_diameter, bubbles_diameter])
    .padding(bubble_padding);

// chord layout


// load data
d3.json(source, function (err, data) {
    if (err) throw err;
    
    // handoff to global var
    dataset = data;
    //console.log(data);
    
    // bubbles
    // data
    var node = svg.selectAll(".node")
        .data(bubble.nodes(states(data))
            .filter(function(d) { return !d.children }))
        .enter().append("g")
        .attr("transform", function(d) { 
            return "translate(" + (d.x + xshift) + "," + (d.y + yshift) + ")"; });
    // title text
    node.append("title")
        .text(function(d) { return d.state + ": " + format(d.value) + " GWh"; });
    // drawing bubbles
    node.append("circle")
        .attr("r", function(d) { return d.r; })
        .style("fill", function(d) { return color(d.area); });
    // text
    node.append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.state.substring(0, d.r / 3); });
    
    // 
});

// Flattens hierarchy
function states(root) {
  var states = [];
  total = 0;
  function recurse(name, node) {
    if (node.states) node.states.forEach(function(obj) { recurse(node.state, obj); });
    else {
        // data for the chords
        total += node.total;
        states.push({state: node.state, value: node.total, area: node.area, 
            gas: node.gas, renewable: node.renewable, petroleum: node.petroleum});
    }
  }
  recurse(null, root);
  console.log(states);
  total_energy = total;  // handoff to global variable
  return {children: states};
}
