//global states
var team_balance = 400;
var team_name = "Team 1";
var team_rank = "14";
var start_time = new Date().getTime() - 1000000;
var end_time = new Date().getTime() + 3000000;
var prices = [[10, 20, 30], [15, 35, 69], [5, 10, 15]];
var team_members = ["Eduard Smetana", "Jiří Matoušek", "Antonín Šreiber", "Vanda Kybalová", "Jan Halfar"];
var problems_solved = 12;
var problems_sold = 3;
var global_chat = [
    {
        author: "support",
        content: "ahoj, toto je technicka podpora aoiw jlasjd lkj"
    },
    {
        author: "support",
        content: "akjsd kjaajsdl jaoiw jlasjd lkj"
    },
    {
        author: "team",
        content: "docela noobatik"
    },
    {
        author: "support",
        content: "spis docela opatik"
    },
]


var problems = [{
    id: "askjdhiwuahskjd",
    title: "Lyzar ve vesnici co si koupil moc drahy listky",
    rank: "A",
    worked_on: true,
    last_answer_time: new Date().getTime(),
    seen_chat: true,
    problem_content: "Mlékárna vykoupí od zemědělců mléko jedině tehdy, má-li předepsanou teplotu 4°C. Farmář při kontrolním měření zjistil, že jeho 60 litrů mléka má teplotu jen 3,6°C. Pomůže mu 10 litrů mléka o teplotě 6,5°C, které původně zamýšlel uschovat pro potřeby své rodiny? Zbude mu nějaké mléko aspoň na snídani? Anebo mu mlékárna mléko vůbec nevykoupí?",
    chat: [
        {
            author: "support",
            content: "akjsd kjashdkjhi udawhkjs duiwoah sldjl jaw diajsdl jaoiw jlasjd lkj"
        },
        {
            author: "support",
            content: "akjsd kjaajsdl jaoiw jlasjd lkj"
        },
        {
            author: "team",
            content: "docela noobatik"
        },
        {
            author: "support",
            content: "spis docela opatik"
        },
    ]
},
{
    id: "bnvcxiuwalknsdlkj",
    title: "Pecka u malého noobatika",
    rank: "C",
    worked_on: false,
    last_answer_time: Date.now(),
    seen_chat: true,
    problem_content: "asi Mlékárna vykoupí od zemědělců mléko jedině tehdy, má-li předepsanou teplotu 4°C. Farmář při kontrolním měření zjistil, že jeho 60 litrů mléka má teplotu jen 3,6°C. Pomůže mu 10 litrů mléka o teplotě 6,5°C, které původně zamýšlel uschovat pro potřeby své rodiny? Zbude mu nějaké mléko aspoň na snídani? Anebo mu mlékárna mléko vůbec nevykoupí?",
    chat: [
        {
            author: "support",
            content: "akjsd kjaajsdl jaoiw jlasjd lkj"
        },
        {
            author: "team",
            content: "docela noobatik"
        },
        {
            author: "support",
            content: "akjsd kjashdkjhi udawhkjs duiwoah sldjl jaw diajsdl jaoiw jlasjd lkj"
        },
    ]
}];

//local states
var focused_problem = "";

const buy_button_wrapper = document.getElementById("buy-button-wrapper");
const buy_button = document.getElementById("buy-button");
const easy_buy = document.getElementById("easy-buy");
const medium_buy = document.getElementById("medium-buy");
const hard_buy = document.getElementById("hard-buy");

const buy_buttons = [easy_buy, medium_buy, hard_buy];

const problem_wrapper = document.getElementById("problem-wrapper");
const team_stats_main_wrapper = document.getElementById("team-stats-main-wrapper");

//initial setup
updateTeamStats();
updateProblemList();
updateFocusedProblem();
updateChat();
updateShop();
updatePriceList();


//buy events

document.getElementById("send-message-button").addEventListener("click", function(){
    const chat_input = document.getElementById("chat-input");
    sendMsg(focused_problem, chat_input.value);
    chat_input.value = "";
});

buy_buttons.forEach(function(button, n){
    button.addEventListener("mouseover", function(){
        button.getElementsByClassName("buy-dropdown-difficulty")[0].innerHTML = `&nbsp` + prices[0][n];
    });
    button.addEventListener("mouseout", function(){
        button.getElementsByClassName("buy-dropdown-difficulty")[0].innerHTML = ["[A]", "[B]", "[C]"][n];
    });
});

