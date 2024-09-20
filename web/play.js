//global states
var team_balance = 25;
var team_name = "Team 1";
var team_rank = "14";
var end_time = new Date().getTime() + 100000;
var prices = [[10, 20, 30], [15, 35, 70], [5, 10, 15]];

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
}
];

//local states
var focused_problem = "askjdhiwuahskjd";

const buy_button_wrapper = document.getElementById("buy-button-wrapper");
const buy_button = document.getElementById("buy-button");
const easy_buy = document.getElementById("easy-buy");
const medium_buy = document.getElementById("medium-buy");
const hard_buy = document.getElementById("hard-buy");

const buy_buttons = [easy_buy, medium_buy, hard_buy];


//initial setup
updateTeamStats();
updateProblemList();
updateFocusedProblem();
updateChat();
updateShop();


//buy events


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
})


function updateShop(){
    buy_buttons.forEach(function(button, n){
        if(team_balance >= prices[0][n]){
            button.classList.remove("subbuy-disabled");
        }else{
            button.classList.add("subbuy-disabled");
        }
    });
}


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
    
    const problems_buttons = document.getElementById("teams-problems").getElementsByClassName("problem");
    for(const button of problems_buttons){
        button.addEventListener("click", function(){
            focused_problem = this.id;
            updateProblemList();
            updateChat();
            updateFocusedProblem();
        });
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

function updateChat(){
    const conversation_wrapper = document.getElementById("conversation-wrapper");
    conversation_wrapper.innerHTML = "";
    for(const message of problems.find(prob => prob.id == focused_problem).chat){
        conversation_wrapper.innerHTML += 
        `<div class="conversation-row ${message.author == "team" ? "message-my" : "message-their"}">
            <p class="conversation-message">${message.content}</p>
        </div>`
    }
}

function updateClock(remaining){
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

document.getElementById("confirm-dialog-cancel").addEventListener("click", function(){
    const confirm_dialog = document.getElementById("confiramtion-dialog-bg");
    confirm_dialog.style.display = "none";
    // document.getElementById("confirm-dialog-ok").removeEventListener("click", arguments.callee);
    document.getElementById("confirm-dialog-cancel").replaceWith(document.getElementById("confirm-dialog-cancel").cloneNode(true));
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
            team_balance -= prices[0]["ABC".indexOf(rank)];
            updateTeamStats();
            const new_problem = {
                id: Math.random().toString(36).substring(7),
                title: "Koupil sis novou úlohu",
                rank: rank,
                worked_on: false,
                last_answer_time: Date.now(),
                seen_chat: true,
                problem_content: "Uspějte v této úloze a získejte další body!",
                chat: []
            }
            problems.push(new_problem);
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
        team_balance += focused_problem_obj.rank == "A" ? 5 : focused_problem_obj.rank == "B" ? 10 : 15;
        updateTeamStats();
        problems = problems.filter(prob => prob.id != focused_problem);
        updateProblemList();
        updateShop();
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
    if ((Math.floor(remaining / 1000) != lastSecond && remaining>=0) || (!clock_zeroed && remaining < 0)){
        if (remaining < 0){clock_zeroed = true;}
        updateClock(remaining);
    }







}

update();