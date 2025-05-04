import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
const projectTitle = document.querySelector('.projects-title');
projectTitle.textContent = `${projects.length} Projects`;

// plotting of pie chart for project years
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let arcs = arcData.map((d) => arcGenerator(d));
    
    //Clear previous SVG paths
    let svg = d3.select('svg');
    svg.selectAll('path').remove();
    // Clear previous legend items
    let legend = d3.select('.legend');
    legend.selectAll('li').remove();


    arcs.forEach((arc, idx) => {
        d3.select('svg')
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(idx))
    })
    
    data.forEach((d, idx) => {
    legend
        .append('li')
            .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
                
    });
}

//initializing pie chart as page loads
let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year,
);
let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
});
let colors = d3.scaleOrdinal(d3.schemeTableau10);

let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let arcs = arcData.map((d) => arcGenerator(d));

//Clear previous SVG paths
let svg = d3.select('svg');
svg.selectAll('path').remove();
// Clear previous legend items
let legend = d3.select('.legend');
legend.selectAll('li').remove();


arcs.forEach((arc, idx) => {
    d3.select('svg')
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(idx))
})

data.forEach((d, idx) => {
legend
    .append('li')
        .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
            
});

// allowing searching projects
let query = '';
let filteredProjects = projects
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  // update query value
  query = event.target.value;
  // filter projects
  filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  // render filtered projects
  renderProjects(filteredProjects, projectsContainer, 'h2');

  // update pie chart as needed
  renderPieChart(filteredProjects)

});

// allow for selection of pie chart wedges
let selectedIndex = -1;
svg.selectAll('path').remove();

arcs.forEach((arc, i) => {
  svg
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(i))
    .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        svg
            .selectAll('path')
            .attr('class', (_, idx) => (
                idx === selectedIndex ? 'selected' : ''
            ));
        legend
            .selectAll('li')
            .attr('class', (_, idx) => (
                idx === selectedIndex ? 'selected' : ''
            ));
        if (selectedIndex === -1) {
            renderProjects(projects, projectsContainer, 'h2');
        } else {
            let selectedYear = data[selectedIndex].label;
            let filteredProjects = projects.filter((p) => p.year === selectedYear);
            renderProjects(filteredProjects, projectsContainer, 'h2');
        }
      });
});
  