buy_buttons.forEach(function(button, n){
    button.addEventListener("click", function(){
        buyProblem(["A", "B", "C"][n]);
    });
})

document.getElementById("sell-button").addEventListener("click", sellProblem);


buy_button.addEventListener("click", function(){
    if(buy_button_wrapper.classList.contains("buy-button-close")){
        buy_button_wrapper.classList.add("buy-button-open");
        buy_button_wrapper.classList.remove("buy-button-close");
    }else{
        buy_button_wrapper.classList.add("buy-button-close");
        buy_button_wrapper.classList.remove("buy-button-open");
    }
});

document.getElementById("team-stats").addEventListener("click", function(){
    focused_problem = "";
    updateFocusedProblem();
    updateChat();
    updateProblemList();
    document.getElementById("team-stats").classList.add("team-stats-selected");
    problem_wrapper.classList.add("hidden");
    team_stats_main_wrapper.classList.remove("hidden");
});


function updateShop(){
    buy_buttons.forEach(function(button, n){
        if(team_balance >= prices[0][n]){
            button.classList.remove("subbuy-disabled");
        }else{
            button.classList.add("subbuy-disabled");
        }
    });
    const focused_problem_obj = problems.find(prob => prob.id == focused_problem);
    const sell_information = document.getElementById("sell-information");
    if(focused_problem_obj != null){
        sell_information.innerHTML = `*Prodat aktuální úlohu: <span class="bold">${focused_problem_obj.title}</span>`;
    }else{
        sell_information.innerHTML = `*Klikněte na úlohu kterou chcete prodat`;
    }
}


function updateTeamStats(){
    document.getElementById("team-name").innerHTML = team_name;
    document.getElementById("rank").innerHTML = team_rank;
    document.getElementById("team-balance").innerHTML = team_balance + " DC"
    document.getElementById("team-stats-main-title").innerHTML = team_name;
    document.getElementById("team-stats-main-balance").innerHTML = team_balance + " DC";
    document.getElementById("team-stats-main-rank").innerHTML = team_rank;
    document.getElementById("statistics-balance").innerHTML = team_balance + " DC";
    document.getElementById("statistics-rank").innerHTML = team_rank;
    document.getElementById("statistics-solved").innerHTML = problems_solved;
    document.getElementById("statistics-sold").innerHTML = problems_sold;
    const team_stats_players_wrapper = document.getElementById("team-stats-players-wrapper");
    team_stats_players_wrapper.innerHTML = "";
    for(const member of team_members){
        team_stats_players_wrapper.innerHTML +=
        `<h2 class="team-stats-player">${member}</h2>`
    }
}

function updatePriceList(){
    document.getElementById("price-list-a-buy").innerHTML = prices[0][0] + " DC";
    document.getElementById("price-list-a-solve").innerHTML = prices[1][0] + " DC";
    document.getElementById("price-list-a-sell").innerHTML = prices[2][0] + " DC";

    document.getElementById("price-list-b-buy").innerHTML = prices[0][1] + " DC";
    document.getElementById("price-list-b-solve").innerHTML = prices[1][1] + " DC";
    document.getElementById("price-list-b-sell").innerHTML = prices[2][1] + " DC";

    document.getElementById("price-list-c-buy").innerHTML = prices[0][2] + " DC";
    document.getElementById("price-list-c-solve").innerHTML = prices[1][2] + " DC";
    document.getElementById("price-list-c-sell").innerHTML = prices[2][2] + " DC";
}

