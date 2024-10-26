const canvas = document.getElementById('generationeditor-canvas');

function resizeCanvas() {
    // Set the CSS size to fill the parent container
    canvas.window = `${canvas.clientWidth}px`;
    canvas.height = `${canvas.clientHeight}px`;
}

// Initial resize
resizeCanvas();

// Resize when window is resized
window.addEventListener('resize', resizeCanvas);
