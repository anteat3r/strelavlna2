var results_string = "asdhjawkjasdkj kajshd kdhgwa sjhd kjahwuka bsflahsd kjb"

function parseResults(){

}

const balance_chart_canvas = document.getElementById("results-graph-canvas");
const income_portions_canvas = document.getElementById("results-income-canvas");

const balance_chart_ctx = balance_chart_canvas.getContext('2d');
const income_portions_ctx = income_portions_canvas.getContext('2d');



let apm = 1.54;
let capm = 0.58;
let solved = [14, 8, 7];
let sold = [2, 1, 3];
let accuracy = [0.45, 0.36, 0.12];
let income_portions = [0.3, 0.1, 0.6];
let balance_chart = [{x:0, y: 50}, {x:45, y: 100}, {x:158, y: 40}, {x:250, y: 120}, {x:300, y: 200}];

//animation variables

let animation_accuracy_curent = [0, 0, 0];
let animation_accuracy_speed = [0, 0, 0];
let animation_income_portions_curent = [0, 0, 1];
let animation_income_portions_speed = [0, 0, 0];

let animation_solved_curent = [0, 0, 0];
let animation_sold_curent = [0, 0, 0];
let animation_apm_curent = 0.0;
let animation_capm_curent = 0.0;
let animation_balance_chart_progress = 0.0;
let animation_balance_chart_X_progress = 0.0;
let animation_balance_chart_Y_progress = 0.0;

let animation_started_apm = false;
let animation_started_capm = false;
let animation_started_solved = [false, false, false];
let animation_started_sold = [false, false, false];
let animation_started_accuracy = [false, false, false];
let animation_started_income_portions = [false, false, false];
let animation_started_balance_chart = false;
let animation_start_balance_chart_X = false;
let animation_start_balance_chart_Y = false;


//DOM elements
const accuracy_dom = [document.getElementById("results-accuracy-correct-filler-a"), document.getElementById("results-accuracy-correct-filler-b"), document.getElementById("results-accuracy-correct-filler-c")];
const solved_dom = [document.getElementById("results-solved-problems-a"), document.getElementById("results-solved-problems-b"), document.getElementById("results-solved-problems-c")];
const sold_dom = [document.getElementById("results-sold-problems-a"), document.getElementById("results-sold-problems-b"), document.getElementById("results-sold-problems-c")];
const amp_dom = document.getElementById("results-additional-stats-content-apm");
const capm_dom = document.getElementById("results-additional-stats-content-capm");

const main_wrappers = [
    document.getElementById("results-accuracy-wrapper"),
    document.getElementById("results-income-wrapper"),
    document.getElementById("results-problem-stats-wrapper"),
    document.getElementById("results-addtional-stats-wrapper")
];

function animationUpdate(){
    //apm
    if(animation_started_apm){
        animation_apm_curent += (apm - animation_apm_curent)*0.05;
    }

    //capm
    if(animation_started_capm){
        animation_capm_curent += (capm - animation_capm_curent)*0.05;
    }

    //solved
    for(let i = 0; i < solved.length; i++){
        if(animation_started_solved[i]){
            animation_solved_curent[i] += (solved[i] - animation_solved_curent[i])*0.05;
        }
    }

    //sold
    for(let i = 0; i < sold.length; i++){
        if(animation_started_sold[i]){
            animation_sold_curent[i] += (sold[i] - animation_sold_curent[i])*0.05;
        }
    }

    //accuracy
    for(let i = 0; i < accuracy.length; i++){
        if(animation_started_accuracy[i]){
            animation_accuracy_speed[i] += (accuracy[i] - animation_accuracy_curent[i])*0.05;
            animation_accuracy_speed[i]*=0.9;
            animation_accuracy_curent[i] += animation_accuracy_speed[i];
        }
    }

    //income portions

    for(let i = 0; i < income_portions.length; i++){
        if(animation_started_income_portions[i]){
            animation_income_portions_speed[i] += (income_portions[i] - animation_income_portions_curent[i])*0.05;
            animation_income_portions_speed[i]*=0.9;
            animation_income_portions_curent[i] += animation_income_portions_speed[i];
            animation_income_portions_curent[i] = Math.max(0, animation_income_portions_curent[i]);
        }
    }

    //balance chart
    if(animation_started_balance_chart){
        animation_balance_chart_progress += (1 - animation_balance_chart_progress)*0.05;
    }
    if(animation_start_balance_chart_X){
        animation_balance_chart_X_progress += (1 - animation_balance_chart_X_progress)*0.05;
    }
    if(animation_start_balance_chart_Y){
        animation_balance_chart_Y_progress += (1 - animation_balance_chart_Y_progress)*0.05;
    }
}

