const cw = document.getElementById("competition-wrapper");
const template = document.getElementById("summary-card-template");




fetch("http://localhost:8090/contests")
    .then(response => response.json())
    .then(data => {
        console.log(data[0]);
        let i = 0;
        for (const competition of data) {
            cw.innerHTML += `
            <div class="summary-card ${i%2 ==0 ? "summary-card-dark-blue" : "summary-card-light-blue"} reg-element reg1">
                <h1 class="summary-card-title">${competition.name}</h1>
                <p class="summary-card-content">
                    <b>${competition.subject == "math" ? "Matematika" : competition.subject == "physics" ? "Fyzika" : "Oboje"}</b><br>
                    <br>
                    Online kolo: ${new Date(competition.online_round).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }).replace(/^0/,'') }<br>
                    Prezenční kolo: ${new Date(competition.final_round).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }).replace(/^0/,'') }<br>
                </p>
                <div class="summary-card-button-wrapper-grid">
                    <i class="far fa-clock summary-card-timer-icon"><span class="summary-card-timer-text">${new Date(competition.registration_start) > new Date() ? "Registrace začíná" : "Registrace právě probíhá"} ${new Date(competition.registration_start) > new Date() ? new Date(competition.registration_start).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }).replace(/^0/,'') : "" }</span></i>
                    <button class="summary-card-button ${new Date(competition.registration_start) > new Date() ? "summary-card-button-gray" : i%2 == 0 ? "summary-card-button-dark-blue" : "summary-card-button-light-blue"}">Registrovat</button>
                </div>
            </div>
            `
            i++;
        }

    });

// cw.innerHTML += `
// <div class="summary-card summary-card-dark-blue reg-element reg1">
//           <h1 class="summary-card-title">Pražská střela 2024</h1>
//           <p class="summary-card-content">
//             <b>Matematika</b><br>
//             <br>
//             Online kolo: 26. 11. 2024<br>
//             Prezenční kolo: 3. 12. 2024
//           </p>
//           <div class="summary-card-button-wrapper-grid">
//             <i class="far fa-clock summary-card-timer-icon"><span class="summary-card-timer-text">Registrace začíná 11. 9. 2024</span></i>
//             <button class="summary-card-button summary-card-button-gray">Registrovat</button>
//           </div>
//         </div>`;
