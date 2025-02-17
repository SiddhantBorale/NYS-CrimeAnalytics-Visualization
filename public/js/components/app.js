
document.addEventListener('DOMContentLoaded', () => {
    const appState = {highlightedCounties: {}}

    const eventDispatcher = d3.dispatch("highlightUpdated", "chartUpdated");

    d3.json("data/areachart_analysis.json").then((areaChartData) => {
        d3.json("data/barchart_analysis.json").then((barChartData) => {
            d3.json("data/mds_attributes_results.json").then((mdsData) => {
                populateDropdowns(areaChartData);

                // initialize chart
                areaChart("1990", "All Counties", areaChartData, appState, eventDispatcher);
                barChart('1990', "Employed", barChartData, appState, eventDispatcher);
                mdsAttrChart(mdsData);
                parallelCoordinatesChart('1990', appState, eventDispatcher);
            });
        });
    });

    // Populate dropdown menus for area chart
    function populateDropdowns(areaChartData) {
        const years = Object.keys(areaChartData).sort((a, b) => a - b);

        const yearSelect = d3.select("#year-select");
        yearSelect.selectAll("option")
            .data(years)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        const counties = areaChartData[years[0]].map(d => d["County"]);
        const countySelect = d3.select("#county-select");
        countySelect.selectAll("option")
            .data(["All Counties", ...counties])
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);
    }

    d3.select("#county-select").on("change", function () {
        updateAllCharts();
    });
    d3.select("#year-select").on("change", function () {
        updateAllCharts();
    });
    d3.select("#variable-select").on("change", function () {
        updateAllCharts();
    });

    function updateAllCharts() {
        const selectedYear = d3.select("#year-select").property("value");
        const selectedCounty = d3.select("#county-select").property("value");
        const barAttribute = d3.select("#variable-select").property("value");

        d3.json("data/areachart_analysis.json").then((areaChartData) => {
            areaChart(selectedYear, selectedCounty, areaChartData, appState, eventDispatcher);
        });

        d3.json("data/barchart_analysis.json").then((barChartData) => {
            barChart(selectedYear, barAttribute, barChartData, appState, eventDispatcher);
        });

        d3.json("data/mds_attributes_analysis.json").then((mdsData) => {
            mdsAttrChart(mdsData); 
        });
        parallelCoordinatesChart(selectedYear, appState, eventDispatcher);
    }

    eventDispatcher.on("highlightUpdated", (updatedHighlightedCounties) => {
        appState.highlightedCounties = updatedHighlightedCounties;
        updateAllCharts();
    });

    // code for area chart
    function areaChart(year = '1990', selectedCounty = 'All Counties', areaChartData, appState, eventDispatcher) {
        const container = document.getElementById("area-chart");
        if (!container) {
            console.error("Container with ID 'area-chart' not found.");
            return;
        }
    
        const margin = { top: 30, right: 30, bottom: 100, left: 80 };
        const containerWidth = 600;
        const containerHeight = 300;
    
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;
    
        // create svg container
        d3.select("#area-chart").select("svg").remove();
        const svg = d3.select("#area-chart")
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
        const attributes = [
            "Employed", "Unemployed", "Crime Index Total", "Violent Total", "Property Total",
            "Burglary", "Larceny", "Motor Vehicle Theft"
        ];
    
        let counties;
        if (selectedCounty === 'All Counties') {
            counties = areaChartData[year].map(d => d["County"]);
        } else {
            counties = [selectedCounty];
        }
    
        const xScale = d3.scalePoint()
            .domain(attributes)
            .range([0, width])
            .padding(0.0);
    
        const yScale = d3.scaleLinear()
            .domain([0, 1]) 
            .nice()
            .range([height, 0]);
    
        svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

    
        svg.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(yScale));
    
        const areaGenerator = d3.area()
            .x((d, i) => xScale(attributes[i]))
            .y0(height)
            .y1(d => yScale(d.value));
    
        // create areas for each county
        counties.forEach((county) => {
            const countyData = attributes.map(attr => {
                const countyRecord = areaChartData[year].find(d => d["County"] === county);
                return { attribute: attr, value: countyRecord ? +countyRecord[attr] : 0 };
            });
    
            svg.append("path")
                .datum(countyData)
                .attr("fill", appState.highlightedCounties[county] ? appState.highlightedCounties[county] : 'steelblue')
                .attr("stroke", "#333")
                .attr("stroke-width", 1)
                .attr("d", areaGenerator)
                .attr("opacity", 0.5)
                .on("click", function () {
                    if (!appState.highlightedCounties[county]) {
                        const newColor = d3.schemeSet2[Object.keys(appState.highlightedCounties).length % d3.schemeCategory10.length];
                        appState.highlightedCounties[county] = newColor;
                        d3.select(this).attr("fill", newColor);
                    } else {
                        delete appState.highlightedCounties[county];
                        d3.select(this).attr("fill", 'steelblue');
                    }
                        eventDispatcher.call("highlightUpdated", this, appState.highlightedCounties);
                });
        });
    }
    
    // code for bar chart
    function barChart(year, attribute, data, state, dispatcher) {

        const container = document.getElementById("barchart-chart");
        if (!container) {
            console.error("Container with ID 'barchart-chart' not found.");
            return;
        }

        const margin = { top: 30, right: 30, bottom: 100, left: 80 };
        const containerWidth = 600;
        const containerHeight = 300;

        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        // create svg container
        let svg = d3.select("#barchart-chart").select("svg");
        if (svg.empty()) {
            svg = d3.select("#barchart-chart")
                .append("svg")
                .attr("width", containerWidth)
                .attr("height", containerHeight)
                .append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);
        } else {
            svg = svg.select("g");
        }

        const colorScale = d3.scaleOrdinal(d3.schemeSet2);

        const filteredData = data[year];

        const values = filteredData.map(d => {
            const value = +d[attribute];
            return isNaN(value) ? 0 : value;
        });

        const xScale = d3.scaleBand()
            .domain(filteredData.map(d => d["County"]))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(values)])
            .nice()
            .range([height, 0]);

        svg.selectAll(".axis").remove();

        svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(yScale));

        const bars = svg.selectAll(".bar")
            .data(filteredData, d => d["County"]);

        // create bars
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d["County"]))
            .attr("y", d => yScale(isNaN(+d[attribute]) ? 0 : +d[attribute]))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(isNaN(+d[attribute]) ? 0 : +d[attribute]))
            .attr("fill", d => state.highlightedCounties[d["County"]] ? state.highlightedCounties[d["County"]] : "steelblue")


        // update existing bars
        bars.transition()
            .duration(500)
            .attr("x", d => xScale(d["County"]))
            .attr("y", d => yScale(isNaN(+d[attribute]) ? 0 : +d[attribute]))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(isNaN(+d[attribute]) ? 0 : +d[attribute]))
            .attr("fill", d => state.highlightedCounties[d["County"]] ? state.highlightedCounties[d["County"]] : "steelblue");

        // remove old bars
        bars.exit().remove();
    }

    // code for mds attr chart
    function mdsAttrChart(data) {
        const coordinates = data.coordinates;
        const columns = data.columns;
    
        const margin = { top: 0, right: 30, bottom: 30, left: 30 };
        const width = 600;
        const height = 300;
        const padding = 70;
    
        const colors = d3.schemeCategory10;
    
        // set x axis scale
        const xMDS = d3.scaleLinear()
            .domain(d3.extent(coordinates, (d) => d[0]))
            .range([padding, width - 150]);
    
        // set y axis scale
        const yMDS = d3.scaleLinear()
            .domain(d3.extent(coordinates, (d) => d[1]))
            .range([height - padding, 50]);
    
        // create SVG container
        const svgContainer = d3.select("#mds-attr-chart");
        let svg = svgContainer.select("svg");
    
        if (svg.empty()) {
            svg = svgContainer
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);
        } else {
            svg = svg.select("g");
        }
    
        svg.selectAll("*").remove();
    
        // draw the points
        svg
            .selectAll("circle")
            .data(coordinates)
            .enter()
            .append("circle")
            .attr("cx", (d) => xMDS(d[0]))
            .attr("cy", (d) => yMDS(d[1]))
            .attr("r", 5)
            .style("fill", "none")
            .style("stroke-width", "2px")
            .style("stroke", (d, i) => colors[i % colors.length])
            .style("opacity", 1);
    
        // add labels 
        svg
            .selectAll("text")
            .data(coordinates)
            .enter()
            .append("text")
            .attr("x", (d) => xMDS(d[0]) + 10)
            .attr("y", (d) => yMDS(d[1]))
            .text((d, i) => columns[i])
            .style("font-size", "12px")
            .style("fill", "black")
            .attr("transform", `translate(0, -10)`);
    
        // add dimension 1
        svg.append("g")
            .attr("transform", `translate(0, ${height - padding})`)
            .call(d3.axisBottom(xMDS).tickFormat(d3.format(".2f")));
    
        // add dimension 2
        svg.append("g")
            .attr("transform", `translate(${padding}, 0)`)
            .call(d3.axisLeft(yMDS).tickFormat(d3.format(".2f")));
    
        // add labels
        svg.append("text")
            .attr("x", width / 2 - 100)
            .attr("y", height - padding / 3)
            .style("text-anchor", "middle")
            .text("MDS Dimension 1");
    
        svg.append("text")
            .attr("x", -height / 2)
            .attr("y", padding / 4 - 5)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text("MDS Dimension 2");
    
        // legend
        const legend = svg
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 140}, ${padding +40})`);
    
        // draw out the legend
        columns.forEach((col, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 16})`);
    
            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", colors[i % colors.length]);
    
            legendRow.append("text")
                .attr("x", 20)
                .attr("y", 10)
                .style("text-anchor", "start")
                .style("font-size", "8px")
                .text(col);
        });
    }
    
    // code for parallel coordinates chat
    function parallelCoordinatesChart(year, state, dispatcher) {
        d3.json("data/parallel_coordinates_analysis.json").then(function (data) {
            const allColumns = Object.keys(data[0]);
            const numericalColumns = allColumns.filter((col) => typeof data[0][col] === "number" && col !== "Year");
            const categoricalColumns = allColumns.filter((col) => typeof data[0][col] === "string" && col !== "Year");
    
            const width = 700;
            const height = 300;
            const margin = { top: 100, right: 100, bottom: 50, left: 0 };
    
            // create SVG container
            const svgContainer = d3.select("#parallel-coordinates-chart");
            let svg = svgContainer.select("svg");
    
            if (svg.empty()) {
                svg = svgContainer
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);
            } else {
                svg = svg.select("g");
            }
    
            const parallelWidth = width - margin.left - margin.right;
            const parallelHeight = height - margin.top - margin.bottom;
    
            const dimensions = [...numericalColumns, ...categoricalColumns];
    
            const xScale = d3.scalePoint()
                .domain(dimensions)
                .range([0, parallelWidth])
                .padding(1);
    
            const yScales = {};
            dimensions.forEach((col) => {
                if (numericalColumns.includes(col)) {
                    yScales[col] = d3.scaleLinear()
                        .domain([0, 1])
                        .range([parallelHeight, 0]);
                } else {
                    const categories = Array.from(new Set(data.map((d) => d[col])));
                    yScales[col] = d3.scalePoint()
                        .domain(categories)
                        .range([parallelHeight, 0]);
                }
            });
    
            // create path function for each line
            function path(d) {
                return d3.line()(dimensions.map((p) => [xScale(p), yScales[p](d[p])]));
            }
    
            function updateParallelCoordinates(selectedYear) {
                let filteredData = selectedYear === "All Years" ? data : data.filter(d => d.Year === +selectedYear);
    
                svg.selectAll("*").remove();
    
                // plot the lines 
                svg.selectAll("path")
                    .data(filteredData)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .attr("fill", "none")
                    .style("stroke", (d) => {
                        return state.highlightedCounties[d.County] ? state.highlightedCounties[d.County] : "steelblue";
                    })
                    .attr("stroke-width", 1.5)
                    .attr("opacity", (d) => {
                        return state.highlightedCounties[d.County] ? 1.0 : 0.2;
                    });
    
                // add axes for each attribute
                dimensions.forEach((dim) => {
                    svg.append("g")
                        .attr("class", "axis axis--x")
                        .attr("transform", `translate(${xScale(dim)})`)
                        .each(function () {
                            d3.select(this)
                                .call(d3.axisLeft(yScales[dim])
                                    .tickFormat((d) => {
                                        return typeof d === "string" ? d.slice(0, 2) : d; 
                                    })
                                )
                                .selectAll("text")
                                .style("text-anchor", "start") 
                                .attr("x", 6); 
                        })
                        .append("text")
                        .style("text-anchor", "start")
                        .attr("y", -9)
                        .text(dim)
                        .attr("transform", "rotate(-45)");

                });
            }
            updateParallelCoordinates(year);
        });
    }
    
});
