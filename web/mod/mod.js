const redirects = false;
//global states
var start_time = new Date().getTime() - 5000;
var end_time = new Date().getTime() + 5000;
var prices = [[10, 20, 30], [15, 35, 69], [5, 10, 15]]; //[buy], [solve], [sell]

var myId = "";

var checks = [
    {
        id: 0,
        probid: 0,
        teamid: 0,
        payload: "To je spatne",
        type: "grade",
        content: "Mlékárna vykoupí od zemědělců mléko jedině tehdy, má-li předepsanou teplotu 4°C. Farmář při kontrolním měření zjistil, že jeho 60 litrů mléka má teplotu jen 3,6°C. Pomůže mu 10 litrů mléka o teplotě 6,5°C, které původně zamýšlel uschovat pro potřeby své rodiny? Zbude mu nějaké mléko aspoň na snídani? Anebo mu mlékárna mléko vůbec nevykoupí?",
        name: "Soudce",
        rank: "C",
        seen_chat: true,
        chat_banned: false,
        focused_by: [],
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

const confirm_button = document.getElementById("confirm-button");
const reject_button = document.getElementById("reject-button");

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
    focusCheck("", "", "");
    focused_check = "";
    updateFocusedCheck();
    updateChat();
    updateCheckList();
    updateShop();
    document.getElementById("home-button").classList.add("home-selected");
    focused_check_wrapper.classList.add("hidden");
    mod_home_wrapper.classList.remove("hidden");
});

