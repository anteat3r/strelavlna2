const loading_canvas = document.getElementById("loading-animation-canvas");
const loading_ctx = loading_canvas.getContext("2d");

const positions = [[0, 0], [30, 0], [60, 0], [60, 30], [60, 60], [30, 60], [0, 60], [0, 30]];
var accual_positions = [[0, 0], [30, 0], [60, 0], [60, 30], [60, 60], [30, 60], [0, 60]];
var target_positions = [0, 1, 2, 3, 4, 5, 6];
var opacity = [0, 0, 0, 0, 0, 0, 0];
var target_opacity = [0, 0, 0, 0, 0, 0, 0];

var is_loading_running = false;

var animation_color = "#ffffff";



function draw() {
    loading_ctx.clearRect(0, 0, loading_canvas.width, loading_canvas.height);
    for (const [index, position] of accual_positions.entries()) {
        let color = hexToRgb(animation_color);
        loading_ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity[index]})`;
        loading_ctx.beginPath();
        loading_ctx.roundRect(position[0], position[1], 30, 30, 5);
        loading_ctx.fill();
    }

}
function updateTargetPositions(){
    for(let i = 0; i < 8; i++){
        if(target_positions.indexOf(i) == -1){
            if(i == 0){
                if(is_loading_running){
                    target_opacity[target_positions.indexOf(7)] = 1;
                }else{
                    target_opacity[target_positions.indexOf(7)] = 0;
                }
                target_positions[target_positions.indexOf(7)] = 0;
            }else{
                if(is_loading_running){
                    target_opacity[target_positions.indexOf(i-1)] = 1;
                }else{
                    target_opacity[target_positions.indexOf(i-1)] = 0;
                }
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
        opacity[i] += (target_opacity[i] - opacity[i])*k;
    }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function AnimationFrame(){
    requestAnimationFrame(AnimationFrame);
    updateAccualPositions(0.3);
    draw();
}
console.log("heheheha");
AnimationFrame();

setInterval(updateTargetPositions, 100);

