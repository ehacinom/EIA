/* GLOBAL VARIABLES */
// loading data in
var ELECTRICITY,
    TJSON, GJSON,
    nodes = [], nodes_i = {},
    elecfile = "data/test.json",
    locfile = "data/us_states.json",
    locidfile = "data/us_states_id.json";

// derived data
var matrix = [];

// location data needs to be tagged with state names
var state_id = ["", "AL", "AK", "", "AZ", "AR", "CA", "", "CO", "CT", "DE", "DC", "FL", "GA", "", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "", "WA", "WV", "WI", "WY"];

/* SETTINGS */
var margin = { top: 40, right: 50, bottom: 40, left: 50 },
    width = 700 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var bubbles_diameter = height * 3 / 4,
    xshift = width / 2 - bubbles_diameter / 2,
    yshift = height / 2 - bubbles_diameter / 2,
    color = d3.scale.category10(), // associated with geographic division
    bubble_padding = 5,
    format = d3.format(",g"), // text numbers format
    pack_sort_threshhold = 100000000; // sorting bubbles by mixed sizes

var gravity = 0.02,         // 0.1, > 0; towards center of layout // make towards center of arcs!!!
    charge = 0,             // -30; negative repels
    friction = 0.8,         // 0.9, [0,1];
    collision_alpha = 0.25, // (0,1)
    alpha = 0.3,            // 0.1; // the longer it cools, the more uncollided it will be
    linkStrength = 0.01;    // 0.1, [0,1];

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
// recenter // used for arcs
var recenter = function() { return "translate(" + width / 2 + "," + height / 2 + ")"; }

// flattens hierarchy and make arc's matrix // used for bubbles in pack layout
// Be careful not to call twice: matrix changes (doubles in elements) because matrix 
// is a global variable
function flatten_pack_matrix_arc(root) {
    var flat = [],
        gas = [],
        renewable = [],
        petroleum = [];
    
    function recurse(name, pt) {
        if (pt.slice) pt.children.forEach(function(obj) { 
            recurse(pt.state, obj); });
        else {
            // data for the chords
            // add more data for chords when they exist
            gas.push(pt.gas);
            renewable.push(pt.renewable);
            petroleum.push(pt.petroleum);

            // data for the bubbles
            // area function for the drawing of bubbles currently
            // remove this property later
            flat.push({state: pt.state, value: pt.value, area: pt.area});
        }
    }
    
    // careful: this is called every time flatten_pack_matrix_arc() is called
    matrix.push(gas, renewable, petroleum); 
    
    // recurse
    recurse(null, root);    
    return {children: flat};
}

// merge pack data by index to nodes
// merging by index
// arrays of objects a, b of equal length
function merge_pack_data(a, b) {
    for (i = 0; i < a.length; i++) {
        var bb = {"x_pack": b[i].x, "y_pack": b[i].y, "r": b[i].r};
        Object.assign(a[i], bb); // merge bb into a[i]

        // store {state: i} in global variable
        nodes_i[a[i].state] = i;
    }
    return a
}

