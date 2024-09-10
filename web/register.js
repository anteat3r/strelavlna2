const regionSelector = document.getElementById('region-selector');
const returnButton = document.getElementById("return-button");

var district_selected = false;
var district = "";
var mouseX = 0;
var mouseY = 0;
var schools = [];

var zoomState = 0;

var viewboxPosition = [-70, 0, 370, 185];
const viewboxPositions = [[-70, 0, 370, 185], [-20, 30, 190, 95], [40, 0, 130, 65], [-45, 0, 170, 85], [-80, 30, 140, 70], [-80, 70, 200, 100], [-15, 100, 180, 90], [50, 85, 160, 80], [90, 100, 170, 85], [150, 110, 120, 60], [150, 40, 190, 95], [100, 40, 200, 100], [75, 60, 120, 60], [70, 25, 110, 55]]

const districtNames = {
    "0": "Praha",
    "1-1": "Praha-západ",
    "1-2": "Praha-východ",
    "1-3": "Mělník",
    "1-4": "Kladno",
    "1-5": "Rakovník",
    "1-6": "Beroun",
    "1-7": "Příbram",
    "1-8": "Benešov",
    "1-9": "Kutná Hora",
    "1-10": "Kolín",
    "1-11": "Nymburk",
    "1-12": "Mladá Boleslav",
    "2-1": "Česká Lípa",
    "2-2": "Liberec",
    "2-3": "Jablonec nad Nisou",
    "2-4": "Semily",
    "3-1": "Děčín",
    "3-2": "Ústí nad Labem",
    "3-3": "Teplice",
    "3-4": "Most",
    "3-5": "Chomutov",
    "3-6": "Louny",
    "3-7": "Litoměřice",
    "4-1": "Karlovy Vary",
    "4-2": "Sokolov",
    "4-3": "Cheb",
    "5-1": "Plzeň-město",
    "5-2": "Plzeň-sever",
    "5-3": "Tachov",
    "5-4": "Domažlice",
    "5-5": "Klatovy",
    "5-6": "Plzeň-jih",
    "5-7": "Rokycany",
    "6-1": "Tábor",
    "6-2": "Písek",
    "6-3": "Strakonice",
    "6-4": "Prachatice",
    "6-5": "Český Krumlov",
    "6-6": "České Budějovice",
    "6-7": "Jindřichův Hradec",
    "7-1": "Havlíčkův Brod",
    "7-2": "Pelhřimov",
    "7-3": "Jihlava",
    "7-4": "Třebíč",
    "7-5": "Žďár nad Sázavou",
    "8-1": "Brno-město",
    "8-2": "Brno-venkov",
    "8-3": "Znojmo",
    "8-4": "Břeclav",
    "8-5": "Hodonín",
    "8-6": "Vyškov",
    "8-7": "Blansko",
    "9-1": "Kroměříž",
    "9-2": "Uherské Hradiště",
    "9-3": "Zlín",
    "9-4": "Vsetín",
    "10-1": "Ostrava-město",
    "10-2": "Opava",
    "10-3": "Nový Jičín",
    "10-4": "Frýdek-Místek",
    "10-5": "Karviná",
    "10-6": "Bruntál",
    "11-1": "Jeseník",
    "11-2": "Šumperk",
    "11-3": "Olomouc",
    "11-4": "Prostějov",
    "11-5": "Přerov",
    "12-1": "Pardubice",
    "12-2": "Chrudim",
    "12-3": "Svitavy",
    "12-4": "Ústí nad Orlicí",
    "13-1": "Trutnov",
    "13-2": "Jičín",
    "13-3": "Hradec Králové",
    "13-4": "Rychnov nad Kněžnou",
    "13-5": "Náchod",

};


regionSelector.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    const point = regionSelector.createSVGPoint();
    point.x = mouseX;
    point.y = mouseY;

    const svgPoint = point.matrixTransform(regionSelector.getScreenCTM().inverse());
    var selected = false;
    if (zoomState == 0){
        for(const path of regionSelector.getElementById('kraje').getElementsByTagName('path')){
            if (path.isPointInFill(svgPoint) && !selected) {
                path.classList.add('region-selector-hover');
                selected = true;
            }else{
                path.classList.remove('region-selector-hover');
            }
        }
    }else{
        for(const path of regionSelector.getElementById('okresy').getElementsByTagName('path')){
            if (path.id.startsWith(`${zoomState}-`) && path.isPointInFill(svgPoint) && !selected) {
                path.classList.add('region-selector-hover');
                selected = true;
            }else{
                path.classList.remove('region-selector-hover');
            }
        }
        
    }

});