function drawResults(){

    //apm
    amp_dom.innerHTML = Math.round(animation_apm_curent*100)/100;

    //capm
    capm_dom.innerHTML = Math.round(animation_capm_curent*100)/100;

    //solved
    for(let i = 0; i < solved.length; i++){
        solved_dom[i].innerHTML = Math.round(animation_solved_curent[i]);
    }

    //sold
    for(let i = 0; i < sold.length; i++){
        sold_dom[i].innerHTML = Math.round(animation_sold_curent[i]);
    }

    //accuracy
    for(let i = 0; i < accuracy.length; i++){
        accuracy_dom[i].style.width = `${animation_accuracy_curent[i]*100}%`;
    }

    //income portions
    const normalized_income_portions = [0, 0, 0];
    for(let i = 0; i < animation_income_portions_curent.length; i++){
        if(animation_income_portions_curent.reduce((a, b) => a + b, 0) == 0){
            normalized_income_portions[i] = 1/3;
        }else{
            normalized_income_portions[i] = animation_income_portions_curent[i] / animation_income_portions_curent.reduce((a, b) => a + b, 0);
        }
    }
    const fillstyles = ["#24cb80", "#3eb1df", "#e12f6a"];
    let ang = -Math.PI/2;
    income_portions_ctx.clearRect(0, 0, income_portions_canvas.width, income_portions_canvas.height);
    for(let i = 0; i < normalized_income_portions.length; i++){
        income_portions_ctx.fillStyle = fillstyles[i];
        income_portions_ctx.beginPath();
        income_portions_ctx.moveTo(income_portions_canvas.width/2, income_portions_canvas.height/2);
        const angle = normalized_income_portions[i]*2*Math.PI;
        income_portions_ctx.arc(income_portions_canvas.width/2, income_portions_canvas.height/2, income_portions_canvas.height/2, ang, ang+angle);
        income_portions_ctx.lineTo(income_portions_canvas.width/2, income_portions_canvas.height/2);
        income_portions_ctx.closePath();
        income_portions_ctx.fill();
        ang += angle;
    }

    // balance chart
    const normalized_balance_chart = [];

    const balance_chart_max_X = balance_chart.reduce((a, b) => Math.max(a, b.x), 0);
    const balance_chart_max_Y = balance_chart.reduce((a, b) => Math.max(a, b.y), 0);
    for(let i = 0; i < balance_chart.length; i++){
        normalized_balance_chart[i] = {x: balance_chart[i].x / balance_chart_max_X, y: balance_chart[i].y / balance_chart_max_Y*0.8};
    }
    balance_chart_ctx.strokeStyle = "#3eb1df";
    balance_chart_ctx.lineWidth = 2;
    balance_chart_ctx.lineCap = "round";
    balance_chart_ctx.lineJoin = "round";
    

    
    balance_chart_ctx.clearRect(0, 0, balance_chart_canvas.width, balance_chart_canvas.height);
    
    balance_chart_ctx.beginPath();
    balance_chart_ctx.moveTo(normalized_balance_chart[0].x*(balance_chart_canvas.width-20)+10, (1-normalized_balance_chart[0].y)*(balance_chart_canvas.height-20)+10);
    for(let i = 1; i < normalized_balance_chart.length*animation_balance_chart_progress; i++){
        balance_chart_ctx.lineTo(normalized_balance_chart[i].x*(balance_chart_canvas.width-20)+10, (1-normalized_balance_chart[i].y)*(balance_chart_canvas.height-20)+10);
    }
    balance_chart_ctx.stroke();
    if(animation_balance_chart_progress == 1){
        balance_chart_ctx.beginPath();
        balance_chart_ctx.arc(normalized_balance_chart[normalized_balance_chart.length-1].x*(balance_chart_canvas.width-20)+10, (1-normalized_balance_chart[normalized_balance_chart.length-1].y)*(balance_chart_canvas.height-20)+10, 5, 0, 2*Math.PI);
        balance_chart_ctx.fillStyle = "#3eb1df";
        balance_chart_ctx.fill();
    }

    balance_chart_ctx.strokeStyle = "#0f455a";
    balance_chart_ctx.lineWidth = 3;

    let x = 10 + animation_balance_chart_X_progress*(balance_chart_canvas.width-20);
    let y = balance_chart_canvas.height-10;
    if(animation_start_balance_chart_X > 0){
        balance_chart_ctx.beginPath();
        balance_chart_ctx.moveTo(10, balance_chart_canvas.height-10);
        balance_chart_ctx.lineTo(x, y);
        balance_chart_ctx.stroke();

        balance_chart_ctx.beginPath();
        balance_chart_ctx.moveTo(x-10, y-10);
        balance_chart_ctx.lineTo(x, y);
        balance_chart_ctx.lineTo(x-10, y+10);
        balance_chart_ctx.stroke();

    }
    

    x = 10;
    y = balance_chart_canvas.height - 10 - animation_balance_chart_Y_progress*(balance_chart_canvas.height-20);

    if(animation_start_balance_chart_Y > 0){
        balance_chart_ctx.beginPath();
        balance_chart_ctx.moveTo(10, balance_chart_canvas.height-10);
        balance_chart_ctx.lineTo(x, y);
        balance_chart_ctx.stroke();
    
        balance_chart_ctx.beginPath();
        balance_chart_ctx.moveTo(x-10, y+10);
        balance_chart_ctx.lineTo(x, y);
        balance_chart_ctx.lineTo(x+10, y+10);
        balance_chart_ctx.stroke();
    }

    
}

