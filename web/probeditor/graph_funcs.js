class Fraction {
  constructor(x, y) {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.simplify()
  }
  simplify() {
    let a = this.x;
    let b = this.y;
    while (b) { [a, b] = [b, a % b]; }
    this.x /= a
    this.y /= a
  }
  num() { return this.x }
  den() { return this.y }
  add(f) {
    this.x = this.x*f.y + f.x*this.y;
    this.y *= f.y;
    this.simplify();
    return new Fraction(this.x, this.y);
  }
  sub(f) {
    this.x = this.x*f.y - f.x*this.y;
    this.y *= f.y;
    this.simplify();
    return new Fraction(this.x, this.y);
  }
  mul(f) {
    this.x *= f.x;
    this.y *= f.y;
    this.simplify();
    return new Fraction(this.x, this.y);
  }
  div(f) {
    this.x *= f.y;
    this.y *= f.x;
    this.simplify();
    return new Fraction(this.x, this.y);
  }

  clone() {
    return new Fraction(this.x, this.y);
  }

  toString() {
    if (this.y == 1) { return this.x; }
    return this.x + "/" + this.y
  }
}

export default {
    "addition": (i, _, __) => i[0] + i[1],
    "addition3": (i, _, __) => i[0] + i[1] + i[2],
    "substraction": (i, _, __) => i[0] - i[1],
    "multiplication": (i, _, __) => i[0] * i[1],
    "multiplication3": (i, _, __) => i[0] * i[1] * i[2],
    "division": (i, _, __) => i[0] / i[1],

    "tostring": (i, _, __) => i[0].toString(),
    "ftostring": (i, _, __) => {
      if (i[0].den() == 1) { return i[0].num().toString(); }
      return i[0].num().toString() + "/" + i[0].den().toString()
    },
    "fromstring": (i, _, __) => parseFloat(i[0]),

    "randomInteger": (i, _, __) => Math.floor(Math.random()*(i[0]-i[1])+i[1]),
    "randomFloat": (i, _, __) => Math.random()*(i[0]-i[1])+i[1],

    "constant": (i, _, t) => parseFloat(t.find(t => t.id == i[0]).value),

    "string": (_, v, __) => v,
    "setstring": (i, _, __) => i[0],
    "number": (_, v, __) => v,
    "setnumber": (i, _, __) => i[0],
    "setfraction": (i, _, __) => i[0],

    "round": (i, _, __) => Math.round(i[0]),
    "roundplaces": (i, _, __) => parseFloat(i[0].toFixed(i[1])),

    "numbercomparison": (i, _, __) => i[0] == i[1],
    "numberif": (i, _, __) => i[0] ? i[1] : i[2],
    "stringif": (i, _, __) => i[0] ? i[1] : i[2],

    "power": (i, _, __) => Math.pow(i[0], i[1]),
    "square": (i, _, __) => i[0] * i[0],
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
    "numerator": (i, _, __) => i[0].num(),
    "denominator": (i, _, __) => i[0].den(),
    "fractionaddition": (i, _, __) => i[0].add(i[1]),
    "fractionsubstraction": (i, _, __) => i[0].sub(i[1]),
    "fractionmultiplication": (i, _, __) => i[0].mul(i[1]),
    "fractiondivision": (i, _, __) => i[0].div(i[1]),
    "overone": (i, _, __) => new Fraction(i[0], 1),
    "underone": (i, _, __) => new Fraction(1, i[0]),
    "redo": (i, _, __) => i[0],
    "lcm": (i, _, __) => {
      let a = Math.abs(Math.round(i[0]));
      let b = Math.abs(Math.round(i[1]));
      if (b > a) [a, b] = [b, a];
      let res = 0;
      while (true) {
        if (b == 0) { res = a; break };
        a %= b;
        if (a == 0) { res = b; break };
        b %= a;
      }
      return a * b / res
    },
    "absolute": (i, _, __) => Math.abs(i[0]),
    "factorial": (i, _, __) => {
        if (i[0] < 0) return NaN;
        let result = 1;
        for (let j = 2; j <= i[0]; j++) {
            result *= j;
        }
        return result;
    },
    "isNaN": (i, _, __) => isNaN(i[0]),
    "isFinite": (i, _, __) => isFinite(i[0]),
    "not": (i, _, __) => !i[0],
    "and": (i, _, __) => i[0] && i[1],
    "or": (i, _, __) => i[0] || i[1],
    "sin": (i, _, __) => Math.sin(i[0]),
    "cos": (i, _, __) => Math.cos(i[0]),
    "tan": (i, _, __) => Math.tan(i[0]),
    "asin": (i, _, __) => Math.asin(i[0]),
    "acos": (i, _, __) => Math.acos(i[0]),
    "atan": (i, _, __) => Math.atan(i[0]),
    "fractiontonumber": (i, _, __) => i[0].num() / i[0].den(),
    "lessthan": (i, _, __) => i[0] < i[1],
    "greaterthan": (i, _, __) => i[0] > i[1],
    "lessthanequal": (i, _, __) => i[0] <= i[1],
    "greaterthanequal": (i, _, __) => i[0] >= i[1],
    "nocachenumber": (i, _, __) => i[0],
    "nocachestring": (i, _, __) => i[0],
    "nocachebool": (i, _, __) => i[0],
    "nocachefraction": (i, _, __) => i[0],
    "modulo": (i, _, __) => i[0] % i[1]
}
