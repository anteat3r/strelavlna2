class Fraction {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.simplify()
  }
  simplify() {
    let a = this.x;
    let b = this.y;
    while (b) {
      [a, b] = [b, a % b]
    }
    this.x /= a
    this.y /= a
  }
  num() { return this.x }
  den() { return this.y }
}

export default {
    "addition": (i, _, __) => i[0] + i[1],
    "addition3": (i, _, __) => i[0] + i[1] + i[2],
    "subtraction": (i, _, __) => i[0] - i[1],
    "multiplication": (i, _, __) => i[0] * i[1],
    "multiplication3": (i, _, __) => i[0] * i[1] * i[2],
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
    "gcd": (i, _, __) => {
      let a = Math.abs(Math.round(i[0]));
      let b = Math.abs(Math.round(i[1]));
      if (b > a) [a, b] = [b, a];
      while (true) {
        if (b == 0) return a;
        a %= b;
        if (a == 0) return b;
        b %= a;
      }
    },

    "fraction": (i, _, __) => new Fraction(i[0], i[1]),
    "numerator": (i, _, __) => {
      console.log(typeof i);
    },
    "denominator": (i, _, __) => i.den(),
}
