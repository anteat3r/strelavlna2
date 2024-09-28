const redirects = false;
//global states
var start_time = new Date().getTime() - 5000;
var end_time = new Date().getTime() + 5000;
var prices = [[10, 20, 30], [15, 35, 69], [5, 10, 15]]; //[buy], [solve], [sell]
var menu_focused_by = [];
var myId = "";
var myRole = "nobody";

var global_information = "Dobrý den";

var checks = [
    {
        id: "uihdabskbnb",
        probid: "huiadkshuiwabksjd",
        teamid: "iuyeabkhkjnjhkj",
        assignid: "iadksibd",
        teamname: "Team 1",
        type: "grade", //grade, chat, globalchat
        payload: "To bude asi 5\x005",
        focused_by: [],
    }
];

var cached_problems = [{
    id: "huiadkshuiwabksjd",
    title: "Lyžař",
    rank: "C",
    contet: "Mlékárna vykoupí od zemědělců mléko jedině tehdy, má-li předepsanou teplotu 4°C. Farmář při kontrolním měření zjistil, že jeho 60 litrů mléka má teplotu jen 3,6°C. Pomůže mu 10 litrů mléka o teplotě 6,5°C, které původně zamýšlel uschovat pro potřeby své rodiny? Zbude mu nějaké mléko aspoň na snídani? Anebo mu mlékárna mléko vůbec nevykoupí?",
}];

var cached_chats = [
    {
        probid: "huiadkshuiwabksjd",
        teamid: "iuyeabkhkjnjhkj",
        seen_chat: false,
        banned: false,
        chat: [
            {
                author: "team",
                content: "Je to 5?"
            },
            {
                author: "support",
                content: "ano, je to 5."
            }
        ]
    }
];

//local states
var focused_check = "";

const accept_button = document.getElementById("accept");
const reject_button = document.getElementById("reject");

const focused_check_wrapper = document.getElementById("check-wrapper");
const mod_home_wrapper = document.getElementById("mod-home-wrapper");

//initial setup
updateCheckList();
updateFocusedCheck();
updateChat();


//buy events

document.getElementById("send-message-button").addEventListener("click", function(){
    const chat_input = document.getElementById("chat-input");
    if(chat_input.value.length > 200 || chat_input.value.length == 0) return;
    const focused_check_obj = checks.find(check => check.id == focused_check);
    
    sendMsg(focused_check_obj.teamid, focused_check_obj.probid, chat_input.value);
    chat_input.value = "";
});


document.getElementById("home-button").addEventListener("click", function(){
    unfocusCheck();
    focusCheck("", "", "", false, false);
    focused_check = "";
    updateFocusedCheck();
    updateChat();
    updateCheckList();
    document.getElementById("home-button").classList.add("home-selected");
    focused_check_wrapper.classList.add("hidden");
    mod_home_wrapper.classList.remove("hidden");
});

accept_button.addEventListener("click", function(){
    const focused_check_obj = checks.find(check => check.id == focused_check);
    if(focused_check_obj){
        grade(focused_check_obj.id, focused_check_obj.teamid, focused_check_obj.probid, true);
    }
});

reject_button.addEventListener("click", function(){
    const focused_check_obj = checks.find(check => check.id == focused_check);
    if(focused_check_obj){
        grade(focused_check_obj.id, focused_check_obj.teamid, focused_check_obj.probid, false);
    }
});

document.getElementById("help-center-mute-button").addEventListener("click", function(){
    const focused_check_obj = checks.find(check => check.id == focused_check);
    if(focused_check_obj){
        if(focused_check_obj.banned){
            unban(focused_check_obj.teamid);
        }else{
            ban(focused_check_obj.teamid);
        }
    }
});