regionSelector.addEventListener('click', e => {
    const point = regionSelector.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;

    const svgPoint = point.matrixTransform(regionSelector.getScreenCTM().inverse());
    if (zoomState == 0){

        var clicked = false;
        var isPointInAnyPath = false;
        for(const path of regionSelector.getElementsByTagName('path')){
            if (path.isPointInFill(svgPoint)) {
                isPointInAnyPath = true;
                break;
            }
        }
        if (!isPointInAnyPath) return;

        for(const path of regionSelector.getElementById('kraje').getElementsByTagName('path')){
            if (path.isPointInFill(svgPoint) && !clicked) {
                if(parseInt(path.id) == 0){
                    zoomState = 0;
                    district = "0";
                    district_selected = true;
                    find_schools();
                    path.classList.add("district-selector-selected");
                }else{
                    zoomState = parseInt(path.id);
                    path.classList.remove('region-selector-hover');
                    path.classList.remove("district-selector-selected");
                }
                clicked = true;
            }else{
                path.classList.add('region-selector-notready');

            }
        }
        
        for(const path of regionSelector.getElementById('okresy').getElementsByTagName('path')){
            if (path.id.startsWith(`${zoomState}-`)) {
                path.classList.remove('region-selector-hidden');
                path.classList.add('region-selector-ready');
            }
        }

        returnButton.classList.remove('return-button-hidden');
    }else{
        var isPointInAnyPath = false;
        for(const path of regionSelector.getElementById('okresy').getElementsByTagName('path')){
            if (path.id.startsWith(`${zoomState}-`) && path.isPointInFill(svgPoint)) {
                isPointInAnyPath = true;
                break;
            }
        }
        if (!isPointInAnyPath) return;
        clicked = false;
        for(const path of regionSelector.getElementById('okresy').getElementsByTagName('path')){
            if (path.id.startsWith(`${zoomState}-`) && path.isPointInFill(svgPoint) && !clicked) {
                path.classList.add('district-selector-selected');
                district = path.id;
                district_selected = true;
                find_schools();
                school_search_box.value = "";
                clicked = true;
            }else{
                path.classList.remove('district-selector-selected');
            }
        }
    }
    
});

returnButton.addEventListener("click", function(){
    returnButton.classList.add('return-button-hidden');
    for (const path of regionSelector.getElementById('kraje').getElementsByTagName('path')) {
        path.classList.remove('region-selector-notready');
        path.classList.remove("district-selector-selected");

    }

    for (const path of regionSelector.getElementById('okresy').getElementsByTagName('path')) {
        path.classList.remove('region-selector-ready');
        path.classList.add('region-selector-hidden');
        path.classList.remove('district-selector-selected');
    }
    zoomState = 0;
    district = "";
    district_selected = false;
    school_search_box.placeholder = "Vyberte kraj a okres z mapy";
    school_search_box.value = "";

})


for (const path of regionSelector.getElementById('kraje').getElementsByTagName('path')) {
    path.classList.add('region-selector-ready');
}

for (const path of regionSelector.getElementById('okresy').getElementsByTagName('path')) {
    path.classList.add('region-selector-hidden');
}

function animateViewbox(k){
    for(let i = 0; i < 4; i++){
        viewboxPosition[i] += (viewboxPositions[zoomState][i] - viewboxPosition[i]) * k;
    }
    regionSelector.setAttribute('viewBox', viewboxPosition.join(' '));
}


const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

