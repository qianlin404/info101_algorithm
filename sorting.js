function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function lineChartSorting(filename) {
    d3.csv(filename, function (d) {
        return {"size": parseInt(d.size),
                "quickSort": parseFloat(d.quick_sort),
                "bubbleSort": parseFloat(d.bubble_sort)};
    }).then(function (data) {
        var margin = {top: 40, right: 20, bottom: 70, left: 40},
        width = 600 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

        var x = d3.scaleLinear().rangeRound([0, width]);
        var y = d3.scaleLinear().rangeRound([height, 0]);

        var color = d3.scaleOrdinal(d3.schemeCategory10);
        color.domain(d3.keys(data[0]).filter(function (key) {
            return key !== "size";
        }));


        var xAxis = d3.axisBottom(x);
        var yAxis = d3.axisLeft(y);

        var line = d3.line()
            .x(function (d) {
                return x(d.size);
            })
            .y(function (d) {
                return y(d.timeCost)
            });

        const y_max = d3.max(data.map(function (d) {
            return d.bubbleSort
        }));

        x.domain(d3.extent(data, function (d) {
            return d.size;
        }));
        y.domain([0, y_max]);



        var timeCost = color.domain().map(function (name) {
            return {
                "name": name,
                "values": data.map(function (d) {
                    return {
                        "size": d.size,
                        "timeCost": d[name]
                    };
                })
            };
        });

        // var div = d3.select("body").append("div")
        //     .attr("class", "tooltip")
        //     .style("opacity", 0);

        var svg = d3.select("[name=sortTime]")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        var legend = svg.selectAll("g")
            .data(timeCost)
            .enter()
            .append("g")
            .attr("class", "legend");

        legend.append("rect")
            .attr("x", 40)
            .attr("y", function (d, i) {
                return i * 20;
            })
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function (d) {
                return color(d.name);
            });

        legend.append('text')
            .attr('x', 52)
            .attr('y', function(d, i) {
                return (i * 20) + 9;
            })
            .text(function(d) {
                return d.name;
            });


        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 )
            .attr("x",0 - (height / 5))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Time Cost (ms)");

        svg.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (width/2) +","+ (height + margin.bottom/2) +")")  // centre below axis
            .text("Array Size");

        svg.append("text")
            .attr("x", (width/2))
            .attr("y", -(margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Array Size VS. Sorting Time Cost");

        var figure = svg.selectAll(".timeCost")
            .data(timeCost)
            .enter().append("g")
            .attr("class", "timeCost");

        figure.append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", function (d) {
                return line(d.values);
            })
            .style("stroke", function (d) {
                return color(d.name);
            });


        var mouseG = svg.append("g")
            .attr("class", "mouse-over-effects");

        mouseG.append("path") // this is the black vertical line to follow mouse
            .attr("class", "mouse-line-sorting")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        var lines = document.getElementsByClassName('line');

        var mousePerLine = mouseG.selectAll('.mouse-per-line-sorting')
            .data(timeCost)
            .enter()
            .append("g")
            .attr("class", "mouse-per-line-sorting");

        mousePerLine.append("circle")
            .attr("r", 7)
            .style("stroke", function(d) {
                return color(d.name);
            })
            .style("fill", "none")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        mousePerLine.append("text")
            .attr("transform", "translate(10,3)");

        mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
            .attr('width', width) // can't catch mouse events on a g element
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mouseout', function() { // on mouse out hide line, circles and text
                d3.select(".mouse-line-sorting")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line-sorting circle")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line-sorting text")
                    .style("opacity", "0");
            })
            .on('mouseover', function() { // on mouse in show line, circles and text
                d3.select(".mouse-line-sorting")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line-sorting circle")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line-sorting text")
                    .style("opacity", "1");
            })
            .on('mousemove', function() { // mouse moving over canvas
                var mouse = d3.mouse(this);
                d3.select(".mouse-line-sorting")
                    .attr("d", function() {
                        var d = "M" + mouse[0] + "," + height;
                        d += " " + mouse[0] + "," + 0;
                        return d;
                    });

                d3.selectAll(".mouse-per-line-sorting")
                    .attr("transform", function(d, i) {
                        var xDate = x.invert(mouse[0]),
                            bisect = d3.bisector(function(d) { return d.size; }).right;
                        idx = bisect(d.values, xDate);

                        var beginning = 0,
                            end = lines[i].getTotalLength(),
                            target = null;

                        while (true){
                            target = Math.floor((beginning + end) / 2);
                            pos = lines[i].getPointAtLength(target);
                            if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                                break;
                            }
                            if (pos.x > mouse[0])      end = target;
                            else if (pos.x < mouse[0]) beginning = target;
                            else break; //position found
                        }

                        var index = Math.round(x.invert(pos.x) / 100);

                        d3.select(this).select('text')
                            .text(timeCost[i].values[index].timeCost.toFixed(2));

                        return "translate(" + mouse[0] + "," + pos.y +")";
                    });
            });


    })
}


