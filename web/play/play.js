const redirects = true;
//global states
let contest_name = "X";
let contest_info = "";
let contest_state = "running";
let seen_contest_info = true;
let team_balance = 400;
let team_name = "Team 1";
let team_rank = "14";
let start_time = new Date().getTime() - 5000;
let end_time = new Date().getTime() + 5000000;
let prices = [[10, 20, 30], [15, 35, 69], [5, 10, 15]]; //[buy], [solve], [sell]
let remaining = [-1, 0, 0];
let team_members = ["Eduard Smetana", "Jiří Matoušek", "Antonín Šreiber", "Vanda Kybalová", "Jan Halfar"];
let problems_solved = 12;
let problems_sold = 3;
let global_chat = [];
let seen_global_chat = true;
let menu_focused_by = [];
let problems = [];
let myId = "";
let chat_banned = false;
let results_ready = false;

let table = [];

//local states
let focused_check = "";

let clock_zeroed = false;

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

document.getElementById("chat-input").addEventListener("keydown", function(e){
    if(e.key == "Enter"){
        if(e.shiftKey){
            const text = this.value;
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.selectionStart = this.selectionEnd = start;
        }else{
            e.preventDefault();
            document.getElementById("send-message-button").click();
        }
    }
});

document.getElementById("send-message-button").addEventListener("click", function(){
    if(chat_banned) return;
    const chat_input = document.getElementById("chat-input");
    if(chat_input.value.length > 200 || chat_input.value.length == 0) return;
    sendMsg(focused_check, chat_input.value);
    chat_input.value = "";
});

buy_buttons.forEach(function(button, n){
    button.addEventListener("mouseover", function(){
        const but = button.getElementsByClassName("buy-dropdown-difficulty")[0];
        const tooltip = document.getElementById("tooltip");
        but.innerHTML = prices[0][n];
        tooltip.innerHTML = `Zbývá: ${n == 0 ? "hodně" : remaining[n]}`;
        if (remaining[n] == 0) {
            tooltip.classList.add("warning");
        } else {
            tooltip.classList.remove("warning");
        }
        tooltip.classList.remove("hidden");
    });
    button.addEventListener("mouseout", function(){
        const but = button.getElementsByClassName("buy-dropdown-difficulty")[0];
        const tooltip = document.getElementById("tooltip");
        but.innerHTML = ["[A]", "[B]", "[C]"][n];
        tooltip.classList.add("hidden");
    });
});

buy_buttons.forEach(function(button, n){
    button.addEventListener("click", function(){
        buyProblem(["A", "B", "C"][n]);
    });
})

document.getElementById("sell-button").addEventListener("click", sellProblem);


buy_button.addEventListener("click", function(){
    if(clock_zeroed){return;}
    if(buy_button_wrapper.classList.contains("buy-button-close")){
        buy_button_wrapper.classList.add("buy-button-open");
        buy_button_wrapper.classList.remove("buy-button-close");
    }else{
        buy_button_wrapper.classList.add("buy-button-close");
        buy_button_wrapper.classList.remove("buy-button-open");
    }
});

document.getElementById("team-stats").addEventListener("click", function(){
    if(!seen_contest_info){
        const warnings = document.getElementsByClassName("information-warning");
        seen_contest_info = true;

        for(const warning of warnings){
            warning.classList.add("blink");
        }

        setTimeout(function(){
            for(const warning of warnings){
                warning.classList.remove("blink");
            }
        }, 3000);
    }
    unfocusProb();
    focusProb("");
    focused_check = "";
    updateFocusedProblem();
    updateChat();
    updateProblemList();
    updateShop();
    document.getElementById("team-stats").classList.add("team-stats-selected");
    problem_wrapper.classList.add("hidden");
    team_stats_main_wrapper.classList.remove("hidden");
});

