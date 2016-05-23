/* GLOBAL VARIABLES */
// loading data in
var dataset,
    elecfile = "data/test.json",
    locfile = "data/us_states.json",
    locidfile = "data/us_states_id.json";

// derived data
var total_energy,
    matrix = [];

var state_id = ["", "AL", "AK", "", "AZ", "AR", "CA", "", "CO", "CT", "DE", "DC", "FL", "GA", "", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "", "WA", "WV", "WI", "WY"];


/* SETTINGS */
var margin = { top: 40, right: 50, bottom: 40, left: 50 },
    width = 960 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var bubbles_diameter = height * 3 / 4,
    xshift = width / 2 - bubbles_diameter / 2,
    yshift = height / 2 - bubbles_diameter / 2,
    color = d3.scale.category10(), // associated with geographic division
    bubble_padding = 5.5,
    format = d3.format(",g"), // text numbers format
    pack_sort_threshhold = 100000000; // sorting bubbles by mixed sizes

var innerRad = bubbles_diameter * 1.25 / 2,
    outerRad = innerRad * 1.05,
    arc_padding = .04, // radians
    fill = d3.scale.ordinal()
        .domain(d3.range(3))
        .range(["#F26223", "#FFDD89", "#957244"]),
    arc_title_text = ["gas", "renewable", "petroleum"],
    arc_opacity = 0.74,
    chord_opacity = 0.54;

// button slicing
var slice = 2012;

/* FUNCTIONS */
// recenter
var recenter = function() { return "translate(" + width / 2 + "," + height / 2 + ")"; }

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

/* SVG CANVAS */
// http://bl.ocks.org/mbostock/3019563
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// tests
//svg.append("circle").attr({"cx": width/2, "cy": height/2, "r": 10});

/* LAYOUTS */
var path = d3.geo.path();
var force = d3.layout.force().size([width, height]);
var bubble = d3.layout.pack()
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
var chord = d3.layout.chord()
    .padding(arc_padding) // radian arc padding
    ;//.sortSubgroups(d3.descending);

/* DATA */
// load data
d3.json(elecfile, function (err, data) {
    if (err) throw err;
    if (data.slice != slice) throw 'Error: wrong slice.';

    // handoff to global var
    dataset = data;
    console.log(dataset);
    
    // bubbles
    var node = svg.selectAll(".node")
        .data(bubble.nodes(states(data))
            .filter(function(d) { return !d.children }))
    
    node.enter().append("g")
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

});

// location data
d3.json(locfile, function(err, us) {
    if (err) throw error;

    console.log(us);

    var states = topojson.feature(us, us.objects.states),
        nodes = [],
        links = [];

    console.log(states);

    // states
    states.features.forEach(function(d, i) {
        //if (d.id === 2 || d.id === 15 || d.id === 72) return; // remove AK, HI, ?
        var centroid = path.centroid(d);
        if (centroid.some(isNaN)) return;
        
        // centroid data
        // voronoi() likes [0], [1] indexes to hold lat/long as well
        // change alaska and hawaii
        if (d.id === 2) {
            centroid[0] = centroid[0] * 0.9;
            centroid[1] -= height * 0.65;
        } else if (d.id === 15) {
            centroid[0] -= width*0.2;
            centroid[1] -= height*0.25;
        } 
        centroid.x = centroid[0]; // latitute
        centroid.y = centroid[1]; // longitude
        
        // added data
        centroid.feature = d; // to draw the state
        centroid.id = d.id; // the id
        centroid.state = state_id[d.id] // name of state
        // radius!
        centroid.r = 5 // radius!
                
        nodes.push(centroid); // make node array of centroids
    });

    // voronoi connections
    d3.geom.voronoi().links(nodes).forEach(function(link) {
        var dx = link.source.x - link.target.x,
            dy = link.source.y - link.target.y;
        // this determines distance between nodes!!
        link.distance = Math.sqrt(dx * dx + dy * dy);
        links.push(link);
    });

    // print nodes
    console.log(nodes);

    // force diagram
    force
        .gravity(0)
        .nodes(nodes) // assign array nodes here
        .links(links)
        .linkDistance(function(d) {
            return d.distance; // hmm change someday?
        })
        .start();

    // links
    var link = svg.selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("x1", function(d) {
            return d.source.x;
        })
        .attr("y1", function(d) {
            return d.source.y;
        })
        .attr("x2", function(d) {
            return d.target.x;
        })
        .attr("y2", function(d) {
            return d.target.y;
        });

    // nodes
    var node = svg.selectAll("g")
        .data(nodes)
        .enter().append("g")
        .attr("transform", function(d) {
            return "translate(" + -d.x + "," + -d.y + ")";
        })
        .call(force.drag) // lets you change the orientation
        .append("path")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        // outlines!
        // currently of states, need to be of circles
        .attr("d", function(d) {
            return path(d.feature);
        });
    
    // test : centroid circles
    var cent = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("cx", function(d) {return d.x;})
        .attr("cy", function(d) {return d.y;})
        .attr("r", "5px")
        .attr("fill", function(d) {
            if (d.id == 2) 
                return "red";
            else
                return "white";
        });

    // // lets the states bobble
    // force.on("tick", function(e) {
    //   link.attr("x1", function(d) { return d.source.x; })
    //       .attr("y1", function(d) { return d.source.y; })
    //       .attr("x2", function(d) { return d.target.x; })
    //       .attr("y2", function(d) { return d.target.y; });
    //
    //   node.attr("transform", function(d) {
    //     return "translate(" + d.x + "," + d.y + ")";
    //   });
    // });
});