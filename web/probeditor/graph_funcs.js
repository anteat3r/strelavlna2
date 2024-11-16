export default {
    "addition": (i, _, __) => i[0] + i[1],
    "subtraction": (i, _, __) => i[0] - i[1],
    "multiplication": (i, _, __) => i[0] * i[1],
    "division": (i, _, __) => i[0] / i[1],

    "tostring": (i, _, __) => i.toString(),
    "fromstring": (i, _, __) => parseFloat(i),

    "randomInteger": (i, _, __) => Math.floor(Math.random()*(i[0]-i[1])+i[1]),
    "randomFloat": (i, _, __) => Math.random()*(i[0]-i[1])+i[1],

    "constant": (i, _, t) => parseFloat(t.find(t => t.id == i[0]).value),

    "string": (_, v, __) => v,
    "setstring": (i, _, __) => i[0],
    "number": (_, v, __) => v,
    "setnumber": (i, _, __) => i[0],

    "round": (i, _, __) => Math.round(i[0]),
    "roundplaces": (i, _, __) => parseFloat(i[0].toFixed(i[1])),

    "numbercomparison": (i, _, __) => i[0] == i[1],
    "numberif": (i, _, __) => i[0] ? i[1] : i[2],
    "stringif": (i, _, __) => i[0] ? i[1] : i[2],

    "power": (i, _, __) => Math.pow(i[0], i[1]),
    "square": (i, _, __) => i[0] * i[1],
    "sqrt": (i, _, __) => Math.sqrt(i[0]),
}
