const regionSelector = document.getElementById('region-selector');
const returnButton = document.getElementById("return-button");

var mouseX = 0;
var mouseY = 0;

var zoomState = 0;

var viewboxPosition = [-70, 0, 370, 185];
const viewboxPositions = [[-70, 0, 370, 185], [-20, 30, 190, 95], [40, 0, 130, 65], [-45, 0, 170, 85], [-80, 30, 140, 70], [-80, 70, 200, 100], [-15, 100, 180, 90], [50, 85, 160, 80], [90, 100, 170, 85], [150, 110, 120, 60], [150, 40, 190, 95], [100, 40, 200, 100], [75, 60, 120, 60], [70, 25, 110, 55]]

regionSelector.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    const point = regionSelector.createSVGPoint();
    point.x = mouseX;
    point.y = mouseY;

    const svgPoint = point.matrixTransform(regionSelector.getScreenCTM().inverse());
    var selected = false;
    if (zoomState == 0){
        for(const path of regionSelector.getElementById('kraje').getElementsByTagName('path')){
            if (path.isPointInFill(svgPoint) && !selected) {
                path.classList.add('region-selector-hover');
                selected = true;
            }else{
                path.classList.remove('region-selector-hover');
            }
        }
    }else{
        for(const path of regionSelector.getElementById('okresy').getElementsByTagName('path')){
            if (path.id.startsWith(`${zoomState}-`) && path.isPointInFill(svgPoint) && !selected) {
                path.classList.add('region-selector-hover');
                selected = true;
            }else{
                path.classList.remove('region-selector-hover');
            }
        }
        
    }

});

regionSelector.addEventListener('click', e => {
    if (zoomState != 0){return;}
    const point = regionSelector.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;

    const svgPoint = point.matrixTransform(regionSelector.getScreenCTM().inverse());

    var clicked = false;
    for(const path of regionSelector.getElementById('kraje').getElementsByTagName('path')){
        if (path.isPointInFill(svgPoint) && !clicked) {
            zoomState = parseInt(path.id);
            path.classList.remove('region-selector-hover');
            clicked = true;
        }else{
            path.classList.add('region-selector-notready');

        }
    }
    
    for(const path of regionSelector.getElementById('okresy').getElementsByTagName('path')){
        if (path.id.startsWith(`${zoomState}-`)) {
            path.classList.remove('region-selector-hidden');
            path.classList.add('region-selector-ready');
        }
    }

    returnButton.classList.remove('return-button-hidden');
});

returnButton.addEventListener("click", function(){
    returnButton.classList.add('return-button-hidden');
    for (const path of regionSelector.getElementById('kraje').getElementsByTagName('path')) {
        path.classList.remove('region-selector-notready');
    }

    for (const path of regionSelector.getElementById('okresy').getElementsByTagName('path')) {
        path.classList.remove('region-selector-ready');
        path.classList.add('region-selector-hidden');
    }
    zoomState = 0;
})


for (const path of regionSelector.getElementById('kraje').getElementsByTagName('path')) {
    path.classList.add('region-selector-ready');
}

for (const path of regionSelector.getElementById('okresy').getElementsByTagName('path')) {
    path.classList.add('region-selector-hidden');
}

function animateViewbox(k){
    for(let i = 0; i < 4; i++){
        viewboxPosition[i] += (viewboxPositions[zoomState][i] - viewboxPosition[i]) * k;
    }
    regionSelector.setAttribute('viewBox', viewboxPosition.join(' '));
}


function update(){
    requestAnimationFrame(update);
    animateViewbox(0.2);
}

update();