//data api
let CO_data = '/api/emissions/daily-averages';
let CO_data_15 = '/api/emissions/15min';
let CO2_data = '/api/emissions/15minco2';
var graphdata = CO_data_15;
var Sensor = "CO";
var unit1 = "Parts Per Million (PPM)";

// Cache DOM selections and constants
const latestTimeDisplay = d3.select("#latest-time");
const currentEmissionDisplay = d3.select("#current-emission");
const airquality = d3.select("#air-quality");
const CO2 = d3.select("#CO2");
const Temperature = d3.select("#Temperature");
const humidity = d3.select("#humidity");
const graphContainer = d3.select("#graph");
const slider = d3.select("#dateSlider");
const s_name = d3.select("#Sensorname");
const unit = d3.select("#unit");

const WIDTH = 1100;
const HEIGHT = 248;
const MARGIN = { top: 20, right: 30, bottom: 70, left: 60 };
const DAYS_TO_SHOW = 50;

async function fetchData(g_data) {
    try {
        const response = await fetch('/api/emissions/latest');
        const data = await response.json();

        // Format and update the latest time
        const formattedTime = data.latestTime;
        latestTimeDisplay.text(formattedTime);
        s_name.text(Sensor);
        unit.text(unit1);
        // Update emission value
        currentEmissionDisplay.text(Number(data.latestEmission).toFixed(2));
        CO2.text(Number(data.CO2));
        Temperature.text(Number(data.Temperature));
        humidity.text(Number(data.Humidity));

        var data_1 = Number(data.latestEmission);
        var data_2 = Number(data.CO2);

        var air_quality;
        if (data_1 > 50) {
            air_quality = "Unhealthy";
            airquality.style("color", "red"); // Red for high emissions
            currentEmissionDisplay.style("color", "red");
        } else if (data_1 < 15) {
            var air_quality = "Good";
            airquality.style("color", "#5fdd38"); // Green for low emissions
            currentEmissionDisplay.style("color", "#5fdd38");

        } else {
            air_quality = "Acceptable"; // Yellow for medium emissions
            airquality.style("color", "#eca438");
            currentEmissionDisplay.style("color", "#eca438");

        }
        airquality.text(air_quality);

        if (data_2 > 1200) {
            CO2.style("color", "red");
        } else if (data_2 < 800) {
            CO2.style("color", "#5fdd38");
        } else {
            CO2.style("color", "#eca438");
        }

        // Fetch graph data
        const graphResponse = await fetch(g_data);
        const dailyData = await graphResponse.json();
        initializeGraphWithSlider(dailyData);

    } catch (error) {
        console.error('Error:', error);
    }
}

// Initialize
fetchData(CO_data);

function formatDate(isoDate) {
    const date = new Date(isoDate);

    // Adjust for timezone offset
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    // Extract date components
    const day = adjustedDate.getDate().toString().padStart(2, '0');
    const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = adjustedDate.getFullYear();
    return `${day}-${month}-${year}`;

}

function initializeGraphWithSlider(dailyData) {
    // Set up slider
    const maxSliderValue = Math.max(0, dailyData.length - DAYS_TO_SHOW);

    slider
        .attr("min", 0)
        .attr("max", maxSliderValue)
        .attr("value", maxSliderValue)
        .on("input", function () {
            updateGraph(dailyData, +this.value);
        });

    // Initial graph render
    updateGraph(dailyData, maxSliderValue);
}

