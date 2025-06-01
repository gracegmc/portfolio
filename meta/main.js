import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

//declearing global variables
let data = await loadData();
let commits = processCommits(data);
let filteredCommits = commits;
const width = 1000;
const height = 600;
let xScale, yScale, xAxis, yAxis, svg;
let commitMaxTime;

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
  
    return data;
}
function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          // What other options do we need to set?
          // Hint: look up configurable, writable, and enumerable
        });
  
        return ret;
      });
  }

function renderCommitInfo(data, commits) {
    if (!commits || commits.length === 0) return;

    // console.log('renderCommitInfo')
    //clear existing info
    d3.select('#stats').html('');

    // Add total LOC
    const dlLOC = d3.select('#stats').append('dl').attr('class', 'stats');
    dlLOC.append('dt').html('Total <abbr title="Lines of code"> LOC</abbr>');
    dlLOC.append('dd').text(data.length);
  
    // Add total commits
    const dlTotComm = d3.select('#stats').append('dl').attr('class', 'stats');
    dlTotComm.append('dt').text('Total commits');
    dlTotComm.append('dd').text(commits.length);
  
    // Longest File (by Line Count)
    const longestFiledl = d3.select('#stats').append('dl').attr('class', 'stats');
    const fileLineCounts = d3.rollup(data, v => v.length, d => d.file);
    const longestFile = Array.from(fileLineCounts.entries()).reduce((a, b) => b[1] > a[1] ? b : a);
    longestFiledl.append('dt').text('Longest file');
    longestFiledl.append('dd').text(`${longestFile[0]}`);
    longestFiledl.append('dd').text(`(${longestFile[1]} lines)`);

    // Average File Length
    const fileLengths = d3.rollups(data, (v) => d3.max(v, (v) => v.line),(d) => d.file,);
    const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
    const avgFileLengthdl = d3.select('#stats').append('dl').attr('class', 'stats');
    avgFileLengthdl.append('dt').text('Average File Lengths');
    avgFileLengthdl.append('dd').text(averageFileLength.toFixed(2) + ' lines');


    // Most Active Day of the Week
    const mostActiveDaydl = d3.select('#stats').append('dl').attr('class', 'stats');
    const dayBuckets = d3.rollup(commits, v => v.length, d => d.datetime.toLocaleDateString('en-US', { weekday: 'long' }));
    const peakDay = Array.from(dayBuckets.entries()).reduce((a, b) => b[1] > a[1] ? b : a);
    mostActiveDaydl.append('dt').text('Most active day');
    mostActiveDaydl.append('dd').text(`${peakDay[0]}`);
    mostActiveDaydl.append('dd').text(`(${peakDay[1]} commits)`);

    // Number of files
    const numFilesdl = d3.select('#stats').append('dl').attr('class', 'stats');
    const uniqueFiles = new Set(data.map(d => d.file));
    numFilesdl.append('dt').text('Number of files');
    numFilesdl.append('dd').text(uniqueFiles.size);

}
    
function renderScatterPlot(data, filteredCommits) {
    // console.log("rendering scatterplot")
    // Clear previous chart contents
    d3.select('#chart').selectAll('*').remove();

    // Sort commits by total lines in descending order
    const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);

    //setting up the axis
    svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(filteredCommits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
      
    const dots = svg.append('g').attr('class', 'dots');
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);
    
    // Add gridlines BEFORE the axes
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // Create the axes
    xAxis = d3.axisBottom(xScale);
    yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');


    // Add X axis
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .attr('class', 'x-axis') // new line to mark the g tag
        .call(xAxis);

    // Add Y axis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis') // just for consistency
        .call(yAxis);
    
    const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt() // Change only this line
        .domain([minLines, maxLines])
        .range([2, 30]);
    
    
    const tooltip = d3.select('#tooltip');

    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id) // change this line
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', 0)
        .attr('fill', 'lightseagreen')
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .on('mouseenter', function (event, d) {
            tooltip
            .style('display', 'block')
            .html(`
                <strong>Commit:</strong> <a href="${d.url}" target="_blank">${d.id}</a><br>
                <strong>Date:</strong> ${d.datetime.toLocaleString('en', { dateStyle: 'full' })}<br>
                <strong>Time:</strong> ${d.time}<br>
                <strong>Author:</strong> ${d.author}<br>
                <strong>Lines:</strong> ${d.totalLines}
            `);
            d3.select(this).attr('stroke', 'white').attr('stroke-width', 2);
        })
        .on('mousemove', function (event) {
            tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
        })
        .on('mouseout', function () {
            tooltip.style('display', 'none');
            d3.select(this).attr('stroke', null);
        });
    
    dots
        .selectAll('circle')
        .transition()
        .duration(200)
        .attr('r', (d) => rScale(d.totalLines))
        .style("--r", d => d.radius);

    // Create brush & Update brush initialization to listen for events
    svg.call(d3.brush().on('start brush end', brushed));

    // Raise dots and everything after overlay
    svg.selectAll('.dots, .overlay ~ *').raise();
      
      
}

