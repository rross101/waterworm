// assets/chart.js

// select SVG and set up margins
tconst svg = d3.select("#chart"),
      margin = { top: 20, right: 30, bottom: 30, left: 50 },
      width  = svg.node().clientWidth  - margin.left - margin.right,
      height = svg.node().clientHeight - margin.top  - margin.bottom;

// main group container
const g = svg
  .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// parser for timestamp strings
const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

// set your goal total here (40 million)
const targetTotal = 40_000_000;
// force the x-axis to end at August 31, 2025
const forcedEndDate = parseTime("2025-08-31 23:59:59");
// interval in milliseconds (e.g., every 5 minutes)
const refreshInterval = 5 * 60 * 1000;

// scales, axes and lines need to be defined in outer scope for updates
let xScale, yScale, xAxis, yAxis, progressLine, targetLine;

def function initChart() {
  // set up scales
  xScale = d3.scaleTime()
             .domain([forcedEndDate, forcedEndDate]) // placeholder
             .range([0, width]);

  yScale = d3.scaleLinear()
             .domain([0, targetTotal])
             .range([height, 0]);

  // axes
  xAxis = g.append("g")
           .attr("transform", `translate(0,${height})`);

  yAxis = g.append("g");

  // target line (static)
  targetLine = g.append("path")
    .attr("fill", "none")
    .attr("stroke", "tomato")
    .attr("stroke-dasharray", "4 2");

  // progress worm path
  progressLine = g.append("path")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2);
}

function updateChart(data) {
  // update domains
  const startDate = d3.min(data, d => d.date);
  xScale.domain([startDate, forcedEndDate]);

  // update axes
  xAxis.call(
    d3.axisBottom(xScale)
      .ticks(d3.timeDay.every(5))
      .tickFormat(d3.timeFormat("%b %-d"))
  )
    .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-45)")
      .attr("dx", "-0.6em")
      .attr("dy", "0.2em");

  yAxis.call(
    d3.axisLeft(yScale)
      .ticks(8)
      .tickFormat(d3.format(".2s"))
  );

  // update target line data
  const targetData = [
    { date: startDate, cumulative: 0 },
    { date: forcedEndDate, cumulative: targetTotal }
  ];
  targetLine
    .datum(targetData)
    .attr("d", d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.cumulative))
    );

  // update progress line data
  const clamped = data.map(d => ({
    date: d.date,
    cumulative: Math.min(d.cumulative, targetTotal)
  }));

  progressLine
    .datum(clamped)
    .transition().duration(1000)
    .attr("d", d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.cumulative))
    );
}

function fetchAndRender() {
  d3.csv("teamwater_progress.csv", row => ({
    date:   parseTime(row.timestamp),
    amount: +row.amount
  }))
  .then(raw => {
    const clean = raw.filter(d => d.date instanceof Date && !isNaN(d.date));

    const data = clean
      .sort((a, b) => a.date - b.date)
      .map(d => ({ date: d.date, cumulative: d.amount }));

    if (!data.length) {
      console.error("No valid data to plot.");
      return;
    }

    updateChart(data);
  })
  .catch(err => console.error("Error loading CSV:", err));
}

// initialize once
d3.csv("teamwater_progress.csv", row => ({ date: parseTime(row.timestamp), amount: +row.amount }))
  .then(raw => {
    const clean = raw.filter(d => d.date instanceof Date);
    const data = clean.sort((a, b) => a.date - b.date).map(d => ({ date: d.date, cumulative: d.amount }));

    initChart();
    updateChart(data);
    // set interval for polling
    setInterval(fetchAndRender, refreshInterval);
  })
  .catch(err => console.error("Initial CSV load error:", err));
