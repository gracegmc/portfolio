console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

//assign navbar a list of url
let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/index.html', title: 'Projects' },
    { url: 'contact/index.html', title: 'Contact' },
    { url: 'cv/index.html', title: 'CV' },
    { url: 'https://github.com/gracegmc', title: 'Github' },
  ];

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/labs/lab1/portfolio/"                  // Local server
    : "/portfolio/";         // GitHub Pages repo name

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    url = !url.startsWith('http') ? BASE_PATH + url : url;

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    } 

    if (a.host !== location.host) {
        a.target = "_blank";
    } 

    nav.append(a);
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
              <option value="light dark">Automatic</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
          </select>
      </label>`,
);

// Function to set the color scheme to prevent redundant code
function setColorScheme(colorScheme) {
    // Apply the color scheme
    document.documentElement.style.setProperty('color-scheme', colorScheme);
    
    // Save the color-scheme preference to localStorage
    localStorage.colorScheme = colorScheme;
}

const select = document.querySelector('.color-scheme select');

if ("colorScheme" in localStorage) {
    // Apply the saved preference
    setColorScheme(localStorage.colorScheme);
    
    // Update the select element to match
    select.value = localStorage.colorScheme;
}

select.addEventListener('input', function (event) {
    setColorScheme(event.target.value)
});
  
  