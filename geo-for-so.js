/* SVG CANVAS */
var margin = { top: 40, right: 50, bottom: 40, left: 50 },
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var bubbles_diameter = height * 3 / 4,
    color = d3.scale.category10(), // associated with geographic division
    bubble_padding = 5,
    format = d3.format(",g"); // text numbers format

// really like the low 0.03 grav and 2 charge and larger 0.3 alpha
var gravity = 0.03,         // 0.1, > 0; towards center of layout // make towards center of arcs!!!
    charge = 2,             // -30; negative repels 
    friction = 0.9,         // 0.9, [0,1];
    collision_alpha = 0.25, // (0,1)
    alpha = 0.3,            // 0.1; // the longer it cools, the more uncollided it will be
    linkStrength = 0.1;    // 0.1, [0,1];

var nodes_i = {};

/* Electricity data */
data = {
    "slice": 2012,
    "children": [{
        "state": "AK",
        "value": 7.7,
        "area": "PCN",
        "gas": 2.5,
        "renewable": 1.2,
        "petroleum": 3.0
        }, {
        "state": "MI",
        "value": 10.7,
        "area": "ENC",
        "gas": 3.5,
        "renewable": 1.2,
        "petroleum": 5.0
        }, {
        "state": "KY",
        "value": 8.7,
        "area": "ESC",
        "gas": 4.0,
        "renewable": 0.2,
        "petroleum": 4.5
        }, {
        "state": "NV",
        "value": 9.7,
        "area": "MTN",
        "gas": 3.5,
        "renewable": 1.2,
        "petroleum": 5.0
        }, {
        "state": "NY",
        "value": 40.7,
        "area": "MAT",
        "gas": 10.5,
        "renewable": 5.2,
        "petroleum": 25.0
        }, {
        "state": "RI",
        "value": 3.7,
        "area": "NEW",
        "gas": 1.5,
        "renewable": 1.2,
        "petroleum": 1.0
        }, {
        "state": "CA",
        "value": 70.7,
        "area": "PCC",
        "gas": 30.5,
        "renewable": 10.2,
        "petroleum": 30.0
        }, {
        "state": "OR",
        "value": 18.7,
        "area": "PCC",
        "gas": 3.5,
        "renewable": 10.2,
        "petroleum": 5.0
        }, {
        "state": "FL",
        "value": 40.7,
        "area": "SAT",
        "gas": 30.5,
        "renewable": 5.0,
        "petroleum": 5.2
        }, {
        "state": "VA",
        "value": 15.7,
        "area": "SAT",
        "gas": 4.5,
        "renewable": 1.2,
        "petroleum": 10.0
        }, {
        "state": "SD",
        "value": 3.7,
        "area": "WNC",
        "gas": 3.5,
        "renewable": 0,
        "petroleum": 0.2
        }, {
        "state": "TX",
        "value": 71.7,
        "area": "WSC",
        "gas": 30.5,
        "renewable": 1.2,
        "petroleum": 40.0
        }, {
        "state": "LA",
        "value": 15.7,
        "area": "WSC",
        "gas": 5.5,
        "renewable": 1.2,
        "petroleum": 9.0
        }, {
        "state": "ID",
        "value": 7.7,
        "area": "MTN",
        "gas": 2.5,
        "renewable": 1.2,
        "petroleum": 3.0
        }, {
        "state": "WI",
        "value": 10.7,
        "area": "ENC",
        "gas": 3.5,
        "renewable": 1.2,
        "petroleum": 5.0
        }, {
        "state": "TN",
        "value": 8.7,
        "area": "ESC",
        "gas": 4.0,
        "renewable": 0.2,
        "petroleum": 4.5
        }, {
        "state": "MT",
        "value": 9.7,
        "area": "MTN",
        "gas": 3.5,
        "renewable": 1.2,
        "petroleum": 5.0
        }, {
        "state": "PA",
        "value": 40.7,
        "area": "MAT",
        "gas": 10.5,
        "renewable": 5.2,
        "petroleum": 25.0
        }, {
        "state": "CT",
        "value": 3.7,
        "area": "NEW",
        "gas": 1.5,
        "renewable": 1.2,
        "petroleum": 1.0
        }, {
        "state": "MN",
        "value": 70.7,
        "area": "WNC",
        "gas": 30.5,
        "renewable": 10.2,
        "petroleum": 30.0
        }, {
        "state": "WA",
        "value": 18.7,
        "area": "PCC",
        "gas": 3.5,
        "renewable": 10.2,
        "petroleum": 5.0
        }, {
        "state": "GA",
        "value": 40.7,
        "area": "SAT",
        "gas": 30.5,
        "renewable": 5.0,
        "petroleum": 5.2
        }, {
        "state": "DE",
        "value": 15.7,
        "area": "SAT",
        "gas": 4.5,
        "renewable": 1.2,
        "petroleum": 10.0
        }, {
        "state": "ND",
        "value": 3.7,
        "area": "WNC",
        "gas": 3.5,
        "renewable": 0,
        "petroleum": 0.2
        }, {
        "state": "OK",
        "value": 21.7,
        "area": "WSC",
        "gas": 10.5,
        "renewable": 1.2,
        "petroleum": 10.0
        }, {
        "state": "AR",
        "value": 15.7,
        "area": "WSC",
        "gas": 5.5,
        "renewable": 1.2,
        "petroleum": 9.0
        }, {
        "state": "DC",
        "value": 7.7,
        "area": "SAT",
        "gas": 2.5,
        "renewable": 1.2,
        "petroleum": 3.0
        }, {
        "state": "IL",
        "value": 10.7,
        "area": "ENC",
        "gas": 3.5,
        "renewable": 1.2,
        "petroleum": 5.0
        }, {
        "state": "SC",
        "value": 8.7,
        "area": "SAT",
        "gas": 4.0,
        "renewable": 0.2,
        "petroleum": 4.5
        }, {
        "state": "CO",
        "value": 9.7,
        "area": "MTN",
        "gas": 3.5,
        "renewable": 1.2,
        "petroleum": 5.0
        }, {
        "state": "UT",
        "value": 40.7,
        "area": "MTN",
        "gas": 10.5,
        "renewable": 5.2,
        "petroleum": 25.0
        }, {
        "state": "VT",
        "value": 3.7,
        "area": "NEW",
        "gas": 1.5,
        "renewable": 1.2,
        "petroleum": 1.0
        }, {
        "state": "WY",
        "value": 70.7,
        "area": "MTN",
        "gas": 30.5,
        "renewable": 10.2,
        "petroleum": 30.0
        }, {
        "state": "NJ",
        "value": 18.7,
        "area": "MAT",
        "gas": 3.5,
        "renewable": 10.2,
        "petroleum": 5.0
        }, {
        "state": "NE",
        "value": 40.7,
        "area": "WNC",
        "gas": 30.5,
        "renewable": 5.0,
        "petroleum": 5.2
        }, {
        "state": "NC",
        "value": 15.7,
        "area": "SAT",
        "gas": 4.5,
        "renewable": 1.2,
        "petroleum": 10.0
        }, {
        "state": "KS",
        "value": 3.7,
        "area": "WNC",
        "gas": 3.5,
        "renewable": 0,
        "petroleum": 0.2
        }, {
        "state": "MO",
        "value": 71.7,
        "area": "WNC",
        "gas": 30.5,
        "renewable": 1.2,
        "petroleum": 40.0
        }, {
        "state": "AL",
        "value": 15.7,
        "area": "ESC",
        "gas": 5.5,
        "renewable": 1.2,
        "petroleum": 9.0
        }, {
        "state": "AZ",
        "value": 40.7,
        "area": "MTN",
        "gas": 30.5,
        "renewable": 5.0,
        "petroleum": 5.2
        }, {
        "state": "MD",
        "value": 15.7,
        "area": "SAT",
        "gas": 4.5,
        "renewable": 1.2,
        "petroleum": 10.0
        }, {
        "state": "HI",
        "value": 3.7,
        "area": "PCN",
        "gas": 3.5,
        "renewable": 0,
        "petroleum": 0.2
        }, {
        "state": "IN",
        "value": 71.7,
        "area": "ENC",
        "gas": 30.5,
        "renewable": 1.2,
        "petroleum": 40.0
        }, {
        "state": "ME",
        "value": 15.7,
        "area": "NEW",
        "gas": 5.5,
        "renewable": 1.2,
        "petroleum": 9.0
        }, {
        "state": "MA",
        "value": 40.7,
        "area": "NEW",
        "gas": 30.5,
        "renewable": 5.0,
        "petroleum": 5.2
        }, {
        "state": "MS",
        "value": 15.7,
        "area": "ESC",
        "gas": 4.5,
        "renewable": 1.2,
        "petroleum": 10.0
        }, {
        "state": "NH",
        "value": 3.7,
        "area": "NEW",
        "gas": 3.5,
        "renewable": 0,
        "petroleum": 0.2
        }, {
        "state": "NM",
        "value": 21.7,
        "area": "MTN",
        "gas": 10.5,
        "renewable": 1.2,
        "petroleum": 10.0
    }, {
        "state": "OH",
        "value": 51.7,
        "area": "ENC",
        "gas": 20.5,
        "renewable": 1.2,
        "petroleum": 30.0
    }, {
        "state": "WV",
        "value": 21.7,
        "area": "SAT",
        "gas": 10.5,
        "renewable": 1.2,
        "petroleum": 10.0
    }, {
        "state": "IA",
        "value": 21.7,
        "area": "WNC",
        "gas": 10.5,
        "renewable": 1.2,
        "petroleum": 10.0
    }
    ]
};

