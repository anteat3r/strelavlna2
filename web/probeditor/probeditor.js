import PocketBase from '../pocketbase.es.mjs';
const pb = new PocketBase("https://strela-vlna.gchd.cz");
await login();


//classes

class TableRow {
    constructor(id, name, symbol, value, unit, description) {
      this._id = id;
      this._name = name;
      this._symbol = symbol;
      this._value = value;
      this._unit = unit;
      this._description = description;

      this._name_modified = false;
      this._symbol_modified = false;
      this._value_modified = false;
      this._unit_modified = false;
      this._description_modified = false;
    }
  
    // Getters and setters
    get id() {
      return this._id;
    }
  
    set id(newId) {
      console.log("setting id is forbiden");
    }
  
    get name() {
      return this._name;
    }
  
    set name(newName) {
      changesUnsaved();
      this._name_modified = true;
      this._name = newName;
    }
  
    get symbol() {
      return this._symbol;
    }
  
    set symbol(newSymbol) {
      changesUnsaved();
      this._symbol_modified = true;
      this._symbol = newSymbol;
    }
  
    get value() {
      return this._value;
    }
  
    set value(newValue) {
      changesUnsaved();
      this._value_modified = true;
      this._value = newValue;
    }
  
    get unit() {
      return this._unit;
    }
  
    set unit(newUnit) {
      changesUnsaved();
      this._unit_modified = true;
      this._unit = newUnit;
    }
  
    get description() {
      return this._description;
    }
  
    set description(newDescription) {
      changesUnsaved();
      this._description_modified = true;
      this._description = newDescription;
    }

    pushChanges() {
      if (!(this._name_modified || this._symbol_modified || this._value_modified || this._unit_modified || this._description_modified)) return;

      const update_data = {};

      if (this._name_modified) update_data.name = this._name;
      if (this._symbol_modified) update_data.symbol = this._symbol;
      if (this._value_modified) update_data.value = this._value;
      if (this._unit_modified) update_data.unit = this._unit;
      if (this._description_modified) update_data.desc = this._description;

      console.log(update_data);

      pb.collection('consts').update(this.id, update_data);

      this._name_modified = false;
      this._symbol_modified = false;
      this._value_modified = false;
      this._unit_modified = false;
      this._description_modified = false;
    }

    isChanged() {
        return this._name_modified || this._symbol_modified || this._value_modified || this._unit_modified || this._description_modified;
    }
}


class Prob {
    constructor(id, title, rank, type, content, solution, image, author) {
      this._id = id;
      this._title = title;
      this._rank = rank;
      this._type = type;
      this._content = content;
      this._solution = solution;
      this._image = image;
      this._author = author;

      this._title_modified = false;
      this._rank_modified = false;
      this._type_modified = false;
      this._content_modified = false;
      this._solution_modified = false;
      this._image_modified = false;
      this._author_modified = false;
    }
  
    // Getters and setters
    get id() {
      return this._id;
    }
  
    set id(newId) {
      console.log("setting id is forbiden");
    }
  
    get title() {
      return this._title;
    }
  
    set title(newTitle) {
      changesUnsaved();
      this._title_modified = true;
      this._title = newTitle;
    }
  
    get rank() {
      return this._rank;
    }
  
    set rank(newRank) {
      changesUnsaved();
      this._rank_modified = true;
      this._rank = newRank;
    }

    get type() {
      return this._type;
    }
  
    set type(newType) {
      changesUnsaved();
      this._type_modified = true;
      this._type = newType;
    }
  
    get content() {
      return this._content;
    }
  
    set content(newContent) {
      changesUnsaved();
      this._content_modified = true;
      this._content = newContent;
    }
  
    get solution() {
      return this._solution;
    }
  
    set solution(newSolution) {
      changesUnsaved();
      this._solution_modified = true;
      this._solution = newSolution;
    }
  
    get image() {
      return this._image;
    }
  
    set image(newImage) {
      changesUnsaved();
      this._image_modified = true;
      this._image = newImage;
    }

    get author() {
        return this._author;
    }

    set author(newAuthor) {
      changesUnsaved();
      this._author_modified = true;
      this._author = newAuthor;
    }

