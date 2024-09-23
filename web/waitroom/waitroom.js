var is_playing = true;
const is_mobile = !window.matchMedia("(pointer: fine)").matches;
console.log(is_mobile);
setTimeout(e=> {is_playing = false;}, 1500);
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var speed = 0;
var pos = 0;
var running = false;

const target_time = Date.now() + 20000000;


const analyser = audioCtx.createAnalyser();
analyser.fftSize = is_mobile ? 256 : 2048; 


const audioElement = document.querySelector('audio');
const audioSrc = audioCtx.createMediaElementSource(audioElement);
audioSrc.connect(analyser);
analyser.connect(audioCtx.destination);


const canvas = document.querySelector('canvas');
const canvasCtx = canvas.getContext('2d');


const spectrumHistory = [];
const maxHistory = is_mobile ? 1 : 25;

if (is_mobile) {
    canvas.width = 400;
}

function drawSpectrum(dataArray, offsetY, scale, opacity, fill) {
    const pointSpacing = (canvas.width / dataArray.length*1.5); 

    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height - offsetY);
    canvasCtx.lineTo((canvas.width / 2) + (-1 - dataArray.length/2) * scale, canvas.height - offsetY);

    for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i]; 
        const y = canvas.height - offsetY - (value / 2)*scale*0.15; 
        const x = (canvas.width / 2) + (i - dataArray.length/2) * scale
        canvasCtx.lineTo(x, y);

    }
    canvasCtx.lineTo((canvas.width / 2) + (dataArray.length - dataArray.length/2) * scale, canvas.height - offsetY);
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
    }else{
        speed += (0 - speed)*0.05;
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
    }
    if(speed < 0.001){return;}

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const depthStep = 3;
    var offsetY = 495;
    var scale = 8;
    const fov = 100;
    const cam_height = -100;
    var offsetZ = 260 + pos;

    for(let i = 0; i < 100; i++){
        const k = fov/offsetZ;
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, canvas.height - (cam_height*k+555));
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
            
            drawSpectrum(spectrumHistory[spectrumHistory.length - 1 - i].slice(0,100), cam_height*k+555, scale, 1, true);
        }else{
            drawSpectrum(spectrumHistory[spectrumHistory.length - 1 - i].slice(0,100), cam_height*k+555, scale, 0.4 - (0.4*i/spectrumHistory.length), false);
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

    const this_second = Math.floor(now/1000);
    if (this_second != last_second) {
        last_second = this_second;
        for (const timer of document.getElementsByClassName('waitroom-timer')) {
            timer.innerText = new Date(remaining).toISOString().substr(11, 8);
        }
    }
    
    // document.getElementById('waitroom-timer').innerText = new Date(remaining).toISOString().substr(11, 8);
    
    
    requestAnimationFrame(frame);
}

audioElement.onplay = () => {
    audioCtx.resume();
};
drawSilentLines();
frame();


function playStop(){
    document.getElementById('note-button').removeEventListener('click', arguments.callee);
    if(audioElement.paused){
        audioElement.play();
        is_playing = true;
        document.getElementById('note-button').addEventListener('click', playStop);
        running = true;
    }else{
        audioElement.pause();
        running = false;
        is_playing = false;
        document.getElementById('note-button').addEventListener('click', playStop);
        setTimeout(e=>{
        }, 1000);
    }
}
document.getElementById('note-button').addEventListener('click', playStop);