function updateModHome(){
    const textfield_wrapper = document.getElementById("global-info-textfield-wrapper");
    const textfield = document.getElementById("global-info-textfield");
    textfield.placeholder = global_information;
    const role_worker = document.getElementById("role-worker");
    const role_manager = document.getElementById("role-manager");
    const role_admin = document.getElementById("role-admin");
    if(myRole == "nobody"){
        role_worker.classList.remove("role-selected");
        role_manager.classList.remove("role-selected");
        role_admin.classList.remove("role-selected");
        textfield_wrapper.classList.add("hidden");
    }else if(myRole == "worker"){
        role_worker.classList.add("role-selected");
        role_manager.classList.remove("role-selected");
        role_admin.classList.remove("role-selected");
        textfield_wrapper.classList.add("hidden");
    }else if(myRole == "manager"){
        role_worker.classList.remove("role-selected");
        role_manager.classList.add("role-selected");
        role_admin.classList.remove("role-selected");
        textfield_wrapper.classList.remove("hidden");
    }else if(myRole == "admin"){
        role_worker.classList.remove("role-selected");
        role_manager.classList.remove("role-selected");
        role_admin.classList.add("role-selected");
        textfield_wrapper.classList.remove("hidden");
    }

}

const role_button_worker = document.getElementById("role-worker");
const role_button_manager = document.getElementById("role-manager");
const role_button_admin = document.getElementById("role-admin");

role_button_worker.addEventListener("click", function(){
    setRole("worker");
});
role_button_manager.addEventListener("click", function(){
    setRole("manager");
});
role_button_admin.addEventListener("click", function(){
    setRole("admin");
});

function setRole(role){
    myRole = role;
    updateModHome();
    updateCheckList();
}

