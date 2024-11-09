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

      this.name_modified = false;
      this.symbol_modified = false;
      this.value_modified = false;
      this.unit_modified = false;
      this.description_modified = false;
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
      this.name_modified = true;
      this._name = newName;
    }
  
    get symbol() {
      return this._symbol;
    }
  
    set symbol(newSymbol) {
      changesUnsaved();
      this.symbol_modified = true;
      this._symbol = newSymbol;
    }
  
    get value() {
      return this._value;
    }
  
    set value(newValue) {
      changesUnsaved();
      this.value_modified = true;
      this._value = newValue;
    }
  
    get unit() {
      return this._unit;
    }
  
    set unit(newUnit) {
      changesUnsaved();
      this.unit_modified = true;
      this._unit = newUnit;
    }
  
    get description() {
      return this._description;
    }
  
    set description(newDescription) {
      changesUnsaved();
      this.description_modified = true;
      this._description = newDescription;
    }

    pushChanges() {
      if (!(this.name_modified || this.symbol_modified || this.value_modified || this.unit_modified || this.description_modified)) return;

      const update_data = {};

      if (this.name_modified) update_data.name = this._name;
      if (this.symbol_modified) update_data.symbol = this._symbol;
      if (this.value_modified) update_data.value = this._value;
      if (this.unit_modified) update_data.unit = this._unit;
      if (this.description_modified) update_data.desc = this._description;

      pb.collection('consts').update(this.id, update_data);

      this.name_modified = false;
      this.symbol_modified = false;
      this.value_modified = false;
      this.unit_modified = false;
      this.description_modified = false;
    }

    isChanged() {
        return this.name_modified || this.symbol_modified || this.value_modified || this.unit_modified || this.description_modified;
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

      this.title_modified = false;
      this.rank_modified = false;
      this.type_modified = false;
      this.content_modified = false;
      this.solution_modified = false;
      this.image_modified = false;
      this.author_modified = false;
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
      this.title_modified = true;
      this._title = newTitle;
    }
  
    get rank() {
      return this._rank;
    }
  
    set rank(newRank) {
      changesUnsaved();
      this.rank_modified = true;
      this._rank = newRank;
    }

    get type() {
      return this._type;
    }
  
    set type(newType) {
      changesUnsaved();
      this.type_modified = true;
      this._type = newType;
    }
  
    get content() {
      return this._content;
    }
  
    set content(newContent) {
      changesUnsaved();
      this.content_modified = true;
      this._content = newContent;
    }
  
    get solution() {
      return this._solution;
    }
  
    set solution(newSolution) {
      changesUnsaved();
      this.solution_modified = true;
      this._solution = newSolution;
    }
  
    get image() {
      return this._image;
    }
  
    set image(newImage) {
      changesUnsaved();
      this.image_modified = true;
      this._image = newImage;
    }

    get author() {
        return this._author;
    }

    set author(newAuthor) {
      changesUnsaved();
      this.author_modified = true;
      this._author = newAuthor;
    }

    pushChanges() {
      if (!(this.title_modified || this.rank_modified || this.type_modified || this.content_modified || this.solution_modified || this.image_modified || this.author_modified)) return;

      const update_data = {};

      if (this.title_modified) update_data.name = this._title;
      if (this.rank_modified) update_data.diff = this._rank;
      if (this.type_modified) update_data.type = this._type;
      if (this.content_modified) update_data.text = this._content;
      if (this.solution_modified) update_data.solution = this._solution;
      if (this.image_modified) update_data.img = this._image;
      if (this.author_modified) update_data.author = this._author;

      pb.collection('probs').update(this.id, update_data);

      this.title_modified = false;
      this.rank_modified = false;
      this.type_modified = false;
      this.content_modified = false;
      this.solution_modified = false;
      this.image_modified = false;
      this.author_modified = false;
    }

    isChanged() {
        return this.title_modified || this.rank_modified || this.type_modified || this.content_modified || this.solution_modified || this.image_modified || this.author_modified;
    }
}

class Obstacle {
    constructor(faces) {
        this.faces = faces;
    }

    passesThrough(p1, p2){
        if(p1.x != p2.x && p1.y != p2.y) return false;

        if(p1.x == p2.x){
            return p1.x > this.faces[3] && p1.x < this.faces[1] && ((p1.y - this.faces[0]) * (p2.y - this.faces[0]) < 0 || (p1.y - this.faces[2]) * (p2.y - this.faces[2]) < 0);
        }else{
            return p1.y < this.faces[0] && p1.y > this.faces[2] && ((p1.x - this.faces[3]) * (p2.x - this.faces[3]) < 0 || (p1.x - this.faces[1]) * (p2.x - this.faces[1]) < 0);
        }
    }

