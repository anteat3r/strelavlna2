const redirects = true;

var is_playing = true;
const is_mobile = !window.matchMedia("(pointer: fine)").matches;
console.log(is_mobile);
setTimeout(e=> {is_playing = false;}, 1500);
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var speed = 0;
var pos = 0;
var running = false;
var cam_height = -200;

stoneSetup = {
    min: -1000,
    max: 1000,
    innerMin: -200,
    InnerMax: 200
}

var target_time = Date.now() + 3600000;

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
fetch(`https://strela-vlna.gchd.cz/api/teamcontstart/${id}`)
    .then(response => {
        if(response.status == 500) {
            window.location.href = `../login?id=${id}`;
            return;
        }
        return response.text();
    })
    .then(data => {
        console.log(data);
        target_time = Date.now() + parseInt(data);
        // console.log(data);
        // target_time = Date.now() + 10000;
    });

const analyser = audioCtx.createAnalyser();
analyser.fftSize = is_mobile ? 256 : 2048; 


const audioElement = document.querySelector('audio');
const audioSrc = audioCtx.createMediaElementSource(audioElement);
audioSrc.connect(analyser);
analyser.connect(audioCtx.destination);


const canvas = document.querySelector('canvas');
const canvasCtx = canvas.getContext('2d');

var stones = []
const spectrumHistory = [];
const maxHistory = is_mobile ? 1 : 25;

if (is_mobile) {
    canvas.width = 400;
}

function pregenerateStones(n, sep){
    for (let i = 0; i < n; i++) {
        if (i % sep == 0) {
            stones.push(Math.floor(Math.random() * (stoneSetup.max - stoneSetup.min + 1) + stoneSetup.min));
        } else {
            stones.push(0);
        }
    }
    for (let i = 0; i < n; i++) {
        if (stones[i] >= stoneSetup.innerMin && stones[i] <= stoneSetup.InnerMax) {
            stones[i] = 0;
        }
    }
}

function drawSpectrum(dataArray, offsetY, scale, opacity, fill, stone, fov, offsetZ) {
    const pointSpacing = (canvas.width / dataArray.length*1.5); 
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height - offsetY);

    if (stone != 0) {
        if(stone < stoneSetup.innerMin){
            const k = fov/offsetZ;
            canvasCtx.lineTo((stone-40)*k + canvas.width/2, canvas.height - ((cam_height)*k+555));
            canvasCtx.lineTo((stone)*k + canvas.width/2, canvas.height - ((cam_height+30)*k+555));
            canvasCtx.lineTo((stone+40)*k + canvas.width/2, canvas.height - ((cam_height)*k+555));
        }
        
    }
    canvasCtx.lineTo((canvas.width / 2) + (-1 - dataArray.length/2) * scale, canvas.height - offsetY);

    for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i]; 
        const y = canvas.height - offsetY - (value / 2)*scale*0.15; 
        const x = (canvas.width / 2) + (i - dataArray.length/2) * scale
        canvasCtx.lineTo(x, y);

    }
    
    canvasCtx.lineTo((canvas.width / 2) + (dataArray.length - dataArray.length/2) * scale, canvas.height - offsetY);
    if (stone != 0) {
        if(stone > 0){
            const k = fov/offsetZ;
            canvasCtx.lineTo((stone-40)*k + canvas.width/2, canvas.height - ((cam_height)*k+555));
            canvasCtx.lineTo((stone)*k + canvas.width/2, canvas.height - ((cam_height+30)*k+555));
            canvasCtx.lineTo((stone+40)*k + canvas.width/2, canvas.height - ((cam_height)*k+555));
        }
    }
    canvasCtx.lineTo(canvas.width, canvas.height - offsetY);
    
    

    if(fill){
        canvasCtx.fillStyle = 'white';
        canvasCtx.fill();
    }
    canvasCtx.strokeStyle = `rgba(62, 177, 223, ${opacity})`;
    canvasCtx.lineWidth = 3;
    canvasCtx.stroke();

}

