// global variables defined elsewhere in d3.js
var π = Math.PI,

function svgchord (source, target, radius, startAngle, endAngle) {
    // var source = d3_source,
    //     target = d3_target,
    //     radius = d3_svg_chordRadius,
    //     startAngle = d3_svg_arcStartAngle,
    //     endAngle = d3_svg_arcEndAngle;

    function chord(d, i) {
        
        console.log("chord data test");
        console.log(d, i);
        var s = subgroup(this, source, d, i),
            t = subgroup(this, target, d, i);
        // return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0)
        //     + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0)
        //     + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0))
        //     + "Z";
        return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) 
            //+ (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) 
            //+ arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) 
            + "Z";
    }

    function subgroup(self, f, d, i) {
        var subgroup = f.call(self, d, i),
            r = radius.call(self, subgroup, i),
            a0 = startAngle.call(self, subgroup, i) - halfπ,
            a1 = endAngle.call(self, subgroup, i) - halfπ;
            console.log(subgroup);
        return {
            r: r,
            a0: a0,
            a1: a1,
            p0: [r * Math.cos(a0), r * Math.sin(a0)],
            p1: [r * Math.cos(a1), r * Math.sin(a1)]
        };
    }
    
    function subgroup2(self, f, d, i) {
        console.log(d);
        return {};
    }

    // function to help chord() decide which kind it is, curve(source) or curve(target)
    function equals(a, b) {
        return a.a0 == b.a0 && a.a1 == b.a1;
    }

    // drawing circular arcs: radius, final point, 
    function arc(r, p, a) {
        // rx,ry = r --> circular arc
        // x-axis-rotation = 0 --> no rotation
        // large-arc-flag = +(a > π) --> ??
        // sweep-flag = 1 --> always 
        // p = final point!!
        return "A" + r + "," + r + " 0 " + +(a > π) + ",1 " + p;
    }

    // drawing bezier curves
    function curve(r0, p0, r1, p1) {
        return "Q 0,0 " + p1;
    }
    
    
    chord.radius = function(v) {
        if (!arguments.length) return radius;
        radius = d3_functor(v);
        return chord;
    };
    chord.source = function(v) {
        if (!arguments.length) return source;
        source = d3_functor(v);
        return chord;
    };
    chord.target = function(v) {
        if (!arguments.length) return target;
        target = d3_functor(v);
        return chord;
    };
    chord.startAngle = function(v) {
        if (!arguments.length) return startAngle;
        startAngle = d3_functor(v);
        return chord;
    };
    chord.endAngle = function(v) {
        if (!arguments.length) return endAngle;
        endAngle = d3_functor(v);
        return chord;
    };
    return chord;
};

function d3_svg_chordRadius(d) {
    return d.radius;
}

d3.svg.chord = svgchord;
//svgchord.apply(d3);