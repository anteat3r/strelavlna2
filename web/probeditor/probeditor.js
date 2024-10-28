import PocketBase from '../pocketbase.es.mjs';
const pb = new PocketBase("https://strela-vlna.gchd.cz");
await login();

//globals


let focused_prob = "";
let my_id = pb.authStore.model.id;
let editor_types = ["finallook", "table", "generationeditor", "table-plus-generationeditor"];
let editor_type = "finallook";
let prob_filter = "all";
let table = [
    // {
    //     id: "hkajs2das65d1a3",
    //     name: "Gravitační konstanta",
    //     symmbol: "g",
    //     value: "9.81",
    //     unit: "m/s2",
    //     description: "Gravitační konstanta"
    // }
];
let probs = [
    // {
    //     id: "iuhs4f9ds6515df1",
    //     title: "Popelar",
    //     rank: "A",
    //     content: "Potápěč naměřil v moři tlak 158kPa. Hustota mořské vody je 1030 kg/m$^3$. V jaké hloubce (v metrech) se potápěč nachází? Výsledek uveďte bez jednotky a zaokrouhlete na 3 platné cifry.",
    //     solution: "0.000",
    //     image: "popelar.png"
    // },
];


async function login(){
    if(pb.authStore.isValid) return;
    localStorage.setItem("logging_from", window.location.href);
    window.location.href = "../adlogin";
}

async function load(){
    const result_probs = await pb.collection("probs").getList(1, 100000000);
    const consts_probs = await pb.collection("consts").getList(1, 100000000);
    const result_items = result_probs.items;
    const consts_items = consts_probs.items;
    for(let item of result_items){
        probs.push({
            id: item.id,
            title: item.name,
            rank: item.diff,
            content: item.text,
            solution: item.solution,
            image: item.img,
            workers: item.workers.split(" ")
        });
    }

    for(let item of consts_items){
        table.push({
            id: item.id,
            name: item.name,
            symmbol: item.symbol,
            value: item.value,
            unit: item.unit,
            description: item.desc
        });
    }
}

// right editor

let editor_type_buttons = [];
for(let item of editor_types){
    let element = document.getElementById(`editor-type-${item}`)
    editor_type_buttons.push(element);
}

let right_editor_elements = [];
right_editor_elements.push(document.getElementById("finallook-wrapper"));
right_editor_elements.push(document.getElementById("table-wrapper"));
right_editor_elements.push(document.getElementById("generationeditor-wrapper"));

for(let item of editor_type_buttons){
    item.addEventListener("click", function(){
        for(let item of editor_type_buttons){
            item.classList.remove("selected");
        }
        if(this.id == "editor-type-finallook"){
            editor_type = "finallook";
        }else if(this.id == "editor-type-table"){
            editor_type = "table";
        }else if(this.id == "editor-type-generationeditor"){
            editor_type = "generationeditor";
        }else{
            editor_type = "table-plus-generationeditor";
        }
        this.classList.add("selected");
        updateRightEditor();
    }
    );
}

function updateRightEditor(){
    for(let item of right_editor_elements){
        item.classList.add("hidden");
    }
    if(editor_type == "finallook"){
        right_editor_elements[0].classList.remove("hidden");
    }else if(editor_type == "table"){
        right_editor_elements[1].classList.remove("hidden");
        right_editor_elements[1].classList.remove("small");
    }else if(editor_type == "generationeditor"){
        right_editor_elements[2].classList.remove("hidden");
    }else{
        right_editor_elements[1].classList.remove("hidden");
        right_editor_elements[2].classList.remove("hidden");
        right_editor_elements[1].classList.add("small");
    }
}

function updateFinallook(){
    if(focused_prob == "") return;
    const prob = probs.find(prob => prob.id == focused_prob);
    const finallook_title_DOM = document.getElementById("finallook-title");
    const finallook_text_DOM = document.getElementById("finallook-text");
    const finallook_image_DOM = document.getElementById("finallook-image");

    finallook_title_DOM.innerHTML = prob.title;
    finallook_text_DOM.innerHTML = prob.content;
    finallook_image_DOM.src = prob.image;

    MathJax.typeset();
}

document.getElementById('add-image').addEventListener('click', function() {
    document.getElementById('image-input').click();
});

document.getElementById("regenerate").addEventListener("click", function(){
    updateFinallook();
})


//left editor
const rank_DOM = document.getElementById("problem-rank-selector-button");
const rank_A_DOOM = document.getElementById("problem-rank-dropdown-item-a");
const rank_B_DOOM = document.getElementById("problem-rank-dropdown-item-b");
const rank_C_DOOM = document.getElementById("problem-rank-dropdown-item-c");
const rank_txt_DOM = document.getElementById("problem-rank-selector-rank");


rank_DOM.addEventListener("click", function(){
    if(focused_prob == "") return;
    updateRankSelector();

    rank_DOM.parentElement.classList.toggle("oppened");
});