document.getElementById("submit-answer-button").addEventListener("click", function(){
    const answer_obj = problems.find(prob => prob.id == focused_check);
    if(answer_obj != null && !answer_obj.pending){
        const answer_input = document.getElementById("answer-input");
        if(answer_input.value != ""){
            answer_obj.pending = true;
            solveProb(focused_check, answer_input.value);
            answer_input.value = "";
            updateFocusedProblem();
        }
    }
});

document.getElementById("answer-input").addEventListener("focus", function(){
    const focused_problem_obj = problems.find(prob => prob.id == focused_check);
    if(focused_problem_obj != null){
        focused_problem_obj.incorrect = false;
    }
    updateFocusedProblem();
    updateProblemList();
});

document.getElementById("answer-input").addEventListener("keydown", function(e){
    if(e.key == "Enter"){
        e.preventDefault();
        this.blur();
        document.getElementById("submit-answer-button").click();
    }
});


function updateShop(){
    buy_buttons.forEach(function(button, n){
        if(team_balance < prices[0][n] || remaining[n] == 0){
            button.classList.add("subbuy-disabled");
        }else{
            button.classList.remove("subbuy-disabled");
        }
    });
    const focused_problem_obj = problems.find(prob => prob.id == focused_check);
    const sell_information = document.getElementById("sell-information");
    if(focused_problem_obj != null){
        if(focused_problem_obj.pending){
            sell_information.innerHTML = `*Nelze prodat úlohu, kterou jste poslali na kontrolu řešení`;
            document.getElementById("sell-action-wrapper").classList.add("cannot-sell");
        }else{
            sell_information.innerHTML = `*Prodat aktuální úlohu: <span class="bold">${focused_problem_obj.title}</span>`;
            document.getElementById("sell-action-wrapper").classList.remove("cannot-sell");
        }
    }else{
        sell_information.innerHTML = `*Klikněte na úlohu kterou chcete prodat`;
        document.getElementById("sell-action-wrapper").classList.add("cannot-sell");
    }
    if(clock_zeroed){
        sell_information.innerHTML = `*Čas vypršel. Již nelze provádět žádné akce`;
        document.getElementById("sell-action-wrapper").classList.add("cannot-sell");
        buy_buttons.forEach(function(button){
            button.classList.add("subbuy-disabled");
        });
        document.getElementById("buy-button-wrapper").classList.add("cannot-sell");
        buy_button.classList.add("cannot-sell");
        if(!buy_button_wrapper.classList.contains("buy-button-close")){
            buy_button_wrapper.classList.add("buy-button-close");
            buy_button_wrapper.classList.remove("buy-button-open");
        }
    }
}