function updateCheckList(){
    const checks_wrapper = document.getElementById("checks-wrapper");
    for(const check of checks){
        if(check.focused_by.length > 0){
            const chat_obj = cached_chats.find(chat => chat.probid == "" ? chat.teamid == check.teamid : chat.probid == check.probid);
            chat_obj.seen_chat = true;
        }
    }
    checks_wrapper.innerHTML = "";
    if(myRole == "nobody")return;
    if(myRole == "worker"){
        checks_wrapper.innerHTML += `<div id="grade-checks-title">------ hodnocení ------</div>`
        for(const check of checks.filter(check => check.type == "grade" && check.assignid == myId)){
            let title;
            let rank;
            const prob_obj = cached_problems.find(prob => prob.id == check.probid);
            const chat_obj = cached_chats.find(chat => chat.probid == "" ? chat.teamid == check.teamid : chat.probid == check.probid);
            if(!prob_obj){
                title = "Nové hodnocení";
                rank = "-";
            }else{
                title = prob_obj.title;
                rank = prob_obj.rank;
            }

            checks_wrapper.innerHTML +=
            `<div class="check ${focused_check == check.id ? "check-focused" : ""} ${check.focused_by.length > (focused_check == check.id ? 1 : 0) ? "check-worked-on" : ""} ${!chat_obj.seen_chat ? "unseen-chat" : ""}" id="${check.id}">
                 <div class="flex flex-row align-center">
                    <h2 class="check-title"${title.length > 12 ? `style="font-size: 15px"` : ""}>${title}</h2>
                    <h2 class="check-rank">[${rank}]</h2>
                </div>
                <div class="occupied-icon"></div>
            </div>`
        }

        checks_wrapper.innerHTML += `<div id="chat-checks-title">------ odpovědi ------</div>`
        for(const check of checks.filter(check => check.type == "chat" && check.assignid == myId)){
            let title;
            let rank;
            const prob_obj = cached_problems.find(prob => prob.id == check.probid);
            const chat_obj = cached_chats.find(chat => chat.probid == "" ? chat.teamid == check.teamid : chat.probid == check.probid);
            if(!prob_obj){
                title = "Nové hodnocení";
                rank = "-";
            }else{
                title = prob_obj.title;
                rank = prob_obj.rank;
            }
            
            checks_wrapper.innerHTML +=
            `<div class="check ${focused_check == check.id ? "check-focused" : ""} ${check.focused_by.length > (focused_check == check.id ? 1 : 0) ? "check-worked-on" : ""} ${!chat_obj.seen_chat ? "unseen-chat" : ""}" id="${check.id}">
                 <div class="flex flex-row align-center">
                    <h2 class="check-title"${title.length > 12 ? `style="font-size: 15px"` : ""}>${title}</h2>
                    <h2 class="check-rank">[${rank}]</h2>
                </div>
                <div class="occupied-icon"></div>
            </div>`
        }
    }
    else if(myRole == "manager"){
        checks_wrapper.innerHTML += `<div id="grade-checks-title">------ hodnocení ------</div>`
        for(const check of checks.filter(check => check.type == "grade" && check.focused_by.length <= (check.id == focused_check ? 1 : 0))){ //probs, that nobody works on
            let title;
            let rank;
            const prob_obj = cached_problems.find(prob => prob.id == check.probid);
            const chat_obj = cached_chats.find(chat => chat.probid == "" ? chat.teamid == check.teamid : chat.probid == check.probid);
            if(!prob_obj){
                title = "Nové hodnocení";
                rank = "-";
            }else{
                title = prob_obj.title;
                rank = prob_obj.rank;
            }
            checks_wrapper.innerHTML +=
            `<div class="check ${focused_check == check.id ? "check-focused" : ""} ${!chat_obj.seen_chat ? "unseen-chat" : ""}" id="${check.id}">
                 <div class="flex flex-row align-center">
                    <h2 class="check-title"${title.length > 12 ? `style="font-size: 15px"` : ""}>${title}</h2>
                    <h2 class="check-rank">[${rank}]</h2>
                </div>
                <div class="occupied-icon"></div>
            </div>`
        }
        checks_wrapper.innerHTML += `<div id="chat-checks-title">------ odpovědi ------</div>`
        for(const check of checks.filter(check => check.type == "chat" && check.focused_by.length <= (check.id == focused_check ? 1 : 0))){ //chats, that nobody works on
            let title;
            let rank;
            const prob_obj = cached_problems.find(prob => prob.id == check.probid);
            const chat_obj = cached_chats.find(chat => chat.probid == "" ? chat.teamid == check.teamid : chat.probid == check.probid);
            if(!prob_obj){
                title = "Nové hodnocení";
                rank = "-";
            }else{
                title = prob_obj.title;
                rank = prob_obj.rank;
            }
            checks_wrapper.innerHTML +=
            `<div class="check ${focused_check == check.id ? "check-focused" : ""} ${!chat_obj.seen_chat ? "unseen-chat" : ""}" id="${check.id}">
                 <div class="flex flex-row align-center">
                    <h2 class="check-title"${title.length > 12 ? `style="font-size: 15px"` : ""}>${title}</h2>
                    <h2 class="check-rank">[${rank}]</h2>
                </div>
                <div class="occupied-icon"></div>
            </div>`
        }
    }
    else if(myRole == "admin"){
        checks_wrapper.innerHTML += `<div id="grade-checks-title">------ hodnocení ------</div>`
        for(const check of checks.filter(check => check.type == "grade")){
            let title;
            let rank;
            const prob_obj = cached_problems.find(prob => prob.id == check.probid);
            const chat_obj = cached_chats.find(chat => chat.probid == "" ? chat.teamid == check.teamid : chat.probid == check.probid);
            if(!prob_obj){
                title = "Nové hodnocení";
                rank = "-";
            }else{
                title = prob_obj.title;
                rank = prob_obj.rank;
            }
            checks_wrapper.innerHTML +=
            `<div class="check ${focused_check == check.id ? "check-focused" : ""} ${check.focused_by.length > (focused_check == check.id ? 1 : 0) ? "check-worked-on" : ""} ${!chat_obj.seen_chat ? "unseen-chat" : ""}" id="${check.id}">
                 <div class="flex flex-row align-center">
                    <h2 class="check-title"${title.length > 12 ? `style="font-size: 15px"` : ""}>${title}</h2>
                    <h2 class="check-rank">[${rank}]</h2>
                </div>
                <div class="occupied-icon"></div>
            </div>`
        }
        checks_wrapper.innerHTML += `<div id="chat-checks-title">------ odpovědi ------</div>`
        for(const check of checks.filter(check => check.type == "chat")){
            let title;
            let rank;
            const prob_obj = cached_problems.find(prob => prob.id == check.probid);
            const chat_obj = cached_chats.find(chat => chat.probid == "" ? chat.teamid == check.teamid : chat.probid == check.probid);
            if(!prob_obj){
                title = "Nové hodnocení";
                rank = "-";
            }else{
                title = prob_obj.title;
                rank = prob_obj.rank;
            }

            checks_wrapper.innerHTML +=
            `<div class="check ${focused_check == check.id ? "check-focused" : ""} ${check.focused_by.length > (focused_check == check.id ? 1 : 0) ? "check-worked-on" : ""} ${!chat_obj.seen_chat ? "unseen-chat" : ""}" id="${check.id}">
                 <div class="flex flex-row align-center">
                    <h2 class="check-title"${title.length > 12 ? `style="font-size: 15px"` : ""}>${title}</h2>
                    <h2 class="check-rank">[${rank}]</h2>
                </div>
                <div class="occupied-icon"></div>
            </div>`
        }
    }
    
    const checks_buttons = document.getElementById("checks-wrapper").getElementsByClassName("check");
    for(const button of checks_buttons){
        button.addEventListener("click", function(){
            console.log(this.id);
            if(focused_check == this.id){
                return;
            }

            // unfocusCheck();

            const focused_check_obj = checks.find(check => check.id == focused_check);
            if(focused_check_obj != null){
                const index = focused_check_obj.focused_by.indexOf(myId);
                if (index > -1) {
                    focused_check_obj.focused_by.splice(index, 1);
                }
            }
            
            focused_check = this.id;
            updateCheckList();
            updateChat();
            updateFocusedCheck();

            let send_problem = true;
            let send_chat = true;
            const check_obj = checks.find(check => check.id == this.id);
            if(check_obj != null){
                const prob_obj = cached_problems.find(prob => prob.id == check_obj.probid);
                const chat_obj = cached_chats.find(chat => chat.probid == "" ? chat.teamid == check_obj.teamid : chat.probid == check_obj.probid);
                if(prob_obj != null){
                    send_problem = false;
                }
                if(chat_obj != null){
                    send_chat = false;
                }
            }else{
                return;
            }
            if(send_problem || send_chat){
                focusCheck(focused_check, check_obj.probid, check_obj.teamid, send_problem, send_chat);
            }else{
                focusCheck(focused_check, "", "", false, false);
            }

            document.getElementById("home-button").classList.remove("home-selected");
            focused_check_wrapper.classList.remove("hidden");
            mod_home_wrapper.classList.add("hidden");
            
        });
    }
    
    
}

