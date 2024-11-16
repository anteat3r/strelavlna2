function addition(i, v, t){
    return i[0] + i[1];
}
function subtraction(i, v, t){
    return i[0] - i[1];
}
function multiplication(i, v, t){
    return i[0] * i[1];
}
function division(i, v, t){
    return i[0] / i[1];
}
function tostring(i, v, t){
    return i.toString();
}
function fromstring(i, v, t){
    return parseFloat(i);
}
function randomInteger(i, v, t){
    return Math.floor(Math.random() * i[0]) + i[1];
}
function randomFloat(i, v, t){
    return Math.random() * i[0] + i[1];
}
function number(i, v, t){
    return v;
}
function string(i, v, t){
    return v;
}
function constant(i, v, t){
    return parseFloat(t.find(t => t.id == i[0]).value);
}

function setnumber(i, v, t){
    return i[0];
}
function setstring(i, v, t){
    return i[0];
}
function round(i, v, t){
    return Math.round(i[0]);
}
function roundplaces(i, v, t){
    return parseFloat(i[0].toFixed(i[1]));
}

export default {
    "addition": addition,
    "subtraction": subtraction,
    "multiplication": multiplication,
    "division": division,

    "tostring": tostring,
    "fromstring": fromstring,

    "randomInteger": randomInteger,
    "randomFloat": randomFloat,

    "constant": constant,

    "string": string,
    "setstring": setstring,
    "number": number,
    "setnumber": setnumber,

    "round": round,
    "roundplaces": roundplaces,
    "numbercomparison": (i, _, _) => i[0] == i[1],
}