function updateTeamStats(){
    document.getElementById("team-name").innerHTML = team_name;
    document.getElementById("results-team-name").innerHTML = team_name;
    document.getElementById("rank-number").innerHTML = team_rank;
    document.getElementById("team-balance").innerHTML = team_balance + " DC"
    document.getElementById("team-stats-main-title").innerHTML = team_name;
    document.getElementById("team-stats-main-balance").innerHTML = team_balance + " DC";
    document.getElementById("team-stats-main-rank").innerHTML = team_rank;
    document.getElementById("information-content").innerHTML = contest_info;
    document.getElementById("title").innerHTML = contest_name;
    const team_stats_players_wrapper = document.getElementById("team-stats-players-wrapper");
    const team_stats_results_playeres = document.getElementById("results-players-wrapper");
    team_stats_players_wrapper.innerHTML = "";
    team_stats_results_playeres.innerHTML = "";
    for(const member of team_members){
        team_stats_players_wrapper.innerHTML +=
        `<h2 class="team-stats-player">${member}</h2>`
        team_stats_results_playeres.innerHTML +=
        `<h2 class="results-player">${member}</h2>`
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
    for(const prob of problems){
        if(prob.focused_by.length > 0){
            prob.seen_chat = true;
            if(focused_check != prob.id){
                prob.incorrect = false;
            }
        }
    }
    problems_wrapper.innerHTML = "";
    for(prob of problems){
        problems_wrapper.innerHTML +=
        `<div class="problem ${focused_check == prob.id ? "problem-focused" : ""} ${prob.focused_by.length > (focused_check == prob.id ? 1 : 0) ? "problem-worked-on" : ""} ${!prob.seen_chat ? "unseen-chat" : ""} ${prob.pending ? "problem-pending" : ""} ${prob.incorrect ? "problem-incorrect" : ""} ${prob.correct ? "problem-correct" : ""}" id="${prob.id}">
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
            if(focused_check == this.id){
                return;
            }

            unfocusProb();

            const focused_problem_obj = problems.find(prob => prob.id == focused_check);
            if(focused_problem_obj != null){
                const index = focused_problem_obj.focused_by.indexOf(myId);
                if (index > -1) {
                    focused_problem_obj.focused_by.splice(index, 1);
                }
            }
            
            focused_check = this.id;
            updateProblemList();
            updateChat();
            updateFocusedProblem();
            updateShop();
            focusProb(focused_check);
            document.getElementById("team-stats").classList.remove("team-stats-selected");
            problem_wrapper.classList.remove("hidden");
            team_stats_main_wrapper.classList.add("hidden");
            
        });
    }
    
    
}

function updateFocusedProblem(){
    if(focused_check == "" || !problems.some(prob => prob.id == focused_check)){
        focused_check = "";
        problem_wrapper.classList.add("hidden");
        team_stats_main_wrapper.classList.remove("hidden");
        return;
    }
    const problem_title = document.getElementById("problem-title");
    const problem_content = document.getElementById("problem-content");
    const focused_problem_obj = problems.find(prob => prob.id == focused_check);
    problem_title.innerHTML = focused_problem_obj.title + " [" + focused_problem_obj.rank + "]";

    const content = focused_problem_obj.problem_content;
    problem_content.innerHTML = parseContentForLatex(content);

    const answer_input_wrapper = document.getElementById("answer-input-wrapper");
    const answer_input = document.getElementById("answer-input");

    const img = document.getElementById("problem-image");
    if(focused_problem_obj.image == ""){
        img.classList.add("hidden");
    }else{
        img.classList.remove("hidden");
    }
    if (focused_problem_obj.image != ""){
        img.src = `http://strela-vlna.gchd.cz/api/files/probs/${focused_check}/${focused_problem_obj.image}`;
    } else {
        img.src = "";
    }
    
    if(focused_problem_obj.pending || focused_problem_obj.incorrect || focused_problem_obj.correct){
        answer_input.placeholder = "Odpověděli jste: " + focused_problem_obj.solution;
        console.log("solution");
        console.log(focused_problem_obj.solution);
    }else{
        answer_input.placeholder = "Odpověď";
    }

    if(focused_problem_obj.incorrect){
        answer_input_wrapper.classList.add("incorrect");
    }else{
        answer_input_wrapper.classList.remove("incorrect");
    }

    if(focused_problem_obj.correct){
        answer_input_wrapper.classList.add("correct");
    }else{
        answer_input_wrapper.classList.remove("correct");
    }

    if(focused_problem_obj.pending || clock_zeroed){
        answer_input_wrapper.classList.add("cannot-answer");
    }else{
        answer_input_wrapper.classList.remove("cannot-answer");
    }
    MathJax.typeset();
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
    if(seen_global_chat && seen_contest_info){
        document.getElementById("seen-global-chat-icon").classList.add("hidden");
        document.getElementById("rank-number").classList.remove("hidden");
    }else{
        document.getElementById("seen-global-chat-icon").classList.remove("hidden");
        document.getElementById("rank-number").classList.add("hidden");
    }

    if(focused_check == "" || !problems.some(prob => prob.id == focused_check)){
        focused_check = "";
        for(const message of global_chat){
            let match = message.content.match(/!gif (.+)/)
            if (match !== null) {
                conversation_wrapper.innerHTML += 
                `<div class="conversation-row ${message.author == "team" ? "message-my" : "message-their"}">
                    <img class="conversation-message conversation-gif" src="https://media.tenor.com/${match[1]}/hhgf.gif" />
                </div>`;
                continue;
            }
            conversation_wrapper.innerHTML += 
            `<div class="conversation-row ${message.author == "team" ? "message-my" : "message-their"}">
                <p class="conversation-message">${message.content}</p>
            </div>`
        }
        return;
    }
    for(const message of problems.find(prob => prob.id == focused_check).chat){
        let match = message.content.match(/!gif (.+)/)
        if (match !== null) {
            conversation_wrapper.innerHTML += 
            `<div class="conversation-row ${message.author == "team" ? "message-my" : "message-their"}">
                <img class="conversation-message conversation-gif" src="https://media.tenor.com/${match[1]}/hhgf.gif" />
            </div>`;
            continue;
        }
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
function buyProblem(rank){
    if (team_balance < prices[0]["ABC".indexOf(rank)]){return;}
    const confirm_dialog = document.getElementById("confiramtion-dialog-bg");
    confirm_dialog.style.display = "block";
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
            // updateProblemList();
            // updateShop();

        }
        confirm_dialog.style.display = "none";
        document.getElementById("confirm-dialog-ok").removeEventListener("click", arguments.callee);
    });
}

