import PocketBase from '../../node_modules/pocketbase/dist/pocketbase.es.mjs'
const pb = new PocketBase("https://strela-vlna.gchd.cz");

const username_DOM = document.getElementById("username");
const password_DOM = document.getElementById("password");
const login_message = document.getElementById("login-message");
const login_button = document.getElementById("login");
const logout_button = document.getElementById("logout");

logout_button.classList.add("hidden");

async function login(username, password){
    if(checkAlreadyLoggedIn()) return;

    animation_color = "#3eb1df";
    is_loading_running = true;
    try {
        const response = await pb.collection('correctors').authWithPassword(username, password);
    } catch (error) {
        login_message.innerHTML = "Přihlašovací údaje nesedí.";
        setTimeout(e=>{is_loading_running = false;}, 1000);
        return;
    }
    if(pb.authStore.isValid){
        if(getCookie("logging_from")){
            window.location.href = getCookie("logging_from");
            deleteCookie("logging_from");
        }else{
            logout_button.classList.remove("hidden");
        }
        login_message.innerHTML = "Přihlášení bylo uspěsné.";
    }

    setTimeout(e=>{is_loading_running = false;}, 1000);
}

function logout(){
    pb.authStore.clear();
    logout_button.classList.add("hidden");
    login_message.innerHTML = "";
}
logout_button.addEventListener("click", logout);

function checkAlreadyLoggedIn(){
    if(pb.authStore.isValid){
        if(getCookie("logging_from")){
            window.location.href = getCookie("logging_from");
            deleteCookie("logging_from");
            return true;
        }else{
            login_message.innerHTML = "Jste již přihlášen.";
            logout_button.classList.remove("hidden");
        }
    }
    return false;
}

checkAlreadyLoggedIn();
await login_button.addEventListener("click", validateButton);

async function validateButton(){
    if(!username_DOM.value == "" && !password_DOM.value == ""){
        await login(username_DOM.value, password_DOM.value);
    }
}

username_DOM.addEventListener("input", () => {
    login_message.innerHTML = "";
});
password_DOM.addEventListener("input", () => {
    login_message.innerHTML = "";
});