function formatDateTime(isoDate) {
    const date = new Date(isoDate);

    // Adjust for timezone offset
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    // Extract date components
    const day = adjustedDate.getDate().toString().padStart(2, '0');
    const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = adjustedDate.getFullYear();

    // Extract time components
    const hours = adjustedDate.getHours().toString().padStart(2, '0');
    const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');
    const seconds = adjustedDate.getSeconds().toString().padStart(2, '0');

    // Return formatted string
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}
function updateGraph(data, startIndex) {
    // Clear previous graph
    graphContainer.html("");

    // Get the visible data window
    const visibleData = data.slice(startIndex, startIndex + DAYS_TO_SHOW);

    const svg = graphContainer
        .append("svg")
        .attr("width", WIDTH + MARGIN.left + MARGIN.right)
        .attr("height", HEIGHT + MARGIN.top + MARGIN.bottom)
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Set up scales
    const x = d3.scaleBand()
        .range([0, WIDTH])
        .domain(visibleData.map(d => d.date))
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([HEIGHT, 0])
        .domain([0, d3.max(visibleData, d => d.average)]);

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${HEIGHT})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "13px")
        .attr("dx", "-0.6em")
        .attr("dy", "0.15em");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y))
        .call(g => g.append("text")
            .attr("x", -30)
            .attr("y", -10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("↑ CO Emission(PPM)"));


    // Add bars
    svg.selectAll("rect")
        .data(visibleData)
        .join("rect")
        .transition()  // Begin transition
        .duration(10000)
        .attr("x", d => x(d.date))
        .attr("y", d => y(d.average))
        .attr("width", x.bandwidth())
        .attr("height", d => HEIGHT - y(d.average))
        ;
    svg.selectAll("rect")
        .data(visibleData)
        .join("rect")
        .attr("x", d => x(d.date))
        .attr("y", d => y(d.average))
        .attr("width", x.bandwidth())
        .attr("height", d => HEIGHT - y(d.average))
        .attr("fill", "#8ec3e7")
        .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .style("opacity", 1)
                .html(`Date: ${formatDate(d.date)}<br/>CO: ${d.average} ppm`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden").style("opacity", 0);
        });

    // Update date range label
    updateDateRangeLabel(visibleData);
}
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function updateDateRangeLabel(visibleData) {
    const startDate = visibleData[0].date;
    const endDate = visibleData[visibleData.length - 1].date;
    d3.select("#sliderLabel")
        .text(`Showing data from ${startDate} to ${endDate}`);
}



// Set line chart dimensions
const margin = { top: 20, right: 30, bottom: 50, left: 60 },
    width = 1200 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Append SVG
