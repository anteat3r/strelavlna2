var results_string = "asdhjawkjasdkj kajshd kdhgwa sjhd kjahwuka bsflahsd kjb"

function parseResults(){

}

const balance_chart_canvas = document.getElementById("results-graph-canvas");
const income_portions_canvas = document.getElementById("results-income-canvas");

const balance_chart_ctx = balance_chart_canvas.getContext('2d');
const income_portions_ctx = income_portions_canvas.getContext('2d');

const balance_chart_internal_padding = 40;
const balance_chart_arrow_size = 10;
const balance_chart_ticks_X_separation = 10;
const arrows_extend = 35;

const balance_chart_X_axis_label = "t (min)";
const balance_chart_Y_axis_label = "DC";


let apm = 1.54;
let capm = 0.58;
let solved = [14, 8, 7];
let sold = [2, 1, 3];
let accuracy = [0.45, 0.36, 0.12];
let income_portions = [0.3, 0.1, 0.6];
let balance_chart = [{x:0, y: 50}, {x:15*60000, y: 100}, {x:22*60000, y: 40}, {x:50*60000, y: 250}, {x:75*60000, y: 220}, {x:120*60000, y: 245}];

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
let animation_balance_chart_ticks_X_progress = 0.0;
let animation_balance_chart_ticks_X_progresses = [];
let animation_balance_chart_ticks_Y_progress = 0.0;
let animation_balance_chart_ticks_Y_progresses = [];
let balance_chart_ticks_Y_separation = 1.0;
let balance_chart_ticks_labels_X = [];
let balance_chart_ticks_labels_Y = [];
let balance_chart_label_states_X = [];
let balance_chart_label_states_Y = [];
let balance_chart_label_state_outline_X = 0.0;
let balance_chart_label_state_outline_Y = 0.0;
let balance_chart_label_state_fill_X = 0.0;
let balance_chart_label_state_fill_Y = 0.0;
let balance_chart_X_axis_label_state = 0.0;
let balance_chart_Y_axis_label_state = 0.0;
let balance_chart_final_dot_state = 0.0;
let balance_chart_final_ring_state = 0.0;
let balance_chart_final_line_state = 0.0;

