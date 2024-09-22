function adjustDivHeight() {
    const div = document.getElementById('teams-problems');
    const chat_wrapper = document.getElementById("chat-wrapper");   
    const conversation_wrapper = document.getElementById("conversation-wrapper");

    // Get the distance from the top of the viewport to the top of the div
    const divTop = div.getBoundingClientRect().top;
    const chat_wrapperTop = chat_wrapper.getBoundingClientRect().top;
    const conversation_wrapperTop = conversation_wrapper.getBoundingClientRect().top;
    
    
    // Calculate the remaining height from the top of the div to the bottom of the viewport
    const remainingHeight_div = window.innerHeight - divTop - 204;
    const remainingHeight_chat_wrapper = window.innerHeight - chat_wrapperTop - 4;
    const remainingHeight_conversation_wrapper = window.innerHeight - conversation_wrapperTop - 104;
    
    // Set the div's height dynamically
    div.style.height = `${remainingHeight_div}px`;
    chat_wrapper.style.height = `${remainingHeight_chat_wrapper}px`;
    // Set the conversation_wrapper's height dynamically
    conversation_wrapper.style.height = `${remainingHeight_conversation_wrapper}px`;
    

  }
  
  // Adjust the div height on page load and when the window is resized
  window.addEventListener('load', adjustDivHeight);
  window.addEventListener('resize', adjustDivHeight);
  