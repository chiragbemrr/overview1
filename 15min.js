//data api
let CO_data = 'https://server-edve.onrender.com/api/emissions/latest';
let CO_data_15 = 'https://server-edve.onrender.com/api/emissions/15min';
let CO2_data = 'https://server-edve.onrender.com/api/emissions/15minco2';
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
const unit = d3.select("#unit");
async function fetchData(g_data) {
    try {
        const response = await fetch(g_data);
        const data = await response.json();

        // Format and update the latest time
        const formattedTime = data.latestTime;
        latestTimeDisplay.text(formattedTime);
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
            airquality.style("color", "#b64a4a"); // #b64a4a for high emissions
            currentEmissionDisplay.style("color", "#b64a4a");
        } else if (data_1 < 15) {
            var air_quality = "Good";
            airquality.style("color", "#28b858cc"); // Green for low emissions
            currentEmissionDisplay.style("color", "#5fdd38");

        } else {
            air_quality = "Acceptable"; // Yellow for medium emissions
            airquality.style("color", "#eca438");
            currentEmissionDisplay.style("color", "#eca438");

        }
        airquality.text(air_quality);

        if (data_2 > 1200) {
            CO2.style("color", "#b64a4a");
        } else if (data_2 < 800) {
            CO2.style("color", "#28b858cc");
        } else {
            CO2.style("color", "#eca438");
        }

    } catch (error) {
        console.error('Error:', error);
    }
}
// Initialize
fetchData(CO_data);
//setInterval(fetchData, 20000, CO_data);

function parseISTToGMT(istDateStr) {
    const [day, month, year, hour, minute, second] = istDateStr.match(/\d+/g).map(Number);

    // Adjust IST date to a Date object, interpreting as GMT directly.
    const istDate = new Date(Date.UTC(year, month - 1, day, hour - 5, minute - 30, second));
    return istDate;
}
// Set line chart dimensions
const container2 = document.querySelector('.line15');//(container1.clientWidth)
const margin = { top: 20, right: 30, bottom: 50, left: 60 };
var width = (container2.clientWidth) - margin.left - margin.right;
console.log(width);
var height = 400 - margin.top - margin.bottom;

// Append SVG
const svg_line_15 = d3.select("#line-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
// Initialize tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("z-index", "1000")
    .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.3)")
    .style("color", "black");

// Function to format date
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

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

// Fetch data and render chart
async function fetchlinegraph(get_data, st, svg_line) {
    try {
        const response = await fetch(get_data);
        const data = await response.json();

        // Parse data
        const parsedData = data.last15MinData.map(d => ({
            time: parseISTToGMT(d.time),  // Convert to Date object
            og: d.time,
            emission: +d.emission    // Convert emission to a number
        }));

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

        // Add circles and tooltip functionality
        svg_line.selectAll("circle")
            .data(parsedData)
            .enter().append("circle")
            .attr("cx", d => xScale(d.time))
            .attr("cy", d => yScale(d.emission))
            .attr("r", 5)
            .attr("fill", "steelblue")
            .on("mouseover", function (event, d) {
                tooltip.style("visibility", "visible")
                    .html(`Date: ${formatDateTime(d.og)}<br/>${st}: ${parseFloat(d.emission).toFixed(2)} ppm`);
            })
            .on("mousemove", function (event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
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
const container3 = document.querySelector('.pi');//(container1.clientWidth)
const p_width = (container3.clientWidth) / 1.87;
const p_height = (container3.clientWidth) / 1.87;
const p_radius = Math.min(p_width, p_height) / 2;
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



        const customColors = {
            Good: "#28b858cc",
            Acceptable: "#dfa145",
            Unhealthy: "#b64a4a"
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
        // Clear any existing labels before appending a new one


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
       // Clear any existing title before appending a new one
        p_svg.selectAll("text.title").remove();
        // Add or update the chart title
        // Add label below the chart
        d3.select("#pi-chart15 svg")
            .append("text")
            .attr("class", "title")
            .attr("x", p_width / 2)
            .attr("y", p_height + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Emissions Category Breakdown");

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
    updateGraph()
    //d3.clear();
    //fetchlinegraph(graphdata, Sensor, svg_line_15);
    //fetchAndRenderDatap1(graphdata, Sensor);
}
fetchlinegraph(graphdata, Sensor, svg_line_15);
fetchAndRenderDatap1(graphdata, Sensor);
function updateGraph() {
    fetchlinegraph(graphdata, Sensor, svg_line_15);
    fetchAndRenderDatap1(graphdata, Sensor);
}

setInterval(updateGraph, 20000);