let animation_started_apm = false;
let animation_started_capm = false;
let animation_started_solved = [false, false, false];
let animation_started_sold = [false, false, false];
let animation_started_accuracy = [false, false, false];
let animation_started_income_portions = [false, false, false];
let animation_started_balance_chart = false;
let animation_start_balance_chart_X = false;
let animation_start_balance_chart_Y = false;
let animation_start_balance_chart_ticks_X = false;
let animation_start_balance_chart_ticks_Y = false;
let animation_start_balance_chart_labels_outline_X = false;
let animation_start_balance_chart_labels_outline_Y = false;
let animation_start_balance_chart_labels_fill_X = false;
let animation_start_balance_chart_labels_fill_Y = false;
let animation_start_balance_chart_X_axis_label = false;
let animation_start_balance_chart_Y_axis_label = false;
let animation_start_balance_chart_final_dot = false;
let animation_start_balance_chart_final_ring = false;
let animation_start_balance_chart_final_line = false;


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

    if(animation_start_balance_chart_ticks_X){
        animation_balance_chart_ticks_X_progress += (1 - animation_balance_chart_ticks_X_progress)*0.03;
        for(let i = 1; i < animation_balance_chart_ticks_X_progresses.length*animation_balance_chart_ticks_X_progress; i++){
            animation_balance_chart_ticks_X_progresses[i] += (1 - animation_balance_chart_ticks_X_progresses[i])*0.1;
        }
    }
    if(animation_start_balance_chart_ticks_Y){
        animation_balance_chart_ticks_Y_progress += (1 - animation_balance_chart_ticks_Y_progress)*0.03;
        for(let i = 1; i < animation_balance_chart_ticks_Y_progresses.length*animation_balance_chart_ticks_Y_progress; i++){
            animation_balance_chart_ticks_Y_progresses[i] += (1 - animation_balance_chart_ticks_Y_progresses[i])*0.1;
        }
    }


    //labels
    if(animation_start_balance_chart_labels_outline_X){
        balance_chart_label_state_outline_X += (1 - balance_chart_label_state_outline_X)*0.05;
        for(let i = 0; i < balance_chart_label_states_X.length*balance_chart_label_state_outline_X; i++){
            balance_chart_label_states_X[i][0] += (1 - balance_chart_label_states_X[i][0])*0.05;
        }
    }
    if(animation_start_balance_chart_labels_fill_X){
        balance_chart_label_state_fill_X += (1 - balance_chart_label_state_fill_X)*0.05;
        for(let i = 0; i < balance_chart_label_states_X.length*balance_chart_label_state_fill_X; i++){
            balance_chart_label_states_X[i][1] += (1 - balance_chart_label_states_X[i][1])*0.05;
        }
    }
    if(animation_start_balance_chart_labels_outline_Y){
        balance_chart_label_state_outline_Y += (1 - balance_chart_label_state_outline_Y)*0.05;
        for(let i = 0; i < balance_chart_label_states_Y.length*balance_chart_label_state_outline_Y; i++){
            balance_chart_label_states_Y[i][0] += (1 - balance_chart_label_states_Y[i][0])*0.05;
        }
    }
    if(animation_start_balance_chart_labels_fill_Y){
        balance_chart_label_state_fill_Y += (1 - balance_chart_label_state_fill_Y)*0.05;
        for(let i = 0; i < balance_chart_label_states_Y.length*balance_chart_label_state_fill_Y; i++){
            balance_chart_label_states_Y[i][1] += (1 - balance_chart_label_states_Y[i][1])*0.05;
        }
    }

    if(animation_start_balance_chart_X_axis_label){
        balance_chart_X_axis_label_state += (1 - balance_chart_X_axis_label_state)*0.02;
    }
    if(animation_start_balance_chart_Y_axis_label){
        balance_chart_Y_axis_label_state += (1 - balance_chart_Y_axis_label_state)*0.02;
    }

    if(animation_start_balance_chart_final_dot){
        balance_chart_final_dot_state += (1 - balance_chart_final_dot_state)*0.1;
    }
    if(animation_start_balance_chart_final_ring){
        balance_chart_final_ring_state += (1 - balance_chart_final_ring_state)*0.1;
    }
    if(animation_start_balance_chart_final_line){
        balance_chart_final_line_state += (1 - balance_chart_final_line_state)*0.05;
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
        normalized_balance_chart[i] = {x: balance_chart[i].x / balance_chart_max_X, y: balance_chart[i].y / balance_chart_max_Y};
    }
    balance_chart_ctx.strokeStyle = "#3eb1df";
    balance_chart_ctx.lineWidth = 2;
    balance_chart_ctx.lineCap = "round";
    balance_chart_ctx.lineJoin = "round";
    

    let dotX = normalized_balance_chart[normalized_balance_chart.length-1].x*(balance_chart_canvas.width-balance_chart_internal_padding*2)+balance_chart_internal_padding;
    let dotY = (1-normalized_balance_chart[normalized_balance_chart.length-1].y)*(balance_chart_canvas.height-balance_chart_internal_padding*2)+balance_chart_internal_padding;
    balance_chart_ctx.clearRect(0, 0, balance_chart_canvas.width, balance_chart_canvas.height);
    
    if(balance_chart_final_line_state > 0){
        const n = 50;
        for(let i = 0; i < n * balance_chart_final_line_state; i++){
            const x = dotX - (dotX - balance_chart_internal_padding) * i / n;
            const y = dotY;
            balance_chart_ctx.beginPath();
            balance_chart_ctx.arc(x, y, 1, 0, 2*Math.PI);
            balance_chart_ctx.fillStyle = "#64c3e9";
            balance_chart_ctx.fill();
        }
    }
    
    balance_chart_ctx.beginPath();
    balance_chart_ctx.moveTo(normalized_balance_chart[0].x*(balance_chart_canvas.width-balance_chart_internal_padding*2)+balance_chart_internal_padding, (1-normalized_balance_chart[0].y)*(balance_chart_canvas.height-balance_chart_internal_padding*2)+balance_chart_internal_padding);
    for(let i = 1; i < normalized_balance_chart.length*animation_balance_chart_progress; i++){
        balance_chart_ctx.lineTo(normalized_balance_chart[i].x*(balance_chart_canvas.width-balance_chart_internal_padding*2)+balance_chart_internal_padding, (1-normalized_balance_chart[i].y)*(balance_chart_canvas.height-balance_chart_internal_padding*2)+balance_chart_internal_padding);
    }
    balance_chart_ctx.stroke();
    if(balance_chart_final_dot_state > 0){
        balance_chart_ctx.beginPath();
        balance_chart_ctx.arc(dotX, dotY, balance_chart_final_dot_state * 5, 0, 2*Math.PI);
        balance_chart_ctx.fillStyle = "#3eb1df";
        balance_chart_ctx.fill();
    }
    if(balance_chart_final_ring_state > 0){
        const offset = (Date.now() * 0.001) % (2*Math.PI);
        const n = 7;
        for(let i = 0; i < n; i++){
            balance_chart_ctx.beginPath();
            balance_chart_ctx.arc(dotX, dotY, balance_chart_final_ring_state * 10, (i-0.5)*2*Math.PI/n + offset, i*2*Math.PI/n + offset);
            balance_chart_ctx.strokeStyle = "#3eb1df";
            balance_chart_ctx.stroke();
        }
    }



    balance_chart_ctx.strokeStyle = "#0f455a";
    balance_chart_ctx.lineWidth = 3;

    let x = balance_chart_internal_padding + animation_balance_chart_X_progress*(balance_chart_canvas.width-balance_chart_internal_padding*2) + arrows_extend;
    let y = balance_chart_canvas.height-balance_chart_internal_padding;
    if(animation_start_balance_chart_X > 0){
        balance_chart_ctx.beginPath();
        balance_chart_ctx.moveTo(balance_chart_internal_padding, balance_chart_canvas.height-balance_chart_internal_padding);
        balance_chart_ctx.lineTo(x, y);
        balance_chart_ctx.stroke();

        balance_chart_ctx.beginPath();
        balance_chart_ctx.moveTo(x-balance_chart_arrow_size, y-balance_chart_arrow_size);
        balance_chart_ctx.lineTo(x, y);
        balance_chart_ctx.lineTo(x-balance_chart_arrow_size, y+balance_chart_arrow_size);
        balance_chart_ctx.stroke();

    }
    

    x = balance_chart_internal_padding;
    y = balance_chart_canvas.height - balance_chart_internal_padding - animation_balance_chart_Y_progress*(balance_chart_canvas.height-balance_chart_internal_padding*2) - arrows_extend;

    if(animation_start_balance_chart_Y > 0){
        balance_chart_ctx.beginPath();
        balance_chart_ctx.moveTo(balance_chart_internal_padding, balance_chart_canvas.height-balance_chart_internal_padding);
        balance_chart_ctx.lineTo(x, y);
        balance_chart_ctx.stroke();
    
        balance_chart_ctx.beginPath();
        balance_chart_ctx.moveTo(x-balance_chart_arrow_size, y+balance_chart_arrow_size);
        balance_chart_ctx.lineTo(x, y);
        balance_chart_ctx.lineTo(x+balance_chart_arrow_size, y+balance_chart_arrow_size);
        balance_chart_ctx.stroke();
    }

    //ticks
    let lengthX = balance_chart.reduce((a, b) => Math.max(a, b.x), 0) / 60000;
    let lengthY = balance_chart.reduce((a, b) => Math.max(a, b.y), 0);

    for(let i = 0; i < animation_balance_chart_ticks_X_progresses.length; i++){
        if(animation_balance_chart_ticks_X_progresses[i] > 0){
            let x = i*balance_chart_ticks_X_separation/lengthX*(balance_chart_canvas.width-balance_chart_internal_padding*2);
            if (balance_chart_ticks_labels_X[i] == ""){
                balance_chart_ctx.beginPath();
                balance_chart_ctx.moveTo(balance_chart_internal_padding + x, balance_chart_canvas.height-balance_chart_internal_padding);
                balance_chart_ctx.lineTo(balance_chart_internal_padding + x, balance_chart_canvas.height-balance_chart_internal_padding + animation_balance_chart_ticks_X_progresses[i]*10);
                balance_chart_ctx.stroke();
                
            }else{
                balance_chart_ctx.beginPath();
                balance_chart_ctx.moveTo(balance_chart_internal_padding + x, balance_chart_canvas.height-balance_chart_internal_padding - animation_balance_chart_ticks_X_progresses[i]*4);
                balance_chart_ctx.lineTo(balance_chart_internal_padding + x, balance_chart_canvas.height-balance_chart_internal_padding + animation_balance_chart_ticks_X_progresses[i]*10);
                balance_chart_ctx.stroke();
            }
            // console.log(x);
        }
    }
    for(let i = 0; i < animation_balance_chart_ticks_Y_progresses.length; i++){
        if(animation_balance_chart_ticks_Y_progresses[i] > 0){
            let y = i*balance_chart_ticks_Y_separation/lengthY*(balance_chart_canvas.height-balance_chart_internal_padding*2);
            // console.log(y);
            if(balance_chart_ticks_labels_Y[i] == ""){
                balance_chart_ctx.beginPath();
                balance_chart_ctx.moveTo(balance_chart_internal_padding, balance_chart_canvas.height-balance_chart_internal_padding - y);
                balance_chart_ctx.lineTo(balance_chart_internal_padding - animation_balance_chart_ticks_Y_progresses[i]*10, balance_chart_canvas.height-balance_chart_internal_padding - y);
                balance_chart_ctx.stroke();
            }else{
                balance_chart_ctx.beginPath();
                balance_chart_ctx.moveTo(balance_chart_internal_padding + animation_balance_chart_ticks_Y_progresses[i]*4, balance_chart_canvas.height-balance_chart_internal_padding - y);
                balance_chart_ctx.lineTo(balance_chart_internal_padding - animation_balance_chart_ticks_Y_progresses[i]*10, balance_chart_canvas.height-balance_chart_internal_padding - y);
                balance_chart_ctx.stroke();
            }
        }
    }

    //labels
    balance_chart_ctx.font = "bold 16px Lexend";
    for(let i = 0; i < balance_chart_label_states_X.length; i++){
        if(balance_chart_label_states_X[i][0] > 0 && balance_chart_ticks_labels_X[i] != ""){
            let x = i*balance_chart_ticks_X_separation/lengthX*(balance_chart_canvas.width-balance_chart_internal_padding*2);
            let textWidth = balance_chart_ctx.measureText(balance_chart_ticks_labels_X[i]).width;
            
            const gradient = balance_chart_ctx.createLinearGradient(-textWidth, 0, textWidth*2, 0);
            gradient.addColorStop(balance_chart_label_states_X[i][0]/3*2, '#0f455a');
            gradient.addColorStop(balance_chart_label_states_X[i][0]/3*2+1/6, '#4b35cc');
            gradient.addColorStop(balance_chart_label_states_X[i][0]/3*2 + 1/3, 'transparent');
            balance_chart_ctx.strokeStyle = gradient;
            balance_chart_ctx.lineWidth = 0.5;
            balance_chart_ctx.save();
            balance_chart_ctx.translate(balance_chart_internal_padding + x -5, balance_chart_canvas.height-balance_chart_internal_padding + 20)
            balance_chart_ctx.rotate(Math.PI/180 * 45);
            balance_chart_ctx.strokeText(balance_chart_ticks_labels_X[i], 0, 0);
            balance_chart_ctx.restore();
        }
    }
    for(let i = 0; i < balance_chart_label_states_X.length; i++){
        if(balance_chart_label_states_X[i][1] > 0 && balance_chart_ticks_labels_X[i] != ""){
            let x = i*balance_chart_ticks_X_separation/lengthX*(balance_chart_canvas.width-balance_chart_internal_padding*2);
            let textWidth = balance_chart_ctx.measureText(balance_chart_ticks_labels_X[i]).width;
            
            const gradient = balance_chart_ctx.createLinearGradient(-textWidth, 0, textWidth*2, 0);
            gradient.addColorStop(balance_chart_label_states_X[i][1]/3*2, '#0f455a');
            gradient.addColorStop(balance_chart_label_states_X[i][1]/3*2+1/6, '#4b35cc');
            gradient.addColorStop(balance_chart_label_states_X[i][1]/3*2 + 1/3, 'transparent');
            balance_chart_ctx.fillStyle = gradient;
            balance_chart_ctx.save();
            balance_chart_ctx.translate(balance_chart_internal_padding + x -5, balance_chart_canvas.height-balance_chart_internal_padding + 20)
            balance_chart_ctx.rotate(Math.PI/180 * 45);
            balance_chart_ctx.fillText(balance_chart_ticks_labels_X[i], 0, 0);
            balance_chart_ctx.restore();
        }
    }
    for(let i = 0; i < balance_chart_label_states_Y.length; i++){
        if(balance_chart_label_states_Y[i][0] > 0 && balance_chart_ticks_labels_Y[i] != ""){
            let y = balance_chart_canvas.height-balance_chart_internal_padding - i*balance_chart_ticks_Y_separation/lengthY*(balance_chart_canvas.height-balance_chart_internal_padding*2);
            let textWidth = balance_chart_ctx.measureText(balance_chart_ticks_labels_Y[i]).width;
            
            const gradient = balance_chart_ctx.createLinearGradient(-textWidth, 0, textWidth*2, 0);
            gradient.addColorStop(balance_chart_label_states_Y[i][0]/3*2, '#0f455a');
            gradient.addColorStop(balance_chart_label_states_Y[i][0]/3*2+1/6, '#4b35cc');
            gradient.addColorStop(balance_chart_label_states_Y[i][0]/3*2 + 1/3, 'transparent');
            balance_chart_ctx.strokeStyle = gradient;
            balance_chart_ctx.lineWidth = 0.5;
            balance_chart_ctx.save();
            balance_chart_ctx.translate(balance_chart_internal_padding - textWidth/3*2-10, y - textWidth/3*2 - 7)
            balance_chart_ctx.rotate(Math.PI/180 * 60);
            balance_chart_ctx.strokeText(balance_chart_ticks_labels_Y[i], 0, 0);
            balance_chart_ctx.restore();
        }
    }
    for(let i = 0; i < balance_chart_label_states_Y.length; i++){
        if(balance_chart_label_states_Y[i][1] > 0 && balance_chart_ticks_labels_Y[i] != ""){
            let y = balance_chart_canvas.height-balance_chart_internal_padding - i*balance_chart_ticks_Y_separation/lengthY*(balance_chart_canvas.height-balance_chart_internal_padding*2);
            let textWidth = balance_chart_ctx.measureText(balance_chart_ticks_labels_Y[i]).width;
            
            const gradient = balance_chart_ctx.createLinearGradient(-textWidth, 0, textWidth*2, 0);
            gradient.addColorStop(balance_chart_label_states_Y[i][1]/3*2, '#0f455a');
            gradient.addColorStop(balance_chart_label_states_Y[i][1]/3*2+1/6, '#4b35cc');
            gradient.addColorStop(balance_chart_label_states_Y[i][1]/3*2 + 1/3, 'transparent');
            balance_chart_ctx.fillStyle = gradient;
            balance_chart_ctx.save();
            balance_chart_ctx.translate(balance_chart_internal_padding - textWidth/3*2-10, y - textWidth/3*2 - 7)
            balance_chart_ctx.rotate(Math.PI/180 * 60);
            balance_chart_ctx.fillText(balance_chart_ticks_labels_Y[i], 0, 0);
            balance_chart_ctx.restore();
        }
    }

    //axis labels
    if(balance_chart_X_axis_label_state > 0){
        let textSize = balance_chart_ctx.measureText(balance_chart_X_axis_label);
        textSize = {width: textSize.width, height: 16};
        const gradient = balance_chart_ctx.createLinearGradient(-textSize.width, 0, textSize.width*2, 0);
        gradient.addColorStop(balance_chart_X_axis_label_state/3*2, '#0f455a');
        gradient.addColorStop(balance_chart_X_axis_label_state/3*2+1/6, '#4b35cc');
        gradient.addColorStop(balance_chart_X_axis_label_state/3*2 + 1/3, 'transparent');
        balance_chart_ctx.fillStyle = gradient;
        balance_chart_ctx.save();
        balance_chart_ctx.translate(balance_chart_canvas.width - balance_chart_internal_padding + arrows_extend - textSize.width, balance_chart_canvas.height - balance_chart_internal_padding - textSize.height);
        balance_chart_ctx.fillText(balance_chart_X_axis_label, 0, 0);
        balance_chart_ctx.restore();
    }
    if(balance_chart_Y_axis_label_state > 0){
        let textSize = balance_chart_ctx.measureText(balance_chart_Y_axis_label);
        textSize = {width: textSize.width, height: 16};
        const gradient = balance_chart_ctx.createLinearGradient(-textSize.width, 0, textSize.width*2, 0);
        gradient.addColorStop(balance_chart_Y_axis_label_state/3*2, '#0f455a');
        gradient.addColorStop(balance_chart_Y_axis_label_state/3*2+1/6, '#4b35cc');
        gradient.addColorStop(balance_chart_Y_axis_label_state/3*2 + 1/3, 'transparent');
        balance_chart_ctx.fillStyle = gradient;
        balance_chart_ctx.save();
        balance_chart_ctx.translate(balance_chart_internal_padding + balance_chart_arrow_size + 5, balance_chart_internal_padding - arrows_extend + textSize.height);
        balance_chart_ctx.fillText(balance_chart_Y_axis_label, 0, 0);
        balance_chart_ctx.restore();
    }
}