function updateScatterPlot(data, filteredCommits) {
    // console.log("updating")

    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
    
    //clearing the chart
    // d3.select('#chart').selectAll('*').remove();

    const svg = d3.select('#chart').select('svg');
  
    xScale = xScale.domain(d3.extent(filteredCommits, (d) => d.datetime));
  
    const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
  
    // CHANGE: we should clear out the existing xAxis and then create a new one.
    
    const xAxisGroup = svg.select('g.x-axis');
        xAxisGroup.selectAll('*').remove();
        xAxisGroup.call(xAxis);

    const dots = svg.select('g.dots');
    const tooltip = d3.select('#tooltip');
  
    const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);
    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id) // change this line
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .style("--r", d => d.radius)
        .attr('fill', 'lightseagreen')
        .on('mouseenter', function (event, d) {
            tooltip
                .style('display', 'block')
                .html(`
                    <strong>Commit:</strong> <a href="${d.url}" target="_blank">${d.id}</a><br>
                    <strong>Date:</strong> ${d.datetime.toLocaleString('en', { dateStyle: 'full' })}<br>
                    <strong>Time:</strong> ${d.time}<br>
                    <strong>Author:</strong> ${d.author}<br>
                    <strong>Lines:</strong> ${d.totalLines}
                `);
            d3.select(this).attr('stroke', 'white').attr('stroke-width', 2);
        })
        .on('mousemove', function (event) {
            tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
        })
        .on('mouseout', function () {
            tooltip.style('display', 'none');
            d3.select(this).attr('stroke', null);
        })
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots;
    
    dots
        .selectAll('circle')
        .transition()
        .duration(200)
        .attr('r', (d) => rScale(d.totalLines));
  }
  
// Main execution
try {
    const data = await loadData();
    
    if (data && data.length > 0) {
        const commits = processCommits(data);
        // Store in window for access in event handlers
        window.data = data;
        window.commits = commits;
        
        renderCommitInfo(data, filteredCommits);
        renderScatterPlot(data, filteredCommits);
        updateFileDisplay(filteredCommits)
    } else {
        console.error('No data loaded');
        document.getElementById('stats').textContent = 'Error loading data';
    }
} catch (error) {
    console.error('Error in main execution:', error);
    document.getElementById('stats').textContent = 'Error: ' + error.message;
}

// function renderTooltipContent(commit) {
//     const link = document.getElementById('commit-link');
//     const date = document.getElementById('commit-date');
//     const time = document.getElementById('commit-time')
//     const author = document.getElementById('commit-author')
//     const lines = document.getElementById('commit-lines')
//     // <!-- Add: Time, author, lines edited -->

//     if (Object.keys(commit).length === 0) return;
  
//     link.href = commit.url;
//     link.textContent = commit.id;
//     date.textContent = commit.datetime?.toLocaleString('en', {
//       dateStyle: 'full',
//     });
//     time.textContent = commit.time;
//     author.textContent = commit.author;
//     lines.textContent = commit.totalLines;
// }
  

// function updateTooltipVisibility(isVisible) {
//     const tooltip = document.getElementById('commit-tooltip');
//     tooltip.hidden = !isVisible;
// }

// function updateTooltipPosition(event) {
//     const tooltip = document.getElementById('commit-tooltip');
//     tooltip.style.left = `${event.clientX}px`;
//     tooltip.style.top = `${event.clientY}px`;
// }