    get vertices(){
        return [
            {x: this.faces[3], y: this.faces[0]},
            {x: this.faces[1], y: this.faces[0]},
            {x: this.faces[1], y: this.faces[2]},
            {x: this.faces[3], y: this.faces[2]}
        ];
    }
}


class PFnode { //path finding node
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.connection = -1;
    }

    trace(node_list){
        if (this.connection == -1 || this.id == -2) {
            return [this];
        }

        let list = node_list.find(node => node.id == this.connection).trace(node_list)
        list.push(this);
        return list;
    }

    connect(node_list, obstacles, target){
        let new_connections = [];

        let nodesInCenter = [];
        let nodesOutCenter = [];

        //sort nodes into quadrants
        for(let i = 0; i < node_list.length; i++){
            if((node_list[i].x - this.x) * (node_list[i].x - target.x) <= 0 && (node_list[i].y - this.y) * (node_list[i].y - target.y) <= 0){
                nodesInCenter.push(node_list[i]);
            }else{
                nodesOutCenter.push(node_list[i]);
            }
        }

        let nodesToCheck = [];
        nodesToCheck.push(...nodesInCenter);
        nodesToCheck.push(...nodesOutCenter);

        for(let i = 0; i < nodesToCheck.length; i++){
            if(nodesToCheck[i].connection != -1) continue;
            if(nodesToCheck[i].id == this.id) continue;

            //first x, then y
            let midX = nodesToCheck[i].x;
            let midY = this.y;

            let possible = true;
            if(nodesToCheck[i].connection == -1){
                for(let j = 0; j < obstacles.length; j++){
                    if(obstacles[j].passesThrough({x: midX, y: midY}, {x: this.x, y: this.y}) || obstacles[j].passesThrough({x: midX, y: midY}, {x: nodesToCheck[i].x, y: nodesToCheck[i].y})){
                        possible = false;
                    }
                }
                if(possible){
                    nodesToCheck[i].connection = this.id;
                    new_connections.push(nodesToCheck[i]);
                }
            }


            //first y, then x
            midX = this.x;
            midY = nodesToCheck[i].y;

            possible = true;
            if(nodesToCheck[i].connection == -1){
                for(let j = 0; j < obstacles.length; j++){
                    if(obstacles[j].passesThrough({x: midX, y: midY}, {x: this.x, y: this.y}) || obstacles[j].passesThrough({x: midX, y: midY}, {x: nodesToCheck[i].x, y: nodesToCheck[i].y})){
                        possible = false;
                    }
                }
                if(possible){
                    nodesToCheck[i].connection = this.id;
                    new_connections.push(nodesToCheck[i]);
                }
            }
        }
        return new_connections;
    }
}


//globals

const max_image_width = 700;
const max_image_height = 400;

const graph_canvas = document.getElementById("generationeditor-canvas");
const graph_ctx = graph_canvas.getContext('2d');

let editor_render_ruleset = null;

let mouse_position = {x: 0, y: 0};

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
let filtered_probs = [];
let show_filtered = false;


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