function updateFocusedCheck(){
    if(focused_check == "" || !checks.some(check => check.id == focused_check)){
        focused_check = "";
        focused_check_wrapper.classList.add("hidden");
        mod_home_wrapper.classList.remove("hidden");
        return;
    }
    const grading_wrapper = document.getElementById("grading-wrapper");
    const check_content_wrapper = document.getElementById("check-content-wrapper");

    const team_name = document.getElementById("team-name");
    const team_id = document.getElementById("team-id");
    const problem_title = document.getElementById("problem-title");
    const problem_content = document.getElementById("problem-content");
    const problem_id = document.getElementById("problem-id");
    const team_answer = document.getElementById("team-answer");
    const correct_answer = document.getElementById("correct-answer");

    const focused_check_obj = checks.find(check => check.id == focused_check);
    const focused_problem_obj = cached_problems.find(prob => prob.id == focused_check_obj.probid);

    if(!focused_check_obj){
        problem_title.innerHTML = "Načítání...";
        problem_content.innerHTML = "Načítání...";
    }else{
        problem_title.innerHTML = focused_problem_obj.title + " [" + focused_problem_obj.rank + "]";
        problem_content.innerHTML = focused_problem_obj.content;
    }
    
    team_name.innerHTML = focused_check_obj.teamname;
    team_id.innerHTML = "#" + focused_check_obj.teamid;

    if(focused_check_obj.type == "grade"){
        problem_id.innerHTML = "#" + focused_check_obj.probid;
        team_answer.innerHTML = focused_check_obj.payload.split("\x00")[0];
        correct_answer.innerHTML = focused_check_obj.payload.split("\x00")[1];
        grading_wrapper.classList.remove("hidden");
        check_content_wrapper.classList.remove("hidden");
    }else if(focused_check_obj.type == "chat"){
        problem_id.innerHTML = "#" + focused_check_obj.probid;
        grading_wrapper.classList.add("hidden");
        check_content_wrapper.classList.remove("hidden");
    }else if(focused_check_obj.type == "globalchat"){
        grading_wrapper.classList.add("hidden");
        check_content_wrapper.classList.add("hidden");
    }else{
        console.error("Unknown check type: " + focused_check_obj.type);
    }
}

