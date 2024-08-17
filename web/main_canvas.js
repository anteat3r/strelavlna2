/**
 * @type {HTMLCanvasElement}
*/
const canvas = document.getElementById("main-canvas");

const ctx = canvas.getContext("2d");
ctx.fillStyle = "#f1effc";

//struct for bock with x and y component and target x and y component
class Block {
    constructor(x, y, target_x, target_y, destroy_x, destroy_y) {
        this.x = x;
        this.y = y;
        this.target_x = target_x;
        this.target_y = target_y;
        this.destroy_x = destroy_x;
        this.destroy_y = destroy_y;
    }
}

class Pos {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Void {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.destination_x = x;
        this.destination_y = y;
    }
}

/**
 * @param {Void} void_ 
 * @param {Void[]} list 
 * @returns {int}
*/
function voidIndex(void_, list){
  return list.findIndex((e) => e.x == void_.x && e.y == void_.y) ?? -1;
    // for(let i = 0; i < list.length; i++){
    //     if (list[i].x == void__.x && list[i].y == void__.y){
    //         return i;
    //     }
    // }
    // return -1;
}

/**
 * @param {Block[]} blocks 
 * @param {number} k 
*/
function uppdate_blocks(blocks, k){
    for(let i=0;i<blocks.length;i++){
        blocks[i].x += (blocks[i].target_x - blocks[i].x)*k;
        blocks[i].y += (blocks[i].target_y - blocks[i].y)*k;
        if (Math.abs(blocks[i].destroy_x - blocks[i].x) < 0.05 && Math.abs(blocks[i].destroy_y - blocks[i].y) < 0.05){
            blocks.splice(i, 1);
        }else if(Math.abs(blocks[i].target_x - blocks[i].x) < 0.01 && Math.abs(blocks[i].target_y - blocks[i].y) < 0.01){
            blocks[i].x = blocks[i].target_x;
            blocks[i].y = blocks[i].target_y;
        }
    }
}

//function that will draw all the blocks onto the canvas
function draw_blocks() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    //clearing the previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //drawing the blocks
    for (let block of canvas_accual) {
        ctx.beginPath();
        ctx.roundRect(30*block.x, 30*block.y, spacing, spacing, corner);
        ctx.fill();
    }
}


function generate_random_blocks(n){
    taken_spots = [];
    for (let y = 0; y < 10; y++){
        canvas_semitarget.push([]);
        for(let x = 0; x < 22; x++){
            canvas_semitarget[y].push(1);
        }
    }
    
    for(let i = 0; i < n; i++) {
        let x = Math.floor(Math.random()*22);
        let y = Math.floor(Math.random()*10);
        if (canvas_semitarget[y][x] == 1) {
            canvas_semitarget[y][x] = 0;
            canvas_accual.push(new Block(x, y, x, y, -1, -1));
        }else{
            i--;
        }
    }
}

function blockIndex(block, list){
    for(let i = 0; i < list.length; i++){
        if (list[i].target_x == block.target_x && list[i].target_y == block.target_y){
            return i;
        }
    }
    return -1;
}

function count_blocks(trgt_canvas){
    i = 0;
    for(let y = 0; y < 10; y++){
        for(let x = 0; x < 22; x++){
            if(trgt_canvas[y][x] == 0){
                i++;
            }
        }
    }
    return i;
}

