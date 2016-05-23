/* GLOBAL VARIABLES */
// loading data in
var dataset,
    fp = "data/test.json";

// derived data
var total_energy,
    matrix = [];

/* SETTINGS */
var margin = {top: 40, right: 50, bottom: 40, left: 50},
    width = 960 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var max_diameter = height * 3 / 4,
    xshift = width / 2 - max_diameter / 2,
    yshift = height / 2 - max_diameter / 2,
    color = d3.scale.category10(), // associated with geographic division
    bubble_padding = 5.5,
    format = d3.format(",g"), // text numbers format
    pack_sort_threshhold = 100000000; // sorting bubbles by mixed sizes

var innerRad = max_diameter * 1.25 / 2,
    outerRad = innerRad * 1.05,
    arc_padding = .04, // radians
    fill = d3.scale.ordinal()
        .domain(d3.range(3))
        .range(["#F26223", "#FFDD89", "#957244"])
    arc_title_text = ["gas", "renewable", "petroleum"],
    arc_opacity = 0.74,
    chord_opacity = 0.54;

// button slicing
var slice = 2012;

// recenter
var recenter = function() { return "translate(" + width/2 + "," + height/2 + ")"; }

/* SVG CANVAS */
// http://bl.ocks.org/mbostock/3019563
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// tests
//svg.append("circle").attr({"cx": width/2, "cy": height/2, "r": 10});

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
    .size([max_diameter, max_diameter])
    .padding(bubble_padding);

// chord layout
var chord = layoutchord()
    .padding(arc_padding) // radian arc padding
    ;//.sortSubgroups(d3.descending);

// load data
d3.json(fp, function (err, data) {
    if (err) throw err;
    if (data.slice != slice) throw 'Error: wrong slice.';
    
    // handoff to global var
    dataset = data;//.children;
    console.log(data);

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
        //.text(function(d) { return d.state.substring(0, d.r / 3); });

    // chord/arc layout
    chord.matrix(matrix);
    // arcs
    // data
    var arcs = svg.append("g").selectAll("path")
        .data(chord.groups)
        .enter().append("path")
        .style("fill", function(d) { return fill(d.index); })
        .style("stroke", function(d) { return fill(d.index); })
        .style("opacity", arc_opacity)
        .attr("transform", recenter())
        .attr("d", d3.svg.arc().innerRadius(innerRad).outerRadius(outerRad));
    // title text
    arcs.append("title")
        .text(function(d) {return arc_title_text[d.index];});
    // chords
    console.log(matrix);
    console.log(chord.chords);
    var chords = svg.append("g").selectAll("path")
        .data(chord.chords)
        .enter().append("path")
        .attr("transform", recenter())
        .attr("d", svgchord().radius(innerRad))
        .style("fill", function(d) { return fill(d.source.index); }) // source determines color
        .style("opacity", chord_opacity);

});

// Flattens hierarchy
function states(root) {
    var states = [],
        total = 0,
        gas = [],
        renewable = [],
        petroleum = [];
    function recurse(name, node) {
        if (node.slice) node.children.forEach(function(obj) { 
            recurse(node.state, obj); });
        else {
            // data for the chords
            total += node.total;
            gas.push(node.gas);
            renewable.push(node.renewable);
            petroleum.push(node.petroleum);

            // data for the bubbles
            states.push({state: node.state, value: node.value, area: node.area});
        }
    }
    // handoff to global variable
    total_energy = total;
    matrix.push(gas, renewable, petroleum);
    
    recurse(null, root);
    return {children: states};
}
