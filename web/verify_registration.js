const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

const infoP = document.getElementById("register-verification-information-paragraph");
const infoT = document.getElementById("register-verification-title");



window.addEventListener("load", () => {
    console.log(id);
    is_loading_running = true;
    animation_color = "#3118ba"

    fetch(`https://strela-vlna.gchd.cz/api/regconfirm/${id}`, {
        method: 'GET',
    })
    .then(response => {
        if (response.ok) {
            infoT.innerHTML = "Hotovo!";
            infoP.innerHTML = "Registrace proběhla úspěšně";
        } else {
            infoT.innerHTML = "Chyba!";
            response.text().then(e =>{
                infoP.innerHTML = e;
            });
        }
        setTimeout(() => {
            is_loading_running = false;
        }, 1000);


        
    });
});
