document.addEventListener("DOMContentLoaded", function() {
  // Dynamic content for the years
  const yearData = {
    "2023": [
      {
        id: "2023_strela", // Unique ID for each entry
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
        id: "2023_vlna", // Unique ID for each entry
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
        id: "2022_strela", // Unique ID for each entry
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
        id: "2022_vlna", // Unique ID for each entry
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
    "2019": [
      {
        id: "2019_strela", // Unique ID for each entry
        title: "Pražská střela 2019",
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
        id: "2019_vlna", // Unique ID for each entry
        title: "Dopplerova vlna 2019",
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
    "2018": [
      {
        id: "2018_strela", // Unique ID for each entry
        title: "Pražská střela 2018",
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
        id: "2018_vlna", // Unique ID for each entry
        title: "Dopplerova vlna 2018",
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
  };

  // Function to generate the HTML for each year entry
  function generateYearHTML(year, data) {
    return data.map(entry => `
      <div class="archive-year archive-${entry.id}" style="max-height: 0; overflow: hidden;">
        <div class="year-title">
          ${entry.title} <i class="fas fa-chevron-right"></i>
        </div>
        <div class="archive-mobile">
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
  const initialYearDiv = document.querySelector(`.archive-${yearData[activeButton.textContent.trim()][0].id}`); // Use the ID of the first entry for initial height

  // Check if the initialYearDiv exists before setting max height
  if (initialYearDiv) {
    setMaxHeight(initialYearDiv);
  } else {
    console.error("No initial year div found");
  }

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

      const yearDivs = document.querySelectorAll(`.archive-${year}_strela, .archive-${year}_vlna`); // Look for all entries of the specified year

      // Check if yearDivs exist before calling setMaxHeight
      if (yearDivs.length > 0) {
        yearDivs.forEach(setMaxHeight); // Set max height for all entries of the specified year
      } else {
        console.error(`No year div found for year: ${year}`);
      }
    });
  });

  function hideAllYears() {
    const yearDivs = document.querySelectorAll(".archive-year");
    yearDivs.forEach(function(div) {
      div.style.maxHeight = "0";
    });
  }

  function setMaxHeight(element) {
    if (!element) return; // Safeguard if element is null

    element.classList.add("active");

    const contentHeight = element.scrollHeight;
    element.style.maxHeight = contentHeight + "px";
  }
});
