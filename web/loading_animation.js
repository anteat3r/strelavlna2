const canvas = document.getElementById("loading-animation-canvas");
const ctx = canvas.getContext("2d");

const positions = [[0, 0], [30, 0], [60, 0], [60, 30], [60, 60], [30, 60], [0, 60], [0, 30]];
var accual_positions = [[0, 0], [30, 0], [60, 0], [60, 30], [60, 60], [30, 60], [0, 60]];
var target_positions = [0, 1, 2, 3, 4, 5, 6];

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(position in accual_positions){
        ctx.fillStyle = "#e3e3f2";
        ctx.beginPath();
        ctx.roundRect(accual_positions[position][0], accual_positions[position][1], 30, 30, 5);
        ctx.fill();
    }
}
function updateTargetPositions(){
    for(let i = 0; i < 8; i++){
        if(target_positions.indexOf(i) == -1){
            if(i == 0){
                target_positions[target_positions.indexOf(7)] = 0;
            }else{
                target_positions[target_positions.indexOf(i-1)] = i;
            }
            break;
        }
    }
}

function updateAccualPositions(k){
    for(let i = 0; i < 7; i++){
        accual_positions[i][0] += (positions[target_positions[i]][0] - accual_positions[i][0])*k
        accual_positions[i][1] += (positions[target_positions[i]][1] - accual_positions[i][1])*k
    }
}

function frame(){
    requestAnimationFrame(frame);

    updateAccualPositions(0.3);
    draw();
    console.log("hehehea");
}

frame();

setInterval(updateTargetPositions, 100);