    pushChanges() {
        // console.log("pushing changes");
      if (!(this._title_modified || this._rank_modified || this._type_modified || this._content_modified || this._solution_modified || this._image_modified || this._author_modified)) return;

      const update_data = {};

      if (this._title_modified) update_data.name = this._title;
      if (this._rank_modified) update_data.diff = this._rank;
      if (this._type_modified) update_data.type = this._type;
      if (this._content_modified) update_data.text = this._content;
      if (this._solution_modified) update_data.solution = this._solution;
      if (this._image_modified) update_data.img = this._image;
      if (this._author_modified) update_data.author = this._author;

      console.log(update_data);

      pb.collection('probs').update(this.id, update_data);

      this._title_modified = false;
      this._rank_modified = false;
      this._type_modified = false;
      this._content_modified = false;
      this._solution_modified = false;
      this._image_modified = false;
      this._author_modified = false;
    }

    isChanged() {
        return this._title_modified || this._rank_modified || this._type_modified || this._content_modified || this._solution_modified || this._image_modified || this._author_modified;
    }
}


//globals

const max_image_width = 700;
const max_image_height = 400;

let focused_prob = "";
let focused_const = "";
let my_id = pb.authStore.model ? pb.authStore.model.id : "";
let editor_types = ["finallook", "table", "generationeditor", "table-plus-generationeditor"];
let editor_type = "finallook";
let author_filter = "all";
let type_filter = "all";
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
        probs.push(new Prob(
            item.id,
            item.name,
            item.diff,
            item.type,
            item.text,
            item.solution,
            item.img,
            item.author
        ));
    }

    for(let item of consts_items){
        table.push(new TableRow(
            item.id,
            item.name,
            item.symbol,
            item.value,
            item.unit,
            item.desc
        ));
    }
}

document.getElementById("save-changes-button").addEventListener("click", async function(){
    for(let prob of probs){
        // console.log(prob);
        prob.pushChanges();
    }
    for(let row of table){
        row.pushChanges();
    }

    document.getElementById("save-changes-button").classList.remove("unsaved");
});

function changesUnsaved(){
    document.getElementById("save-changes-button").classList.add("unsaved");
}