function updateCheckList(){
    const checks_wrapper = document.getElementById("teams-checks");
    for(const check of checks){
        if(check.focused_by.length > 0){
            check.seen_chat = true;
        }
    }
    checks_wrapper.innerHTML = "";
    for(check of checks){
        checks_wrapper.innerHTML +=
        `<div class="check ${focused_check == check.id ? "check-focused" : ""} ${check.focused_by.length > (focused_check == check.id ? 1 : 0) ? "check-worked-on" : ""} ${!check.seen_chat ? "unseen-chat" : ""}" id="${check.id}">
            <div class="flex flex-row align-center">
                <h2 class="check-title"${check.title.length > 12 ? `style="font-size: 15px"` : ""}>${check.title}</h2>
                <h2 class="check-rank">[${check.rank}]</h2>
            </div>
            <div class="occupied-icon"></div>
        </div>`
    }
    
    const checks_buttons = document.getElementById("teams-checks").getElementsByClassName("check");
    for(const button of checks_buttons){
        button.addEventListener("click", function(){
            if(focused_check == this.id){
                return;
            }

            unfocusCheck();

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
            focusCheck(focused_check);
            document.getElementById("team-stats").classList.remove("team-stats-selected");
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
    const checklem_title = document.getElementById("checklem-title");
    const checklem_content = document.getElementById("checklem-content");
    const focused_check_obj = checklems.find(check => check.id == focused_check);
    checklem_title.innerHTML = focused_check_obj.title + " [" + focused_check_obj.rank + "]";
    checklem_content.innerHTML = focused_check_obj.checklem_content;
    const answer_input_wrapper = document.getElementById("answer-input-wrapper");
    const answer_input = document.getElementById("answer-input");
    if(focused_check_obj.pending){
        answer_input.placeholder = "Odpověděli jste: " + focused_check_obj.solution;
    }else{
        answer_input.placeholder = "Odpověď";
    }

    if(focused_check_obj.pending || clock_zeroed){
        answer_input_wrapper.classList.add("cannot-answer");
    }else{
        answer_input_wrapper.classList.remove("cannot-answer");
    }
}

function updateChat(){
    console.log(menu_focused_by);
    if(chat_banned){
        document.getElementById("help-center-wrapper").classList.add("chat-banned");
        document.getElementById("chat-banned-info").classList.remove("hidden");
    }else{
        document.getElementById("help-center-wrapper").classList.remove("chat-banned");
        document.getElementById("chat-banned-info").classList.add("hidden");
    }
    const conversation_wrapper = document.getElementById("conversation-wrapper");
    conversation_wrapper.innerHTML = "";

    if(menu_focused_by.length > 0){
        seen_global_chat = true;
    }
    if(seen_global_chat){
        document.getElementById("seen-global-chat-icon").classList.add("hidden");
        document.getElementById("rank-number").classList.remove("hidden");
    }else{
        document.getElementById("seen-global-chat-icon").classList.remove("hidden");
        document.getElementById("rank-number").classList.add("hidden");
    }

    if(focused_check == "" || !checklems.some(check => check.id == focused_check)){
        focused_check = "";
        for(const message of global_chat){
            conversation_wrapper.innerHTML += 
            `<div class="conversation-row ${message.author == "team" ? "message-my" : "message-their"}">
                <p class="conversation-message">${message.content}</p>
            </div>`
        }
        return;
    }
    for(const message of checklems.find(check => check.id == focused_check).chat){
        conversation_wrapper.innerHTML += 
        `<div class="conversation-row ${message.author == "team" ? "message-my" : "message-their"}">
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

document.getElementById("confirm-dialog-cancel").addEventListener("click", function(){
    const confirm_dialog = document.getElementById("confiramtion-dialog-bg");
    confirm_dialog.style.display = "none";
    document.getElementById("confirm-dialog-ok").replaceWith(document.getElementById("confirm-dialog-ok").cloneNode(true));
});
function buyChecklem(rank){
    if (team_balance < prices[0]["ABC".indexOf(rank)]){return;}
    const confirm_dialog = document.getElementById("confiramtion-dialog-bg");
    confirm_dialog.style.display = "block";
    document.getElementById("confirm-dialog-content").innerHTML = `Opravdu chcete koupit úlohu:<br><span class="bold">${rank}</span> za <span class="bold">${prices[0]["ABC".indexOf(rank)]}</span> DC?`;
    document.getElementById("confirm-dialog-ok").addEventListener("click", function(){
        console.log(prices[0]["ABC".indexOf(rank)]);
        if(team_balance >= prices[0]["ABC".indexOf(rank)]){
            buyCheck(rank);
            // team_balance -= prices[0]["ABC".indexOf(rank)];
            // updateTeamStats();
            // const new_checklem = {
            //     id: Math.random().toString(36).substring(7),
            //     title: "Koupil sis novou úlohu",
            //     rank: rank,
            //     worked_on: false,
            //     last_answer_time: Date.now(),
            //     seen_chat: true,
            //     checklem_content: "Uspějte v této úloze a získejte další body!",
            //     chat: []
            // }
            // checklems.push(new_checklem);
            // updateCheckList();
            // updateShop();

        }
        confirm_dialog.style.display = "none";
        document.getElementById("confirm-dialog-ok").removeEventListener("click", arguments.callee);
    });
}

function sellChecklem(){
    if(!focused_check || !checklems.some(check => check.id == focused_check) || checklems.find(check => check.id == focused_check).pending || clock_zeroed) return;
    const confirm_dialog = document.getElementById("confiramtion-dialog-bg");
    confirm_dialog.style.display = "block";
    const focused_check_obj = checklems.find(check => check.id == focused_check);
    document.getElementById("confirm-dialog-content").innerHTML = `Opravdu chcete prodat úlohu:<br><span class="bold">${focused_check_obj.title}</span> za <span class="bold">${focused_check_obj.rank == "A" ? 5 : focused_check_obj.rank == "B" ? 10 : 15}</span> DC?`;
    document.getElementById("confirm-dialog-ok").addEventListener("click", function(){
        sellCheck(focused_check);

        confirm_dialog.style.display = "none";
        document.getElementById("confirm-dialog-ok").removeEventListener("click", arguments.callee);
    });
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
            updateShop();
            updateFocusedCheck();
            remaining = 0;
            passed = end_time-start_time;
        }
        updateClock(remaining, passed);
    }

}

update();

/** @type {WebSocket} */
let socket;

function connectWS() {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get("id");
  socket = new WebSocket(`wss://strela-vlna.gchd.cz/api/play/${id}`);
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

      case "msgrecd":
        if (msg.length != 3) { cLe() }
        msgRecieved(msg[1], msg[2])
      break;
      case "sold":
        if (msg.length != 3) { cLe() }
        checkSold(msg[1], msg[2])
      break;
      case "bought":
        if (msg.length != 6) { cLe() }
        checkBought(msg[1], msg[2], msg[3], msg[4], msg[5])
      break;
      case "solved":
        if (msg.length != 3) { cLe() }
        checkSolved(msg[1], msg[2])
      break;
      case "focused":
        if (msg.length != 3) { cLe() }
        checkFocused(msg[1], msg[2])
      break;
      case "unfocused":
        if (msg.length != 2) { cLe() }
        checkUnfocused(msg[1])
      break;
      case "msgsent":
        if (msg.length != 4) { cLe() }
        msgSent(msg[1], msg[2], msg[3])
      break;
      case "focuscheck":
        focusCheck();
      break;
      case "loaded":
        if (msg.length != 2) { cLe() }
        loaded(msg[1]);
      break;
      case "graded" :
        if (msg.length != 4) { cLe() }
        graded(msg[1], msg[2], msg[3]);
        break;
      case "banned" :
        chat_banned = true;
        updateChat();
        break;
      case "unbanned" :
        chat_banned = false;
        updateChat();
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
        window.location.href = `login.html?id=${id}`;
    }
}
// connectWS();

/** @param {string} id */
function sellCheck(id) { //done
  socket.send(`sell\x00${id}`) }

/** @param {string} diff */
function buyCheck(diff) { //done
  socket.send(`buy\x00${diff}`) }

/** @param {string} diff */
function buyOldCheck(diff) {
  socket.send(`buyold\x00${diff}`) }

/** @param {string} id
 * @param {string} sol */
function solveCheck(id, sol) { //done
  socket.send(`solve\x00${id}\x00${sol}`) }

/** @param {string} id
 * @param {string} probid
 * @param {string} teamid 
 * @param {boolean} send_content
 * */
function focusCheck(id, probid, teamid, send_content) { //done
  socket.send(`focus\x00${id}\x00${probid}\x00${teamid}\x00${send_content ? "yes" : "no"}`) }

/** @param {string} id */
function unfocusCheck() { //done
    const focused_check_obj = checks.find(check => check.id == focused_check);
    if(focused_check_obj != null){
        const index = focused_check_obj.focused_by.indexOf(myId);
        if (index > -1) {
            focused_check_obj.focused_by.splice(index, 1);
        }
    }
    socket.send(`unfocus`) }

/** @param {string} teamid
 * @param {string} checkid
 * @param {string} text */
function sendMsg(teamid, checkid, text) { //done
  socket.send(`chat\x00${teamid}\x00${checkid}\x00${text}`) }

/** load game state */
function load() {
  socket.send("load");
}

/** @param {string} msg
 * @param {string} id */
function msgRecieved(id, msg) {
  if(id == "") {
    global_chat.push({author: "support", content: msg});
    seen_global_chat = false;
    updateChat();
  } else {
    const checklem = checklems.find(check => check.id == id);
    if(checklem != null) {
      checklem.chat.push({author: "support", content: msg});
      checklem.seen_chat = false;
      updateCheckList();
      updateChat();
    }
  }
  console.log(id, msg) }

/** @param {string} msg
 * @param {string} id */
function msgSent(id, msg) {
  if(id == "") {
    global_chat.push({author: "team", content: msg});
    updateChat();
  } else {
    const checklem = checklems.find(check => check.id == id);
    if(checklem != null) {
      checklem.chat.push({author: "team", content: msg});
      updateChat();
    }
  }
  console.log(id, msg) }

/** @param {string} money
 * @param {string} id */
function checkSold(id, money) {
  checklems = checklems.filter(check => check.id != id);
  team_balance = parseInt(money);
  checklems_sold++;
  updateTeamStats();
  updateCheckList();
  updateFocusedCheck();
  updateShop();
  updateChat();
  console.log(id, money);
}

/** @param {string} id
 * @param {string} diff
 * @param {string} money
 * @param {string} name
 * @param {string} text */
function checkBought(id, diff, money, name, text) {
    const new_checklem = {
        id: id,
        title: name,
        rank: diff,
        focused_by: [],
        can_answer: true,
        seen_chat: true,
        checklem_content: text,
        chat: []
    }
    checklems.push(new_checklem);
    team_balance = parseInt(money);
    console.log(id, diff, money, name, text) 
    updateCheckList();
    updateTeamStats();
    updateShop();
}
/** @param {string} msg
 * @param {string} id 
 * @param {string} solution */
function checkSolved(id, solution) {
    const checklem = checklems.find(check => check.id == id);
    checklem.pending = true;
    checklem.solution = solution;
    updateFocusedCheck();
    updateCheckList();
    updateShop();
    console.log(id, solution);
}



/** @param {string} idx
 * @param {string} id */
function checkFocused(id, idx) {
    if(id == ""){
        if(!menu_focused_by.includes(idx)){
            menu_focused_by.push(idx);
        }
        seen_global_chat = true;
        updateCheckList();
        updateChat();
        return;
    }
    const checklem = checklems.find(check => check.id == id);
    console.log(id);
    if(!checklem.focused_by.includes(idx)){
        checklem.focused_by.push(idx);
    }
    updateCheckList();    
    console.log(id, idx) }

/** @param {string} idx
 * @param {string} id */
function checkUnfocused(idx) {
    checklems.forEach(check => check.focused_by = check.focused_by.filter(focused => focused != idx));
    menu_focused_by = menu_focused_by.filter(focused => focused != idx);
    updateCheckList();    
}
  
function focusCheck(){
    if(!checklems.some(check => check.id == focused_check)){
        focused_check = "";
    }
    focusCheck(focused_check);
}

/** @param {string} checkid
 * @param {string} correct
 * @param {string} money */
function graded(checkid, correct, money) {
    const checklem = checklems.find(check => check.id == checkid);
    if(correct == "yes"){
        checklems = checklems.filter(check => check.id != checkid);
    }else{
        checklem.pending = false;
        checklem.solution = "";
    }
    team_balance = parseInt(money);
    updateTeamStats();
    updateCheckList();
    updateShop();
    console.log(checkid, correct, money);
}





function loaded(data) {
    data = JSON.parse(data);
    
    checklems = data.bought.map(bought => {
        return {
            id: bought.id,
            title: bought.name,
            rank: bought.diff,
            focused_by: [],
            can_answer: true,
            seen_chat: true,
            pending: false,
            solution: "",
            checklem_content: bought.text,
            chat: [],
        }
    });
    console.log(data);
    checklems = checklems.concat(data.pending.map(pending => {
        return {
            id: pending.id,
            title: pending.name,
            rank: pending.diff,
            focused_by: [],
            can_answer: true,
            seen_chat: true,
            pending: true,
            solution: data.checks.find(check => check.checkid == pending.id).solution,
            checklem_content: pending.text,
            chat: [],
        }
    }));
    team_balance = parseInt(data.money);
    team_name = data.name;
    start_time = new Date(Date.now() + parseInt(data.online_round));
    end_time = new Date(Date.now() + parseInt(data.online_round_end));
    team_members = [data.player1, data.player2, data.player3, data.player4, data.player5].filter(member => member != "");
    global_chat = [];
    for (const line of data.chat.split("\x0b")) {
      if (line == "") continue;
      const [author, id, text] = line.split("\x09");
      if (id == "") {
        global_chat.push({author: author == "a" ? "support" : "team", content: text});
      } else {
        const check = checklems.find(i => i.id == id);
        if (check == undefined) { continue; }
        check.chat.push({author: author == "a" ? "support" : "team", content: text});
      }
    }
    prices = [
        [data.costs["A"] || 0, data.costs["B"] || 0, data.costs["C"] || 0],
        [data.costs["+A"] || 0, data.costs["+B"] || 0, data.costs["+C"] || 0],
        [data.costs["-A"] || 0, data.costs["-B"] || 0, data.costs["-C"] || 0]
    ];
    team_rank = parseInt(data.rank);
    checklems_solved = parseInt(data.numsolved);
    checklems_sold = parseInt(data.numsold);
    chat_banned = data.banned;
    myId = data.idx.toString();
    updatePriceList();
    // console.log(checklems[0].chat);
    updateCheckList();
    updateShop();
    updateFocusedCheck();
    updateTeamStats();
    updateChat();
}