function generateTicks(){
    let length_X = balance_chart.reduce((max, item) => item.x > max ? item.x : max, 0)/1000/60/balance_chart_ticks_X_separation;
    for(let i = 0; i <= length_X; i++){
        animation_balance_chart_ticks_X_progresses.push(0.0);
        if(i != 0 && i%3 == 0){
            balance_chart_ticks_labels_X.push((i*10).toString());
            balance_chart_label_states_X.push([0.0, 0.0]);
        }else{
            balance_chart_label_states_X.push([0.0, 0.0]);
            balance_chart_ticks_labels_X.push("");
        }
    }

    let length_Y = balance_chart.reduce((max, item) => item.y > max ? item.y : max, 0);
    let steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    let step_index = 0;
    while(length_Y/steps[step_index] > 10 && step_index < steps.length - 1){
        step_index++;
    }
    balance_chart_ticks_Y_separation = steps[step_index];
    console.log(balance_chart_ticks_Y_separation);

    for(let i = 0; i <= length_Y/balance_chart_ticks_Y_separation; i++){
        animation_balance_chart_ticks_Y_progresses.push(0.0);
        if(i != 0 && i*balance_chart_ticks_Y_separation % steps[Math.min(step_index+1, steps.length-1)] == 0){
            balance_chart_ticks_labels_Y.push((i*balance_chart_ticks_Y_separation).toString());
            balance_chart_label_states_Y.push([0.0, 0.0]);
        }else{
            balance_chart_ticks_labels_Y.push("");
            balance_chart_label_states_Y.push([0.0, 0.0]);
        }
    }
}


