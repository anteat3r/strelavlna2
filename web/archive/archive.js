import yearData from "../archive/archive.json" with {type: 'json'};
//https://docs.google.com/spreadsheets/d/1KPlhODXQD08uxGzW3EeDqy0YM-MSqdEPGbkCX594-Yc/edit?pli=1&gid=0#gid=0
//https://eu.zonerama.com/Strela-Vlna/1416376
document.addEventListener("DOMContentLoaded", function() {
const mediaQuery = window.matchMedia("(max-width: 1000px)");

  function generateYearHTML(year, data) {
    return data.map(entry => `
      <div class="archive-year archive-${entry.id}">
        <div class="year-title" style="cursor: pointer;">
          ${entry.title} <i class="fas fa-chevron-right"></i>
        </div>
        <div class="archive-mobile" style="max-height: 0; overflow: hidden;">
          ${year === "2019" || year === "2018" ? '' : `
            <div class="online-round">
              <h1>Online kolo</h1>
              <div class="placement-wrapper">
                <div>
                  <p class="first-place">1. místo</p>
                  <p class="place-name">${entry.placeNameOnline1}</p>
                </div>
                <div>
                  <p class="second-place">2. místo</p>
                  <p class="place-name">${entry.placeNameOnline2}</p>
                </div>
                <div>
                  <p class="third-place">3. místo</p>
                  <p class="place-name">${entry.placeNameOnline3}</p>
                </div>
              </div>
            </div>
          `}
          ${year === "2020" || year === "2021" ? '' : `
            <div class="normal-round">
              <h1>Prezenční kolo</h1>
              <div class="placement-wrapper">
                <div>
                  <p class="first-place">1. místo</p>
                  <p class="place-name">${entry.placeNameNormal1}</p>
                </div>
                <div>
                  <p class="second-place">2. místo</p>
                  <p class="place-name">${entry.placeNameNormal2}</p>
                </div>
                <div>
                  <p class="third-place">3. místo</p>
                  <p class="place-name">${entry.placeNameNormal3}</p>
                </div>
              </div>
              <div class="image-gallery">
                <h1>Fotogalerie</h1>
                <div class="images">
                  <img src="${entry.imageLink1}">
                  <img src="${entry.imageLink2}">
                  <img src="${entry.imageLink3}">
                </div>
                <div class="more-button">
                  <a href="${entry.galleryLink}" target="_blank">Více</a>
                </div>
              </div>
            </div>
          `}
        </div>
      </div>      
    `).join('');
    
  }

  // Add logic for mobile devices to display the titles in the specified order
  function renderArchiveContent() {
  const archiveContainer = document.createElement('div');
  archiveContainer.classList.add('archive');
  let archiveHTML = ''; // Define the archiveHTML variable

  // Sort the yearData keys in descending order
  const sortedYears = Object.keys(yearData).sort((a, b) => parseInt(b) - parseInt(a));
    
  if (mediaQuery.matches) {
    // On mobile devices, show all titles at once
    sortedYears.forEach(year => {
      archiveHTML += generateYearHTML(year, yearData[year]);
    });
  } else {
    // On desktop devices, keep the existing behavior
    sortedYears.forEach((year, index) => {
      if (index === 0) {
        archiveHTML += generateYearHTML(year, yearData[year]);
      } else {
        archiveHTML += generateYearHTML(year, yearData[year]);
      }
    });
  }

  archiveContainer.innerHTML = archiveHTML;
  const yearSelector = document.querySelector('.year-selector');
  yearSelector.insertAdjacentElement('afterend', archiveContainer);
}

function initialize() {
  renderArchiveContent();
  handleYearButtons();
  handleYearTitles();
  if (!mediaQuery.matches) {
    hideAllTitlesExcept("2023");
  }
}

function handleYearButtons() {
  const yearButtons = document.querySelectorAll(".year-button");
  let activeButton = yearButtons[0];
  activeButton.classList.add("current-year-button");

  yearButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      const year = button.textContent.trim();
      if (button === activeButton) return;

      activeButton.classList.remove("current-year-button");

      // Fade out all year titles
      const allTitles = document.querySelectorAll('.archive-year');
      allTitles.forEach(function(title) {
        title.style.transition = "opacity 0.3s ease-out"; // Set transition for disappearing
        title.style.opacity = "0"; // Fade out
      });

      // Wait for the transition to finish before hiding titles and showing new ones
      setTimeout(() => {
        hideAllYears();
        button.classList.add("current-year-button");
        activeButton = button;

        // Fade in titles for the selected year
        hideAllTitlesExcept(year);
        const newTitles = document.querySelectorAll(`.archive-${year}_strela, .archive-${year}_vlna`);
        newTitles.forEach(function(title) {
          title.style.transition = "opacity 0.3s ease-out"; // Set transition for appearing
          title.style.opacity = "0"; // Start from transparent
          setTimeout(() => {
            title.style.opacity = "1"; // Fade in
          }, 10); // Small delay to allow for transition effect
        });

      }, 300); // Match the timeout to the transition duration
    });
  });
}

function handleYearTitles() {
  const yearTitles = document.querySelectorAll('.year-title');
  yearTitles.forEach(title => {
    title.addEventListener("click", function() {
      const parent = title.parentElement;
      const content = parent.querySelector('.archive-mobile');
      const icon = title.querySelector('i');
      if (content.style.maxHeight === "0px" || !content.style.maxHeight) {
        content.style.maxHeight = content.scrollHeight + "px";
        icon.style.transform = "rotate(90deg)";
      } else {
        content.style.maxHeight = "0";
        icon.style.transform = "rotate(0deg)";
      }
    });
  });
}

function hideAllYears() {
  const yearDivs = document.querySelectorAll(".archive-year");
  yearDivs.forEach(function(div) {
    const content = div.querySelector('.archive-mobile');
    const icon = div.querySelector('.year-title i');
    content.style.maxHeight = "0"; // Collapse the content
    icon.style.transform = "rotate(0deg)"; // Reset the arrow to its original position
  });
}

function hideAllTitlesExcept(year) {
  const allTitles = document.querySelectorAll('.archive-year');
  allTitles.forEach(function(title) {
    if (!title.classList.contains(`archive-${year}_strela`) && !title.classList.contains(`archive-${year}_vlna`)) {
      title.style.display = 'none'; // Hide the titles
      title.style.opacity = '0'; // Ensure titles are hidden
    } else {
      title.style.display = 'block'; // Show the titles
      title.style.opacity = '0'; // Start from transparent for fade-in
      title.style.transition = "opacity 0.3s ease-out"; // Set transition for appearing
      setTimeout(() => {
        title.style.opacity = "1"; // Fade in
      }, 10); // Small delay to allow for transition effect
    }
  });
}

let lastWidth = window.innerWidth; // Store the last width
function handleResize() {
  const currentWidth = window.innerWidth;
  if (currentWidth < 1000 && lastWidth >= 1000) {
    window.location.reload(); // Reload if crossing to mobile
  } else if (currentWidth >= 1000 && lastWidth < 1000) {
    const activeYear = document.querySelector('.current-year-button').textContent.trim();
    hideAllTitlesExcept(activeYear);
  }
  lastWidth = currentWidth; // Update the last width
}

// Initialize the content and event listeners
initialize();

// Listen for window resize events
window.addEventListener('resize', handleResize);
});

