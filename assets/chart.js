// assets/chart.js

// select SVG and set up margins
const svg = d3.select("#chart"),
      margin = { top: 20, right: 30, bottom: 30, left: 50 },
      width  = svg.node().clientWidth  - margin.left - margin.right,
      height = svg.node().clientHeight - margin.top  - margin.bottom,
      g = svg
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

// parser for your timestamp strings
const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

// set your goal total here (40 million)
const targetTotal = 40_000_000;

// force the x-axis to end at August 31, 2025
const forcedEndDate = parseTime("2025-08-31 23:59:59");

d3.csv("teamwater_progress.csv", row => ({
  date:   parseTime(row.timestamp),  // parse timestamp → Date
  amount: +row.amount                // coerce amount → Number
}))
.then(raw => {
  // filter out any bad parses
  const clean = raw.filter(d => d.date instanceof Date && !isNaN(d.date));

  // if amount is already cumulative, map directly
  const data = clean
    .sort((a, b) => a.date - b.date)
    .map(d => ({ date: d.date, cumulative: d.amount }));

  console.log("Using cumulative values:", data.map(d => d.cumulative));

  if (data.length === 0) {
    console.error("No valid data to plot.");
    return;
  }

  // scales
  const x = d3.scaleTime()
              .domain([d3.min(data, d => d.date), forcedEndDate])
              .range([0, width]);

  const y = d3.scaleLinear()
              .domain([0, targetTotal])
              .range([height, 0]);

  // axes
  g.append("g")
   .call(d3.axisLeft(y)
     .ticks(8)
     .tickFormat(d3.format(".2s"))  // e.g. “10M”
   );

  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(
     d3.axisBottom(x)
       .ticks(d3.timeDay.every(5))
       .tickFormat(d3.timeFormat("%b %-d"))
   )
   .selectAll("text")
     .attr("text-anchor","end")
     .attr("transform","rotate(-45)")
     .attr("dx","-0.6em")
     .attr("dy","0.2em");

  // draw progress “worm” (clamped to target)
  g.append("path")
    .datum(data.map(d => ({
      date:       d.date,
      cumulative: Math.min(d.cumulative, targetTotal)
    })))
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 8)
    .attr("d", d3.line()
      .x(d => x(d.date))
      .y(d => y(d.cumulative))
    );

  // draw straight-line target
  g.append("path")
    .datum([
      { date: d3.min(data, d => d.date), cumulative: 0 },
      { date: forcedEndDate,                   cumulative: targetTotal }
    ])
    .attr("fill", "none")
    .attr("stroke", "tomato")
    .attr("stroke-dasharray", "4 2")
    .attr("d", d3.line()
      .x(d => x(d.date))
      .y(d => y(d.cumulative))
    );
})
.catch(err => console.error("Error loading CSV:", err));