/* location data */
var state_id = ["", "AL", "AK", "", "AZ", "AR", "CA", "", "CO", "CT", "DE", "DC", "FL", "GA", "", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "", "WA", "WV", "WI", "WY"];

/* layouts */
var path = d3.geo.path();
var force = d3.layout.force()
    .size([bubbles_diameter, bubbles_diameter])
    .gravity(gravity)
    //.charge(charge)
    //.friction(friction)
    .alpha(alpha)
    .linkStrength(linkStrength);
var pack = d3.layout.pack()
    .sort(null)
    .size([bubbles_diameter, bubbles_diameter])
    .padding(bubble_padding);

/* Functions */
function flatten_pack(root) {
    var flat = [];
    function recurse(name, pt) {
        if (pt.slice) pt.children.forEach(function(obj) { 
            recurse(pt.state, obj); });
        else {
            flat.push({state: pt.state, value: pt.value, area: pt.area});
        }
    }
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

/* DATA */
// putting things together for nodes
var nodes = data.children; // (area, state, value, **fuels)
var pack_info = pack.nodes(flatten_pack(data))
                    .filter(function(d) { return !d.children });
nodes = merge_pack_data(nodes, pack_info); //  (r, x_pack, y_pack)


// datafile at http://bl.ocks.org/mbostock/raw/4090846/us.json
d3.json("data/us_states.json", function(err, us) {
    if (err) throw error;

    // handoff to global variables
    var TJSON = us,
        GJSON = topojson.feature(us, us.objects.states);
        

    // local variables
    var pt = [],    // array of centroids and related data
        links = []; // array of voronoi links

    console.log(TJSON);

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

    // circles
    var circles = svg.selectAll("g") //g
        .data(nodes)
        .enter()
        .append("g")
        .attr("transform", function(d) {
            return "translate(" + -d.x + "," + -d.y + ")";
        })
        .append("circle")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        // // this is not needed to init position here
        // // the standard init does NOT retrieve .x, .y
        // // (because if I don't have collide calling .x .y it fails)
        // // luckily collide() in tick() calls .x .y
        // .attr("cx", function(d) {return d.x;})
        // .attr("cy", function(d) {return d.y;})
        .attr("r", function(d) {return d.r;})
        .attr("fill", function(d) { return color(d.area); })
        .call(force.drag); // lets you change the orientation

    // title text
    circles.append("title")
        .text(function(d) { return d.state + ": " + format(d.value) + " GWh"; });

    // // text // doesn't work :/ porque?
    // circles.append("text")
    //     .attr("dy", ".3em")
    //     //.style("text-anchor", "middle")
    //     .text(function(d) { return d.state.substring(0, d.r / 3); });

    // circle tick function
    function tick(e) {
        circles
            .each(collide(collision_alpha))
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    }

    // on("tick") has to be placed down here, not up there
    // because else the function runs asynchronously
    // enters an undefined 'node' as the function
    // and is sad and won't run.
    // ALSO I can't figure out how to move tick to accept 'circles'
    // as a function argument so it's going to be a local function qq
    force.nodes(nodes)
        .on("tick", tick)
        .start();
    
});