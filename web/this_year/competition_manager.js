const cw = document.getElementById("competition-wrapper");
const template = document.getElementById("summary-card-template");


fetch("https://strela-vlna.gchd.cz/api/contests")
    .then(response => response.json())
    .then(data => {
        let i = 0;
        for (const competition of data) {
            const online_round_date =  new Date(competition.online_round).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }).replace(/^0/,'');
            const final_round_date = new Date(competition.final_round).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }).replace(/^0/,'');
            const competition_registration_start_date = new Date(competition.registration_start).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }).replace(/^0/,'');
            const competition_registration_end_date = new Date(competition.registration_end).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }).replace(/^0/,'');
            const can_register = new Date(competition.registration_start) <= new Date() && new Date(competition.registration_end) >= new Date()
            var summary_card_timer_text;
            if (new Date(competition.registration_start) > new Date()){
                summary_card_timer_text = `<span>Registrace začíná ${competition_registration_start_date}</span>`
            }else if(new Date(competition.registration_end) >= new Date()){
                summary_card_timer_text = `<span class="summary-card-sliding-text summary-card-sliding-text-up">Registrace právě probíhá <br> Registrace končí ${competition_registration_end_date}</span>`
            }else{
                summary_card_timer_text = `<span>Registrace skončila ${competition_registration_end_date}</span>`
            }
            cw.innerHTML += `
            <div class="card ${i%2 ==0 ? "card-main" : "card-play"} reg-element reg1">
                <h1 class="summary-card-title">${competition.name}</h1>
                <p class="summary-card-content">
                    <b>${competition.subject == "math" ? "Matematika" : competition.subject == "physics" ? "Fyzika" : "Oboje"}</b><br>
                    <br>
                    Online kolo: ${online_round_date}<br>
                    Prezenční kolo: ${final_round_date}<br>
                </p>
                <div class="summary-card-button-wrapper-grid">
                    <div class="summary-card-timer-wrapper">
                        <i class="far fa-clock summary-card-timer-icon"></i>
                        <div class="summary-card-timer-text-wrapper">${summary_card_timer_text}</div>
                    </div>
                    <button class="summary-card-button ${can_register ? i%2 == 0 ? "submit-button-main" : "submit-button-play": "summary-card-button-gray"}" id="${competition.id}">Registrovat</button>
                </div>
            </div>
            `
            i++;
        }
        const buttons = document.getElementsByClassName("summary-card-button");


        for (const button of buttons) {
            if (!button.classList.contains("summary-card-button-gray")) {
                button.addEventListener("click", function(){
                    window.location.href = `../register/?id=${this.id}`;
                })
            }
        }

        const sliding_texts = document.getElementsByClassName("summary-card-sliding-text");
        setInterval(() => {
            for (const text of sliding_texts) {
                if (text.classList.contains("summary-card-sliding-text-down")) {
                    text.classList.add("summary-card-sliding-text-up");
                    text.classList.remove("summary-card-sliding-text-down");
                } else {
                    text.classList.add("summary-card-sliding-text-down");
                    text.classList.remove("summary-card-sliding-text-up");
                }
            }
        }, 6000);

    }
);