window.onbeforeunload = function() {
    if (document.getElementById("save-changes-button").classList.contains("unsaved")) {
        return "Máte neuložené změny";
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

    const add_image_button = document.getElementById("add-image");
    const remove_image_button = document.getElementById("remove-image");


    finallook_title_DOM.innerHTML = prob.title;
    finallook_text_DOM.innerHTML = parseContentForLatex(prob.content);
    if(prob.image != ""){
        const img = new Image();
        finallook_image_DOM.src = `https://strela-vlna.gchd.cz/api/files/probs/${prob.id}/${prob.image}`;
        img.onload = function(){
            let width = img.width;
            let height = img.height;
            let shrink = 1;
            if(width / max_image_width > shrink){
                shrink = width / max_image_width;
            }
            if(height / max_image_height > shrink){
                shrink = height / max_image_height;
            }
            if(shrink > 1){
                width = width / shrink;
                height = height / shrink;
            }
            finallook_image_DOM.style.width = `${width}px`;
            finallook_image_DOM.style.height = `${height}px`;

        };
        img.src = finallook_image_DOM.src;
    }else{
        finallook_image_DOM.src = "";
        finallook_image_DOM.style.width = `0px`;
        finallook_image_DOM.style.height = `0px`;
    }

    if(prob.image == ""){
        add_image_button.classList.remove("disabled");
        remove_image_button.classList.add("disabled");
    }else{
        add_image_button.classList.add("disabled");
        remove_image_button.classList.remove("disabled");
    }

    MathJax.typeset();
}

function parseContentForLatex(txt){
    let newtxt = "";
    let current_state = 0;
    let i = 0;
    for(;i < txt.length - 1; i++){
        if(txt[i] == "$" && txt[i + 1] == "$"){
            if(current_state == 0){
                current_state = 2;
                newtxt += `<span class="latex-styled">$`;
            }else if(current_state == 1){
                newtxt += "$$";
            }else if(current_state == 2){
                current_state = 0;
                newtxt += `$</span>`;
            }
            i++;
        }else if(txt[i] == "$" && txt[i + 1] != "$"){
            if(current_state == 0){
                current_state = 1;
                newtxt += "$";
            }else if(current_state == 1){
                newtxt += "$";
                current_state = 0;
            }else if(current_state == 2){
                console.log("parsing error");
            }
        }else{
            newtxt += txt[i];
        }
    }
    if(i == txt.length - 1){
        newtxt += txt[txt.length - 1];
    }
    console.log(newtxt);
    return newtxt;
}

document.getElementById('add-image').addEventListener('click', function() {
    if(focused_prob == "") return;
    document.getElementById('image-input').click();
});
document.getElementById("image-input").addEventListener("change", async function(){
    if(this.classList.contains("disabled")) return;
    const form_data = new FormData();
    const file = this.files[0];
    form_data.append("img", file);
    const response = await pb.collection('probs').update(focused_prob, {img: file});
    probs.find(prob => prob.id == focused_prob).image = response.img;
    console.log(file.name);
    updateFinallook();
});

document.getElementById("remove-image").addEventListener("click", async function(){
    if(focused_prob == "") return;
    if(this.classList.contains("disabled")) return;
    const prob = probs.find(prob => prob.id == focused_prob);
    const response = await pb.collection('probs').update(focused_prob, {img: ""});
    probs.find(prob => prob.id == focused_prob).image = "";
    updateFinallook();
});

document.getElementById("regenerate").addEventListener("click", function(){
    if(focused_prob == "") return;
    updateFinallook();
});

function updateTable(){
    const table_DOM = document.getElementById("table-body");

    table_DOM.innerHTML = "";

    for(let item of table){
        table_DOM.innerHTML += `
            <tr id=${item.id} class="${focused_const == item.id ? "selected" : ""}">
                <td>${item.name}</td>
                <td>${item.symbol}</td>
                <td>${item.value}</td>
                <td>${item.unit}</td>
            </tr>
            `
    }
    for(let item of table_DOM.children){
        item.addEventListener("click", function(){
            if(document.querySelector(".editing")) return;
            focused_const = this.id;
            updateTable();
        })
    }

    MathJax.typeset();
}

document.getElementById("table-add").addEventListener("click",  async function(){
    if(document.querySelector(".editing")) return;

    const response = await pb.collection('consts').create({
        name: "Nová konstanta",
        symbol: "",
        value: 0,
        unit: "",
        desc: ""
    });

    table.push(new TableRow(
        response.id,
        "Nová konstanta",
        "",
        0,
        "",
        ""
    ));

    focused_const = response.id;
    updateTable();
    document.getElementById("table-edit").click();
});

document.getElementById("table-edit").addEventListener("click", function(){
    if(focused_const == "") return;

    if(document.querySelector(".editing")){
        document.querySelector(".editing").classList.remove("editing");

        this.innerHTML = "Upravit";
        document.getElementById("table-add").classList.remove("disabled");
        document.getElementById("table-edit").classList.remove("active");
        document.getElementById("table-delete").classList.remove("disabled");

        updateTable();
        return;
    }


    const row = table.find(row => row.id == focused_const);
    const row_DOM = document.getElementById(focused_const);

    row_DOM.classList.add("editing");
    row_DOM.innerHTML = `
        <td><input placeholder="Název" value="${row.name}" id="name"></td>
        <td><input placeholder="Symbol" value="${row.symbol}" id="symbol"></td>
        <td><input placeholder="Hodnota" value="${row.value}" id="value"></td>
        <td><input placeholder="Jednotka" value="${row.unit}" id="unit"></td>
        `;
    
    this.innerHTML = "Hotovo";
    document.getElementById("table-add").classList.add("disabled");
    document.getElementById("table-edit").classList.add("active");
    document.getElementById("table-delete").classList.add("disabled");

    const inputs = row_DOM.querySelectorAll("input");
    for(let input of inputs){
        input.addEventListener("input", function(){
            const id = input.id;
            const row = table.find(row => row.id == focused_const);

            if(id == "name") row.name = input.value;
            if(id == "symbol") row.symbol = input.value;
            if(id == "value") row.value = input.value;
            if(id == "unit") row.unit = input.value;
        })
    }
});

document.getElementById("table-delete").addEventListener("click", async function(){
    if(focused_const == "") return;
    if(document.querySelector(".editing")) return;

    await pb.collection('consts').delete(focused_const);
    table = table.filter(row => row.id != focused_const);
    
    focused_const = "";
    
    updateTable();
});


//left editor
const rank_DOM = document.getElementById("problem-rank-selector-button");
const rank_A_DOM = document.getElementById("problem-rank-dropdown-item-a");
const rank_B_DOM = document.getElementById("problem-rank-dropdown-item-b");
const rank_C_DOM = document.getElementById("problem-rank-dropdown-item-c");
const rank_txt_DOM = document.getElementById("problem-rank-selector-rank");

const type_DOM = document.getElementById("problem-type-selector-button");
const type_math_DOM = document.getElementById("problem-type-dropdown-item-math");
const type_physics_DOM = document.getElementById("problem-type-dropdown-item-physics");
const type_txt_DOM = document.getElementById("problem-type-selector-type");

const title_DOM = document.getElementById("problem-title-input");
const content_DOM = document.getElementById("problem-content-textarea");
const solution_DOM = document.getElementById("problem-solution-input");


rank_DOM.addEventListener("click", function(){
    if(focused_prob == "") return;
    updateRankSelector();

    rank_DOM.parentElement.classList.toggle("oppened");
});

rank_A_DOM.addEventListener("click", function(){
    const prob = probs.find(prob => prob.id == focused_prob);
    prob.rank = "A";
    updateRankSelector();
    updateProbList();
    scrollToFocusedProb();
    rank_DOM.parentElement.classList.toggle("oppened");
});
rank_B_DOM.addEventListener("click", function(){
    const prob = probs.find(prob => prob.id == focused_prob);
    prob.rank = "B";
    updateRankSelector();
    updateProbList();
    scrollToFocusedProb();
    rank_DOM.parentElement.classList.toggle("oppened");
});
rank_C_DOM.addEventListener("click", function(){
    const prob = probs.find(prob => prob.id == focused_prob);
    prob.rank = "C";
    updateRankSelector();
    updateProbList();
    scrollToFocusedProb();
    rank_DOM.parentElement.classList.toggle("oppened");
});

type_DOM.addEventListener("click", function(){
    if(focused_prob == "") return;
    updateTypeSelector();

    type_DOM.parentElement.classList.toggle("oppened");
});

type_math_DOM.addEventListener("click", function(){
    const prob = probs.find(prob => prob.id == focused_prob);
    prob.type = "math";
    if (type_filter != "all"){
        document.getElementById("filter-math").click();
    }
    updateTypeSelector();
    updateProbList();
    scrollToFocusedProb();
    type_DOM.parentElement.classList.toggle("oppened");
});
type_physics_DOM.addEventListener("click", function(){
    const prob = probs.find(prob => prob.id == focused_prob);
    prob.type = "physics";
    if (type_filter != "all"){
        document.getElementById("filter-physics").click();
    }
    updateTypeSelector();
    updateProbList();
    scrollToFocusedProb();
    type_DOM.parentElement.classList.toggle("oppened");
});

title_DOM.addEventListener("blur", function(){
    if(focused_prob == "") return;
    const prob = probs.find(prob => prob.id == focused_prob);
    const prob_DOM = document.getElementById(prob.id);
    prob.title = title_DOM.value;
    if(prob_DOM) prob_DOM.querySelector(".problem-selector-title").innerHTML = prob.title;
});

content_DOM.addEventListener("blur", function(){
    if(focused_prob == "") return;
    const prob = probs.find(prob => prob.id == focused_prob);
    prob.content = content_DOM.value;
});

solution_DOM.addEventListener("blur", function(){
    if(focused_prob == "") return;
    const prob = probs.find(prob => prob.id == focused_prob);
    prob.solution = solution_DOM.value;
});


function updateRankSelector(){
    const prob = probs.find(prob => prob.id == focused_prob);

    rank_A_DOM.classList.remove("selected");
    rank_B_DOM.classList.remove("selected");
    rank_C_DOM.classList.remove("selected");

    if(prob.rank == "A"){
        rank_A_DOM.classList.add("selected");
    }else if(prob.rank == "B"){
        rank_B_DOM.classList.add("selected");
    }else{
        rank_C_DOM.classList.add("selected");
    }

    rank_txt_DOM.innerHTML = `[${prob.rank}]`;
}


function updateTypeSelector(){
    const prob = probs.find(prob => prob.id == focused_prob);

    type_math_DOM.classList.remove("selected");
    type_physics_DOM.classList.remove("selected");

    if(prob.type == "math"){
        type_math_DOM.classList.add("selected");
    }else{
        type_physics_DOM.classList.add("selected");
    }

    type_txt_DOM.innerHTML = `${prob.type == "math" ? "Mat." : "Fyz."}`;
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
        type_txt_DOM.innerHTML = `${prob.type == "math" ? "Mat." : "Fyz."}`;
    }

    
}