function lineChartSearching(filename) {
    d3.csv(filename, function (d) {
        return {"size": parseInt(d.size),
            "linearSearch": parseFloat(d.linear_time),
            "binarySearch": parseFloat(d.binary_time)};
    }).then(function (data) {
        var margin = {top: 40, right: 20, bottom: 70, left: 40},
            width = 800 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        var x = d3.scaleLinear().rangeRound([0, width]);
        var y = d3.scaleLinear().rangeRound([height, 0]);

        var color = d3.scaleOrdinal(d3.schemeCategory10);
        color.domain(d3.keys(data[0]).filter(function (key) {
            return key !== "size";
        }));


        var xAxis = d3.axisBottom(x);
        var yAxis = d3.axisLeft(y);

        var line = d3.line()
            .x(function (d) {
                return x(d.size);
            })
            .y(function (d) {
                return y(d.timeCost)
            });

        const y_max = d3.max(data.map(function (d) {
            return d.linearSearch
        }));

        x.domain(d3.extent(data, function (d) {
            return d.size;
        }));
        y.domain([0, y_max]);



        var timeCost = color.domain().map(function (name) {
            return {
                "name": name,
                "values": data.map(function (d) {
                    return {
                        "size": d.size,
                        "timeCost": d[name]
                    };
                })
            };
        });

        // var div = d3.select("body").append("div")
        //     .attr("class", "tooltip")
        //     .style("opacity", 0);

        var svg = d3.select("[name=searchTime]")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        var legend = svg.selectAll("g")
            .data(timeCost)
            .enter()
            .append("g")
            .attr("class", "legend");

        legend.append("rect")
            .attr("x", 40)
            .attr("y", function (d, i) {
                return i * 20;
            })
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function (d) {
                return color(d.name);
            });

        legend.append('text')
            .attr('x', 52)
            .attr('y', function(d, i) {
                return (i * 20) + 9;
            })
            .text(function(d) {
                return d.name;
            });


        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 )
            .attr("x",0 - (height / 5))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Time Cost (ms)");

        svg.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (width/2) +","+ (height + margin.bottom/2) +")")  // centre below axis
            .text("Array Size");

        svg.append("text")
            .attr("x", (width/2))
            .attr("y", -(margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Array Size VS. Searching Time Cost");

        var figure = svg.selectAll(".timeCost")
            .data(timeCost)
            .enter().append("g")
            .attr("class", "timeCost");

        figure.append("path")
            .attr("class", "line-search")
            .attr("fill", "none")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", function (d) {
                return line(d.values);
            })
            .style("stroke", function (d) {
                return color(d.name);
            });


        var mouseG = svg.append("g")
            .attr("class", "mouse-over-effects");

        mouseG.append("path") // this is the black vertical line to follow mouse
            .attr("class", "mouse-line-searching")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        var lines = document.getElementsByClassName('line-search');

        var mousePerLine = mouseG.selectAll('.mouse-per-line-searching')
            .data(timeCost)
            .enter()
            .append("g")
            .attr("class", "mouse-per-line-searching");

        mousePerLine.append("circle")
            .attr("r", 7)
            .style("stroke", function(d) {
                return color(d.name);
            })
            .style("fill", "none")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        mousePerLine.append("text")
            .attr("transform", "translate(10,3)");

        mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
            .attr('width', width) // can't catch mouse events on a g element
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mouseout', function() { // on mouse out hide line, circles and text
                d3.select(".mouse-line-searching")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line-searching circle")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line-searching text")
                    .style("opacity", "0");
            })
            .on('mouseover', function() { // on mouse in show line, circles and text
                d3.select(".mouse-line-searching")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line-searching circle")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line-searching text")
                    .style("opacity", "1");
            })
            .on('mousemove', function() { // mouse moving over canvas
                var mouse = d3.mouse(this);
                d3.select(".mouse-line-searching")
                    .attr("d", function() {
                        var d = "M" + mouse[0] + "," + height;
                        d += " " + mouse[0] + "," + 0;
                        return d;
                    });

                d3.selectAll(".mouse-per-line-searching")
                    .attr("transform", function(d, i) {
                        var xDate = x.invert(mouse[0]),
                            bisect = d3.bisector(function(d) { return d.size; }).right;
                        idx = bisect(d.values, xDate);

                        var beginning = 0,
                            end = lines[i].getTotalLength(),
                            target = null;

                        while (true){
                            target = Math.floor((beginning + end) / 2);
                            pos = lines[i].getPointAtLength(target);
                            if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                                break;
                            }
                            if (pos.x > mouse[0])      end = target;
                            else if (pos.x < mouse[0]) beginning = target;
                            else break; //position found
                        }

                        var index = Math.round(x.invert(pos.x) / 10000);
                        d3.select(this).select('text')
                            .text(timeCost[i].values[index].timeCost.toFixed(2));

                        return "translate(" + mouse[0] + "," + pos.y +")";
                    });
            });


    })
}

