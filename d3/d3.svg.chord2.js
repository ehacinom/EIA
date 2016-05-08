d3.svg.chord2 = function() {
    var source = d3.d3_source,
        target = d3.d3_target,
        radius = d3.d3_svg_chord2Radius,
        startAngle = d3.d3_svg_arcStartAngle,
        endAngle = d3.d3_svg_arcEndAngle;

    function chord2(d, i) {
        var s = subgroup(this, source, d, i),
            t = subgroup(this, target, d, i);
        return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) + "Z";
    }

    function subgroup(self, f, d, i) {
        var subgroup = f.call(self, d, i),
            r = radius.call(self, subgroup, i),
            a0 = startAngle.call(self, subgroup, i) - halfπ,
            a1 = endAngle.call(self, subgroup, i) - halfπ;
        return {
            r: r,
            a0: a0,
            a1: a1,
            p0: [r * Math.cos(a0), r * Math.sin(a0)],
            p1: [r * Math.cos(a1), r * Math.sin(a1)]
        };
    }

    function equals(a, b) {
        return a.a0 == b.a0 && a.a1 == b.a1;
    }

    function arc(r, p, a) {
        return "A" + r + "," + r + " 0 " + +(a > π) + ",1 " + p;
    }

    function curve(r0, p0, r1, p1) {
        return "Q 0,0 " + p1;
    }
    chord2.radius = function(v) {
        if (!arguments.length) return radius;
        radius = d3.functor(v);
        return chord2;
    };
    chord2.source = function(v) {
        if (!arguments.length) return source;
        source = d3.functor(v);
        return chord2;
    };
    chord2.target = function(v) {
        if (!arguments.length) return target;
        target = d3.functor(v);
        return chord2;
    };
    chord2.startAngle = function(v) {
        if (!arguments.length) return startAngle;
        startAngle = d3.functor(v);
        return chord2;
    };
    chord2.endAngle = function(v) {
        if (!arguments.length) return endAngle;
        endAngle = d3.functor(v);
        return chord2;
    };
    return chord2;
};

function d3_svg_chord2Radius(d) {
    return d.radius;
}