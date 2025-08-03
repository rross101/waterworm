// assets/chart.js

// select SVG and set up margins
const svg = d3.select("#chart"),
      margin = { top: 40, right: 100, bottom: 30, left: 50 },
      width  = svg.node().clientWidth  - margin.left - margin.right,
      height = svg.node().clientHeight - margin.top  - margin.bottom;

// clear SVG & attach group
svg.selectAll("*").remove();
const g = svg
  .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// parser for timestamp strings
const parseTime = d3.timeParse("2025-%m-%d %H:%M:%S".replace("2025-", "%Y-")); // ensure correct format
// set your goal total here (40 million)
const targetTotal = 40_000_000;
// force the x-axis to end at August 31, 2025
const forcedEndDate = d3.timeParse("%Y-%m-%d %H:%M:%S")("2025-08-31 23:59:59");
// interval in milliseconds (e.g., every 5 minutes)
const refreshInterval = 5 * 60 * 1000;

// scales, axes and lines in outer scope
let xScale, yScale, xAxis, yAxis, progressLine, targetLine, totalText;

function initChart() {
  // set up scales
  xScale = d3.scaleTime()
             .domain([forcedEndDate, forcedEndDate]) // dummy init
             .range([0, width]);

  yScale = d3.scaleLinear()
             .domain([0, targetTotal])
             .range([height, 0]);

  // axes groups
  xAxis = g.append("g")
           .attr("transform", `translate(0,${height})`);

  yAxis = g.append("g");

  // current total text (top-right, outside plotting area)
  totalText = svg.append("text")
    .attr("x", width + margin.left + margin.right - 10)
    .attr("y", margin.top - 10)
    .attr("text-anchor", "end")
    .attr("font-size", "16px")
    .attr("fill", "white");

  // static target line
  targetLine = g.append("path")
    .attr("fill", "none")
    .attr("stroke", "#FF6F61")
    .attr("stroke-dasharray", "4 2");

  // dynamic progress worm
  progressLine = g.append("path")
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 2);
}

function updateChart(data) {
  // recompute x domain from first data date to forced end
  const startDate = d3.min(data, d => d.date);
  xScale.domain([startDate, forcedEndDate]);

  // redraw axes
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

  // target line data
  const targetData = [
    { date: startDate,       cumulative: 0 },
    { date: forcedEndDate,   cumulative: targetTotal }
  ];
  targetLine
    .datum(targetData)
    .attr("d", d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.cumulative))
    );

  // clamp and draw progress worm
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

  // update the current-total text
  const latest = clamped[clamped.length - 1].cumulative;
  totalText.text(`Current total: ${d3.format(",")(latest)}`);
}

function fetchAndRender() {
  d3.csv("teamwater_progress.csv", row => ({
    date: parseTime(row.timestamp),
    amount: +row.amount
  }))
  .then(raw => {
    const clean = raw.filter(d => d.date instanceof Date && !isNaN(d.date));
    const data = clean
      .sort((a, b) => a.date - b.date)
      .map(d => ({ date: d.date, cumulative: d.amount }));
    if (data.length) updateChart(data);
  })
  .catch(err => console.error("Error loading CSV:", err));
}

// initialize chart and start polling
d3.csv("teamwater_progress.csv", row => ({
  date: parseTime(row.timestamp),
  amount: +row.amount
}))
.then(raw => {
  const clean = raw.filter(d => d.date instanceof Date);
  const data = clean
    .sort((a, b) => a.date - b.date)
    .map(d => ({ date: d.date, cumulative: d.amount }));

  initChart();
  updateChart(data);
  setInterval(fetchAndRender, refreshInterval);
})
.catch(err => console.error("Initial CSV load error:", err));