document.addEventListener("mousemove", function(e) {
    mouse_position = {x: e.clientX, y: e.clientY};
});

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

    // graph_canvas.width = graph_canvas.clientWidth;
    // graph_canvas.height = graph_canvas.clientHeight - 10;
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
    let curent_state = 0;
    let i = 0;
    for(;i < txt.length - 1; i++){
        if(txt[i] == "$" && txt[i + 1] == "$"){
            if(curent_state == 0){
                curent_state = 2;
                newtxt += `<span class="latex-styled">$`;
            }else if(curent_state == 1){
                newtxt += "$$";
            }else if(curent_state == 2){
                curent_state = 0;
                newtxt += `$</span>`;
            }
            i++;
        }else if(txt[i] == "$" && txt[i + 1] != "$"){
            if(curent_state == 0){
                curent_state = 1;
                newtxt += "$";
            }else if(curent_state == 1){
                newtxt += "$";
                curent_state = 0;
            }else if(curent_state == 2){
                console.error("parsing error");
            }
        }else{
            newtxt += txt[i];
        }
    }
    if(i == txt.length - 1){
        newtxt += txt[txt.length - 1];
    }
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

    let probs_a;
    let probs_b;
    let probs_c;

    if(show_filtered){
        probs_a = filtered_probs.filter(prob => prob.rank == "A" && (author_filter == "all" || prob.author == my_id) && (prob.type == type_filter || type_filter == "all"));
        probs_b = filtered_probs.filter(prob => prob.rank == "B" && (author_filter == "all" || prob.author == my_id) && (prob.type == type_filter || type_filter == "all"));
        probs_c = filtered_probs.filter(prob => prob.rank == "C" && (author_filter == "all" || prob.author == my_id) && (prob.type == type_filter || type_filter == "all"));
    }else{
        probs_a = probs.filter(prob => prob.rank == "A" && (author_filter == "all" || prob.author == my_id) && (prob.type == type_filter || type_filter == "all"));
        probs_b = probs.filter(prob => prob.rank == "B" && (author_filter == "all" || prob.author == my_id) && (prob.type == type_filter || type_filter == "all"));
        probs_c = probs.filter(prob => prob.rank == "C" && (author_filter == "all" || prob.author == my_id) && (prob.type == type_filter || type_filter == "all"));
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

function filterSearch(){
    const search = document.getElementById("problem-filter-input").value.toLowerCase();
    return probs.filter(prob => 
        (prob.title.toLowerCase().includes(search) || 
        prob.id.toLowerCase().includes(search) || 
        prob.solution.toLowerCase().includes(search) || 
        prob.content.toLowerCase().includes(search))
    );
}
document.getElementById("problem-filter-input").addEventListener("blur", function(){
    const search = document.getElementById("problem-filter-input").value;
    if(search.length >= 3){
        filtered_probs = filterSearch();
        show_filtered = true;
    }else{
        show_filtered = false;
    }
    updateProbList();
    scrollToFocusedProb();
})
document.getElementById("problem-filter-input").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        this.blur();
    }
});

function scrollToFocusedProb(){
    if(focused_prob == "") return;
    document.getElementById(focused_prob).scrollIntoView({block: "center", behavior: "smooth"});
}


//grpah editor

function initializeCanvasWhenVisible() {
    const interval = setInterval(() => {
        if (graph_canvas.clientWidth > 0 && graph_canvas.clientHeight > 0) {
            graph_canvas.height = graph_canvas.clientHeight - 68;
            graph_canvas.width = graph_canvas.clientWidth;

            // Start the animation loop
            graphEditorLoop();

            // Stop checking once it's set
            clearInterval(interval);
        }
    }, 100); // Check every 100ms
}

initializeCanvasWhenVisible()

let graph = {
    nodes: [
        {
            id: 0,
            type: "addition",
            x: 200,
            y: 100,
            inputs: [1, 2],
            defautltInputs: [1, 1]
        },
        {
            id: 1,
            type: "addition",
            x: 150,
            y: 150,
            inputs: [2, 3],
            defautltInputs: [3, 3]
        },
        {
            id: 2,
            type: "addition",
            x: 200,
            y: 260,
            inputs: [3, -1],
            defautltInputs: [6, 6]
        },
        {
            id: 3,
            type: "addition",
            x: 200,
            y: 200,
            inputs: [0, 1],
            defautltInputs: [1, 9]
        }
    ]
}

function graphEditorLoop(){
    requestAnimationFrame(graphEditorLoop);

    graph_ctx.clearRect(0, 0, graph_canvas.width, graph_canvas.height);

    renderGraph(graph);

    // graph_ctx.strokeStyle = "#0f455a";
    // graph_ctx.beginPath();
    // graph_ctx.lineWidth = 10;
    // graph_ctx.moveTo(0, 100);
    // graph_ctx.lineTo(100, 100);
    // graph_ctx.stroke();
}

