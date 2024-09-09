const canvas = document.getElementById("this_year_canvas");

const ctx = canvas.getContext("2d");

const topOftset = 60;
const bottomOftset = 100;
const height = 500;

const spacing = 5;

const dropletSize = 10;


let topFluid = []
let bottomFluid = []
let topFluidSpeed = []
let bottomFluidSpeed = []

let droplets = [];

class Droplet {
    constructor(x, y, sy){
        this.x = x;
        this.y = y;
        this.speedY = sy;
    }
}

function generateFluid(){
    o = []
    k = []
    p = []
    for(let i = 0; i < 20; i++){
        o.push(Math.random()*100);
        k.push(Math.random()*0.3);
        p.push((Math.random()+0.15)*0.3);
    }

    for(let i = 0; i < 3000/spacing + 1; i++){
        a = 0
        b = 0
        for(let j = 0; j < 10; j++){
            r = (Math.random()-0.5)*1.1;
            a += Math.sin(i*p[j]+o[j])*k[j]/p[j] + r*r*r;
            b += Math.cos(i*p[j+10]+o[j+10])*k[j+10]/p[j+10];
        }
        topFluid.push(a + topOftset);
        bottomFluid.push(b + bottomOftset);


        topFluidSpeed.push(0);
        bottomFluidSpeed.push(0);
    }
}

function updateFluid(acc, dt){
    for(let i = 0; i < topFluid.length; i++){
        if (i == 0){
            topFluidSpeed[0] += (topFluid[1]-topFluid[0])*acc*dt;
        }else if(i == topFluid.length-1){
            topFluidSpeed[topFluid.length-1] += (topFluid[topFluid.length-2]-topFluid[topFluid.length-1])*acc*dt;
        }else{
            topFluidSpeed[i] += ((topFluid[i-1] + topFluid[i+1])/2-topFluid[i])*acc*dt;
        }

        if (i == 0){
            bottomFluidSpeed[0] += (bottomFluid[1]-bottomFluid[0])*acc*dt;
        }else if(i == bottomFluid.length-1){
            bottomFluidSpeed[bottomFluid.length-1] += (bottomFluid[bottomFluid.length-2]-bottomFluid[bottomFluid.length-1])*acc*dt;
        }else{
            bottomFluidSpeed[i] += ((bottomFluid[i-1] + bottomFluid[i+1])/2-bottomFluid[i])*acc*dt;
        }
        bottomFluidSpeed[i]*=0.9997;
    }
    for(let i = 0; i < topFluid.length; i++){
        // console.log(topFluid[20]);
        topFluid[i] += topFluidSpeed[i]*dt;
        bottomFluid[i] += bottomFluidSpeed[i]*dt;
    }
}


function renderFluid(){
    ctx.fillStyle = "#3118ba";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for(let i = 0; i < topFluid.length; i++){
        ctx.lineTo(i*spacing, topFluid[i]);
    }
    ctx.lineTo(canvas.width, 0);
    ctx.closePath();
    ctx.fill();

    // ctx.fillStyle = "#14B8FF";
    // ctx.beginPath();
    // ctx.moveTo(0, canvas.height);
    // for(let i = 0; i < bottomFluid.length; i++){
    //     ctx.lineTo(i*spacing, 700-bottomFluid[i]);
    // }
    // ctx.lineTo(canvas.width, canvas.height);
    // ctx.closePath();
    // ctx.fill();

}



generateFluid();

function animate() {
    requestAnimationFrame(animate);
    updateFluid(1, 1);
    renderFluid();
    // if(Math.round(Math.random()*50)==0){
    //     checkForPossibleDrop();
    // }
    // updateDrops(1);
    // renderDrops();
    // console.log(droplets[0]);
}

animate();
