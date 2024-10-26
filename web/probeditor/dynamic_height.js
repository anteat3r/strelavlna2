function adjustDivHeight() {
    const div = document.getElementById('main-content');

    const divTop = div.getBoundingClientRect().top;
    
    // Calculate the remaining height from the top of the div to the bottom of the viewport
    const remainingHeight_div = window.innerHeight - divTop;
    
    // Set the div's height dynamically
    div.style.height = `${remainingHeight_div}px`;
}
  
  // Adjust the div height on page load and when the window is resized
  window.addEventListener('load', adjustDivHeight);
  window.addEventListener('resize', adjustDivHeight);
  