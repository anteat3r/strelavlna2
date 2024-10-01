document.addEventListener("DOMContentLoaded", function() {
  // Dynamic content for the years
  const yearData = {
    "2023": [
      {
        id: "2023_strela",
        title: "Pražská střela 2023",
        placeNameOnline1: "N/A",
        placeNameOnline2: "N/A",
        placeNameOnline3: "N/A",
        placeNameNormal1: "N/A",
        placeNameNormal2: "N/A",
        placeNameNormal3: "N/A",
        imageLink1: "../images/placeholder.png",
        imageLink2: "../images/placeholder.png",
        imageLink3: "../images/placeholder.png",
      },
      {
        id: "2023_vlna",
        title: "Dopplerova vlna 2023",
        placeNameOnline1: "N/A",
        placeNameOnline2: "N/A",
        placeNameOnline3: "N/A",
        placeNameNormal1: "N/A",
        placeNameNormal2: "N/A",
        placeNameNormal3: "N/A",
        imageLink1: "../images/placeholder.png",
        imageLink2: "../images/placeholder.png",
        imageLink3: "../images/placeholder.png",
      }
    ],
    "2022": [
      {
        id: "2022_strela",
        title: "Pražská střela 2022",
        placeNameOnline1: "N/A",
        placeNameOnline2: "N/A",
        placeNameOnline3: "N/A",
        placeNameNormal1: "N/A",
        placeNameNormal2: "N/A",
        placeNameNormal3: "N/A",
        imageLink1: "../images/placeholder.png",
        imageLink2: "../images/placeholder.png",
        imageLink3: "../images/placeholder.png",
      },
      {
        id: "2022_vlna",
        title: "Dopplerova vlna 2022",
        placeNameOnline1: "N/A",
        placeNameOnline2: "N/A",
        placeNameOnline3: "N/A",
        placeNameNormal1: "N/A",
        placeNameNormal2: "N/A",
        placeNameNormal3: "N/A",
        imageLink1: "../images/placeholder.png",
        imageLink2: "../images/placeholder.png",
        imageLink3: "../images/placeholder.png",
      }
    ],
    // Other years...
  };

  // Function to generate the HTML for each year entry
  function generateYearHTML(year, data) {
    return data.map(entry => `
      <div class="archive-year archive-${entry.id}">
        <div class="year-title" style="cursor: pointer;">
          ${entry.title} <i class="fas fa-chevron-right"></i>
        </div>
        <div class="archive-mobile" style="max-height: 0; overflow: hidden;"> <!-- Content hidden by default -->
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
                <a href="about:blank" target="_blank">Více</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Function to render the archive content for all years
  function renderArchiveContent() {
    const archiveContainer = document.createElement('div');
    archiveContainer.classList.add('archive'); // Create the archive container

    let archiveHTML = '';

    // Loop through each year's data and generate the HTML
    Object.keys(yearData).forEach(year => {
      archiveHTML += generateYearHTML(year, yearData[year]);
    });

    // Insert the generated HTML into the archive container
    archiveContainer.innerHTML = archiveHTML;

    // Find the .year-selector and insert the archive content after it
    const yearSelector = document.querySelector('.year-selector');
    if (yearSelector) {
      yearSelector.insertAdjacentElement('afterend', archiveContainer);  // Append archive container after year selector
    } else {
      console.error("No .year-selector found in the HTML.");
    }

    // Hide all titles except for the year 2023
    hideAllTitlesExcept('2023');
  }

  // Function to hide all year titles except the selected year
  function hideAllTitlesExcept(year) {
    const allTitles = document.querySelectorAll('.archive-year');
    allTitles.forEach(function(title) {
      if (!title.classList.contains(`archive-${year}_strela`) && !title.classList.contains(`archive-${year}_vlna`)) {
        title.style.display = 'none'; // Hide the title
      } else {
        title.style.display = 'block'; // Show the title
      }
    });
  }

  // Call the functions to render the content
  renderArchiveContent();

  // Handling button clicks for year buttons
  const yearButtons = document.querySelectorAll(".year-button");
  if (yearButtons.length === 0) {
    console.error("No year buttons found");
    return;
  }

  let activeButton = yearButtons[0];
  activeButton.classList.add("current-year-button");

  // Enable unrolling each year entry by clicking on the .year-title
  const yearTitles = document.querySelectorAll('.year-title');
  yearTitles.forEach(function(title) {
    title.addEventListener("click", function() {
      const parent = title.parentElement; // Get the parent .archive-year div
      const content = parent.querySelector('.archive-mobile');
      const icon = title.querySelector('i'); // Get the icon to rotate

      if (content.style.maxHeight === "0px" || !content.style.maxHeight) {
        content.style.maxHeight = content.scrollHeight + "px"; // Expand
        icon.style.transform = "rotate(90deg)"; // Rotate the arrow 90 degrees
      } else {
        content.style.maxHeight = "0"; // Collapse
        icon.style.transform = "rotate(0deg)"; // Reset the arrow to its original position
      }
    });
  });

  yearButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      const year = button.textContent.trim();

      if (button === activeButton) {
        return;
      }

      activeButton.classList.remove("current-year-button");

      hideAllYears();

      button.classList.add("current-year-button");
      activeButton = button;

      // Show only the titles for the selected year
      hideAllTitlesExcept(year);
    });
  });

  function hideAllYears() {
    const yearDivs = document.querySelectorAll(".archive-year");
    yearDivs.forEach(function(div) {
      const content = div.querySelector('.archive-mobile');
      content.style.maxHeight = "0"; // Collapse the content
      const icon = div.querySelector('.year-title i'); // Reset the arrow to its original position
      icon.style.transform = "rotate(0deg)";
    });
  }

  function setMaxHeight(element) {
    if (!element) return; // Safeguard if element is null

    const content = element.querySelector('.archive-mobile');
    const contentHeight = content.scrollHeight;
    content.style.maxHeight = contentHeight + "px";
  }
});
