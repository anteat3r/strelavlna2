
document.addEventListener("DOMContentLoaded", function() {
    const yearButtons = document.querySelectorAll(".year-button");
    const selectedYearDisplay = document.getElementById("selected-year");
  
    yearButtons.forEach(function(button) {
      button.addEventListener("click", function() {
        // Get the year from the clicked button's text
        const year = button.textContent.trim();
  
        // If the clicked button is already active, remove the class and clear the display
        if (button.classList.contains("current-year-button")) {
          button.classList.remove("current-year-button");
          selectedYearDisplay.textContent = ""; // Clear the selected year
          hideAllYears(); // Hide all year content
        } else {
          // Remove the 'current-year-button' class from all buttons
          yearButtons.forEach(function(btn) {
            btn.classList.remove("current-year-button");
          });
  
          // Add the 'current-year-button' class to the clicked button
          button.classList.add("current-year-button");
  
          // Display the selected year (trim to remove extra spaces)
          //selectedYearDisplay.textContent = "Selected Year: " + year;
  
          // Hide all year divs, then show the selected year div
          hideAllYears();
          const yearDiv = document.querySelector(`.archive-${year}`);
          if (yearDiv) {
            yearDiv.style.display = "block";
          }
        }
      });
    });
  
    // Function to hide all year divs
    function hideAllYears() {
      const yearDivs = document.querySelectorAll(".archive-year");
      yearDivs.forEach(function(div) {
        div.style.display = "none";
      });
    }
  });
  