function change_screen(starting_canvas, target_canvas){
    let delta_N = count_blocks(target_canvas) - count_blocks(starting_canvas);

    // console.log(delta_N);
    if (delta_N != 0){
        let modified_canvas = starting_canvas.slice();
        if (delta_N > 0){
            for(let y = 0; y < 10 && delta_N != 0; y++){
                for(let x = 0; x < 22 && delta_N != 0; x++){
                    if (starting_canvas[y][x] == 0){
                        if (x+1 < 22 && modified_canvas[y][x+1] == 1){
                            canvas_accual.push(new Block(x, y, x+1, y, -1, -1));
                            modified_canvas[y][x+1] = 0;
                            delta_N --;
                            continue;
                        }
                        if (y+1 < 10 && modified_canvas[y+1][x] == 1){
                            canvas_accual.push(new Block(x, y, x, y+1, -1, -1));
                            modified_canvas[y+1][x] = 0;
                            delta_N --;
                            continue;
                        }
                        if (x-1 > 0 && modified_canvas[y][x-1] == 1){
                            canvas_accual.push(new Block(x, y, x-1, y, -1, -1));
                            modified_canvas[y][x-1] = 0;
                            delta_N --;
                            continue;
                        }
                        if (y-1 > 0 && modified_canvas[y-1][x] == 1){
                            canvas_accual.push(new Block(x, y, x, y-1, -1, -1));
                            modified_canvas[y-1][x] = 0;
                            delta_N --;
                            continue;
                        }
                    }
                }
            }

        }else{
            for(let y = 0; y < 10 && delta_N != 0; y++){
                for(let x = 0; x < 22 && delta_N != 0; x++){
                    if (modified_canvas[y][x] == 0){
                        if (x+1 < 22 && modified_canvas[y][x+1] == 0){
                            let idx = blockIndex(new Block(x, y, x, y, -1, -1), canvas_accual);
                            // canvas_accual.indexOf(block(x, y, x, y, -1, -1));
                            canvas_accual[idx].target_x = x+1;
                            canvas_accual[idx].target_y = y;
                            canvas_accual[idx].destroy_x = x+1;
                            canvas_accual[idx].destroy_y = y;
                            modified_canvas[y][x] = 1;
                            delta_N ++;
                            x+=4;
                            continue;
                        }
                        if (y+1 < 10 && modified_canvas[y+1][x] == 0){
                            let idx = blockIndex(new Block(x, y, x, y, -1, -1), canvas_accual);
                            // let idx = canvas_accual.indexOf(block(x, y, x, y, -1, -1));
                            canvas_accual[idx].target_x = x;
                            canvas_accual[idx].target_y = y+1;
                            canvas_accual[idx].destroy_x = x;
                            canvas_accual[idx].destroy_y = y+1;
                            modified_canvas[y][x] = 1;
                            delta_N ++;
                            x+=4;
                            continue;
                        }
                        if (x-1 > 0 && modified_canvas[y][x-1] == 0){
                            let idx = blockIndex(new Block(x, y, x, y, -1, -1), canvas_accual);
                            // let idx = canvas_accual.indexOf(block(x, y, x, y, -1, -1));
                            canvas_accual[idx].target_x = x-1;
                            canvas_accual[idx].target_y = y;
                            canvas_accual[idx].destroy_x = x-1;
                            canvas_accual[idx].destroy_y = y;
                            modified_canvas[y][x] = 1;
                            delta_N ++;
                            x+=4;
                            continue;
                        }
                        if (y-1 > 0 && modified_canvas[y-1][x] == 0){
                            let idx = blockIndex(new Block(x, y, x, y, -1, -1), canvas_accual);
                            // let idx = canvas_accual.indexOf(block(x, y, x, y, -1, -1));
                            canvas_accual[idx].target_x = x;
                            canvas_accual[idx].target_y = y-1;
                            canvas_accual[idx].destroy_x = x;
                            canvas_accual[idx].destroy_y = y-1;
                            modified_canvas[y][x] = 1;
                            delta_N ++;
                            x+=4;
                            continue;
                        }
                    }
                }
            }
        }

        starting_canvas = modified_canvas.slice();

    }
    voids = [];
    target_voids = [];
    for(let y = 0; y < 10; y++){
        for(let x = 0; x < 22; x++){
            if(starting_canvas[y][x] == 1){
                voids.push(new Void(x, y));
            }
            if(target_canvas[y][x] == 1){
                target_voids.push(new Pos(x, y));
            }
        }
    }
    for(let i = 0; i < voids.length; i++){
        let min_dist = 100000;
        let idx = -1;
        for(let j = 0; j < target_voids.length; j++){
            let dist = Math.abs(voids[i].x - target_voids[j].x) + Math.abs(voids[i].y - target_voids[j].y);
            if (dist < min_dist){
                min_dist = dist;
                voids[i].destination_x = target_voids[j].x;
                voids[i].destination_y = target_voids[j].y;
                idx = j;
            }
        }
        target_voids.splice(idx, 1);
    }
}