//prob selector

function updateProbList(){
    const prob_list_a = document.getElementById("problem-section-a");
    const prob_list_b = document.getElementById("problem-section-b");
    const prob_list_c = document.getElementById("problem-section-c");

    const probs_a = probs.filter(prob => prob.rank == "A" && (author_filter == "all" || prob.author == my_id) && (prob.type == type_filter || type_filter == "all"));
    const probs_b = probs.filter(prob => prob.rank == "B" && (author_filter == "all" || prob.author == my_id) && (prob.type == type_filter || type_filter == "all"));
    const probs_c = probs.filter(prob => prob.rank == "C" && (author_filter == "all" || prob.author == my_id) && (prob.type == type_filter || type_filter == "all"));

    if(author_filter != "all"){
        for(let item of probs){
            console.log(item.author);
        }
    }

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

    if(!document.getElementById(focused_prob)){
        focused_prob = "";
    }

    for(let item of document.getElementsByClassName("problem")){
        item.addEventListener("click", function(){
            if(focused_prob == this.id) return;
            if(focused_prob != "" && document.getElementById(focused_prob)){
                document.getElementById(focused_prob).classList.remove("selected");
            }
            focused_prob = this.id;
            this.classList.add("selected");
            document.getElementById("problems-delete").classList.remove("disabled");
            updateRankSelector();
            // updateRightEditor();
            updateFinallook();
            updateLeftEditor();

        });
    }

    if(focused_prob == ""){
        document.getElementById("problems-delete").classList.add("disabled");
    }
}