function resultsAnimationFrame(){
    requestAnimationFrame(resultsAnimationFrame);
    animationUpdate();
    drawResults();
    // console.log(animation_accuracy_speed[0]);
}

resultsAnimationFrame();
for(item of main_wrappers){
    item.classList.add("invisible");
}

setTimeout(e=>{
    setTimeout(e=>{main_wrappers[0].classList.remove("invisible");}, 500);
    setTimeout(e=>{main_wrappers[1].classList.remove("invisible");}, 1000);
    setTimeout(e=>{main_wrappers[2].classList.remove("invisible");}, 1500);
    setTimeout(e=>{main_wrappers[3].classList.remove("invisible");}, 2000);





    animation_start_balance_chart_X = true;
    setTimeout(e=>{animation_start_balance_chart_Y = true;}, 300);
    setTimeout(e=>{animation_started_balance_chart = true;}, 600);
    
    setTimeout(e=>{animation_started_accuracy[0] = true;}, 1000);
    setTimeout(e=>{animation_started_accuracy[1] = true;}, 1200);
    setTimeout(e=>{animation_started_accuracy[2] = true;}, 1400);

    setTimeout(e=>{animation_started_income_portions[0] = true;}, 1600);
    setTimeout(e=>{animation_started_income_portions[1] = true;}, 1800);
    setTimeout(e=>{animation_started_income_portions[2] = true;}, 2000);

    setTimeout(e=>{animation_started_solved[0] = true;}, 2200);
    setTimeout(e=>{animation_started_solved[1] = true;}, 2400);
    setTimeout(e=>{animation_started_solved[2] = true;}, 2600);

    setTimeout(e=>{animation_started_sold[0] = true;}, 2800);
    setTimeout(e=>{animation_started_sold[1] = true;}, 3000);
    setTimeout(e=>{animation_started_sold[2] = true;}, 3200);

    setTimeout(e=>{animation_started_apm = true;}, 3400);
    setTimeout(e=>{animation_started_capm = true;}, 3600);

    //animation_started_solved

    // animation_started_accuracy[0] = true;
}, 6500);


for(let i = 0; i < document.getElementsByClassName("results-accuracy-value-wrapper").length; i++){
    const item = document.getElementsByClassName("results-accuracy-value-wrapper")[i];
    item.addEventListener("mouseenter", function(){

        let n = i
        animation_accuracy_speed[n] += 0.01;
    });
}

document.getElementById("results-income-canvas").addEventListener("mouseenter", function(){
    for(let i = 0; i < animation_income_portions_speed.length; i++){
        animation_income_portions_speed[i] += (Math.random()*2 - 1)*0.01;
    }
})







