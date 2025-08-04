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
const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

// goal and milestones
const targetTotal = 40_000_000;
const milestoneSteps = [10_000_000, 20_000_000, 30_000_000];

const forcedEndDate = parseTime("2025-08-31 23:59:59");
const refreshInterval = 5 * 60 * 1000;

// enforce US formatting with dollar sign
const usLocale = d3.formatLocale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});
const formatCurrency = usLocale.format("$,.0f");

let xScale, yScale, xAxis, yAxis, gridLines, progressLine, targetLine, totalText;

function initChart() {
  xScale = d3.scaleTime().range([0, width]);
  yScale = d3.scaleLinear().domain([0, targetTotal]).range([height, 0]);

  xAxis = g.append("g").attr("transform", `translate(0,${height})`);
  yAxis = g.append("g");
  gridLines = g.append("g").attr("class", "grid").attr("stroke-opacity", 0.2);

  totalText = svg.append("text")
    .attr("x", width + margin.left + margin.right - 200)
    .attr("y", margin.top)
    .attr("text-anchor", "end")
    .attr("font-size", "2em")
    .attr("fill", "white")
    .attr("font-weight", "bold")
    .attr("text-shadow", "0 0 6px rgba(255,255,255,0.6)");

  targetLine = g.append("path")
    .attr("fill", "none")
    .attr("stroke", "#FF6F61")
    .attr("stroke-dasharray", "4 2")
    .attr("stroke-width", 4)
    .attr("filter", "url(#glow)");

  progressLine = g.append("path")
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 6)
    .attr("stroke-linecap", "round");
}

function updateChart(data) {
  const startDate = d3.min(data, d => d.date);
  xScale.domain([startDate, forcedEndDate]);

  gridLines.call(d3.axisLeft(yScale).ticks(8).tickSize(-width).tickFormat(""))
    .selectAll("line")
    .attr("stroke", "#444").attr("stroke-dasharray", "2,2");

  xAxis.call(d3.axisBottom(xScale)
    .ticks(d3.timeDay.every(5))
    .tickFormat(d3.timeFormat("%b %-d")))
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-45)")
    .attr("dx", "-0.6em")
    .attr("dy", "0.2em")
    .style("font-size", "1.2em")
    .style("fill", "#ccc");

  yAxis.call(d3.axisLeft(yScale).ticks(8).tickFormat(usLocale.format(".2s")))
    .selectAll("text")
    .style("font-size", "1.5em")
    .style("fill", "#ccc");

  const targetData = [
    { date: startDate, cumulative: 0 },
    { date: forcedEndDate, cumulative: targetTotal }
  ];
  targetLine.datum(targetData)
    .attr("d", d3.line().x(d => xScale(d.date)).y(d => yScale(d.cumulative)));

  const clamped = data.map(d => ({
    date: d.date,
    cumulative: Math.min(d.cumulative, targetTotal)
  }));
  progressLine.datum(clamped)
    .transition().duration(1000)
    .attr("d", d3.line().x(d => xScale(d.date)).y(d => yScale(d.cumulative)));

  g.selectAll(".point-circle").remove();
  g.selectAll(".point-circle")
    .data(clamped)
    .enter().append("circle")
    .attr("class", "point-circle")
    .attr("cx", d => xScale(d.date))
    .attr("cy", d => yScale(d.cumulative))
    .attr("r", 6)
    .style("fill", "#fff")
    .style("opacity", 0.2)
    .style("pointer-events", "all")
    .on("mouseover", (event, d) => {
      tooltip.html(`<strong>${d3.timeFormat("%b %-d, %Y")(d.date)}</strong><br>${formatCurrency(d.cumulative)}`)
        .style("visibility", "visible");
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  g.selectAll(".milestone-line").remove();
  g.selectAll(".milestone-label").remove();
  milestoneSteps.forEach(m => {
    g.append("line")
      .attr("class", "milestone-line")
      .attr("x1", 0).attr("x2", width)
      .attr("y1", yScale(m)).attr("y2", yScale(m))
      .attr("stroke", "#aaa")
      .attr("stroke-dasharray", "2,2");
    g.append("text")
      .attr("class", "milestone-label")
      .attr("x", width - 5)
      .attr("y", yScale(m) - 6)
      .attr("text-anchor", "end")
      .attr("fill", "#aaa")
      .attr("font-size", "0.9em")
      .text(`${formatCurrency(m)} milestone`);
  });

  const latest = clamped[clamped.length - 1].cumulative;
  totalText.text(`Current total: ${formatCurrency(latest)}`);
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