function sellProblem(){
    if(!focused_check || !problems.some(prob => prob.id == focused_check) || problems.find(prob => prob.id == focused_check).pending || clock_zeroed) return;
    const confirm_dialog = document.getElementById("confiramtion-dialog-bg");
    confirm_dialog.style.display = "block";
    const focused_problem_obj = problems.find(prob => prob.id == focused_check);
    const sellPrice = prices[2]["ABC".indexOf(focused_problem_obj.rank)];
    document.getElementById("confirm-dialog-content").innerHTML = `Opravdu chcete prodat úlohu:<br><span class="bold">${focused_problem_obj.title}</span> za <span class="bold">${sellPrice}</span> DC?`;
    document.getElementById("confirm-dialog-ok").addEventListener("click", function(){
        sellProb(focused_check);

        confirm_dialog.style.display = "none";
        document.getElementById("confirm-dialog-ok").removeEventListener("click", arguments.callee);
    });
}

function contestStateUpdated(){
    if (contest_state == "waiting") {
        document.getElementById("wait-wrapper").classList.remove("hidden");
        document.getElementById("play-wrapper").classList.add("hidden");
        document.getElementById("results-wrapper").classList.add("hidden");
    
    } else if (contest_state == "running") {
        document.getElementById("wait-wrapper").classList.add("hidden");
        document.getElementById("play-wrapper").classList.remove("hidden");
        document.getElementById("results-wrapper").classList.add("hidden");

        updateChat();
        updateFocusedProblem();
        updateProblemList();
        updateShop();
        adjustDivHeight();
    
    } else if (contest_state == "ended") {
        document.getElementById("wait-wrapper").classList.add("hidden");
        document.getElementById("play-wrapper").classList.add("hidden");
        document.getElementById("constants-wrapper").classList.add("hidden");
        document.getElementById("results-wrapper").classList.remove("hidden");
    }
}

function updateTable(){
    const table_DOM = document.getElementById("table-body");

    table_DOM.innerHTML = "";

    let possibleGroups = [];
    for(let item of table){
        if (!possibleGroups.includes(item.group)) possibleGroups.push(item.group);
    }

    possibleGroups.sort((a, b) => a.localeCompare(b));
    console.log("table", table);
    table.sort((a, b) => a.name.localeCompare(b.name, "cs"));

    console.log(table);

    for (let group of possibleGroups) {
        table_DOM.innerHTML += `
            <tr class="table-group-title">
                <td colspan="4"><h2>${group}</h2></td>
            </tr>
                `
        for(let item of table.filter(item => item.group == group)){
            table_DOM.innerHTML += `
                <tr id=${item.id}">
                    <td>${item.name}</td>
                    <td>${item.symbol}</td>
                    <td>${item.value}</td>
                    <td>${item.unit}</td>
                </tr>
                `
        }
    }

    MathJax.typeset();
}