function updateChat(){
    const conversation_wrapper = document.getElementById("conversation-wrapper");
    conversation_wrapper.innerHTML = "";
    if(focused_check == "" || !checks.some(check => check.id == focused_check)){
        focused_check = "";
        document.getElementById("help-center-mute-button").classList.add("hidden");
        return;
    }
    document.getElementById("help-center-mute-button").classList.remove("hidden");

    const check_obj = checks.find(check => check.id == focused_check);
    const chat_obj = cached_chats.find(chat => chat.probid == "" ? chat.teamid == check_obj.teamid : chat.probid == check_obj.probid);
    const title_wrapper = document.getElementById("help-center-title-wrapper");
    const mute_button = document.getElementById("help-center-mute-button");

    if(!chat_obj){
        title_wrapper.classList.add("chat-loading");
        return;
    }else{
        title_wrapper.classList.remove("chat-loading");
    }

    if(chat_obj.banned){
        mute_button.classList.add("chat-button-muted");
    }else{
        mute_button.classList.remove("chat-button-muted");
    }


    for(const message of chat_obj.chat){
        conversation_wrapper.innerHTML += 
        `<div class="conversation-row ${message.author == "team" ? "message-their" : "message-my"}">
            <p class="conversation-message">${message.content}</p>
        </div>`
    }
    
    conversation_wrapper.scrollTop = conversation_wrapper.scrollHeight;
}

