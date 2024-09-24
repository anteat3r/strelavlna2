document.addEventListener("DOMContentLoaded", function() {
  const yearButtons = document.querySelectorAll(".year-button");
  const yearTitles = document.querySelectorAll(".year-title");
  const mediaQuery = window.matchMedia("(max-width: 1100px)");

  function handleDesktopFeatures() {
    let activeButton = yearButtons[0];
    activeButton.classList.add("current-year-button");
    const initialYearDiv = document.querySelector(`.archive-${activeButton.textContent.trim()}`);
    setMaxHeight(initialYearDiv);

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

        const yearDiv = document.querySelector(`.archive-${year}`);
        if (yearDiv) {
          setMaxHeight(yearDiv); 
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
      element.classList.add("active");

      const contentHeight = element.scrollHeight;
      element.style.maxHeight = contentHeight + "px"; 
    }
  }

  function handleMobileFeatures() {
    yearTitles.forEach(function(title) {
      const arrowIcon = title.querySelector("i");

      title.addEventListener("click", function() {
        const archiveMobileDiv = this.nextElementSibling;

        if (archiveMobileDiv && archiveMobileDiv.classList.contains("archive-mobile")) {
          if (archiveMobileDiv.style.maxHeight === "0px" || !archiveMobileDiv.style.maxHeight) {
            archiveMobileDiv.style.maxHeight = archiveMobileDiv.scrollHeight + "px"; 
            arrowIcon.classList.add("rotate");
          } else {
            archiveMobileDiv.style.maxHeight = "0px";
            arrowIcon.classList.remove("rotate");
          }
        }
      });
    });
  }

  function applyFeatures() {
    if (mediaQuery.matches) {
      handleMobileFeatures();
    } else {
      handleDesktopFeatures();
    }
  }

  applyFeatures();

  mediaQuery.addListener(function(e) {
    if (e.matches) {
      location.reload();
    } else {
      location.reload(); 
    }
  });
});
