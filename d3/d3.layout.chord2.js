// var ε = 1e-6,
//     ε2 = ε * ε,
//     π = Math.PI,
//     τ = 2 * π,
//     τε = τ - ε,
//     halfπ = π / 2,
//     d3_radians = π / 180,
//     d3_degrees = 180 / π;

// global variables defined elsewhere in d3.js
var π = Math.PI,
    τ = 2 * π;


d3.layout.chord2 = function() {
    var chord2 = {},
        chord2s, groups, matrix, n, padding = 0,
        sortGroups, sortSubgroups, sortChords;

    function relayout() {
        var subgroups = {},
            groupSums = [],
            groupIndex = d3.range(n),
            subgroupIndex = [],
            k, x, x0, i, j;
        chord2s = [];
        groups = [];
        k = 0, i = -1;
        while (++i < n) {
            x = 0, j = -1;
            while (++j < n) {
                x += matrix[i][j];
            }
            groupSums.push(x);
            subgroupIndex.push(d3.range(n));
            k += x;
        }
        if (sortGroups) {
            groupIndex.sort(function(a, b) {
                return sortGroups(groupSums[a], groupSums[b]);
            });
        }
        if (sortSubgroups) {
            subgroupIndex.forEach(function(d, i) {
                d.sort(function(a, b) {
                    return sortSubgroups(matrix[i][a], matrix[i][b]);
                });
            });
        }
        k = (τ - padding * n) / k;
        x = 0, i = -1;
        while (++i < n) {
            x0 = x, j = -1;
            while (++j < n) {
                var di = groupIndex[i],
                    dj = subgroupIndex[di][j],
                    v = matrix[di][dj],
                    a0 = x,
                    a1 = x += v * k;
                subgroups[di + "-" + dj] = {
                    index: di,
                    subindex: dj,
                    startAngle: a0,
                    endAngle: a1,
                    value: v
                };
            }
            groups[di] = {
                index: di,
                startAngle: x0,
                endAngle: x,
                value: groupSums[di]
            };
            x += padding;
        }
        i = -1;
        while (++i < n) {
            j = i - 1;
            while (++j < n) {
                var source = subgroups[i + "-" + j],
                    target = subgroups[j + "-" + i];
                if (source.value || target.value) {
                    chord2s.push(source.value < target.value ? {
                        source: target,
                        target: source
                    } : {
                        source: source,
                        target: target
                    });
                }
            }
        }
        if (sortChords) resort();
    }

    function resort() {
        chord2s.sort(function(a, b) {
            return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
        });
    }
    chord2.matrix = function(x) {
        if (!arguments.length) return matrix;
        n = (matrix = x) && matrix.length;
        chord2s = groups = null;
        return chord2;
    };
    chord2.padding = function(x) {
        if (!arguments.length) return padding;
        padding = x;
        chord2s = groups = null;
        return chord2;
    };
    chord2.sortGroups = function(x) {
        if (!arguments.length) return sortGroups;
        sortGroups = x;
        chord2s = groups = null;
        return chord2;
    };
    chord2.sortSubgroups = function(x) {
        if (!arguments.length) return sortSubgroups;
        sortSubgroups = x;
        chord2s = null;
        return chord2;
    };
    chord2.sortChords = function(x) {
        if (!arguments.length) return sortChords;
        sortChords = x;
        if (chord2s) resort();
        return chord2;
    };
    chord2.chord2s = function() {
        if (!chord2s) relayout();
        return chord2s;
    };
    chord2.groups = function() {
        if (!groups) relayout();
        return groups;
    };
    return chord2;
};