rank_A_DOOM.addEventListener("click", function(){
    const prob = probs.find(prob => prob.id == focused_prob);
    prob.rank = "A";
    updateRankSelector();
    updateProbList();
    rank_DOM.parentElement.classList.toggle("oppened");
});
rank_B_DOOM.addEventListener("click", function(){
    const prob = probs.find(prob => prob.id == focused_prob);
    prob.rank = "B";
    updateRankSelector();
    updateProbList();
    rank_DOM.parentElement.classList.toggle("oppened");
});
rank_C_DOOM.addEventListener("click", function(){
    const prob = probs.find(prob => prob.id == focused_prob);
    prob.rank = "C";
    updateRankSelector();
    updateProbList();
    rank_DOM.parentElement.classList.toggle("oppened");
});

function updateRankSelector(){
    const prob = probs.find(prob => prob.id == focused_prob);

    rank_A_DOOM.classList.remove("selected");
    rank_B_DOOM.classList.remove("selected");
    rank_C_DOOM.classList.remove("selected");

    if(prob.rank == "A"){
        rank_A_DOOM.classList.add("selected");
    }else if(prob.rank == "B"){
        rank_B_DOOM.classList.add("selected");
    }else{
        rank_C_DOOM.classList.add("selected");
    }

    rank_txt_DOM.innerHTML = `[${prob.rank}]`;
}


function updateLeftEditor(){
    const title_DOM = document.getElementById("problem-title-input");
    const content_DOM = document.getElementById("problem-content-textarea");
    const solution_DOM = document.getElementById("problem-solution-input");

    

    if(focused_prob == ""){
        title_DOM.value = "";
        content_DOM.value = "";
        solution_DOM.value = "";
        rank_DOM.classList.remove("oppened");
        rank_txt_DOM.innerHTML = "[-]";
    }else{
        const prob = probs.find(prob => prob.id == focused_prob);
        title_DOM.value = prob.title;
        content_DOM.value = prob.content;
        solution_DOM.value = prob.solution;
        rank_txt_DOM.innerHTML = `[${prob.rank}]`;
    }

    
}


//prob selector

function updateProbList(){
    const prob_list_a = document.getElementById("problem-section-a");
    const prob_list_b = document.getElementById("problem-section-b");
    const prob_list_c = document.getElementById("problem-section-c");

    const probs_a = probs.filter(prob => prob.rank == "A" && (prob.workers[0] == my_id || prob_filter == "all"));
    const probs_b = probs.filter(prob => prob.rank == "B" && (prob.workers[0] == my_id || prob_filter == "all"));
    const probs_c = probs.filter(prob => prob.rank == "C" && (prob.workers[0] == my_id || prob_filter == "all"));

    prob_list_a.innerHTML = "";
    prob_list_b.innerHTML = "";
    prob_list_c.innerHTML = "";

    for(let item of probs_a){
        prob_list_a.innerHTML += `
            <div id="${item.id}" class="problem${focused_prob == item.id ? " selected" : ""}">
                <h2 class="problem-selector-title">${item.title}</h2>
                <h2 class="problem-selector-rank">[A]</h2>
            </div>  
        `;
    }
    for(let item of probs_b){
        prob_list_b.innerHTML += `
            <div id="${item.id}" class="problem${focused_prob == item.id ? " selected" : ""}">
                <h2 class="problem-selector-title">${item.title}</h2>
                <h2 class="problem-selector-rank">[B]</h2>
            </div>  
        `;
    }
    for(let item of probs_c){
        prob_list_c.innerHTML += `
            <div id="${item.id}" class="problem${focused_prob == item.id ? " selected" : ""}">
                <h2 class="problem-selector-title">${item.title}</h2>
                <h2 class="problem-selector-rank">[C]</h2>
            </div>  
        `;
    }

    for(let item of document.getElementsByClassName("problem")){
        item.addEventListener("click", function(){
            if(focused_prob == this.id) return;
            if(focused_prob != ""){
                document.getElementById(focused_prob).classList.remove("selected");
            }
            focused_prob = this.id;
            this.classList.add("selected");
            updateRankSelector();
            // updateRightEditor();
            updateFinallook();
            updateLeftEditor();
        });
    }

    if(focused_prob == ""){
        document.getElementById("problems-delete").classList.add("disabled");
    }else{
        document.getElementById("problems-delete").classList.remove("disabled");
    }
}

function deleteFocusedProb(){
    if(focused_prob == "") return;
    probs = probs.filter(prob => prob.id != focused_prob);
    focused_prob = "";
    updateProbList();
}

function addProb(){
    const newId = getFreeProbId();
    probs.push({
        id: newId,
        title: "Nová úloha",
        rank: "A",
        content: "",
        solution: "",
    });
    focused_prob = newId;
    updateProbList();
}

function getFreeProbId() {
    let newId;
    do {
        newId = Math.random().toString(36).substr(2, 9);
    } while (probs.some(prob => prob.id === newId));
    return newId;
}

document.getElementById("problems-add").addEventListener("click", addProb);
document.getElementById("problems-delete").addEventListener("click", deleteFocusedProb);




await load();
updateProbList();
