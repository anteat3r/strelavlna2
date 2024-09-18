const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

const id_field = document.getElementById("id");
const login_message = document.getElementById("login-message");
const button = document.getElementById("validate_play");

function checkId(id){
    animation_color = "#3eb1df";
    is_loading_running = true;
    fetch(`https://strela-vlna.gchd.cz/api/validate_play?id=${id}`)
        .then(response => response.text())
        .then(data => {
            if(data == "free"){
                window.location.href = `play.html?id=${id}`;
            }else if(data == "not running"){
                login_message.innerHTML = "*Hra momentě neběží";
            }else if(data = "full"){
                login_message.innerHTML = "*Maximální počet hráču na tým dosažen";
            }else{
                id_field.value = "";
                const url = new URL(window.location.href);
                url.searchParams.delete('id');
                window.history.replaceState({}, '', url.toString());
                login_message.innerHTML = "*Neplatný kód";
            }
            
            setTimeout(() => {
                is_loading_running = false;
            }, 1000);
            
        });
    
    
}


if(id == null){
    console.log("nothing");
    // window.location.href = "index.html";
}else{
    id_field.value = id;
    checkId(id);
}

button.addEventListener("click", validateButton);

function validateButton(){
    console.log("doing something");
    if(!id_field.value == ""){
        checkId(id_field.value);
    }
}

id_field.addEventListener("input", () => {
    login_message.innerHTML = "";
});

