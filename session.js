var Sensor = "CO";
var unit1 = "Parts Per Million (PPM)";
const sdata = 'https://server-edve.onrender.com/api/emissions/session';

const s_name = d3.select("#Sensorname");
const unit = d3.select("#unit");
const S_time = d3.select("#stime");
const E_time = d3.select("#etime");
const Max_value = d3.select("#maxvalue");
const Min_value = d3.select("#minvalue");
const Avg_value = d3.select("#avgvalue");
const Curr_value = d3.select("#currvalue");
const Session = d3.select("#sessiondropdown");

document.getElementById('startDates').value = "2018-12-31";
document.getElementById('startDates').min = "2018-12-31";
document.getElementById('endDates').min = "2018-12-31";

async function fetchData() {
    try {

        const response = await fetch('https://server-edve.onrender.com/api/emissions/latest');
        const data = await response.json();

        // Format and update the latest time
        const formattedTime = data.latestTime;
        //console.log(xyz);
        document.getElementById('endDates').value = formatDate1(formattedTime);
        document.getElementById('endDates').max = formatDate1(formattedTime);
        document.getElementById('startDates').max = formatDate1(formattedTime);

    } catch (error) {
        console.error('Error:', error);
    }
}
fetchData();
function formatDate1(isoDate) {
    const date = new Date(isoDate);

    // Adjust for timezone offset
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    // Extract date components
    const day = adjustedDate.getDate().toString().padStart(2, '0');
    const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = adjustedDate.getFullYear();
    return `${year}-${day}-${month}`;

}

s_name.text(Sensor);
unit.text(unit1);

//slider for line graph
d3.select("#sliderLabel2")
    .text("Adjust the slider to view previous data");

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

function parseISTToGMT(datee) {
    // Ensure istDateObj is a Date object (if it's not already)
    var istDateObj = new Date(datee);
    if (istDateObj instanceof Date) {
        // Adjust IST date to GMT by subtracting 5 hours and 30 minutes
        const istDateInMillis = istDateObj.getTime(); // Get time in milliseconds
        const gmtDate = new Date(istDateInMillis - (5 * 60 + 30) * 60000); // Subtract 5 hours 30 minutes
        return gmtDate;
    } else {
        throw new Error('Invalid input: expected a Date object');
    }
}
// Set margins and dimensions for the SVG
const container = document.querySelector('.chart-container-2');

const margin1 = { top: 30, right: 50, bottom: 20, left: 60 };
var width1 = (container.clientWidth) - margin1.left - margin1.right;
//console.log(width1);
const height11 = 450 - margin1.top - margin1.bottom;

// Append SVG to the container
const svg_mm = d3.select("#line-chart")
    .append("svg")
    .attr("width", width1 + margin1.left + margin1.right)
    .attr("height", height11 + margin1.top + margin1.bottom)
    .append("g")
    .attr("transform", `translate(${margin1.left},${margin1.top})`);

// Initialize tooltip
const tooltip1 = d3.select("body").append("div")
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