function updateClock(remaining, passed){
    lastSecond = Math.floor(remaining / 1000);

    const hours = Math.floor(remaining / 1000 / 60 / 60) % 24;
    const minutes = Math.floor(remaining / 1000 / 60) % 60 % 10;
    const seconds = Math.floor(remaining / 1000) % 60 % 10;
    const ten_seconds = Math.floor(Math.floor(remaining / 1000) % 60 / 10);
    const ten_minutes = Math.floor(Math.floor(remaining / 1000 / 60) % 60 / 10);

    const hour_wrapper = document.getElementById("hours").getElementsByClassName("digit-wrapper")[0];
    const ten_minute_wrapper = document.getElementById("ten-minutes").getElementsByClassName("digit-wrapper")[0];
    const minute_wrapper = document.getElementById("minutes").getElementsByClassName("digit-wrapper")[0];
    const ten_second_wrapper = document.getElementById("ten-seconds").getElementsByClassName("digit-wrapper")[0];
    const second_wrapper = document.getElementById("seconds").getElementsByClassName("digit-wrapper")[0];

    const progressbar_time_string = document.getElementById("progressbar-time-passed");
    const progressbar_cursor = document.getElementById("progressbar-cursor-wrapper");
    const progressbar_percentage = document.getElementById("progressbar-percentage");
    const progressbar_foreground = document.getElementById("progressbar-foreground");

    const passed_percentage = (passed / (end_time - start_time)) * 100;
    progressbar_time_string.innerHTML = new Date(passed).toISOString().substr(11, 8);
    progressbar_cursor.style.left = `${passed_percentage}%`;
    progressbar_percentage.innerHTML = `${Math.round(passed_percentage)}%`;
    progressbar_foreground.style.width = `${passed_percentage}%`;

    for(let i = 1; i < 10; i++){
        hour_wrapper.classList.remove(`digit-${i}`);
        ten_minute_wrapper.classList.remove(`digit-ten-${i}`);
        minute_wrapper.classList.remove(`digit-${i}`);
        ten_second_wrapper.classList.remove(`digit-ten-${i}`);
        second_wrapper.classList.remove(`digit-${i}`);
    }
    
    hour_wrapper.classList.add(`digit-${hours}`);
    if(ten_minutes == 0){
        if(!ten_minute_wrapper.classList.contains(`digit-ten-0-start`)){
            ten_minute_wrapper.classList.add(`digit-ten-0-end`);
            setTimeout(e => {
                ten_minute_wrapper.classList.remove(`digit-ten-0-end`);
                ten_minute_wrapper.classList.add(`digit-ten-0-start`);
            }, 500);
        }
    }else{
        ten_minute_wrapper.classList.remove(`digit-ten-0-start`);
        ten_minute_wrapper.classList.add(`digit-ten-${ten_minutes}`);
    }
    if(minutes == 0){
        if(!minute_wrapper.classList.contains(`digit-0-start`)){
            minute_wrapper.classList.add(`digit-0-end`);
            setTimeout(e => {
                minute_wrapper.classList.remove(`digit-0-end`);
                minute_wrapper.classList.add(`digit-0-start`);
            }, 500);
        }
    }else{
        minute_wrapper.classList.remove(`digit-0-start`);
        minute_wrapper.classList.add(`digit-${minutes}`);
    }
    if(ten_seconds == 0){
        if(!ten_second_wrapper.classList.contains(`digit-ten-0-start`)){
            ten_second_wrapper.classList.add(`digit-ten-0-end`);
            setTimeout(e => {
                ten_second_wrapper.classList.remove(`digit-ten-0-end`);
                ten_second_wrapper.classList.add(`digit-ten-0-start`);
            }, 500);
        }
    }else{
        ten_second_wrapper.classList.remove(`digit-ten-0-start`);
        ten_second_wrapper.classList.add(`digit-ten-${ten_seconds}`);
    }
    if(seconds == 0){
        if(!second_wrapper.classList.contains(`digit-0-start`)){
            second_wrapper.classList.add(`digit-0-end`);
            setTimeout(e => {
                second_wrapper.classList.remove(`digit-0-end`);
                second_wrapper.classList.add(`digit-0-start`);
            }, 500);
        }
    }else{
        second_wrapper.classList.remove(`digit-0-start`);
        second_wrapper.classList.add(`digit-${seconds}`);
    }
}

var lastSecond = 0;
var clock_zeroed = false;
function update(){
    requestAnimationFrame(update);

    //clock
    const now = new Date().getTime();
    var remaining = end_time - now;
    var passed = now - start_time;
    if ((Math.floor(remaining / 1000) != lastSecond && remaining>=0) || (!clock_zeroed && remaining < 0)){
        if (remaining < 0){
            clock_zeroed = true;
            updateFocusedCheck();
            remaining = 0;
            passed = end_time-start_time;
        }
        updateClock(remaining, passed);
    }

}
updateModHome();
update();

/** @type {WebSocket} */
let socket;

