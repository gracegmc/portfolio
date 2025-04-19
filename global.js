console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

//assign navbar a list of url
let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'cv/', title: 'CV' },
    { url: 'https://github.com/gracegmc', title: 'Github' },
  ];

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"                  // Local server
    : "/portfolio/";         // GitHub Pages repo name

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
    }

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    } 

    // a.classList.toggle(
    //     'current',
    //     a.host === location.host && a.pathname === location.pathname,
    // );

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
    // Apply the color scheme to the root element
    document.documentElement.style.setProperty('color-scheme', colorScheme);
    
    // Save the preference to localStorage
    localStorage.colorScheme = colorScheme;
}

const select = document.getElementById('color-scheme-select');

if ("colorScheme" in localStorage) {
    // Apply the saved preference
    setColorScheme(localStorage.colorScheme);
    
    // Update the select element to match
    select.value = localStorage.colorScheme;
}

select.addEventListener('input', function (event) {
    setColorScheme(event.target.value)
});
  
  