async function deleteFocusedProb(){
    if(focused_prob == "") return;
    probs = probs.filter(prob => prob.id != focused_prob);
    await pb.collection('probs').delete(focused_prob);
    focused_prob = "";
    updateProbList();
}

async function addProb(){
    const response = await pb.collection('probs').create({
        name: "Nová úloha",
        diff: "A",
        type: type_filter == "all" ? "math" : type_filter,
        text: "",
        solution: "",
        img: "",
        workers: "",
        author: my_id
    });
    probs.push(new Prob(
        response.id,
        "Nová úloha",
        "A",
        response.type,
        "",
        "",
        "",
        my_id
    ));
    focused_prob = response.id;
    
    updateProbList();
    scrollToFocusedProb();
    updateLeftEditor();
    updateFinallook();
}

const type_filter_buttons = [
    document.getElementById("filter-math"),
    document.getElementById("filter-physics"),
    document.getElementById("filter-all"),
]

type_filter_buttons[0].addEventListener("click", function(){
    if(type_filter == "math") return;

    type_filter = "math";
    updateProbList();
    scrollToFocusedProb();

    type_filter_buttons[0].classList.add("selected");
    type_filter_buttons[1].classList.remove("selected");
    type_filter_buttons[2].classList.remove("selected");
});
type_filter_buttons[1].addEventListener("click", function(){
    if(type_filter == "physics") return;

    type_filter = "physics";
    updateProbList();
    scrollToFocusedProb();

    type_filter_buttons[0].classList.remove("selected");
    type_filter_buttons[1].classList.add("selected");
    type_filter_buttons[2].classList.remove("selected");
});
type_filter_buttons[2].addEventListener("click", function(){
    if(type_filter == "all") return;

    type_filter = "all";
    updateProbList();
    scrollToFocusedProb();

    type_filter_buttons[0].classList.remove("selected");
    type_filter_buttons[1].classList.remove("selected");
    type_filter_buttons[2].classList.add("selected");
});

document.getElementById("problems-add").addEventListener("click", addProb);
document.getElementById("problems-delete").addEventListener("click", deleteFocusedProb);

const prob_selector_all = document.getElementById("problem-selector-all");
const prob_selector_my = document.getElementById("problem-selector-my");

prob_selector_all.addEventListener("click", function(){
    author_filter = "all";
    prob_selector_all.classList.add("selected");
    prob_selector_my.classList.remove("selected");
    updateProbList();
    scrollToFocusedProb();
})
prob_selector_my.addEventListener("click", function(){
    author_filter = "my";
    prob_selector_my.classList.add("selected");
    prob_selector_all.classList.remove("selected");
    
    if(focused_prob != "" && !probs.some(prob => prob.id == focused_prob && prob.author == my_id)){
        focused_prob = "";
    }
    
    updateProbList();
    scrollToFocusedProb();
})



function scrollToFocusedProb(){
    if(focused_prob == "") return;
    document.getElementById(focused_prob).scrollIntoView({block: "center", behavior: "smooth"});
}



await load();
updateProbList();
updateTable();