function renderGraph(graph){
    const rules = editor_render_ruleset;
    graph_ctx.moveTo(100, 100);           // Start point
    // graph_ctx.lineTo(150, 50);          // Draw horizontal line
    graph_ctx.arcTo(100, 100, 150, 150, 80); // Rounded corner from horizontal to vertical
    // graph_ctx.lineTo(200, 150);         // Continue downwards
    graph_ctx.stroke();
    for(let node of graph.nodes){
        graph_ctx.fillStyle = "#0f455a";
        const node_rules = editor_render_ruleset.nodes[node.type];

        graph_ctx.beginPath();
        graph_ctx.roundRect(node.x, node.y, node_rules.width, node_rules.height, 5);
        graph_ctx.fill();

        graph_ctx.font = `${rules.nodeFontSize}px Lexend`;
        graph_ctx.fillStyle = "#ffffff";
        graph_ctx.textAlign = "center";
        graph_ctx.textBaseline = "middle";
        graph_ctx.fillText(node_rules.text, node.x + node_rules.width/2, node.y + node_rules.height/2);

        for(let i = 0; i < node.inputs.length; i++){
            graph_ctx.strokeStyle = "#c0d5dd";
            graph_ctx.strokeWidth = rules.connectionWidth;

            const x = node.x;
            const y = node.y + rules.inputSeparation * (i + 1);
            
            if(node.inputs[i] == -1) {
                const extendX = rules.defaultInputExtendX * Math.min(i, node.inputs.length - i - 1);
                const extendY = rules.defaultInputExtendY * (i - (node.inputs.length - 1)/2);
                const maxExtendX = rules.defaultInputExtendX * Math.ceil(node.inputs.length/2);


                drawRoundedPath(graph_ctx, [
                    {x: x, y: y},
                    {x: x - extendX - rules.defaultInputOffset/2, y: y},
                    {x: x - extendX - rules.defaultInputOffset/2, y: y + extendY},
                    {x: x - maxExtendX - rules.defaultInputOffset, y: y + extendY},
                ], 5);
                
                
                
                
                
                // graph_ctx.beginPath();
                // graph_ctx.moveTo(node.x, y);
                // graph_ctx.lineTo(x, y);
                // graph_ctx.stroke();

                graph_ctx.beginPath();
                graph_ctx.roundRect(x - rules.defaultInputSize - maxExtendX - rules.defaultInputOffset, y - rules.defaultInputSize/2 + extendY, rules.defaultInputSize, rules.defaultInputSize, 5);
                graph_ctx.stroke();

                graph_ctx.font = `${rules.defaultInputFontSize}px Lexend`;
                graph_ctx.fillStyle = "#c0d5dd";
                graph_ctx.fillText(node.defautltInputs[i], x - rules.defaultInputSize/2 - maxExtendX - rules.defaultInputOffset, y + extendY);

            }else{
                let target_node = graph.nodes.find(nd => nd.id == node.inputs[i]);
                const target_rules = editor_render_ruleset.nodes[target_node.type];
                const target = {x: target_node.x + target_rules.width, y: target_node.y + target_rules.height/2};
                const points = [{x: x, y: y}, ...findPath(graph, {x: x - 10, y: y}, {x:target.x + 10 , y:target.y}, 5), target];
                // graph_ctx.fillStyle = "#000";
                // for(const point of points) {
                //     graph_ctx.beginPath();
                //     graph_ctx.arc(point.x, point.y, 2, 0, 2*Math.PI);
                //     graph_ctx.fill();
                // }

                // console.log(points);
                drawRoundedPath(graph_ctx, points, 5);
            }
        }
    }

    drawRoundedPath(graph_ctx, findPath(graph, {x: 50, y: 80}, {x:mouse_position.x - 300, y:mouse_position.y - 300}, 5), 5);

}