async function createLineGraphWithSlider(dataUrl, pollutant) {
    try {
        //console.log(pollutant);
        // Load and process data
        const rawData = dataUrl;

        // Update meta-information (start time, end time, current value)
        if (rawData.length > 0) {
            const starttime = rawData[0].time;
            const endtime = rawData[rawData.length - 1].time;
            if (pollutant == "CO2") {
                var currval = rawData[rawData.length - 1].CO2;
            } else {
                var currval = rawData[rawData.length - 1].CO;
            }

            S_time.text(formatDateTime(starttime));
            E_time.text(formatDateTime(endtime));
            Curr_value.text(Number(currval).toFixed(2));
        }

        // Parse the data
        const parsedData = rawData.map(d => ({
            date: parseISTToGMT(d.time[0]),
            og: d.time,
            emission: pollutant === "CO2" ? +d.CO2 : +d.CO,
        }));

        // Calculate statistics
        const totalEmission = parsedData.length;
        const avgEmission = parsedData.reduce((sum, d) => sum + d.emission, 0) / totalEmission;
        const minEmission = Math.min(...parsedData.map(d => d.emission));
        const maxEmission = Math.max(...parsedData.map(d => d.emission));

        Max_value.text(Number(maxEmission).toFixed(2));
        Min_value.text(Number(minEmission).toFixed(2));
        Avg_value.text(Number(avgEmission).toFixed(2));

        // Clear any existing chart elements
        svg_mm.selectAll("*").remove();

        const pointsPerSegment = parseInt(width1 / 45);

        // Set up scales
        const xScale = d3.scaleTime().range([0, width1]);
        const yScale = d3.scaleLinear().range([height11, 0]);

        // Define axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%d-%m %H:%M:%S"));
        const yAxis = d3.axisLeft(yScale);

        // Append axes
        const xAxisGroup = svg_mm.append("g")
            .attr("transform", `translate(0,${height11})`)
            .call(xAxis);
        const yAxisGroup = svg_mm.append("g");
        // Rotate the x-axis tick labels
        /*
        // Add axis labels
        svg_mm.append("text")
            .attr("transform", `translate(${width1 / 2},${height11 + margin1.bottom - 10})`)
            .style("text-anchor", "middle")
            .text("Timestamp");
            */
        svg_mm.append("text")
            .attr("x", -30)
            .attr("y", -10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .style("font-size", "10px") // Add font size here
            .text("↑ Emission(PPM)");
        // Line generator
        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.emission));

        // Append line path
        const path = svg_mm.append("path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2);

        // Update chart function
        function updateChart(startIndex) {
            const visibleData = parsedData.slice(startIndex, startIndex + pointsPerSegment);

            if (visibleData.length === 0) return;

            // Update scales
            xScale.domain(d3.extent(visibleData, d => d.date));
            yScale.domain([0, d3.max(visibleData, d => d.emission)]);

            // Update axes
            xAxisGroup.call(xAxis);
            yAxisGroup.call(yAxis);

            // Update line path
            path.datum(visibleData).attr("d", line);

            // Update circles for interaction
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
                        .html(`Timestamp: ${formatDateTime(d.og)}<br>Emission: ${d.emission.toFixed(2)} ppm`);
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
            .attr("max", parsedData.length - pointsPerSegment)
            .attr("step", 1)
            .property("value", parsedData.length - pointsPerSegment)
            .on("input", function () {
                updateChart(+this.value);
            });

        // Render the last segment by default
        updateChart(parsedData.length - pointsPerSegment);

    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}




const SessionDropDown = document.getElementById("SessionDropDown");

function parseCustomDate(dateStr) {
    let parts = dateStr.split(" "); // Split date and time
    let dateParts = parts[0].split("-"); // Split day, month, year
    let timeParts = parts[1].split(":"); // Split hours, minutes, seconds

    return new Date(
        dateParts[2],  // Year
        dateParts[1] - 1, // Month (0-based in JS)
        dateParts[0],  // Day
        timeParts[0],  // Hours
        timeParts[1],  // Minutes
        timeParts[2]   // Seconds
    );
}
// Fetch and populate session data
async function populateSessionDropdown(dataUrl, Sensor) {
    SessionDropDown.innerHTML = "";

    var sd = new Date(document.getElementById('startDates').value);

    var ed = new Date(document.getElementById('endDates').value);
    //console.log(ed);
    const SessionData = await createsession(dataUrl);
    const keys = Object.keys(SessionData); // Get all keys
    //console.log(keys);
    for (let key in SessionData) {
        let sessionDate = parseCustomDate(key); // Ensure parseCustomDate works correctly
        let sessionDateObj = new Date(sessionDate);

        if (sessionDateObj >= sd) {
            if (ed.getTime()) {
                if (sessionDateObj <= ed) {
                    //console.log("hello");
                    let option = document.createElement("option");
                    option.setAttribute('value', key); // Use the key (formatted date) as the value
                    let optionText = document.createTextNode(key);
                    option.appendChild(optionText);
                    SessionDropDown.appendChild(option);
                }


            } else {
                //console.log(parseCustomDate(key));
                let option = document.createElement("option");
                option.setAttribute('value', key); // Use the key (formatted date) as the value
                let optionText = document.createTextNode(key);
                option.appendChild(optionText);
                SessionDropDown.appendChild(option);
            }

        }


    }
    var initline = SessionDropDown.options[SessionDropDown.options.length - 1].value;
    console.log(SessionDropDown.length);
    createLineGraphWithSlider(SessionData[initline], Sensor);
}

async function changedata() {
    const SessionData = await createsession(sdata);
    var key = document.getElementById("SessionDropDown").value;
    var newdata = SessionData[key];

    createLineGraphWithSlider(newdata, Sensor);

}
async function createsession(dataUrl) {
    try {
        const response = await fetch(dataUrl);
        const rawData = await response.json();

        // Sort rawData by time in ascending order
        const sortedData = rawData.sort((a, b) => new Date(a.time) - new Date(b.time));

        // Initialize variables for processing
        const resultDict = {};
        let currentSegment = [];
        let lastTime = null;

        // Iterate through the sorted data
        sortedData.forEach((item, index) => {
            const currentTime = new Date(item.time);

            if (lastTime && (currentTime - lastTime) > 2 * 60 * 60 * 1000) {
                // Break detected: Store the current segment in the dictionary
                if (currentSegment.length > 0) {
                    const key = formatDateTime(currentSegment[0].time); // Format the first data point's time
                    resultDict[key] = currentSegment;
                }

                // Start a new segment
                currentSegment = [];
            }

            // Add the current item to the segment
            currentSegment.push(item);
            lastTime = currentTime;

            // Handle the last segment after the loop
            if (index === sortedData.length - 1 && currentSegment.length > 0) {
                const key = formatDateTime(currentSegment[0].time);
                resultDict[key] = currentSegment;
            }
        });

        return resultDict;
    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}

// Call the function to populate the dropdown
populateSessionDropdown(sdata, Sensor); // Replace 'dataUrl' with your actual URL
//setInterval(populateSessionDropdown, 20000, sdata, Sensor);

function changevalue() {
    Sensor = "CO";
    if (document.getElementById("Sensor").value == "1") {
        Sensor = "CO2";
    }
    else {
        Sensor = "CO";
    }
    s_name.text(Sensor);
    populateSessionDropdown(sdata, Sensor);
}