function updateProblemList(){
    const problems_wrapper = document.getElementById("teams-problems");
    problems_wrapper.innerHTML = "";
    for(prob of problems){
        problems_wrapper.innerHTML +=
        `<div class="problem ${focused_problem == prob.id ? "problem-focused" : ""} ${prob.worked_on ? "problem-worked-on" : ""} ${!prob.seen_chat ? "unseen-chat" : ""}" id="${prob.id}">
            <div class="flex flex-row align-center">
                <h2 class="problem-title"${prob.title.length > 12 ? `style="font-size: 15px"` : ""}>${prob.title}</h2>
                <h2 class="problem-rank">[${prob.rank}]</h2>
            </div>
            <div class="occupied-icon"></div>
        </div>`
    }
    
    const problems_buttons = document.getElementById("teams-problems").getElementsByClassName("problem");
    for(const button of problems_buttons){
        button.addEventListener("click", function(){
            focused_problem = this.id;
            updateProblemList();
            updateChat();
            updateFocusedProblem();
            updateShop();
            document.getElementById("team-stats").classList.remove("team-stats-selected");
            problem_wrapper.classList.remove("hidden");
            team_stats_main_wrapper.classList.add("hidden");
            
        });
    }
}

function updateFocusedProblem(){
    if(focused_problem == "" || !problems.some(prob => prob.id == focused_problem)){
        focused_problem = "";
        problem_wrapper.classList.add("hidden");
        team_stats_main_wrapper.classList.remove("hidden");
        return;
    }
    const problem_title = document.getElementById("problem-title");
    const problem_content = document.getElementById("problem-content");
    const focused_problem_obj = problems.find(prob => prob.id == focused_problem);
    problem_title.innerHTML = focused_problem_obj.title + " [" + focused_problem_obj.rank + "]";
    problem_content.innerHTML = focused_problem_obj.problem_content;
}

function updateChat(){
    const conversation_wrapper = document.getElementById("conversation-wrapper");
    conversation_wrapper.innerHTML = "";
    if(focused_problem == "" || !problems.some(prob => prob.id == focused_problem)){
        focused_problem = "";
        for(const message of global_chat){
            conversation_wrapper.innerHTML += 
            `<div class="conversation-row ${message.author == "team" ? "message-my" : "message-their"}">
                <p class="conversation-message">${message.content}</p>
            </div>`
        }
        return;
    }
    for(const message of problems.find(prob => prob.id == focused_problem).chat){
        conversation_wrapper.innerHTML += 
        `<div class="conversation-row ${message.author == "team" ? "message-my" : "message-their"}">
            <p class="conversation-message">${message.content}</p>
        </div>`
    }
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
    // document.getElementById("confirm-dialog-ok").removeEventListener("click", arguments.callee);
    document.getElementById("confirm-dialog-ok").replaceWith(document.getElementById("confirm-dialog-ok").cloneNode(true));
});
function buyProblem(rank){
    if (team_balance < prices[0]["ABC".indexOf(rank)]){return;}
    const confirm_dialog = document.getElementById("confiramtion-dialog-bg");
    confirm_dialog.style.display = "block";
    // document.getElementById("confirm-dialog-content").innerHTML = `Opravdu chcete koupit úlohu ranku <span class="bold">${rank}</span> za <span class="bold">${prices[team_rank.indexOf(rank)][0]}</span> DC?`;
    document.getElementById("confirm-dialog-content").innerHTML = `Opravdu chcete koupit úlohu:<br><span class="bold">${rank}</span> za <span class="bold">${prices[0]["ABC".indexOf(rank)]}</span> DC?`;
    document.getElementById("confirm-dialog-ok").addEventListener("click", function(){
        console.log(prices[0]["ABC".indexOf(rank)]);
        if(team_balance >= prices[0]["ABC".indexOf(rank)]){
            buyProb(rank);
            // team_balance -= prices[0]["ABC".indexOf(rank)];
            // updateTeamStats();
            // const new_problem = {
            //     id: Math.random().toString(36).substring(7),
            //     title: "Koupil sis novou úlohu",
            //     rank: rank,
            //     worked_on: false,
            //     last_answer_time: Date.now(),
            //     seen_chat: true,
            //     problem_content: "Uspějte v této úloze a získejte další body!",
            //     chat: []
            // }
            // problems.push(new_problem);
            updateProblemList();
            updateShop();

        }
        confirm_dialog.style.display = "none";
        document.getElementById("confirm-dialog-ok").removeEventListener("click", arguments.callee);
    });
}

