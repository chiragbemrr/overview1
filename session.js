async function createLineGraphWithSlider(dataUrl, pollutant) {
    try {
        // Fetch data
        const response = await fetch(dataUrl);
        const rawData = await response.json();

        if (!rawData || rawData.length === 0) {
            console.error("No data available.");
            return;
        }

        // Extract metadata
        const startTime = rawData[0].time;
        const endTime = rawData[rawData.length - 1].time;
        const currentValue = pollutant === "CO2"
            ? rawData[rawData.length - 1].CO2
            : rawData[rawData.length - 1].CO;

        // Update metadata in UI
        S_time.text(formatDateTime(startTime));
        E_time.text(formatDateTime(endTime));
        Curr_value.text(Number(currentValue).toFixed(2));

        // Parse and process data
        const parsedData = rawData.map(d => ({
            date: parseISTToGMT(d.time),
            originalTime: d.time,
            emission: pollutant === "CO2" ? +d.CO2 : +d.CO
        }));

        // Calculate statistics
        const avgEmission = parsedData.reduce((sum, d) => sum + d.emission, 0) / parsedData.length;
        const minEmission = Math.min(...parsedData.map(d => d.emission));
        const maxEmission = Math.max(...parsedData.map(d => d.emission));

        Max_value.text(Number(maxEmission).toFixed(2));
        Min_value.text(Number(minEmission).toFixed(2));
        Avg_value.text(Number(avgEmission).toFixed(2));

        // Clear existing chart elements
        svg_mm.selectAll("*").remove();

        // Define scales
        const xScale = d3.scaleTime().range([0, width1]);
        const yScale = d3.scaleLinear().range([height11, 0]);

        // Define axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M:%S"));
        const yAxis = d3.axisLeft(yScale);

        // Append axes
        const xAxisGroup = svg_mm.append("g").attr("transform", `translate(0,${height11})`);
        const yAxisGroup = svg_mm.append("g");

        // Add labels
        svg_mm.append("text")
            .attr("transform", `translate(${width1 / 2},${height11 + margin1.bottom - 20})`)
            .style("text-anchor", "middle")
            .text("Timestamp");

        svg_mm.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin1.left + 20)
            .attr("x", -height11 / 2)
            .style("text-anchor", "middle")
            .text("Emission (PPM)");

        // Line generator
        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.emission));

        const path = svg_mm.append("path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2);

        // Update chart function
        const pointsPerSegment = 40;
        function updateChart(startIndex) {
            const visibleData = parsedData.slice(startIndex, startIndex + pointsPerSegment);

            if (visibleData.length === 0) return;

            // Update scales
            xScale.domain(d3.extent(visibleData, d => d.date));
            yScale.domain([0, d3.max(visibleData, d => d.emission)]);

            // Update axes
            xAxisGroup.call(xAxis);
            yAxisGroup.call(yAxis);

            // Update line
            path.datum(visibleData).attr("d", line);

            // Update circles for points
            svg_mm.selectAll(".circle").remove();
            svg_mm.selectAll(".circle")
                .data(visibleData)
                .enter().append("circle")
                .attr("class", "circle")
                .attr("cx", d => xScale(d.date))
                .attr("cy", d => yScale(d.emission))
                .attr("r", 4)
                .attr("fill", "steelblue")
                .on("mouseover", function (event, d) {
                    tooltip1.style("visibility", "visible")
                        .html(`Timestamp: ${formatDateTime(d.originalTime)}<br>Emission: ${d.emission.toFixed(2)} ppm`);
                })
                .on("mousemove", function (event) {
                    tooltip1.style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 28}px`);
                })
                .on("mouseout", function () {
                    tooltip1.style("visibility", "hidden");
                });
        }

        // Initialize slider
        const slider = d3.select("#slider2")
            .attr("type", "range")
            .attr("min", 0)
            .attr("max", Math.max(parsedData.length - pointsPerSegment, 0))
            .attr("step", 1)
            .property("value", Math.max(parsedData.length - pointsPerSegment, 0))
            .on("input", function () {
                updateChart(+this.value);
            });

        // Render the last segment by default
        updateChart(Math.max(parsedData.length - pointsPerSegment, 0));

    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}