// Resolves collisions between d and all other circles.
function collide(aa) {
    var quadtree = d3.geom.quadtree(nodes);
    return function(d) {
        var nx1 = d.x - d.r,
            nx2 = d.x + d.r,
            ny1 = d.y - d.r,
            ny2 = d.y + d.r;

        quadtree.visit(function(quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),                
                    r = d.r + quad.point.r + bubble_padding;
                if (l < r) {
                    l = (l - r) / l * aa;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
    };
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
var force = d3.layout.force()
    .size([bubbles_diameter, bubbles_diameter])
    .gravity(gravity)
    .charge(charge)
    .friction(friction)
    .alpha(alpha)
    .linkStrength(linkStrength);
var pack = d3.layout.pack()
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
var chord = d3.layout.chord() // layoutchord() or d3.layout.chord()
    .padding(arc_padding) // radian arc padding
    ;//.sortSubgroups(d3.descending);

/* DATA */
// load data
d3.json(elecfile, function (err, data) {
    if (err) throw err;
    if (data.slice != slice) throw 'Error: wrong time slice.';

    // handoff to global var
    ELECTRICITY = data;

    // putting things together for nodes
    nodes = data.children; // (area, state, value, **fuels)
    var pack_info = pack.nodes(flatten_pack_matrix_arc(data))
                        .filter(function(d) { return !d.children });
    nodes = merge_pack_data(nodes, pack_info); //  (r, x_pack, y_pack)

    // // bubbles
    // // data
    // var bub = svg.selectAll(".node")
    //     .data(pack.nodes(flatten_pack_matrix_arc(data))
    //         .filter(function(d) { return !d.children }))
    //     .enter().append("g")
    //     .attr("transform", function(d) {
    //         return "translate(" + (d.x + xshift) + "," + (d.y + yshift) + ")"; });
    // // title text
    // bub.append("title")
    //     .text(function(d) { return d.state + ": " + format(d.value) + " GWh"; });
    // // drawing bubbles
    // bub.append("circle")
    //     .attr("r", function(d) { return d.r; })
    //     .style("fill", function(d) { return color(d.area); });
    // // text
    // bub.append("text")
    //     .attr("dy", ".3em")
    //     .style("text-anchor", "middle")
    //     .text(function(d) { return d.state.substring(0, d.r / 3); });
    //
    // // chord/arc layout
    // chord.matrix(matrix);
    // // arcs
    // // data
    // var arcs = svg.append("g").selectAll("path")
    //     .data(chord.groups)
    //     .enter().append("path")
    //     .style("fill", function(d) { return fill(d.index); })
    //     .style("stroke", function(d) { return fill(d.index); })
    //     .style("opacity", arc_opacity)
    //     .attr("transform", recenter())
    //     .attr("d", d3.svg.arc().innerRadius(innerRad).outerRadius(outerRad));
    // // title text
    // arcs.append("title")
    //     .text(function(d) {return arc_title_text[d.index];});
    // // chords
    // var chords = svg.append("g").selectAll("path")
    //     .data(chord.chords)
    //     .enter().append("path")
    //     .attr("transform", recenter())
    //     .attr("d", d3.svg.chord().radius(innerRad)) // svgchord() or d3.svg.chord()
    //     .style("fill", function(d) { return fill(d.source.index); }) // source determines color
    //     .style("opacity", chord_opacity);
    //
    // // console
    // console.log('\nchord data');
    // console.log(matrix); // fuel types
    // console.log(chord.chords); // chords ??

});

// location data
d3.json(locfile, function(err, us) {
    if (err) throw error;

    // handoff to global variables
    TJSON = us;
    GJSON = topojson.feature(us, us.objects.states);
    
    // local variables
    var pt = [],    // array of centroids and related data
        links = []; // array of voronoi links

    // centroids and data set up
    GJSON.features.forEach(function(d, i) {
        //if (d.id === 2 || d.id === 15 || d.id === 72) return; // remove AK, HI, ?
        var centroid = path.centroid(d); // path centroid! :D such a useful function
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
        centroid.state = state_id[d.id] // name
        
        // merge into nodes
        Object.assign(nodes[nodes_i[state_id[d.id]]], centroid);
        
        // make array of centroids // for voronoi, force, outlines, circles
        pt.push(centroid);
    });

    // print points
    console.log('\ncentroids');
    console.log(pt);
    console.log(nodes);

    // voronoi connections // calculating links
    // this determines distance between centroids
    d3.geom.voronoi().links(nodes).forEach(function(link) {
        link.distance = link.source.r + link.target.r + bubble_padding;
        links.push(link);
    });

    // LINKS: not good // makes circles interact oddly
    // // voronoi connections // calculating links
    // // Save for useage some other time: it keeps things weird
    // d3.geom.voronoi().links(nodes).forEach(function(link) {
    //     var dx = link.source.x - link.target.x,
    //         dy = link.source.y - link.target.y;
    //     // this determines distance between points!!
    //     link.distance = Math.sqrt(dx * dx + dy * dy);
    //     links.push(link);
    // });
    //
    // // drawing links
    // var link = svg.selectAll("line")
    //     .data(links)
    //     .enter().append("line")
    //     .attr("x1", function(d) {
    //         return d.source.x;
    //     })
    //     .attr("y1", function(d) {
    //         return d.source.y;
    //     })
    //     .attr("x2", function(d) {
    //         return d.target.x;
    //     })
    //     .attr("y2", function(d) {
    //         return d.target.y;
    //     });
    
    // circles
    var circles = svg.selectAll("g")
        .data(nodes)
        .enter().append("g")
        .attr("transform", function(d) {
            return "translate(" + -d.x + "," + -d.y + ")";
        })
        .append("circle")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        // // WHY IS THIS NOT NECESSARY TO INITIALIZE POSITIONS IDK
        // .attr("cx", function(d) {return d.x;})
        // .attr("cy", function(d) {return d.y;})
        .attr("r", function(d) {return d.r;})
        .attr("fill", function(d) { return color(d.area); })
        .call(force.drag); // lets you change the orientation

    // // outlines of states --> circles
    // var outlines = svg.selectAll("g")
    //     .data(nodes)
    //     .enter().append("g")
    //     .attr("transform", function(d) {
    //         return "translate(" + -d.x + "," + -d.y + ")";
    //     })
    //     .call(force.drag) // lets you change the orientation
    //     .append("path")
    //     .attr("transform", function(d) {
    //         return "translate(" + d.x + "," + d.y + ")";
    //     })
    //     // outlines!
    //     // currently of states, need to be of circles
    //     .attr("d", function(d) {
    //         return path(d.feature);
    //     });


    // circle tick function
    function tick(e) {
      circles
          .each(collide(collision_alpha))
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }


    // on("tick") has to be placed down here, not up there
    // because else the function runs asynchronously
    // enters an undefined node as the function
    // and is sad and won't run.
    force.nodes(nodes)
        .on("tick", tick)
        .start();
    
    // // force diagrams // calculating forces
    // force
    //     .nodes(nodes) // assign array nodes here
    //     .links(links)
    //     .linkDistance(function(d) {
    //         return d.distance; // from voronoi, change someday
    //     });

    // // lets the states bobble under the force
    // // needed so the force pulls things together from centroid positions
    // force.on("tick", function(e) {
    //   link.attr("x1", function(d) { return d.source.x; })
    //       .attr("y1", function(d) { return d.source.y; })
    //       .attr("x2", function(d) { return d.target.x; })
    //       .attr("y2", function(d) { return d.target.y; });
    //
    //   outlines.attr("transform", function(d) {
    //     return "translate(" + d.x + "," + d.y + ")";
    //   });
    // });
});