fetch(`https://strela-vlna.gchd.cz/api/contest/${id}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById("register-title").innerHTML = data.name;
});

const dropdown_playeres_wrapper_clickable = document.getElementById("player-name-selector-top-wrapper");
const dropdown_schools_wrapper_clickable = document.getElementById("school-selector-top-wrapper");
const dropdown_icon_players = document.getElementById("register-players-dropdown-icon");
const dropdown_players = document.getElementById('player-name-selector-wrapper');
const dropdown_icon_school = document.getElementById("school-dropdown-icon");
const dropdown_school = document.getElementById("school-selector-wrapper");

dropdown_icon_players.addEventListener("click", function(){
    this.classList.toggle("register-players-dropdown-icon-toggle");
    dropdown_players.classList.toggle("player-name-selector-wrapper-toggle");
});

dropdown_icon_school.addEventListener("click", function(){
    this.classList.toggle("school-dropdown-icon-toggle");
    dropdown_school.classList.toggle("school-selector-wrapper-toggle");
});

dropdown_playeres_wrapper_clickable.addEventListener("click", function(e){
    if(e.target === dropdown_playeres_wrapper_clickable){
        dropdown_icon_players.classList.toggle("register-players-dropdown-icon-toggle");
        dropdown_players.classList.toggle("player-name-selector-wrapper-toggle");
    }
});

dropdown_schools_wrapper_clickable.addEventListener("click", function(e){
    if(e.target === dropdown_schools_wrapper_clickable){
        dropdown_icon_school.classList.toggle("school-dropdown-icon-toggle");
        dropdown_school.classList.toggle("school-selector-wrapper-toggle");
    }
});

const player_count = document.getElementById("player-conunt");
const player_name = document.getElementById("player-name");

player_count.addEventListener("keydown", function(e){
    if (e.key === "Enter") {
        this.blur();
    }
});

player_count.addEventListener("blur", function(){
    let num = parseInt(this.value);
    if(num > 5){
        this.value = 5;
        num = 5;
    }else if(num < 1){
        this.value = 1;
        num = 1;
    }


    const player_name_selectors = dropdown_players.getElementsByClassName("player-name-input-wrapper");
    if (player_name_selectors.length > num){
        for (let i = player_name_selectors.length - 1; i >= num; i--){
            player_name_selectors[i].remove();
        }
    }else if(player_name_selectors.length < num){
        for (let i = player_name_selectors.length; i < num; i++){
            dropdown_players.insertAdjacentHTML('beforeend',
            `   <div class="player-name-input-wrapper">
                    <label class="register-label-small">Člen ${i+1}.</label>
                    <input type="text" id="player-name" class="register-text-input" placeholder="Jméno" name="player_name_${i+1}">
                </div>`);
        }
    }
    if(!dropdown_icon_players.classList.contains("register-players-dropdown-icon-toggle")){
        dropdown_icon_players.click();
    }
    

});


const school_search_box = document.getElementById("school");

school_search_box.addEventListener("focus", function(){
    if (!district_selected){
        if(!dropdown_icon_school.classList.contains("school-dropdown-icon-toggle")){
            dropdown_icon_school.click();
        }
        this.blur();
    }
})


function find_schools(){
    school_search_box.placeholder = "Počkejte prosím...";

    fetch(`https://strela-vlna.gchd.cz/api/schools?o=${districtNames[district]}`)
        .then(response => response.text())
        .then(data => {
            schools = data.split("*");
            school_search_box.removeEventListener("input", arguments.callee);
            school_search_box.removeEventListener("keydown", arguments.callee);
            autocomplete(school_search_box, schools);
            school_search_box.placeholder = "Začněte psát";

            

        }
    );
}

const team_mail_input = document.getElementById("team-mail");
const mail_check_button = document.getElementById("mail-check-button");
const mail_check_digits_wrapper = document.getElementsByClassName("email-check-code-wrapper")[0];
const email_sent_message = document.getElementById("email-sent-message");
var mail_check_digits = [];
var correct_code = "";
var last_sent_email = "";

for (let i = 1; i < 5; i++){
    mail_check_digits.push(document.getElementById(i.toString()));
    mail_check_digits[i-1].addEventListener("keydown", function(e){
        const was_empty = mail_check_digits[i-1].value == "";
        if(!isNaN(parseInt(e.key)) && !was_empty){
            mail_check_digits[i-1].value = "";
        }
            
            
        setTimeout(() => {
            // Your custom code goes here, running after the default input behavior
            if(!isNaN(parseInt(e.key))){
            
                if(i == 4){
                    mail_check_digits[3].blur();
                }else{
                    mail_check_digits[i].focus();
                }
            }
            if(e.key == "Backspace"){
                if(i > 1 && was_empty){
                    mail_check_digits[i-2].value = "";
                    mail_check_digits[i-2].focus();
                }
            }

            if(mail_check_digits.every(x => x.value != "") && mail_check_digits.map(x => x.value).join("") == correct_code){
                mail_check_digits.forEach(x => x.classList.add("correct-code"));
                email_sent_message.innerHTML = `*Váš email je ověřený`;
                email_sent_message.classList.remove("hidden");
            }else{
                mail_check_digits.forEach(x => x.classList.remove("correct-code"));
                email_sent_message.innerHTML = `*Poslali jsme vám email s kódem na adresu: ${last_sent_email}`;
                if(last_sent_email == ""){
                    email_sent_message.classList.add("hidden");
                }
            }
            
        }, 10);
        
    })
}

