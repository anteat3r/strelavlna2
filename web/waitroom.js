var is_playing = true;
const is_mobile = !window.matchMedia("(pointer: fine)").matches;
console.log(is_mobile);
setTimeout(e=> {is_playing = false;}, 1500);
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();



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

function drawSpectrum(dataArray, offsetY, scale, opacity) {
    const pointSpacing = (canvas.width / dataArray.length*1.5); 

    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height - offsetY);
    canvasCtx.lineTo((canvas.width / 2) + (-1 - dataArray.length/2) * scale, canvas.height - offsetY);

    for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i]; 
        const y = canvas.height - offsetY - (value / 2); 
        const x = (canvas.width / 2) + (i - dataArray.length/2) * scale
        canvasCtx.lineTo(x, y);

    }
    canvasCtx.lineTo((canvas.width / 2) + (dataArray.length - dataArray.length/2) * scale, canvas.height - offsetY);
    canvasCtx.lineTo(canvas.width, canvas.height - offsetY);

    canvasCtx.strokeStyle = `rgba(62, 177, 223, ${opacity})`;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
    const now = Date.now();
    const remaining = target_time - now;
    document.getElementById('waitroom-timer').innerText = new Date(remaining).toISOString().substr(11, 8);
}

function updateSpectrogramMountains() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(dataArray);

    if (spectrumHistory.length >= maxHistory) {
        spectrumHistory.shift();
    }
    spectrumHistory.push([...dataArray]);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const depthStep = 1.5;
    var offsetY = 500;
    var scale = 4;
    for (let i = 0; i < spectrumHistory.length; i++) {
        scale += i/70; 
        offsetY -= depthStep * (1+i/1.5) + (Math.random()*2-1)*0.2;

        if(i==0){
            drawSpectrum(spectrumHistory[spectrumHistory.length - 1 - i].slice(0,100), offsetY, scale, 1);

        }else{
            drawSpectrum(spectrumHistory[spectrumHistory.length - 1 - i].slice(0,100), offsetY, scale, 0.4 - (0.4*i/spectrumHistory.length));
        }
    }

}

function frame(){
    if(is_playing){
        updateSpectrogramMountains();
    }
    requestAnimationFrame(frame);
}

audioElement.onplay = () => {
    audioCtx.resume();
};

frame();


// window.addEventListener('load', function() {
//     var audio = document.getElementById('audio');
    
//     audio.play().catch(function(error) {
//       console.log("Autoplay prevented: " + error);
//     });
//   });


function playStop(){
    document.getElementById('note-button').removeEventListener('click', arguments.callee);
    if(audioElement.paused){
        audioElement.play();
        is_playing = true;
        document.getElementById('note-button').addEventListener('click', playStop);
    }else{
        audioElement.pause();
        setTimeout(e=>{
            is_playing = false;
            document.getElementById('note-button').addEventListener('click', playStop);
        }, 1000);
    }
}
document.getElementById('note-button').addEventListener('click', playStop);
