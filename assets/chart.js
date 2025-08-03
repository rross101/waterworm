// assets/chart.js

// select SVG and set up margins
const svg = d3.select("#chart"),
      margin = { top: 40, right: 100, bottom: 50, left: 50 },
      width  = svg.node().clientWidth  - margin.left - margin.right,
      height = svg.node().clientHeight - margin.top  - margin.bottom;

// clear SVG & attach group
svg.selectAll("*").remove();

// add defs for glow effect on target line
const defs = svg.append("defs");
defs.append("filter")
    .attr("id", "glow")
  .append("feDropShadow")
    .attr("stdDeviation", 3)
    .attr("flood-color", "#FF6F61")
    .attr("flood-opacity", 0.6);

const g = svg
  .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// create a hidden tooltip div
const tooltip = d3.select("body").append("div")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("padding", "0.4em 0.6em")
  .style("background", "rgba(0,0,0,0.7)")
  .style("color", "#fff")
  .style("border-radius", "4px")
  .style("font-size", "0.9em")
  .style("visibility", "hidden");

// parser for timestamp strings
const parseTime = d3.timeParse("2025-%m-%d %H:%M:%S".replace("2025-", "%Y-"));

// set your goal total here (40 million)
const targetTotal = 40_000_000;

// force the x-axis to end at August 31, 2025
const forcedEndDate = d3.timeParse("%Y-%m-%d %H:%M:%S")("2025-08-31 23:59:59");

// interval in milliseconds (e.g., every 5 minutes)
const refreshInterval = 5 * 60 * 1000;

// scales, axes and lines in outer scope
let xScale, yScale, xAxis, yAxis, gridLines, progressLine, targetLine, totalText;

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

  // gridlines group (drawn behind data)
  gridLines = g.append("g")
    .attr("class", "grid")
    .attr("stroke-opacity", 0.2);

  // current total text (top-right, outside plotting area)
  totalText = svg.append("text")
    .attr("x", width + margin.left + margin.right - 200)
    .attr("y", margin.top)
    .attr("text-anchor", "end")
    .attr("font-size", "2em")
    .attr("fill", "white");

  // static target line with glow
  targetLine = g.append("path")
    .attr("fill", "none")
    .attr("stroke", "#FF6F61")
    .attr("stroke-dasharray", "4 2")
    .attr("stroke-width", 4)
    .attr("filter", "url(#glow)");

  // dynamic progress worm
  progressLine = g.append("path")
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 6);
}

function updateChart(data) {
  // recompute x domain from first data date to forced end
  const startDate = d3.min(data, d => d.date);
  xScale.domain([startDate, forcedEndDate]);

  // redraw gridlines
  gridLines.call(
    d3.axisLeft(yScale)
      .ticks(8)
      .tickSize(-width)
      .tickFormat("")
  )
  .selectAll("line")
    .attr("stroke", "white");

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
      .attr("dy", "0.2em")
      .style("font-size", "1.2em");

  yAxis.call(
    d3.axisLeft(yScale)
      .ticks(8)
      .tickFormat(d3.format(".2s"))
  )
    .selectAll("text")
    .style("font-size", "1.5em");

  // target line data
  const targetData = [
    { date: startDate,     cumulative: 0 },
    { date: forcedEndDate, cumulative: targetTotal }
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

  // remove old tooltip target circles
  g.selectAll(".point-circle").remove();

  // add invisible circles for hover targets
  g.selectAll(".point-circle")
    .data(clamped)
    .enter().append("circle")
      .attr("class", "point-circle")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.cumulative))
      .attr("r", 6)
      .style("fill", "transparent")
      .style("pointer-events", "all")
      .on("mouseover", (event, d) => {
        tooltip
          .html(
            `<strong>${d3.timeFormat("%b %-d, %Y")(d.date)}</strong><br>` +
            `£${d3.format(",")(d.cumulative)}`
          )
          .style("visibility", "visible");
      })
      .on("mousemove", event => {
        tooltip
          .style("top",  (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

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
