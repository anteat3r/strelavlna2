import PocketBase from '../pocketbase.es.mjs';
const pb = new PocketBase("https://strela-vlna.gchd.cz");

const username_DOM = document.getElementById("username");
const password_DOM = document.getElementById("password");
const login_message = document.getElementById("login-message");
const login_button = document.getElementById("login");
const login_disc_button = document.getElementById("login-disc");
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
        if(localStorage.getItem("logging_from")){
            window.location.href = localStorage.getItem("logging_from");
            localStorage.removeItem("logging_from");
        }else{
            logout_button.classList.remove("hidden");
        }
        login_message.innerHTML = "Přihlášení bylo uspěsné.";
    }

    setTimeout(e=>{is_loading_running = false;}, 1000);
}

async function disc_login() {
  await pb.collection("correctors").authWithOAuth2({ prvider: "discord" })
  if(pb.authStore.isValid){
      if(localStorage.getItem("logging_from")){
          window.location.href = localStorage.getItem("logging_from");
          localStorage.removeItem("logging_from");
      }else{
          logout_button.classList.remove("hidden");
      }
      login_message.innerHTML = "Přihlášení bylo uspěsné.";
  }

  setTimeout(e=>{is_loading_running = false;}, 1000);
}
login_disc_button.addEventListener("click", disc_login);

function logout(){
    pb.authStore.clear();
    logout_button.classList.add("hidden");
    login_message.innerHTML = "";
}
logout_button.addEventListener("click", logout);

function checkAlreadyLoggedIn(){
    if(pb.authStore.isValid){
        if(localStorage.getItem("logging_from")){
            window.location.href = localStorage.getItem("logging_from");
            localStorage.removeItem("logging_from");
            return true;
        }else{
            login_message.innerHTML = "Jste již přihlášen.";
            logout_button.classList.remove("hidden");
        }
    }
    return false;
}

checkAlreadyLoggedIn();
login_button.addEventListener("click", validateButton);

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