function barchart(arr, svg=null, title="Sorting", left_index=-1, right_index=-1, pivot_index=-1) {

    x = d3.range(arr.length);
    var color = d3.range(arr.length).map(function (d) {
        return "steelblue";
    });
    color[left_index] = "red";
    color[right_index] = "red";
    color[pivot_index] = "grey";

    var data = x.map(function (d) {
       return {"x": d,
               "y": arr[d]}
    });


    var margin = {top: 40, right: 20, bottom: 70, left: 40},
    width = 600 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

    var x = d3.scaleBand()
        .range([0, width])
        .padding(.05);

    var y = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y);

    var figure_id = title.replace(/\s/g, '');

    if (svg == null){
        svg = d3.select("#" + figure_id);

        if (svg.empty() == true) {
            svg = d3.select("[name=" + figure_id + "]")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("id", figure_id)
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
        }
    }

    svg.selectAll("*").remove();

    x.domain(data.map(function (d) {
        return d.x;
    }));
    y.domain([0, d3.max(data.map(function (d) {
        return d.y;
    }))*1.2]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("g").remove();

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .selectAll("g").remove();

    svg.append("text")
        .attr("x", (width/2))
        .attr("y", -(margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(title);

    if (left_index >= 0 && right_index >= 0) {
        const halfwidth = x.bandwidth() / 2;
        const left_pos_x = x(data[left_index].x) + halfwidth;
        const right_pos_x = x(data[right_index].x) + halfwidth;
        const left_pos_y = y(data[left_index].y);
        const right_pos_y = y(data[right_index].y);

        const points = [
            [left_pos_x, left_pos_y],
            [left_pos_x, 0],
            [right_pos_x, 0],
            [right_pos_x, right_pos_y]
        ];

        var lineGenerator = d3.line();
        var indicator = lineGenerator(points);

        svg.append("g")
            .attr("class", "indicator")
            .attr("fill", "none")
            .attr("text-anchor", "end")
            .append("path")
            .attr("stroke", "currentColor")
            .attr("d", indicator);
    }



    svg.selectAll("bar")
        .data(data)
        .enter().append("rect")
        .style("fill", function (d, i) {
            return color[i];
        })
        .attr("x", function (d) {
            return x(d.x);
        })
        .attr("width", x.bandwidth())
        .attr("y", function (d) {
            return y(d.y);
        })
        .attr("height", function (d) {
            return height - y(d.y);
        });

    return svg;

};


function *swap(arr, i, j, p=-1){
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    yield {"arr": arr,
           "x1": i,
           "x2": j,
           "pivot": p};
}

function *bubbleSort(arr){
    const n = arr.length;

    for (var i = 0; i < n; i++){
        for (var j = 0; j < n - i - 1; j++){
            if (arr[j] > arr[j+1]){
                yield *swap(arr, j, j+1);
            }
        }
    }
}

function *partition(arr, lo, hi){
    const pivot = arr[hi];
    var i = lo - 1;
    for (var j = lo; j < hi; j++){
        if (arr[j] < pivot){
            if (i !== j){
                i = i + 1;
                yield *swap(arr, i, j, hi)
            }
        }
    }

    i = i + 1;
    yield *swap(arr, i, hi);
    return  i
}

function *quickSort_wrap(arr, lo, hi){
    if (lo < hi){
        var p = yield *partition(arr, lo, hi);
        yield *quickSort_wrap(arr, lo, p-1);
        yield *quickSort_wrap(arr, p+1, hi);
    }
};

function *quickSort(arr) {
    yield *quickSort_wrap(arr, 0, arr.length-1);
};


async function visualizeSorting(){
    var button = document.getElementById("run-sorting");
    button.disabled = true;
    button.value = "Running!";
    var n = parseInt(document.getElementById("arraySize").value);

    if (isNaN(n) === true){
        alert("Input " + n + " is not a number!");
        return;
    }

    var data1 = d3.range(n).map(function (d) {
        return Math.random();
    });
    var data2 = data1.slice();

    var svg1 = barchart(data1, null, "Bubble Sorting");
    var svg2 = barchart(data2, null, "Quick Sorting");

    await sleep(2000);

    var bubbleSortGen = bubbleSort(data1);
    var quickSortGen = quickSort(data2);

    var bubbleSortNext = bubbleSortGen.next();
    var quickSortNext = quickSortGen.next();

    while(bubbleSortNext.done === false || quickSortNext.done === false){
        if (bubbleSortNext.done === false) {
            barchart(bubbleSortNext.value.arr, svg1, "Bubble Sorting", bubbleSortNext.value.x1, bubbleSortNext.value.x2);
        } else {
            barchart(data1, svg1, "Bubble Sorting");
        }

        if (quickSortNext.done === false) {
            barchart(quickSortNext.value.arr, svg2, "Quick Sorting",
                quickSortNext.value.x1, quickSortNext.value.x2, quickSortNext.value.pivot);
        } else {
            barchart(data2, svg2, "Quick Sorting");
        }

        bubbleSortNext = bubbleSortGen.next();
        quickSortNext = quickSortGen.next();

        await sleep(1000);
    }

    barchart(data1, svg=svg1, title="Bubble Sorting");
    barchart(data2, svg=svg2, title="Quick Sorting");

    button.value = "Go!";
    button.disabled = false;
}