function sellProblem(){
    if(!focused_problem || !problems.some(prob => prob.id == focused_problem)) return;
    const confirm_dialog = document.getElementById("confiramtion-dialog-bg");
    confirm_dialog.style.display = "block";
    const focused_problem_obj = problems.find(prob => prob.id == focused_problem);
    document.getElementById("confirm-dialog-content").innerHTML = `Opravdu chcete prodat úlohu:<br><span class="bold">${focused_problem_obj.title}</span> za <span class="bold">${focused_problem_obj.rank == "A" ? 5 : focused_problem_obj.rank == "B" ? 10 : 15}</span> DC?`;
    document.getElementById("confirm-dialog-ok").addEventListener("click", function(){
        sellProb(focused_problem);

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
    const remaining = end_time - now;
    const passed = now - start_time;
    if ((Math.floor(remaining / 1000) != lastSecond && remaining>=0) || (!clock_zeroed && remaining < 0)){
        if (remaining < 0){clock_zeroed = true;}
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
      // window.location.href = `login.html?id=${id}`;
  });
    // window.location.href = "login.html";

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
        probSold(msg[1], msg[2])
      break;
      case "bought":
        if (msg.length != 6) { cLe() }
        probBought(msg[1], msg[2], msg[3], msg[4], msg[5])
      break;
      case "solved":
        if (msg.length != 4) { cLe() }
        probSolved(msg[1], msg[2], msg[3])
      break;
      case "viewed":
        if (msg.length != 4) { cLe() }
        probViewed(msg[1], msg[2], msg[3])
      break;
      case "focused":
        if (msg.length != 3) { cLe() }
        probFocused(msg[1], msg[2])
      break;
      case "msgsent":
        if (msg.length != 3) { cLe() }
        msgSent(msg[1], msg[2], msg[3])
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
//   window.location.href = "login.html";
}
// connectWS();

/** @param {string} id */
function sellProb(id) {
  socket.send(`sell\x00${id}`) }

/** @param {string} diff */
function buyProb(diff) {
  socket.send(`buy\x00${diff}`) }

/** @param {string} diff */
function buyOldProb(diff) {
  socket.send(`buyold\x00${diff}`) }

/** @param {string} id
 * @param {string} sol */
function solveProb(id, sol) {
  socket.send(`buy\x00${id}:${sol}`) }

/** @param {string} id */
function viewProb(id) {
  socket.send(`view\x00${id}`) }

/** @param {string} id
 * @param {string} text */
function sendMsg(id, text) {
  socket.send(`chat\x00${id}\x00${text}`) }

/** @param {string} msg
 * @param {string} id */
function msgRecieved(id, msg) {
  if(id == "") {
    global_chat.push({author: "support", content: msg});
    updateChat();
  } else {
    const problem = problems.find(prob => prob.id == id);
    if(problem != null) {
      problem.chat.push({author: "support", content: msg});
      updateChat();
    }
  }
  console.log(id, msg) }

/** @param {string} msg
 * @param {string} id */
function msgSent(id, msg) {
  if(id == "") {
    global_chat.push({author: "team", content: msg});
    // updateChat();
  } else {
    const problem = problems.find(prob => prob.id == id);
    if(problem != null) {
      problem.chat.push({author: "team", content: msg});
      updateChat();
    }
  }
  console.log(id, msg) }

/** @param {string} money
 * @param {string} id */
function probSold(id, money) {
  problems = problems.filter(prob => prob.id != id);
  team_balance = parseInt(money);
  updateTeamStats();
  updateProblemList();
  updateFocusedProblem();
  console.log(id, money);
}

/** @param {string} id
 * @param {string} diff
 * @param {string} money
 * @param {string} name
 * @param {string} text */
function probBought(id, diff, money, name, text) {
    const new_problem = {
        id: id,
        title: name,
        rank: diff,
        worked_on: false,
        last_answer_time: Date.now()-10000,
        seen_chat: true,
        problem_content: text,
        chat: []
    }
    problems.push(new_problem);
    team_balance = parseInt(money);
    console.log(id, diff, money, name, text) 
    updateProblemList();
    updateTeamStats();
}
/** @param {string} msg
 * @param {string} id 
 * @param {string} name */
function probSolved(id, diff, name) {
  console.log(id, diff, name) }

/** @param {string} msg
 * @param {string} text 
 * @param {string} name */
function probViewed(diff, name, text) {
  console.log(text, diff, name) }

/** @param {string} idx
 * @param {string} id */
function probFocused(id, idx) {
  console.log(id, idx) }