function drawRoundedPath(ctx, points, radius) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    let mids = [];

    for (let i = 0; i < points.length - 1; i++) {
        mids.push({x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2});
    }

    mids[0] = points[0];
    mids[mids.length - 1] = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
        const begin = mids[i - 1];
        const corner = points[i];
        const end = mids[i];

        // Determine the direction of the line (horizontal or vertical)
        const isHorizontal = begin.y === corner.y;
        
        if (isHorizontal) {
            const begCut = Math.abs(begin.x - corner.x) < radius;
            const endCut = Math.abs(end.y - corner.y) < radius;

            if (begCut && endCut) {
                console.error("Error: controll points too close to each other");
                return;
            }

            if (begCut) {
                let dX = Math.abs(begin.x - corner.x);
                let dY = (Math.tan(Math.PI / 2 - Math.acos(1 - dX / radius))) * dX;

                ctx.arcTo(corner.x, corner.y + dY * (end.y > corner.y ? 1 : -1), corner.x, corner.y + radius * (end.y > corner.y ? 1 : -1), radius);
                ctx.lineTo(end.x, end.y);

            } else if (endCut) {
                let dY = Math.abs(end.y - corner.y);
                let dX = (Math.tan(Math.PI / 2 - Math.acos(1 - dY / radius))) * dY;

                ctx.lineTo(corner.x + radius * (begin.x > corner.x ? 1 : -1), corner.y);
                ctx.arcTo(corner.x + dX * (begin.x > corner.x ? 1 : -1), corner.y, end.x, end.y, radius);
            } else {
                ctx.lineTo(corner.x + radius * (begin.x > corner.x ? 1 : -1), corner.y);
                ctx.arcTo(corner.x, corner.y, corner.x, corner.y + radius * (end.y > corner.y ? 1 : -1), radius);
                ctx.lineTo(end.x, end.y);
            }

        } else {
            const begCut = Math.abs(begin.y - corner.y) < radius;
            const endCut = Math.abs(end.x - corner.x) < radius;

            if (begCut && endCut) {
                console.error("Error: controll points too close to each other");
                return;
            }

            if (begCut) {
                let dY = Math.abs(begin.y - corner.y);
                let dX = (Math.tan(Math.PI / 2 - Math.acos(1 - dY / radius))) * dY;

                ctx.arcTo(corner.x + dX * (end.x > corner.x ? 1 : -1), corner.y, corner.x + radius * (end.x > corner.x ? 1 : -1), corner.y, radius);
                ctx.lineTo(end.x, end.y);

            } else if (endCut) {
                let dX = Math.abs(end.x - corner.x);
                let dY = (Math.tan(Math.PI / 2 - Math.acos(1 - dX / radius))) * dX;

                ctx.lineTo(corner.x, corner.y + radius * (begin.y > corner.y ? 1 : -1));
                ctx.arcTo(corner.x, corner.y + dY * (begin.y > corner.y ? 1 : -1), end.x, end.y, radius);
            } else {
                ctx.lineTo(corner.x, corner.y + radius * (begin.y > corner.y ? 1 : -1));
                ctx.arcTo(corner.x, corner.y, corner.x + radius * (end.x > corner.x ? 1 : -1), corner.y, radius);
                ctx.lineTo(end.x, end.y);
            }
        }
    }

    ctx.stroke();

}

function findPath(graph, start, end, radius){

    const nodes = graph.nodes;
    let obstacles = [];
    let PFnodes = [];

    PFnodes.push(new PFnode(start.x, start.y, -2));
    PFnodes.push(new PFnode(end.x, end.y, 1));

    for(let i = 0; i < nodes.length; i++){
        let node = nodes[i];
        const node_rules = editor_render_ruleset.nodes[node.type];
        obstacles.push(new Obstacle([
            node.y + node_rules.height + radius,
            node.x + node_rules.width + radius,
            node.y - radius,
            node.x - radius
        ]));

        PFnodes.push(new PFnode(node.x - radius, node.y + node_rules.height + radius, i*4 + 2));
        PFnodes.push(new PFnode(node.x + node_rules.width + radius, node.y + node_rules.height + radius, i*4 + 3));
        PFnodes.push(new PFnode(node.x + node_rules.width + radius, node.y - radius, i*4 + 4));
        PFnodes.push(new PFnode(node.x - radius, node.y - radius, i*4 + 5));
    }

    
    let queue = [PFnodes[0]];

    while(queue.length > 0){
        const curent = queue.shift();

        queue.push(...curent.connect(PFnodes, obstacles, end));
    }


    const path = PFnodes[1].trace(PFnodes);
    let path_points = [];

    for(let i = 0; i < path.length - 1; i++){
        path_points.push({x: path[i].x, y: path[i].y});

        // first x, then y
        let x = path[i + 1].x;
        let y = path[i].y;

        let possible = true;
        for(let j = 0; j < obstacles.length; j++){
            const obs = obstacles[j];
            if(obs.passesThrough({x: x, y: y}, {x: path[i].x, y: path[i].y}) || obs.passesThrough({x: x, y: y}, {x: path[i + 1].x, y: path[i + 1].y})){
                possible = false;
            }
        }

        if(possible){
            path_points.push({x: x, y: y});
        }else{

            // first y, then x
            x = path[i].x;
            y = path[i + 1].y;
            path_points.push({x: x, y: y});
        }
    }

    path_points.push({x: path[path.length - 1].x, y: path[path.length - 1].y});

    //chek for 3 points in a row
    //and delete the middle one
    for(let i = 0; i < path_points.length - 2; i++){
        if((path_points[i].x == path_points[i + 1].x && path_points[i + 1].x == path_points[i + 2].x) || (path_points[i].y == path_points[i + 1].y && path_points[i + 1].y == path_points[i + 2].y)){
            path_points.splice(i + 1, 1);
        }
    }

    return path_points;
}


await load();
fetch('editor_render_ruleset.json')
  .then(response => response.json())
  .then(data => {
    editor_render_ruleset = data;
})
  .catch(error => console.error('Error fetching JSON:', error));
updateProbList();
updateTable();
// graphEditorLoop();