function connectWS() {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get("id");
  socket = new WebSocket(`wss://strela-vlna.gchd.cz/ws/admin/play/${id}`);
  socket.addEventListener("error", (e) => {
      console.log(e);
      if(redirects){
        window.location.href = `login.html?id=${id}`;
      }
  });

  socket.addEventListener("open", (event) => {
    load();
  });

  socket.addEventListener("message", (event) => {
    function cLe() { console.log("invalid msg", rawmsg) }
    /** @type {string} */
    const rawmsg = event.data;
    const msg = rawmsg.split("\x00");
    if (msg.length == 0) { cLe() }
    switch (msg[0]) {
      case "solved":
        if (msg.length != 8) { cLe() }
        solved(msg[1], msg[2], msg[3], msg[4], msg[5], msg[6], msg[7]);
      break;
      case "msgrecd":
        if (msg.length != 4) { cLe() }
        msgRecieved(msg[1], msg[2], msg[3]);
      break;
      case "graded":
        if (msg.length != 3) { cLe() }
        graded(msg[1], msg[2]);
      break;
      case "dismissed":
        if (msg.length != 2) { cLe() }
        dismissed(msg[1]);
      break;
      case "focused":
        if (msg.length != 3) { cLe() }
        checkFocused(msg[1], msg[2]);
      break;
      case "unfocused":
        if (msg.length != 2) { cLe() }
        checkUnfocused(msg[1]);
      break;
      case "msgsent":
        if (msg.length != 4) { cLe() }
        msgSent(msg[1], msg[2], msg[3]);
      break;
      case "focuscheck":
        focuscheck();
      break;
      case "loaded":
        if (msg.length != 2) { cLe() }
        loaded(msg[1]);
      break;
      case "banned":
        if (msg.length != 2) { cLe() }
        banned(msg[1]);
        break;
      case "unbanned":
        if (msg.length != 2) { cLe() }
        unbanned(msg[1]);
        break;
      case "err":
        console.log(msg)
      break;
    }
  })
}
try {
  connectWS();
} catch (e) {
    console.log(e);
    if(redirects){
        const searchParams = new URLSearchParams(window.location.search);
        const id = searchParams.get("id");
        window.location.href = `../login?id=${id}`;
    }
}

/**
 * Send a grade to the server
 * @param {string} checkid - ID of the check
 * @param {string} teamid - ID of the team
 * @param {string} probid - ID of the problem
 * @param {boolean} correct - Whether the answer is correct or not
 */
function grade(checkid, teamid, probid, correct){
    socket.send(`grade\x00${checkid}\x00${teamid}\x00${probid}\x00${correct ? "yes" : "no"}`);
}


/** @param {string} checkid
 * @param {string} probid
 * @param {string} teamid 
 * @param {boolean} send_problem
 * @param {boolean} send_chat
 * */
function focusCheck(checkid, probid, teamid, send_problem, send_chat) { //done
  socket.send(`focus\x00${checkid}\x00${probid}\x00${teamid}\x00${send_problem ? "yes" : "no"}\x00${send_chat ? "yes" : "no"}`) }

/**
 * Dismiss a check
 * @param {string} checkid - ID of the check
 */
function dismiss(checkid){
    socket.send(`dismiss\x00${checkid}`);
}

/** @param {string} id */
function unfocusCheck() { //done
    const focused_check_obj = checks.find(check => check.id == focused_check);
    if(focused_check_obj != null){
        const index = focused_check_obj.focused_by.indexOf(myId);
        if (index > -1) {
            focused_check_obj.focused_by.splice(index, 1);
        }
    }
    const index = menu_focused_by.indexOf(focused_check);
    if (index > -1) {
        menu_focused_by.splice(index, 1);
    }
    socket.send(`unfocus`) 
}

/**
 * Ban a teams chat
 * @param {string} teamid - ID of the team
 */
function ban(teamid){
    socket.send(`ban\x00${teamid}`);
}

/**
 * Unban a teams chat
 * @param {string} teamid - ID of the team
 */