function parseContentForLatex(txt){
    let newtxt = "";
    let curent_state = 0;
    let i = 0;
    for(;i < txt.length - 1; i++){
        if(txt[i] == "$" && txt[i + 1] == "$"){
            if(curent_state == 0){
                curent_state = 2;
                newtxt += `<span class="latex-styled">$`;
            }else if(curent_state == 1){
                newtxt += "$$";
            }else if(curent_state == 2){
                curent_state = 0;
                newtxt += `$</span>`;
            }
            i++;
        }else if(txt[i] == "$" && txt[i + 1] != "$"){
            if(curent_state == 0){
                curent_state = 1;
                newtxt += "$";
            }else if(curent_state == 1){
                newtxt += "$";
                curent_state = 0;
            }else if(curent_state == 2){
                console.error("parsing error");
            }
        }else{
            newtxt += txt[i];
        }
    }
    if(i == txt.length - 1){
        newtxt += txt[txt.length - 1];
    }
    return newtxt;
}

document.getElementById("show-constants").addEventListener("click", function() {
    this.classList.toggle("active");
    document.getElementById("constants-wrapper").classList.toggle("hidden");

});



let lastSecond = 0;
let results_shown = false;

let last_contest_state = "";
function update(){
    requestAnimationFrame(update);
    if(last_contest_state != contest_state){
        last_contest_state = contest_state;
        contestStateUpdated();
    }
    if(contest_state == "waiting"){
        updateSpectrogramMountains();
    }
    if(contest_state == "ended"){
        if(!results_ready && !is_loading_running){
            is_loading_running = true;
            animation_color = '#3eb1df';
        }
        if(results_ready && !results_shown){
            results_shown = true;
            is_loading_running = false;
        }
    }

    //clock
    const now = new Date().getTime();
    var remaining = end_time - now;
    var passed = now - start_time;
    if(passed < 0){
        contest_state = "waiting";
    }
    else if (contest_state == "waiting"){
        contest_state = "running";
        stopMusic();
    }

    if ((Math.floor(remaining / 1000) != lastSecond && remaining>=0) || (!clock_zeroed && remaining < 0) && contest_state == "running"){
        if (remaining < 0){
            clock_zeroed = true;
            updateShop();
            updateFocusedProblem();
            remaining = 0;
            passed = end_time-start_time;
            contest_state = "ended";
        }
        if (passed < 0){
            updateClock(-passed, 1000);
        } else {
            updateClock(remaining, passed);
        }
    } else if (contest_state == "waiting"){
        
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
        window.location.href = `../login?id=${id}`;
      }
  });

  socket.addEventListener("open", (event) => {
    load();
  });
  socket.addEventListener("close", (event) => {
      disconnected();
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
        msgRecieved(msg[1], msg[2]);
      break;
      case "sold":
        if (msg.length != 3) { cLe() }
        probSold(msg[1], msg[2]);
      break;
      case "bought":
        if (msg.length != 8) { cLe() }
        probBought(msg[1], msg[2], msg[3], msg[4], msg[5], msg[6], msg[7]);
      break;
      case "solved":
        if (msg.length != 3) { cLe() }
        probSolved(msg[1], msg[2]);
      break;
      case "focused":
        if (msg.length != 3) { cLe() }
        probFocused(msg[1], msg[2]);
      break;
      case "unfocused":
        if (msg.length != 2) { cLe() }
        probUnfocused(msg[1]);
      break;
      case "msgsent":
        if (msg.length != 4) { cLe() }
        msgSent(msg[1], msg[2], msg[3]);
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
      case "gotinfo":
        if (msg.length != 2) { cLe() }
        gotinfo(msg[1]);
      break;
      case "gotdata":
        if (msg.length != 2) { cLe() }
        gotdata(msg[1]);
      break;
      case "showrank":
        if (msg.length != 1) { cLe() }
        showRank();
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
// connectWS();

/** @param {string} id */
function sellProb(id) { //done
  socket.send(`sell\x00${id}`) }

/** @param {string} diff */
function buyProb(diff) { //done
  socket.send(`buy\x00${diff}`) }

/** @param {string} diff */
function buyOldProb(diff) {
  socket.send(`buyold\x00${diff}`) }

/** @param {string} id
 * @param {string} sol */
function solveProb(id, sol) { //done
  socket.send(`solve\x00${id}\x00${sol}`) }

/** @param {string} id */
function focusProb(id) { //done
  socket.send(`focus\x00${id}`) }

/** @param {string} id */
function unfocusProb() { //done
    const focused_problem_obj = problems.find(prob => prob.id == focused_check);
    if(focused_problem_obj != null){
        const index = focused_problem_obj.focused_by.indexOf(myId);
        if (index > -1) {
            focused_problem_obj.focused_by.splice(index, 1);
        }
    }
    socket.send(`unfocus`) }

/** @param {string} id
 * @param {string} text */
function sendMsg(id, text) { //done
  socket.send(`chat\x00${id}\x00${text}`) }

/** load game state */
function load() {
  socket.send("load");
}

function gotinfo(info){
    contest_info = info;
    let seen = false;
    if(info == "") {
        seen = true;
    }
    if(focused_check == ""){
        seen = true;
    }
    seen_contest_info = seen;
    updateChat();
    updateTeamStats();
}


/** @param {string} msg
 * @param {string} id */
function msgRecieved(id, msg) {
  if(id == "") {
    global_chat.push({author: "support", content: msg});
    seen_global_chat = false;
    updateChat();
  } else {
    const problem = problems.find(prob => prob.id == id);
    if(problem != null) {
      problem.chat.push({author: "support", content: msg});
      problem.seen_chat = false;
      updateProblemList();
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
  problems_sold++;
  updateTeamStats();
  updateProblemList();
  updateFocusedProblem();
  updateShop();
  updateChat();
  console.log(id, money);
}

/** @param {string} id
 * @param {string} diff
 * @param {string} money
 * @param {string} name
 * @param {string} text 
 * @param {string} imgsrc*/
function probBought(id, diff, money, name, text, imgname, rem) {
    const new_problem = {
        id: id,
        title: name,
        rank: diff,
        focused_by: [],
        can_answer: true,
        seen_chat: true,
        incorrect: false,
        correct: false,
        problem_content: text,
        image: imgname,
        chat: []
    }
    remaining[["A", "B", "C"].indexOf(diff)] = rem;
    problems.push(new_problem);
    team_balance = parseInt(money);
    updateProblemList();
    updateTeamStats();
    updateShop();
}
/** @param {string} msg
 * @param {string} id 
 * @param {string} solution */
function probSolved(id, solution) {
    const problem = problems.find(prob => prob.id == id);
    problem.pending = true;
    problem.solution = solution;
    updateFocusedProblem();
    updateProblemList();
    updateShop();
    console.log(id, solution);
}



/** @param {string} idx
 * @param {string} id */
function probFocused(id, idx) {
    if(id == ""){
        if(!menu_focused_by.includes(idx)){
            menu_focused_by.push(idx);
        }
        seen_global_chat = true;
        updateProblemList();
        updateChat();
        return;
    }
    const problem = problems.find(prob => prob.id == id);
    console.log(id);
    if(!problem.focused_by.includes(idx)){
        problem.focused_by.push(idx);
    }
    updateProblemList();    
    console.log(id, idx) }

/** @param {string} idx
 * @param {string} id */
function probUnfocused(idx) {
    problems.forEach(prob => prob.focused_by = prob.focused_by.filter(focused => focused != idx));
    menu_focused_by = menu_focused_by.filter(focused => focused != idx);
    updateProblemList();    
}
  
function focusCheck(){
    if(!problems.some(prob => prob.id == focused_check)){
        focused_check = "";
    }
    focusProb(focused_check);
}

/** @param {string} probid
 * @param {string} correct
 * @param {string} money */
function graded(probid, correct, money) {
    const problem = problems.find(prob => prob.id == probid);
    if(correct == "yes"){
        problem.correct = true;
        problem.pending = false;
        updateProblemList();
        setTimeout(() => {
            problems = problems.filter(prob => prob.id != probid);
            updateProblemList();
            updateFocusedProblem();
        }, 2000);
    }else{
        problem.incorrect = true;
        problem.pending = false;
    }
    team_balance = parseInt(money);
    updateTeamStats();
    updateProblemList();
    updateShop();
    updateFocusedProblem();
    console.log(probid, correct, money);
}

function disconnected() {
    document.getElementById("disconnected-wrapper").classList.remove("hidden");

    const txt = "Spojení přerušeno - vyčkejte chvíli (30s) a obnovte stránky";

    const p = document.getElementById("disconnected-message");
    let t = 1000;
    for (let i = 0; i < txt.length; i++) {
        setTimeout(() => {
            p.innerHTML += txt[i];
        }, t);
        t += Math.random() * 150;
    }
}


function loaded(data) {
    data = JSON.parse(data);

    console.log("data: ", data);
    
    problems = data.bought.map(bought => {
        return {
            id: bought.id,
            title: bought.name,
            rank: bought.diff,
            focused_by: [],
            can_answer: true,
            seen_chat: true,
            pending: false,
            incorrect: false,
            correct: false,
            solution: "",
            image: bought.image,
            problem_content: bought.text,
            chat: [],
        }
    });
    console.log(data);
    problems = problems.concat(data.pending.map(pending => {
        return {
            id: pending.id,
            title: pending.name,
            rank: pending.diff,
            focused_by: [],
            can_answer: true,
            seen_chat: true,
            pending: true,
            incorrect: false,
            correct: false,
            image: pending.image,
            solution: data.checks.find(check => check.probid == pending.id).solution,
            problem_content: pending.text,
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
        const prob = problems.find(i => i.id == id);
        if (prob == undefined) { continue; }
        prob.chat.push({author: author == "a" ? "support" : "team", content: text});
      }
    }
    prices = [
        [data.costs["A"] || 0, data.costs["B"] || 0, data.costs["C"] || 0],
        [data.costs["+A"] || 0, data.costs["+B"] || 0, data.costs["+C"] || 0],
        [data.costs["-A"] || 0, data.costs["-B"] || 0, data.costs["-C"] || 0]
    ];
    team_rank = parseInt(data.rank);
    problems_solved = parseInt(data.numsolved);
    problems_sold = parseInt(data.numsold);
    chat_banned = data.banned;
    myId = data.idx.toString();
    contest_info = data.contest_info;
    contest_name = data.contest_name;
    for ([key, value] of Object.entries(JSON.parse(data.consts))) {
        table.push(value);
    }
    if (data.stats != ""){
        loadData(JSON.parse(data.stats));
    }
    // loadData(data.stats);
    remaining = [
        -1,
        data.remprobscnt.B !== undefined ? data.remprobscnt.B : 0,
        data.remprobscnt.C !== undefined ? data.remprobscnt.C : 0
    ];

    updatePriceList();
    updateProblemList();
    updateShop();
    updateFocusedProblem();
    updateTeamStats();
    updateChat();
    updateTable();

}