mail_check_button.addEventListener("click", function(){
    const random_digits = Math.floor(1000 + Math.random() * 9000);
    last_sent_email = team_mail_input.value;
    fetch("https://strela-vlna.gchd.cz/api/mailcheck", {
        headers: {
            "Content-Type": "application/json"
        },
        method: 'POST',
        body: JSON.stringify({
            email: team_mail_input.value,
            code: random_digits.toString()
        })

    })
    .then(response => response.text())
    .then(data => {
        if(data == "OK"){
            mail_check_digits_wrapper.classList.remove("hidden");
            email_sent_message.classList.remove("hidden");
            email_sent_message.innerHTML = `*Poslali jsme vám email s kódem na adresu: ${last_sent_email}`;
            correct_code = random_digits.toString();
        }else{
            last_sent_email = "";
            alert('Nelze odeslat email! Zkuste to prosím později.');
        }
    });
    
    
});

team_mail_input.addEventListener("keydown", function(e){
    if (e.key === "Enter") {
        this.blur();
    }
})

team_mail_input.addEventListener("blur", function(){
    if(this.validity.valid && team_mail_input.value != ""){
        mail_check_button.classList.remove("hidden");
        mail_check_digits_wrapper.classList.remove("hidden");
    }else{
        mail_check_button.classList.add("hidden");
        mail_check_digits_wrapper.classList.add("hidden");
        email_sent_message.classList.add("hidden");
    }
})

const register_button = document.getElementById("register-button");

register_button.addEventListener("click", function(){
    this.disabled = true;
    
    if(document.getElementById("team-name").value == ""){
        alert('Zadejte prosím název týmu');
        return;
    }
    if(!document.getElementById("team-mail").validity.valid || document.getElementById("team-mail").value == ""){
        alert('Zadejte prosím platný email');
        return;
    }
    for(const member of document.getElementById("player-name-selector-wrapper").getElementsByClassName("player-name-input-wrapper")){
        if(member.querySelector('input').value == ""){
            alert('Vplňte prosím všechna jména členů týmu');
            return;
        }
    }
    if(schools.indexOf(school_search_box.value) == -1){
        alert('Zadejte prosím platnou školu');
        return;
    }

    const register_card = document.getElementById("register-card");
    var formData = new FormData(register_card);
    formData.append('id', new URLSearchParams(window.location.search).get('id'));
    for(let i = 1; i <= 5; i++){
        if(!formData.has(`player_name_${i}`)){
            formData.append(`player_name_${i}`, "");
        }
    }
    console.log(formData.values());
    fetch("https://strela-vlna.gchd.cz/api/register", {
        headers: {
            // "Content-Type": "application/x-www-form-urlencoded"
        },
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        if(data == "OK"){
            window.location.href = "registration_succsessful.html";
            
        }else{
            alert('Registrace selhala!');
        }
        this.disabled = false;

    });
    
    
});

function update(){
    requestAnimationFrame(update);
    animateViewbox(0.2);
}

update();


//this code is copied from w3schools, yea, I know, Im lazy...

function autocomplete(inp, arr) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
          /*check if the item starts with the same letters as the text field value:*/
          if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            /*create a DIV element for each matching element:*/
            b = document.createElement("DIV");
            /*make the matching letters bold:*/
            b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].substr(val.length);
            /*insert a input field that will hold the current array item's value:*/
            b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
            /*execute a function when someone clicks on the item value (DIV element):*/
            b.addEventListener("click", function(e) {
                /*insert the value for the autocomplete text field:*/
                inp.value = this.getElementsByTagName("input")[0].value;
                /*close the list of autocompleted values,
                (or any other open lists of autocompleted values:*/
                closeAllLists();
            });
            a.appendChild(b);
          }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          /*If the arrow DOWN key is pressed,
          increase the currentFocus variable:*/
          currentFocus++;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 38) { //up
          /*If the arrow UP key is pressed,
          decrease the currentFocus variable:*/
          currentFocus--;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 13) {
          /*If the ENTER key is pressed, prevent the form from being submitted,*/
          e.preventDefault();
          if (currentFocus > -1) {
            /*and simulate a click on the "active" item:*/
            if (x) x[currentFocus].click();
          }
        }
    });
    function addActive(x) {
      /*a function to classify an item as "active":*/
      if (!x) return false;
      /*start by removing the "active" class on all items:*/
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      /*add class "autocomplete-active":*/
      x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
      /*a function to remove the "active" class from all autocomplete items:*/
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
    function closeAllLists(elmnt) {
      /*close all autocomplete lists in the document,
      except the one passed as an argument:*/
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}