function unban(teamid){
    socket.send(`unban\x00${teamid}`);
}

/** @param {string} teamid
 * @param {string} probid
 * @param {string} text */
function sendMsg(teamid, probid, text) { //done
  socket.send(`chat\x00${teamid}\x00${probid}\x00${text}`) }

/** load game state */
function load() {
  socket.send("load");
}



function solved(checkid, teamid, probid, assignid, rank, teamname, title){
    checks.push(
        {   
            id: checkid,
            probid: probid,
            teamid: teamid,
            assignid: assignid,
            teamname: teamname,
            type: "grade",
            payload: `${title}\x00${rank}`,
            focused_by: []
        });
}

/**@param {string} probid
 * @param {string} checkid */
function graded(probid, checkid){
    console.log(probid, checkid);
}

/**
 * @param {string} checkid
 */
function dismissed(checkid){
    const index = checks.findIndex(check => check.id == checkid);
    if (index > -1) {
        checks.splice(index, 1);
    }
    updateCheckList();
    updateFocusedCheck();
}

/** @param {string} teamid
 * @param {string} probid
 * @param {string} msg */
function msgRecieved(probid, teamid, msg) {
    const chat_obj = cached_chats.find(chat => probid == "" ? chat.teamid == teamid : chat.probid == probid);
    if(chat_obj == null)return;
    chat_obj.chat.push({author: "team", content: msg});
    chat_obj.seen_chat = false;
    updateChat();
    updateCheckList();
    console.log(id, msg);
}

/** @param {string} teamid
 * @param {string} probid
 * @param {string} msg */
 
function msgSent(teamid, probid, msg) {
    const chat_obj = cached_chats.find(chat => probid == "" ? chat.teamid == teamid : chat.probid == probid);
    if(chat_obj == null)return;
    chat_obj.chat.push({author: "support", content: msg});
    updateChat();
    updateCheckList();
}



/**
 * @param {string} checkid
 * @param {string} modid
 */
function checkFocused(checkid, modid) {
    if(checkid == ""){
        if(!menu_focused_by.includes(modid)){
            menu_focused_by.push(modid);
        }
        updateCheckList();
        updateChat();
        return;
    }
    const check = checks.find(check => check.id == checkid);
    if(!check.focused_by.includes(modid)){
        check.focused_by.push(modid);
    }
    updateCheckList();    
    updateChat();
}


/**
 * @param {string} modid
 */
function checkUnfocused(modid) {
    checks.forEach(check => check.focused_by = check.focused_by.filter(focused => focused != modid));
    menu_focused_by = menu_focused_by.filter(focused => focused != modid);
    updateCheckList();
}
  
function focuscheck(){
    if(!checks.some(check => check.id == focused_check)){
        focused_check = "";
    }
    focusCheck(focused_check, "", "", false, false);
}

/**
 * @param {string} teamid
 */
function banned(teamid){
    const chats = cached_chats.filter(chat => chat.teamid == teamid);
    chats.forEach(chat => chat.banned = true);
    updateChat();
}

/**
 * @param {string} teamid
 */
function unbanned(teamid){
    const chats = cached_chats.filter(chat => chat.teamid == teamid);
    chats.forEach(chat => chat.banned = false);
    updateChat();
}

function loaded(data) {
    data = JSON.parse(data);
    
    checks = data.checks.map(check => {
        return {
            id: check.id,
            probid: check.probid,
            teamid: check.teamid,
            assignid: check.assign,
            teamname: check.teamname,
            type: check.type, //grade, chat, globalchat
            payload: check.payload,
            focused_by: [],
        }
    });
    
    console.log(data);
    start_time = new Date(Date.now() + parseInt(data.online_round));
    end_time = new Date(Date.now() + parseInt(data.online_round_end));
    myId = data.idx.toString();
    updateCheckList();
    updateFocusedCheck();
    updateChat();
}