function updateSpectrogramMountains() {
    if(running){
        speed += Math.min((2 - speed)*0.05, 0.01);
        cam_height += (-100 - cam_height) * 0.01;
    }else{
        speed += (0 - speed)*0.05;
        cam_height += (-200 - cam_height) * 0.01;

    }
    pos -= speed;
    while(pos <= -2){
        pos += 2;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyser.getByteFrequencyData(dataArray);

        if (spectrumHistory.length >= maxHistory) {
            spectrumHistory.shift();
        }
        spectrumHistory.push([...dataArray]);
        stones.shift();
        if(stones[stones.length-5] != 0){
            var new_stone = Math.floor(Math.random() * (stoneSetup.max - stoneSetup.min + 1) + stoneSetup.min);
            while(new_stone >= stoneSetup.innerMin && new_stone <= stoneSetup.InnerMax){
                new_stone = Math.floor(Math.random() * (stoneSetup.max - stoneSetup.min + 1) + stoneSetup.min);
            }
            stones.push(new_stone);
        }else{
            stones.push(0);
        }
    }
    if(speed < 0.001 && cam_height < -199){return;}

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const depthStep = 3;
    var offsetY = 495;
    var scale = 8;
    const fov = 100;
    var offsetZ = 260 + pos;

    for(let i = 0; i < 100; i++){
        const k = fov/offsetZ;
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, canvas.height - (cam_height*k+555));
        if(99-i < stones.length && stones[99-i] != 0){
            canvasCtx.lineTo((stones[129-i]-40)*k + canvas.width/2, canvas.height - ((cam_height)*k+555));
            canvasCtx.lineTo((stones[129-i])*k + canvas.width/2, canvas.height - ((cam_height+30)*k+555));
            canvasCtx.lineTo((stones[129-i]+40)*k + canvas.width/2, canvas.height - ((cam_height)*k+555));
        }
            
        canvasCtx.lineTo(canvas.width, canvas.height - (cam_height*k+555));
        canvasCtx.strokeStyle = `rgba(128, 128, 128, ${i*i/50000})`;
        canvasCtx.lineWidth = 1;
        canvasCtx.stroke();
        offsetZ-=2;

    }
    // offsetY = 500;
    var offsetZ = 60 + pos;
    for (let i = 0; i < spectrumHistory.length; i++) {
        if(offsetZ <= 0){
            break;
        }
        const k = fov/offsetZ;
        // console.log(spectrumHistory.length);
        scale = k*3;
        // offsetY -= depthStep * (1+i/3);

        if(i==0){
            
            drawSpectrum(spectrumHistory[spectrumHistory.length - 1 - i].slice(0,100), cam_height*k+555, scale, 1, true, stones[29-i], fov, offsetZ);
        }else{
            drawSpectrum(spectrumHistory[spectrumHistory.length - 1 - i].slice(0,100), cam_height*k+555, scale, 0.4 - (0.4*i/spectrumHistory.length), false, stones[29-i], fov, offsetZ);
        }
        offsetZ-=2;
    }

}

function drawSilentLines() {
    for(let i = 0; i < maxHistory-1; i++){
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        spectrumHistory.push([...dataArray]);
    }
    speed = 2;
    updateSpectrogramMountains();
    speed = 0;
}

var last_second = Math.floor(Date.now()/1000);
function frame(){
    updateSpectrogramMountains();
    const now = Date.now();
    const remaining = target_time - now;

    if (remaining <= 0 && redirects) {
        window.location.href = `../play?id=${id}`;
    }

    const this_second = Math.floor(now/1000);
    if (this_second != last_second) {
        last_second = this_second;
        for (const timer of document.getElementsByClassName('waitroom-timer')) {
            if (Math.floor(remaining / 86400000) == 0) {
                timer.innerText = new Date(remaining).toISOString().substr(11, 8);
            } else {
                timer.innerText = "Zbývá " + Math.floor(remaining / 86400000) + ' dní';
            }
        }
    }
    
    // document.getElementById('waitroom-timer').innerText = new Date(remaining).toISOString().substr(11, 8);
    
    
    requestAnimationFrame(frame);
}

audioElement.onplay = () => {
    audioCtx.resume();
};
pregenerateStones(130, 1);
console.log(stones);
drawSilentLines();
frame();


function playStop(){
    document.getElementById('note-button').removeEventListener('click', arguments.callee);
    if(audioElement.paused){
        audioElement.play();
        is_playing = true;
        document.getElementById('note-button').addEventListener('click', playStop);
        running = true;
        document.getElementById('note-button').innerHTML = `<i class="fa-solid fa-pause"></i>`;
        
    }else{
        audioElement.pause();
        running = false;
        is_playing = false;
        document.getElementById('note-button').addEventListener('click', playStop);
        document.getElementById('note-button').innerHTML = `<i class="fa-brands fa-itunes-note"></i>`;
    }
}
document.getElementById('note-button').addEventListener('click', playStop);
