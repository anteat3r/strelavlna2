//https://docs.google.com/spreadsheets/d/1KPlhODXQD08uxGzW3EeDqy0YM-MSqdEPGbkCX594-Yc/edit?pli=1&gid=0#gid=0;
//https://eu.zonerama.com/Strela-Vlna/1416376
document.addEventListener("DOMContentLoaded", function() {
let yearData;
fetch('../archive/archive.json')
  .then(response => {
    return response.json();
  })
  .then(data => {
    yearData = data;
    initialize();
  })
  .catch(error => {
    console.error('Error loading JSON:', error);
  });
  function generateYearHTML(year, data) {
    return data.map(entry => `
      <div class="archive-year ${entry.type} archive-${entry.id}">
        <div class="year-title">
          <img class="logo_${entry.type}" src = "../images/${entry.type}.png"</img>${entry.title} <i class="fas fa-chevron-right"></i>
        </div>
        <div class="archive-mobile">
          ${year === "2019" || year === "2018" ? '' : `
            <div class="online-round">
              <h1>Online kolo</h1>
              <div class="placement-wrapper">
                <div>
                  <p class="first-place">1. místo</p>
                  <p class="place-name">${entry.placeNameOnline1}</p>
                  <p class="place-name">${entry.schoolOnline1}</p>
                </div>
                <div>
                  <p class="second-place">2. místo</p>
                  <p class="place-name">${entry.placeNameOnline2}</p>
                  <p class="place-name">${entry.schoolOnline2}</p>
                </div>
                <div>
                  <p class="third-place">3. místo</p>
                  <p class="place-name">${entry.placeNameOnline3}</p>
                  <p class="place-name">${entry.schoolOnline3}</p>
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
                  <p class="place-name">${entry.schoolNormal1}</p>
                </div>
                <div>
                  <p class="second-place">2. místo</p>
                  <p class="place-name">${entry.placeNameNormal2}</p>
                  <p class="place-name">${entry.schoolNormal2}</p>
                </div>
                <div>
                  <p class="third-place">3. místo</p>
                  <p class="place-name">${entry.placeNameNormal3}</p>
                  <p class="place-name">${entry.schoolNormal3}</p>
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
  archiveContainer.classList.add('.archive-title');
  let archiveHTML = ''; // Define the archiveHTML variable

  // Sort the yearData keys in descending order
  const sortedYears = Object.keys(yearData).sort((a, b) => parseInt(b) - parseInt(a));
    
  sortedYears.forEach(year => {
    archiveHTML += generateYearHTML(year, yearData[year]);
  });

  archiveContainer.innerHTML = archiveHTML;
  const yearSelector = document.querySelector('.archive-title');
  yearSelector.insertAdjacentElement('afterend', archiveContainer);
}


function initialize() {
  renderArchiveContent();
  handleYearTitles();
}

function handleYearTitles() {
  const yearTitles = document.querySelectorAll('.year-title');
  yearTitles.forEach(title => {
    let canClick = true;
    title.addEventListener("click", function() {
      if (!canClick) return;
      canClick = false;
      const parent = title.parentElement;
      const content = parent.querySelector('.archive-mobile');
      const icon = title.querySelector('i');
      const normalRound = content.querySelector('.normal-round')
      if (content.style.maxHeight ===  "30px" || content.style.maxHeight ===  "0px" || !content.style.maxHeight) {
        content.style.maxHeight = content.scrollHeight + "px";  
        icon.style.transform = "rotate(90deg)";
          if (parent.classList.contains('archive-2018_vlna') || parent.classList.contains('archive-2019_vlna')){
            normalRound.style.marginTop = "0";
            normalRound.style.paddingTop = 30 + "px";
          }
          if (parent.classList.contains('archive-2018_strela') || parent.classList.contains('archive-2019_strela')){
            title.style.marginBottom = "0";
          }
      } 
      else {
        if (parent.classList.contains('archive-2018_strela') || parent.classList.contains('archive-2019_strela')){
          setTimeout(() => {
            title.style.marginBottom = -2 + "px";
          },500)
        }
        if (parent.classList.contains('vlna')){
          content.style.maxHeight = 30 + "px";
          if (parent.classList.contains('archive-2018_vlna') || parent.classList.contains('archive-2019_vlna')){
            setTimeout(() => {
              normalRound.style.marginTop = 30 + "px";
              normalRound.style.paddingTop = 2 + "px";
            },500)
          }
        }
        else {
          content.style.maxHeight = "0";
        };
        icon.style.transform = "rotate(0deg)";
      }
      setTimeout(() => {
        canClick = true;
      }, 500);
    });
  });
}
});

