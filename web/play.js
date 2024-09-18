const buy_button_wrapper = document.getElementById("buy-button-wrapper");
const buy_button = document.getElementById("buy-button");


buy_button.addEventListener("click", function(){
    if(buy_button_wrapper.classList.contains("buy-button-close")){
        buy_button_wrapper.classList.add("buy-button-open");
        buy_button_wrapper.classList.remove("buy-button-close");
    }else{
        buy_button_wrapper.classList.add("buy-button-close");
        buy_button_wrapper.classList.remove("buy-button-open");
    }
})
