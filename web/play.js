//global states
var team_balance = 25;
var team_name = "Team 1";
var team_rank = "14";
var end_time = new Date().getTime() + 100000;
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
            content: "akjsd kjashdkjhi udawhkjs duiwoah sldjl jaw diajsdl jaoiw jlasjd lkj"
        },
    ]
},
{
    id: "bnvcxiuwalknsdlkj",
    title: "Pecka u malého nuubatika",
    rank: "C",
    worked_on: false,
    last_answer_time: Date.now(),
    seen_chat: false,
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
var focused_problem = "askjdhiwuahskjd";



//initial setup
updateTeamStats();
updateProblemList();
updateFocusedProblem()


//buy events
const buy_button_wrapper = document.getElementById("buy-button-wrapper");
const buy_button = document.getElementById("buy-button");
const easy_buy = document.getElementById("easy-buy");
const medium_buy = document.getElementById("medium-buy");
const hard_buy = document.getElementById("hard-buy");

buy_button.addEventListener("click", function(){
    if(buy_button_wrapper.classList.contains("buy-button-close")){
        buy_button_wrapper.classList.add("buy-button-open");
        buy_button_wrapper.classList.remove("buy-button-close");
    }else{
        buy_button_wrapper.classList.add("buy-button-close");
        buy_button_wrapper.classList.remove("buy-button-open");
    }
})


function updateTeamStats(){
    document.getElementById("team-name").innerHTML = team_name;
    document.getElementById("rank").innerHTML = team_rank;
    document.getElementById("team-balance").innerHTML = team_balance + " DC"
}

function updateProblemList(){
    const problem_wrapper = document.getElementById("teams-problems");
    problem_wrapper.innerHTML = "";
    for(prob of problems){
        problem_wrapper.innerHTML +=
        `<div class="problem ${focused_problem == prob.id ? "problem-focused" : ""} ${prob.worked_on ? "problem-worked-on" : ""} ${!prob.seen_chat ? "unseen-chat" : ""}" id="${prob.id}">
            <div class="flex flex-row align-center">
                <h2 class="problem-title"${prob.title.length > 12 ? `style="font-size: 15px"` : ""}>${prob.title}</h2>
                <h2 class="problem-rank">[${prob.rank}]</h2>
            </div>
            <div class="occupied-icon"></div>
        </div>`
    }
}

function updateFocusedProblem(){
    if(focused_problem == "" || !problems.some(prob => prob.id == focused_problem)){
        focused_problem = "";


        return;
    }
    const problem_title = document.getElementById("problem-title");
    const problem_content = document.getElementById("problem-content");
    const sell_information = document.getElementById("sell-information");
    const focused_problem_obj = problems.find(prob => prob.id == focused_problem);
    problem_title.innerHTML = focused_problem_obj.title + " [" + focused_problem_obj.rank + "]";
    problem_content.innerHTML = focused_problem_obj.problem_content;
    sell_information.innerHTML = `*Prodat aktuální úlohu: <span class="bold">${focused_problem_obj.title}</span>`;
}





lastSecond = 0;
function update(){
    requestAnimationFrame(update);

    //clock
    const now = new Date().getTime();
    const remaining = end_time - now;
    if (Math.floor(remaining / 1000) != lastSecond && remaining>=0){
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







}

update();

/** @type {WebSocket} */
let socket;

function connectWS() {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get("id");

  socket = new WebSocket(`wss://strela-vlna.gchd.cz/api/play/${id}`);

  socket.addEventListener("message", (event) => {
    function cLe() { console.log("invalid msg", rawmsg) }
    /** @type {string} */
    const rawmsg = event.data;
    const msg = rawmsg.split(":");
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
        if (msg.length != 5) { cLe() }
        probBought(msg[1], msg[2], msg[3], msg[4])
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

    }
  })
}

connectWS();

/** @param {string} prob */
function sellProb(prob) {
  socket.send(`sell:${prob}`) }

/** @param {string} diff */
function buyProb(diff) {
  socket.send(`buy:${diff}`) }

/** @param {string} diff */
function buyOldProb(diff) {
  socket.send(`buyold:${diff}`) }

/** @param {string} prob
 * @param {string} sol */
function solveProb(prob, sol) {
  socket.send(`buy:${prob}:${sol}`) }

/** @param {string} prob */
function viewProb(prob) {
  socket.send(`view:${prob}`) }

/** @param {string} prob
 * @param {string} text */
function sendMsg(prob, text) {
  socket.send(`chat:${prob}:${text}`) }




/** @param {string} msg
 * @param {string} prob */
function msgRecieved(prob, msg) {
  console.log(prob, msg) }

/** @param {string} msg
 * @param {string} prob */
function msgSent(prob, msg) {
  console.log(prob, msg) }

/** @param {string} money
 * @param {string} prob */
function probSold(prob, money) {
  console.log(prob, money) }

/** @param {string} msg
 * @param {string} prob 
 * @param {string} money 
 * @param {string} name */
function probBought(prob, diff, money, name) {
  console.log(prob, diff, money, name) }

/** @param {string} msg
 * @param {string} prob 
 * @param {string} name */
function probSolved(prob, diff, name) {
  console.log(prob, diff, name) }

/** @param {string} msg
 * @param {string} text 
 * @param {string} name */
function probViewed(diff, name, text) {
  console.log(text, diff, name) }

/** @param {string} idx
 * @param {string} prob */
function probFocused(prob, idx) {
  console.log(prob, idx) }



