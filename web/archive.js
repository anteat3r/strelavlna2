document.addEventListener("DOMContentLoaded", function() {
    const yearButtons = document.querySelectorAll(".year-button");
    const yearSelector = document.querySelector(".year-selector");
  
    // Initially, activate the first button and show its content
    let activeButton = yearButtons[0];
    activeButton.classList.add("current-year-button");
    const initialYearDiv = document.querySelector(`.archive-${activeButton.textContent.trim()}`);
    setMaxHeight(initialYearDiv);
  
    yearButtons.forEach(function(button) {
      button.addEventListener("click", function() {
        const year = button.textContent.trim();
  
        // Check if the clicked button is already active
        if (button === activeButton) {
          return; // Do nothing if it's the only active button
        }
  
        // Remove 'current-year-button' from the previously active button
        activeButton.classList.remove("current-year-button");
  
        // Hide all year content
        hideAllYears();
  
        // Set the clicked button as the new active one
        button.classList.add("current-year-button");
        activeButton = button;
  
        // Show the corresponding year div with dynamic height
        const yearDiv = document.querySelector(`.archive-${year}`);
        if (yearDiv) {
          setMaxHeight(yearDiv); // Apply the dynamic max-height
        }
      });
    });
  
    // Function to hide all year divs
    function hideAllYears() {
      const yearDivs = document.querySelectorAll(".archive-year");
      yearDivs.forEach(function(div) {
        div.style.maxHeight = "0"; // Reset max-height to 0 for smooth closing
      });
    }
  
    // Function to set dynamic max-height
    function setMaxHeight(element) {
      element.classList.add("active");
  
      // Calculate content height using scrollHeight
      const contentHeight = element.scrollHeight;
      element.style.maxHeight = contentHeight + "px"; // Set max-height dynamically
    }
  });
  