function resultsAnimationFrame(){
    requestAnimationFrame(resultsAnimationFrame);
    animationUpdate();
    drawResults();
    // console.log(animation_accuracy_speed[0]);
}

generateTicks();
resultsAnimationFrame();
for(item of main_wrappers){
    item.classList.add("invisible");
}

setTimeout(e=>{
    setTimeout(e=>{main_wrappers[0].classList.remove("invisible");}, 3000);
    setTimeout(e=>{main_wrappers[1].classList.remove("invisible");}, 3500);
    setTimeout(e=>{main_wrappers[2].classList.remove("invisible");}, 4000);
    setTimeout(e=>{main_wrappers[3].classList.remove("invisible");}, 4500);





    animation_start_balance_chart_X = true;
    setTimeout(e=>{animation_start_balance_chart_Y = true;}, 300);
    setTimeout(e=>{animation_started_balance_chart = true;}, 600);
    setTimeout(e=>{animation_start_balance_chart_ticks_X = true;}, 600);
    setTimeout(e=>{animation_start_balance_chart_ticks_Y = true;}, 1000);
    
    setTimeout(e=>{animation_start_balance_chart_final_dot = true;}, 1500);
    setTimeout(e=>{animation_start_balance_chart_final_ring = true;}, 2000);
    setTimeout(e=>{animation_start_balance_chart_final_line = true;}, 2500);


    setTimeout(e=>{animation_start_balance_chart_labels_outline_X = true;}, 1000);
    setTimeout(e=>{animation_start_balance_chart_labels_fill_X = true;}, 2000);
    setTimeout(e=>{animation_start_balance_chart_labels_outline_Y = true;}, 1400);
    setTimeout(e=>{animation_start_balance_chart_labels_fill_Y = true;}, 2400);

    setTimeout(e=>{animation_start_balance_chart_X_axis_label = true;}, 2400);
    setTimeout(e=>{animation_start_balance_chart_Y_axis_label = true;}, 3000);
    


    
    setTimeout(e=>{animation_started_accuracy[0] = true;}, 3500);
    setTimeout(e=>{animation_started_accuracy[1] = true;}, 3700);
    setTimeout(e=>{animation_started_accuracy[2] = true;}, 3900);

    setTimeout(e=>{animation_started_income_portions[0] = true;}, 4000);
    setTimeout(e=>{animation_started_income_portions[1] = true;}, 4200);
    setTimeout(e=>{animation_started_income_portions[2] = true;}, 4400);

    setTimeout(e=>{animation_started_solved[0] = true;}, 4500);
    setTimeout(e=>{animation_started_solved[1] = true;}, 4700);
    setTimeout(e=>{animation_started_solved[2] = true;}, 4900);

    setTimeout(e=>{animation_started_sold[0] = true;}, 5000);
    setTimeout(e=>{animation_started_sold[1] = true;}, 5200);
    setTimeout(e=>{animation_started_sold[2] = true;}, 5400);

    setTimeout(e=>{animation_started_apm = true;}, 5000);
    setTimeout(e=>{animation_started_capm = true;}, 5200);



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







