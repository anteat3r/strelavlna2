document.getElementById('set-icon').addEventListener('click', () => {
    document.querySelector('.settings').classList.toggle('hidden');
});
let timerInterval = null;
let countdownInterval = null;
document.getElementById('start-timer').addEventListener('click', () => {
    const startTimeInput = document.getElementById('start-time').value;
    const endTimeInput = document.getElementById('end-time').value;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
   //if (countdownInterval) {
   //    clearInterval(countdownInterval);
   //    countdownInterval = null;
   //}

    if (!startTimeInput || !endTimeInput) {
        alert('Please select both start and end times.');
        return;
    }

    const startTime = new Date(startTimeInput).getTime();
    const endTime = new Date(endTimeInput).getTime();

    if (endTime <= startTime) {
        alert('End time must be after start time.');
        return;
    }
    //const startCountdown = document.getElementById('start-countdown');
    //let countdown = (endTime - startTime) / 1000;
    //let countdownInterval = setInterval(() => {
    //    countdown--;
    //    startCountdown.textContent = `T: -${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`;
    //    if (countdown <= 0) {
    //        clearInterval(countdownInterval);
    //        startCountdown.classList.add('hidden');
    //    }
    //}, 1000);
    const timerDisplay = document.getElementById('timer-display');
    timerInterval = setInterval(() => {
        const currentTime = new Date().getTime();
        
        if (currentTime >= endTime) {
            clearInterval(timerInterval);
            timerDisplay.textContent = '00:00:00';
            return;
        }

        
        if (currentTime < startTime) {
            const timer = endTime - startTime;
            const hours = Math.floor((timer / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((timer / (1000 * 60)) % 60);
            const seconds = Math.floor((timer / 1000) % 60);

            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            const remainingTime = endTime - currentTime;
            const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
            const seconds = Math.floor((remainingTime / 1000) % 60);

            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
});