const svg_line_15 = d3.select("#line-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);



function parseISTToGMT(istDateStr) {
    const [day, month, year, hour, minute, second] = istDateStr.match(/\d+/g).map(Number);

    // Adjust IST date to a Date object, interpreting as GMT directly.
    const istDate = new Date(Date.UTC(year, month - 1, day, hour - 5, minute - 30, second));
    return istDate;
}


// Fetch data and render chart
async function fetchlinegraph(get_data, st, svg_line) {
    try {
        const response = await fetch(get_data);
        const data = await response.json();

        // Parse data: Ensure dates are Date objects and emissions are numbers
        const parsedData = data.last15MinData.map(d => ({
            time: parseISTToGMT(d.time),  // Convert to Date object for scaling'
            og: d.time,
            emission: +d.emission    // Convert emission to a number
        }));
        console.log(parsedData);


        // Set up scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(parsedData, d => d.time)) // Set domain based on time range
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(parsedData, d => d.emission)]) // Set domain based on emission values
            .nice() // Add padding to the top of the y-axis
            .range([height, 0]);

        // Define line generator
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d.emission))
            .curve(d3.curveMonotoneX); // Optional smoothing

        svg_line.selectAll("*").remove();

        // Add the line path to the SVG
        svg_line.append("path")
            .datum(parsedData) // Bind data
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 3)
            .attr("d", line);

        // Add X axis
        svg_line.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%H:%M:%S")))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        svg_line.append("g")
            .call(d3.axisLeft(yScale))
            .call(g => g.append("text")
                .attr("x", -30)
                .attr("y", -10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text("↑ Emission(PPM)"));


        svg_line.selectAll("circle")
            .data(parsedData)
            .enter().append("circle")
            .attr("cx", d => xScale(d.time))
            .attr("cy", d => yScale(d.emission))
            .attr("r", 5)
            .attr("fill", "steelblue")
            .on("mouseover", function (event, d) {
                tooltip.style("visibility", "visible")
                    .style("opacity", 1)
                    .html(`Date: ${formatDateTime(d.og)}<br/>${st}: ${parseFloat(d.emission).toFixed(2)} ppm`);
            })
            .on("mousemove", function (event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden").style("opacity", 0);
            });

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function categorizeEmissions(data, sensor) {
    const categories = {
        Good: 0,
        Acceptable: 0,
        Unhealthy: 0
    };
    var high;
    var low;
    if (sensor == "CO") {
        high = 50;
        low = 15;
    }
    if (sensor == "CO2") {
        high = 1200;
        low = 800;
    }

    data.forEach(item => {
        const emission = item.CO_Emissions_ppm;
        if (emission < low) {
            categories.Good++;
        } else if (emission >= low && emission < high) {
            categories.Acceptable++;
        } else if (emission >= high) {
            categories.Unhealthy++;
        }
    });

    return categories;
}

async function fetchAndRenderDatap() {
    try {
        const response_p = await fetch('/api/emissions/pi');
        const data1 = await response_p.json();
        const p_data = categorizeEmissions(data1, "CO");

        const pieData = Object.entries(p_data).map(([key, value]) => ({ category: key, count: value }));
        const total = pieData.reduce((sum, d) => sum + d.count, 0);

        const p_width = 347;
        const p_height = 347;
        const p_radius = Math.min(p_width, p_height) / 2;

        const customColors = {
            Good: "#28b858cc",
            Acceptable: "#6495f1",
            Unhealthy: "#dfa145"
        };

        const p_svg = d3.select("#pi-chart")
            .append("svg")
            .attr("width", p_width)
            .attr("height", p_height + 100)  // Keep the width fixed to the desired value
            .append("g")
            .attr("transform", `translate(${p_width / 2}, ${p_height / 2})`);

        const pie = d3.pie().value(d => d.count);
        const arc = d3.arc().innerRadius(0).outerRadius(p_radius);

        p_svg.selectAll("path")
            .data(pie(pieData))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => customColors[d.data.category])
            .attr("stroke", "white")
            .style("stroke-width", "2px");

        p_svg.selectAll("text")
            .data(pie(pieData))
            .enter()
            .append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("dy", "0.35em")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text(d => `${((d.data.count / total) * 100).toFixed(1)}%`);

        // Add label below the chart
        d3.select("#pi-chart svg")
            .append("text")
            .attr("x", p_width / 2)
            .attr("y", p_height + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("CO Emissions Category Breakdown");

        // Add legend below the main label with circles (adjusting the position to avoid increasing the width)
        const legendGroup = d3.select("#pi-chart svg")
            .append("g")
            .attr("transform", `translate(${p_width / 2 - 60}, ${p_height + 50})`);  // Adjusted to make sure it fits within the visual width

        legendGroup.selectAll("circle")
            .data(pieData)
            .enter()
            .append("circle")
            .attr("cx", 0)
            .attr("cy", (d, i) => i * 20)
            .attr("r", 5)
            .style("fill", d => customColors[d.category]);

        legendGroup.selectAll("text")
            .data(pieData)
            .enter()
            .append("text")
            .attr("x", 15)  // Adjusted x-position to align the text properly
            .attr("y", (d, i) => i * 20 + 5)
            .style("font-size", "12px")
            .text(d => `${d.category}: ${d.count} (${((d.count / total) * 100).toFixed(1)}%)`);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

fetchAndRenderDatap();

async function fetchAndRenderDatap1(get_data, st) {
    try {
        const response_p = await fetch(get_data);
        const data1 = await response_p.json();

        const parsedDatap = data1.last15MinData.map(d => ({
            time: parseISTToGMT(d.time), // Convert to Date object for scaling
            og: d.time,
            emission: parseFloat(+d.emission).toFixed(2) // Convert emission to a number
        }));
        const emissionsArray = parsedDatap.map(d => ({ CO_Emissions_ppm: parseFloat(d.emission) }));

        const p_data = categorizeEmissions(emissionsArray, st);

        const pieData = Object.entries(p_data).map(([key, value]) => ({ category: key, count: value }));
        const total = pieData.reduce((sum, d) => sum + d.count, 0);

        const p_width = 347;
        const p_height = 347;
        const p_radius = Math.min(p_width, p_height) / 2;

        const customColors = {
            Good: "#28b858cc",
            Acceptable: "#6495f1",
            Unhealthy: "#dfa145"
        };

        // Select the container and clear previous SVG content only once during initialization
        let p_svg = d3.select("#pi-chart15 svg g");
        if (p_svg.empty()) {
            // If SVG doesn't exist, create it
            p_svg = d3.select("#pi-chart15")
                .append("svg")
                .attr("width", p_width)
                .attr("height", p_height + 100)
                .append("g")
                .attr("transform", `translate(${p_width / 2}, ${p_height / 2})`);
        }

        const pie = d3.pie().value(d => d.count);
        const arc = d3.arc().innerRadius(0).outerRadius(p_radius);

        // Bind new data to paths
        const paths = p_svg.selectAll("path").data(pie(pieData));

        // Update existing paths
        paths.attr("d", arc)
            .attr("fill", d => customColors[d.data.category]);

        // Enter new paths
        paths.enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => customColors[d.data.category])
            .attr("stroke", "white")
            .style("stroke-width", "2px");

        // Remove old paths
        paths.exit().remove();

        // Update labels
        const labels = p_svg.selectAll("text").data(pie(pieData));

        d3.select("#pi-chart15 svg")
            .append("text")
            .attr("x", p_width / 2)
            .attr("y", p_height + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Emissions Category Breakdown");

        labels.attr("transform", d => `translate(${arc.centroid(d)})`)
            .text(d => `${((d.data.count / total) * 100).toFixed(1)}%`);

        labels.enter()
            .append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("dy", "0.35em")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text(d => `${((d.data.count / total) * 100).toFixed(1)}%`);

        labels.exit().remove();

        // Update legend
        var legendGroup = d3.select("#pi-chart15 svg").select("g.legend");
        if (legendGroup.empty()) {
            // If legend doesn't exist, create it
            legendGroup = d3.select("#pi-chart15 svg")
                .append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${p_width / 2 - 80}, ${p_height + 50})`);
        }

        const legendItems = legendGroup.selectAll("g").data(pieData);

        // Update existing legend items
        legendItems.select("circle")
            .style("fill", d => customColors[d.category]);

        legendItems.select("text")
            .text(d => `${d.category}: ${d.count} (${((d.count / total) * 100).toFixed(1)}%)`);

        // Add new legend items
        const legendEnter = legendItems.enter().append("g")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendEnter.append("circle")
            .attr("r", 5)
            .style("fill", d => customColors[d.category]);

        legendEnter.append("text")
            .attr("x", 15)
            .attr("y", 5)
            .style("font-size", "12px")
            .text(d => `${d.category}: ${d.count} (${((d.count / total) * 100).toFixed(1)}%)`);

        // Remove old legend items
        legendItems.exit().remove();
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

Sensor = "CO";
function changevalue() {
    if (document.getElementById("Sensor").value == "0") {
        graphdata = CO_data_15;
        Sensor = "CO";
    }
    else {
        graphdata = CO2_data;
        Sensor = "CO2";
    }
    //d3.clear();
    fetchlinegraph(graphdata, Sensor, svg_line_15);
    fetchAndRenderDatap1(graphdata, Sensor);
    s_name.text(Sensor);
}
fetchlinegraph(graphdata, Sensor, svg_line_15);
fetchAndRenderDatap1(graphdata, Sensor);

/*
const SessionDropDown = document.getElementById("SessionDropDown");

const SessionData = {
    "1": "🇦🇺",
    "2": "🇨🇦",
    "3": "🇬🇧",
    "4": "🇺🇸",
    "5": "ab"
}
for (let key in SessionData) {
    let option = document.createElement("option");
    option.setAttribute('value', SessionData[key]);

    let optionText = document.createTextNode(key);
    option.appendChild(optionText);

    SessionDropDown.appendChild(option);
}
*/

// Set margins and dimensions for the SVG
const margin1 = { top: 20, right: 50, bottom: 70, left: 80 },
    width1 = 1890 - margin1.left - margin1.right,
    height11 = 300 - margin1.top - margin1.bottom;

// Append SVG to the container
const svg_mm = d3.select("#line-chart-mm")
    .append("svg")
    .attr("width", width1 + margin1.left + margin1.right)
    .attr("height", height11 + margin1.top + margin1.bottom)
    .append("g")
    .attr("transform", `translate(${margin1.left},${margin1.top})`);

// tooltip1 setup
const tooltip1 = d3.select("body").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "4px")
    .style("font-size", "12px");

// Fetch and render data
async function createLineGraphWithSlider(dataUrl, pollutant) {
    try {
        const response = await fetch(dataUrl);
        const rawData = await response.json();

        const parsedData = rawData.map(d => ({
            date: new Date(d.date), // Parse date
            og: d.time,
            min: pollutant === "CO" ? +d.min_co : +d.min_co2,
            max: pollutant === "CO" ? +d.max_co : +d.max_co2,
        }));

        const pointsPerSegment = 40;  // This can be adjusted as per your needs
        // const totalSegments = Math.max(1, Math.ceil(parsedData.length / daysPerSegment));

        // Set up scales
        const xScale = d3.scaleTime().range([0, width1]);
        const yScaleMax = d3.scaleLinear().range([height11, 0]);
        const yScaleMin = d3.scaleLinear().range([height11, 0]);

        // Define axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y-%m-%d"));
        const yAxisMax = d3.axisLeft(yScaleMax);
        const yAxisMin = d3.axisRight(yScaleMin);

        // Append axes to SVG
        const xAxisGroup = svg_mm.append("g")
            .attr("transform", `translate(0,${height11})`);
        const yAxisMaxGroup = svg_mm.append("g");
        const yAxisMinGroup = svg_mm.append("g")
            .attr("transform", `translate(${width1},0)`);

        // Add X and Y axis labels
        svg_mm.append("text")
            .attr("transform", `translate(${width1 / 2},${height11 + margin1.bottom - 20})`)
            .style("text-anchor", "middle")
            .text("Date");

        svg_mm.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin1.left + 20)
            .attr("x", -height11 / 2)
            .style("text-anchor", "middle")
            .text("Emission (PPM)");

        // Define line generators
        const maxLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScaleMax(d.max));
        const minLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScaleMin(d.min));

        // Append paths for lines
        const maxPath = svg_mm.append("path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2);
        const minPath = svg_mm.append("path")
            .attr("fill", "none")
            .attr("stroke", "orange")
            .attr("stroke-width", 2);

        // Add legend
        const legend = svg_mm.append("g")
            .attr("transform", `translate(${width1 - 150}, ${margin1.top})`);

        // Max Line Legend
        legend.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", -35)
            .attr("y2", -35)
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 25)
            .attr("y", -30)
            .style("font-size", "12px")
            .text("Max Values");

        // Min Line Legend
        legend.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", -20)
            .attr("y2", -20)
            .attr("stroke", "orange")
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 25)
            .attr("y", -15)
            .style("font-size", "12px")
            .text("Min Values");

        // Update function
        function updateChart(segmentIndex) {
            // const segmentStart = segmentIndex * pointsPerSegment;
            const segmentEnd = segmentIndex + pointsPerSegment;
            let currentData = parsedData.slice(segmentIndex, segmentEnd);

            // Filter out data points where date is missing (invalid date)
            currentData = currentData.filter(d => !isNaN(d.date));

            if (currentData.length === 0) return;

            // Update scale domains based on the filtered data
            xScale.domain(d3.extent(currentData, d => d.date));
            yScaleMax.domain([0, d3.max(currentData, d => d.max)]);
            yScaleMin.domain([0, d3.max(currentData, d => d.min)]);

            // Update axes
            xAxisGroup.call(xAxis);
            yAxisMaxGroup.call(yAxisMax);
            yAxisMinGroup.call(yAxisMin);

            // Update line paths
            maxPath.datum(currentData).attr("d", maxLine);
            minPath.datum(currentData).attr("d", minLine);

            // Add circles with tooltip1 interaction
            svg_mm.selectAll(".circle-max").remove();
            svg_mm.selectAll(".circle-min").remove();

            svg_mm.selectAll(".circle-max")
                .data(currentData)
                .enter().append("circle")
                .attr("class", "circle-max")
                .attr("cx", d => xScale(d.date))
                .attr("cy", d => yScaleMax(d.max))
                .attr("r", 5)
                .attr("fill", "steelblue")
                .on("mouseover", function (event, d) {
                    tooltip1.style("visibility", "visible")
                        .html(`Date: ${formatDate(d.date)}<br>Max: ${d.max.toFixed(2)} ppm`);
                })
                .on("mousemove", function (event) {
                    tooltip1.style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 28}px`);
                })
                .on("mouseout", function () {
                    tooltip1.style("visibility", "hidden");
                });

            svg_mm.selectAll(".circle-min")
                .data(currentData)
                .enter().append("circle")
                .attr("class", "circle-min")
                .attr("cx", d => xScale(d.date))
                .attr("cy", d => yScaleMin(d.min))
                .attr("r", 5)
                .attr("fill", "orange")
                .on("mouseover", function (event, d) {
                    tooltip1.style("visibility", "visible")
                        .html(`Date: ${formatDate(d.date)}<br>Min: ${d.min.toFixed(2)} ppm`);
                })
                .on("mousemove", function (event) {
                    tooltip1.style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 28}px`);
                })
                .on("mouseout", function () {
                    tooltip1.style("visibility", "hidden");
                });
        }

        // Initialize slider with 40 data points per segment and start from the last segment
        const slider = d3.select("#slider2")
            .attr("type", "range")
            .attr("min", 0)  // Start from the first segment
            .attr("max", parsedData.length - pointsPerSegment)  // Max value is the total segments - 1
            .attr("step", 1)  // Step size is 1
            .property("value", parsedData.length - pointsPerSegment)  // Initialize with the last segment
            .on("input", function () {
                const currentValue = +this.value;


                // Update the chart with the new segment
                updateChart(currentValue);
            });

        // Initialize chart with the last segment
        updateChart(parsedData.length - pointsPerSegment);  // Start with the last segment

    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}




function changevalue1() {
    if (document.getElementById("Sensor1").value == "0") {
        graphdata = CO_data_15;
        Sensor = "CO";
    }
    else {
        graphdata = CO2_data;
        Sensor = "CO2";
    }
    createLineGraphWithSlider(CO_data, "CO");
}
// Replace with your actual data URL and pollutant type
createLineGraphWithSlider(CO_data, "CO");