function uppdate_voids(){
    voids_to_move = [];
    for(let i = 0; i < voids.length; i++){
        voids_to_move.push(i);
    }

    idx = voids_to_move[Math.floor(Math.random()*voids_to_move.length)];
    while (voids[idx].destination_x == voids[idx].x && voids[idx].destination_y == voids[idx].y && voids_to_move.length > 1){
        voids_to_move.splice(voids_to_move.indexOf(idx), 1);
        idx = voids_to_move[Math.floor(Math.random()*voids_to_move.length)];
    }
    if (voids_to_move.length == 0){
        return;
    }

    let dx = voids[idx].destination_x - voids[idx].x;
    let dy = voids[idx].destination_y - voids[idx].y;

    if (Math.random() > Math.abs(dx)/(Math.abs(dx) + Math.abs(dy))){
        dx = 0;
        dy = Math.sign(dy);
    }else{
        dx = Math.sign(dx);
        dy = 0;
    }

    let i = blockIndex(new Block(0, 0, voids[idx].x + dx, voids[idx].y + dy, 0, 0), canvas_accual);
    if (i != -1){
        canvas_accual[i].target_x = voids[idx].x;
        canvas_accual[i].target_y = voids[idx].y;
        voids[idx].x += dx;
        voids[idx].y += dy;
    }else{
        i = voidIndex(new Void(voids[idx].x + dx, voids[idx].y + dy, -1, -1), voids);
        voids[i].x -= dx;
        voids[i].y -= dy;
        voids[idx].x += dx;
        voids[idx].y += dy;
    }
    if (voids_done(voids, canvas_targets[target_canvas])){
        setTimeout(() => {
            let new_target_canvas;
            if (target_canvas == canvas_targets.length-1){
                new_target_canvas = 0
            }else{
                new_target_canvas = target_canvas+1;
            }
            change_screen(canvas_targets[target_canvas].slice(), canvas_targets[new_target_canvas].slice());
            target_canvas = new_target_canvas;
            setTimeout(() => {
                for(let i = 0; i < canvas_accual.length; i++){
                    if (canvas_accual[i].target_x == canvas_accual[i].destroy_x && canvas_accual[i].target_y == canvas_accual[i].destroy_y){
                    }else{
                    }
                }

                uppdate_blocks(canvas_accual, 0.3);
                uppdate_voids();
            }, 500);

        }, 10000);
        
    }else{
        setTimeout(() => {uppdate_voids();}, 50);
    }
}

function voids_done(voids, target_canvas){
    for(let i = 0; i < voids.length; i++){
        if (target_canvas[voids[i].y][voids[i].x] == 0){
            return false;
        }
    }
    return true;
}


const canvas_targets = [[
    [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
],[
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1],
    [0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]
],[
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
],[
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
]
]

var canvas_accual = [];

var canvas_semitarget = [];

var voids = [];

var target_canvas = 0;

var spacing = 29.5;
var corner = 4;

for(let i = 0; i < canvas_targets.length; i++){
    let delta_N = count_blocks(canvas_targets[i]) - count_blocks(canvas_targets[0]);
    console.log(count_blocks(canvas_targets[i]))
    console.log(delta_N);
}

generate_random_blocks(count_blocks(canvas_targets[target_canvas]));
draw_blocks();

setTimeout(() => {change_screen(canvas_semitarget.slice(), canvas_targets[target_canvas].slice());}, 3000);
setTimeout(() => {uppdate_voids();}, 3000);

//main animation loop
function animate() {
    requestAnimationFrame(animate);
    uppdate_blocks(canvas_accual, 0.3);

    draw_blocks();
}

animate();