// brush
function createBrushSelector(svg) {
    svg.call(d3.brush());
}

  
function isCommitSelected(selection, commit) {
    if (!selection) {
      return false;
    }
    const [x0, x1] = selection.map((d) => d[0]); 
    const [y0, y1] = selection.map((d) => d[1]); 
    const x = xScale(commit.datetime); 
    const y = yScale(commit.hourFrac); 
    return x >= x0 && x <= x1 && y >= y0 && y <= y1; 
}

function renderSelectionCount(selection) {
    const data = window.data; // Access global data
    const commits = window.commits; // Access global commits
    
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
        
    // function renderLanguageBreakdown(selection, selectedCommits) {
    const languageStats = document.getElementById('language-breakdown');
    
    if (!selection || selectedCommits.length === 0) {
        languageStats.innerHTML = '';
        return;
    }
}

function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language

    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type,
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
                <dt>${language}</dt>
                <dd>${count} lines (${formatted})</dd>
          `;
    }
}  

function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
        isCommitSelected(selection, d),
    );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
}

let commitProgress = 100;
let timeScale = d3.scaleTime(
    [d3.min(commits, (d) => d.datetime), d3.max(commits, (d) => d.datetime)],
    [0, 100],
);

const silder = document.getElementById("time-slider");
const selectedTime = document.getElementById("max-commit-time");

silder.addEventListener('input', function () {
    commitProgress = +this.value;
    onTimeSliderChange();
}); 

function onTimeSliderChange() {
    commitMaxTime = timeScale.invert(commitProgress); // Get slider value
    updateToDatetime();
}

function updateToDatetime(){
    // Optionally sync the slider position visually (if desired)
    commitProgress = timeScale(commitMaxTime);
    silder.value = commitProgress;

    selectedTime.textContent = commitMaxTime
            .toLocaleString('en-US', { timeStyle: 'short' , dateStyle: "long"}); // Display formatted time     
    
    // Call updateScatterPlot to reflect the changes on the map
    filteredCommits = getFilterCommits();
    updateScatterPlot(data, filteredCommits);
    updateFileDisplay(filteredCommits);
    renderCommitInfo(data, filteredCommits);
}

function getFilterCommits(){
    return commits.filter(d => d.datetime < commitMaxTime);
}

// This code updates the div info
function updateFileDisplay(filteredCommits) {
    let lines = filteredCommits.flatMap((d) => d.lines);
    let files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
            return { name, lines };
        })
        .sort((a, b) => b.lines.length - a.lines.length);

    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let filesContainer = d3
        .select('#files')
        .selectAll('div')
        .data(files, (d) => d.name)
        .join(
        // This code only runs when the div is initially rendered
        (enter) =>
            enter.append('div').call((div) => {
            div.append('dt').append('code');
            div.append('dd');
            }),
        
        );
   
    filesContainer.select('dt > code').text((d) => d.name);
     // append one div for each line
     filesContainer
        .select('dd')
        .selectAll('div')
        .data((d) => d.lines)
        .join('div')
        .attr('class', 'loc')
        .attr('style', (d) => `--color: ${colors(d.type)}`);
}

d3.select('#scatter-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html(
        (d, i) => `
            On ${d.datetime.toLocaleString('en', {
        dateStyle: 'full',
        timeStyle: 'short',
        })},
            I made <a href="${d.url}" target="_blank">${
        i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
        }</a>.
            I edited ${d.totalLines} lines across ${
        d3.rollups(
            d.lines,
            (D) => D.length,
            (d) => d.file,
        ).length
        } files.
            Then I looked over all I had made, and I saw that it was very good.
        `,
);

function onStepEnter(response) {
    // console.log(response);
    const stepData = response.element.__data__;
    const stepDate = stepData.datetime;

    // Optional: Log to debug
    // console.log('Scroll step datetime:', stepDate);

    commitMaxTime = stepDate;
    updateToDatetime();
}
  
const scroller = scrollama();
  scroller
    .setup({
        container: '#scrolly-1',
        step: '#scrolly-1 .step',
    })
    .onStepEnter(onStepEnter);
  