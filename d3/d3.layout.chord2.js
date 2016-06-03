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

function layoutchord () {
    var chord = {}, // each chord
        chords,     // chords data using source/target
        groups,     // groups/arcs
        matrix, source, target,
        ns, nt,     // length of matrix source/target
        padding = 0,// why is padding 0??
        sortGroups, sortSubgroups, sortChords; // temporarily removed all of Chord sorting

    function relayout() {
        var subgroups = {}, // {index, subindex, startAngle, endAngle, value, }
            groupSums = [],
            groupIndex = d3.range(ns),
            subgroupIndex = [],   // making this into targets' looper
            k, x, x0, i, j; 
        chords = [];
        groups = [];
        
        // loop over arcs, the chord sources, to sum data points
        // k is total of data; x is total of each arc
        k = 0, i = -1;
        while (++i < ns) {
            x = 0, j = -1;
            
            // loop over bubble data, the chord targets
            while (++j < nt) {
                x += matrix[i][j];
            }
            
            groupSums.push(x); // store sum of each group/arc, which determines size of arc
            subgroupIndex.push(d3.range(nt)); // This changes how many targets you're looking at
            k += x;
        }
        
        // sort groups / arcs
        if (sortGroups) {
            groupIndex.sort(function(a, b) {
                return sortGroups(groupSums[a], groupSums[b]);
            });
        }
        
        // sort subgroups / targets
        if (sortSubgroups) {
            subgroupIndex.forEach(function(d, i) {
                d.sort(function(a, b) {
                    return sortSubgroups(matrix[i][a], matrix[i][b]);
                });
            });
        }
        
        // k is radians per total of data (in our case 1 MWhr)
        k = (τ - padding * ns) / k; 
        
        ////////
        // aggregates data
        // defines subgroups, groups
        
        // loop to create arrays of data obj: subgroups, groups 
        x = 0, i = -1; // x is how many radians we have progressed
        while (++i < ns) {
            
            // loop over bubbles, the chord targets
            // create subgroups[ns-nt] data
            x0 = x, j = -1;
            while (++j < nt) {
                var di = groupIndex[i],
                    dj = subgroupIndex[di][j],
                    v = matrix[di][dj],
                    a0 = x,
                    a1 = x += v * k;
                // define sub groups / arcs
                subgroups[di + "-" + dj] = {
                    index: di,
                    subindex: dj,
                    startAngle: a0,
                    endAngle: a1,
                    value: v
                };
                
                // define chords the new way! in here!
                var s = subgroups[di + "-" + dj];
                var t = target[dj];
                console.log(t, dj);
            }
            // define groups / arcs
            groups[di] = {
                index: di,
                startAngle: x0,
                endAngle: x,
                value: groupSums[di]
            };
            x += padding;
        }
        
        console.log("sources and targets in chord layout");
        console.log(matrix);
        console.log(source);
        console.log(target);
        console.log(subgroups);
        
        /////////
        // defines chords the old way, we define it in additions to above 
        // loops over arcs/sources and some bubbles/targets
        // i = -1;
        // while (++i < ns) {
        //     j = i - 1;
        //     while (++j < nt) {
        //         var source = subgroups[i + "-" + j],
        //             target = subgroups[j + "-" + i];
        //         if (source.value || target.value) {
        //             chords.push(source.value < target.value ? {
        //                 source: target,
        //                 target: source
        //             } : {
        //                 source: source,
        //                 target: target
        //             });
        //         }
        //     }
        // }
        
        // // sort chords
        // if (sortChords) resort();
    }

    // // sort chords at end of relayout if sortChords is a thing
    // // sort function returns
    // function resort() {
    //     chords.sort(function(a, b) {
    //         return sortChords((a.source.value + a.target.value) / 2,
    //             (b.source.value + b.target.value) / 2);
    //     });
    // }
    
    // init data
    chord.matrix = function(x) {
        if (!arguments.length) return matrix;
        ns = (matrix = x) && matrix.length;
        nt = matrix[0].length;
        chords = groups = null;
        return chord;
    };
    
    // init data
    chord.source = function(x) {
        if (!arguments.length) return source;
        if (!matrix) return 0; // must call after matrix
        if (arguments[0].length != ns) return 0; // wrong length of source argments!
        source = x;
        chords = groups = null;
        return chord;
    };
    
    // init data
    chord.target = function(x) {
        if (!arguments.length) return target;
        if (!matrix) return 0; // must call after matrix
        if (arguments[0][0].length != nt) return 0; // wrong length of target arguments!
        target = x[0];
        chords = groups = null;
        return chord;
    };
    
    // set padding between arcs in radians
    chord.padding = function(x) {
        if (!arguments.length) return padding;
        padding = x;
        chords = groups = null;
        return chord;
    };
    
    chord.sortGroups = function(x) {
        if (!arguments.length) return sortGroups;
        sortGroups = x;
        chords = groups = null;
        return chord;
    };
    
    chord.sortSubgroups = function(x) {
        if (!arguments.length) return sortSubgroups;
        sortSubgroups = x;
        chords = null;
        return chord;
    };
    
    // chord.sortChords = function(x) {
    //     if (!arguments.length) return sortChords;
    //     sortChords = x;
    //     if (chords) resort();
    //     return chord;
    // };
    
    chord.chords = function() {
        if (!chords) relayout();
        return chords;
    };
    
    chord.groups = function() {
        if (!groups) relayout();
        return groups;
    };
    
    return chord;
};

d3.layout.chord = layoutchord;
//layoutchord.apply(d3)