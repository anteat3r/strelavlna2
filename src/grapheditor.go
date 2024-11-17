package src

import (
	"encoding/json"
	"math"
	"math/rand/v2"
	"strconv"
	"strings"
)

type GraphNode interface {
  Compute(Graph, PathSet) (any, error)
}

type Graph map[GraphId]GraphNode
type PathSet map[GraphId]any
type GraphId = string

type InvalidGraphErr struct { msg string }
func (e InvalidGraphErr) Error() string { return e.msg }

func ParseGraph(graphs string) (Graph, error) {
  graphinp := struct{
    Nodes struct{
      Basic map[string]struct{
        Inputs []string `json:"inputs"`
        Type string `json:"type"`
      } `json:"basic"`
      Get struct{
        Selected bool `json:"selected"`
        Type string `json:"type"`
        Value string `json:"value"`
      } `json:"get"`
      Set struct{
        Selected bool `json:"selected"`
        Type string `json:"type"`
        Value string `json:"value"`
        Input string `json:"input"`
      } `json:"set"`
    } `json:"nodes"`
  }{}
  err := json.Unmarshal([]byte(graphs), &graphinp)
  if err != nil { return nil, err }
  graphres := make(Graph)
  for id, nd := range graphinp.Nodes.Basic {
    var nnd FunctionNode
    switch nd.Type {
    case "addition":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) + i[1].(float64)
        },
      }
    case "addition3":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) + i[1].(float64) + i[2].(float64)
        },
      }
    case "substraction":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) - i[1].(float64)
        },
      }
    case "multiplication":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) * i[1].(float64)
        },
      }
    case "multiplication3":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) * i[1].(float64) * i[2].(float64)
        },
      }
    case "division":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) / i[1].(float64)
        },
      }
    case "tostring":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return strconv.FormatFloat(i[0].(float64), 'g', -1, 64)
        },
      }
    case "fromstring":
      nnd = FunctionNode{
        wtypes: []DataType{String},
        fn: func(i []any) any {
          res, _ := strconv.ParseFloat(i[0].(string), 64)
          return res
        },
      }
    case "randomInteger":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return math.Floor(
            rand.Float64()*(i[0].(float64)-i[1].(float64))+i[0].(float64))
        },
      }
    case "randomFloat":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return rand.Float64()*(i[0].(float64)-i[1].(float64))+i[0].(float64)
        },
      }
    case "constant":
      nnd = FunctionNode{
        wtypes: []DataType{String},
        fn: func(i []any) any {
          var res float64
          Consts.RWith(func(v map[string]float64) { res = v[i[0].(string)] })
          return res
        },
      }
    case "round":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.Round(i[0].(float64))
        },
      }
    case "roundplaces":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          exp := math.Pow(10, i[1].(float64))
          return math.Round(i[0].(float64) * exp) / exp
        },
      }
    case "numbercomparison":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) == i[0].(float64)
        },
      }
    case "numberif":
      nnd = FunctionNode{
        wtypes: []DataType{Bool, Number, Number},
        fn: func(i []any) any {
          if i[0].(bool) { return i[1].(float64) }
          return i[2].(float64)
        },
      }
    case "stringif":
      nnd = FunctionNode{
        wtypes: []DataType{Bool, String, String},
        fn: func(i []any) any {
          if i[0].(bool) { return i[1].(string) }
          return i[2].(string)
        },
      }
    case "power":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return math.Pow(i[0].(float64), i[1].(float64))
        },
      }
    case "square":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          r := i[0].(float64)
          return r * r
        },
      }
    case "sqrt":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.Sqrt(i[0].(float64))
        },
      }
    case "gcd":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          a := int64(math.Abs(i[0].(float64)))
          b := int64(math.Abs(i[1].(float64)))
          if b > a { a, b = b, a }
          res := int64(0)
          for {
            if (b == 0) { res = a; break };
            a %= b
            if (a == 0) { res = b; break };
            b %= a
          }
          return float64(res)
        },
      }
    case "fraction":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return NewFraction(i[0].(float64), i[1].(float64))
        },
      }
    case "numerator":
      nnd = FunctionNode{
        wtypes: []DataType{Frac},
        fn: func(i []any) any {
          return i[0].(Fraction).x
        },
      }
    case "denominator":
      nnd = FunctionNode{
        wtypes: []DataType{Frac},
        fn: func(i []any) any {
          return i[0].(Fraction).y
        },
      }
    case "fractionaddition":
      nnd = FunctionNode{
        wtypes: []DataType{Frac, Frac},
        fn: func(i []any) any {
          a := i[0].(Fraction)
          return a.Add(i[1].(Fraction))
        },
      }
    case "fractiondivision":
      nnd = FunctionNode{
        wtypes: []DataType{Frac, Frac},
        fn: func(i []any) any {
          a := i[0].(Fraction)
          return a.Div(i[1].(Fraction))
        },
      }
    case "underone":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return NewFraction(1, i[0].(float64))
        },
      }
    default:
      return nil, InvalidGraphErr{"unsopportes node " + nd.Type}
    }
    nnd.id = id
    nnd.inputs = nd.Inputs
    graphres[id] = nnd
  }
  return graphres, nil
}

func (g Graph) Generate(text, sol string) (string, string, error) {
  cache := make(PathSet)
  for _, nd := range g {
    strnd, ok := nd.(SetNode[string])
    if ok {
      ndres, err := strnd.Compute(g, cache)
      if err != nil { return "", "", err }
      ndresstr, ok := ndres.(string)
      if !ok { return "", "", InvalidGraphErr{"invalid ret type"} }
      text = strings.ReplaceAll(text, "`" + strnd.name + "`", ndresstr)
      sol = strings.ReplaceAll(sol, "`" + strnd.name + "`", ndresstr)
      continue
    }
    fltnd, ok := nd.(SetNode[float64])
    if ok {
      ndres, err := fltnd.Compute(g, cache)
      if err != nil { return "", "", err }
      ndresflt, ok := ndres.(float64)
      if !ok { return "", "", InvalidGraphErr{"invalid ret type"} }
      ndresstr := strconv.FormatFloat(ndresflt, 'g', -1, 64)
      text = strings.ReplaceAll(text, "`" + strnd.name + "`", ndresstr)
      sol = strings.ReplaceAll(sol, "`" + strnd.name + "`", ndresstr)
      continue
    }
  }
  return text, sol, nil
}

type DataType int
const (
  Number DataType = iota
  String
  Bool
  Frac
)

type Fraction struct { x, y int }
func NewFraction(x, y float64) Fraction {
  res := Fraction{ int(x), int(y) }
  res.Simplify()
  return res
}
func (f *Fraction) Simplify() {
  a := f.x
  b := f.y
  for b != 0 { a, b = b, a % b }
  f.x /= a
  f.y /= a
}
func (f *Fraction) Add(o Fraction) Fraction {
  f.x = f.x*o.y + o.x*f.y
  f.y *= o.y
  f.Simplify()
  return *f
}
func (f *Fraction) Sub(o Fraction) Fraction {
  f.x = f.x*o.y - o.x*f.y
  f.y *= o.y
  f.Simplify()
  return *f
}
func (f *Fraction) Mul(o Fraction) Fraction {
  f.x *= o.x
  f.y *= o.y
  f.Simplify()
  return *f
}
func (f *Fraction) Div(o Fraction) Fraction {
  f.x *= o.y
  f.y *= o.x
  f.Simplify()
  return *f
}

type FunctionNode struct {
  id GraphId
  inputs []GraphId
  wtypes []DataType
  fn func([]any) any
}
var _ GraphNode = (*FunctionNode)(nil)
func (v FunctionNode) Compute(g Graph, cache PathSet) (any, error) {
  if len(v.inputs) != len(v.wtypes) {
    return nil, InvalidGraphErr{"invalid wtypes"}
  }
  inps := make([]any, len(v.inputs))
  for i, inp := range v.inputs {
    cval, ok := cache[v.id]
    if ok {
      if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
      return cval, nil
    }
    nd, ok := g[inp]
    if !ok { return nil, InvalidGraphErr{"invalid ref"} }
    comp, err := nd.Compute(g, cache)
    if err != nil { return nil, err }
    switch v.wtypes[i] {
      case Number: _, ok = comp.(float64)
      case String: _, ok = comp.(string)
      case Bool: _, ok = comp.(bool)
      case Frac: _, ok = comp.(Fraction)
    }
    if !ok { return nil, InvalidGraphErr{"invalid type"} }
    inps[i] = comp
  }
  res := v.fn(inps)
  cache[v.id] = res
  return res, nil
}


// type LiteralNode struct{ val any }
// var _ GraphNode = (*LiteralNode)(nil)
// func (v LiteralNode) Compute(Graph, PathSet) (any, error) {
//   return v.val, nil
// }

type SetNode[T float64 | string] struct{
  id GraphId
  name string
  inp GraphId
}
var _ GraphNode = (*SetNode[float64])(nil)
func (v SetNode[T]) Compute(g Graph, cache PathSet) (any, error) {
  cval, ok := cache[v.id]
  if ok {
    if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
    return cval, nil
  }
  nd, ok := g[v.inp]
  if !ok { return nil, InvalidGraphErr{"invalid ref"} }
  comp, err := nd.Compute(g, cache)
  if err != nil { return nil, err }
  compt, ok := comp.(T)
  if !ok { return nil, InvalidGraphErr{"invalid type"} }
  cache[v.id] = compt
  return compt, nil
}

// type AdditionNode struct {
//   id GraphId
//   inputs []GraphId
// }
// var _ GraphNode = (*AdditionNode)(nil)
// func (v AdditionNode) Compute(g Graph, cache PathSet) (any, error) {
//   cval, ok := cache[v.id]
//   if ok {
//     if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
//     return cval, nil
//   }
//   var res float64
//   cache[v.id] = nil
//   for _, inp := range v.inputs {
//     nd, ok := g[inp]
//     if !ok { return nil, InvalidGraphErr{"invalid ref"} }
//     comp, err := nd.Compute(g, cache)
//     if err != nil { return nil, err }
//     compt, ok := comp.(float64)
//     if !ok { return nil, InvalidGraphErr{"invalid type"} }
//     res += compt
//   }
//   cache[v.id] = res
//   return res, nil
// }
//
// type SubstractionNode struct {
//   id GraphId
//   inputs []GraphId
// }
// var _ GraphNode = (*SubstractionNode)(nil)
// func (v SubstractionNode) Compute(g Graph, cache PathSet) (any, error) {
//   cval, ok := cache[v.id]
//   if ok {
//     if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
//     return cval, nil
//   }
//   var res float64
//   cache[v.id] = nil
//   for i, inp := range v.inputs {
//     nd, ok := g[inp]
//     if !ok { return nil, InvalidGraphErr{"invalid ref"} }
//     comp, err := nd.Compute(g, cache)
//     if err != nil { return nil, err }
//     compt, ok := comp.(float64)
//     if !ok { return nil, InvalidGraphErr{"invalid type"} }
//     if i == 0 {
//       res += compt
//     } else {
//       res -= compt
//     }
//   }
//   cache[v.id] = res
//   return res, nil
// }
//
// type MultiplicationNode struct {
//   id GraphId
//   inputs []GraphId
// }
// var _ GraphNode = (*MultiplicationNode)(nil)
// func (v MultiplicationNode) Compute(g Graph, cache PathSet) (any, error) {
//   cval, ok := cache[v.id]
//   if ok {
//     if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
//     return cval, nil
//   }
//   var res float64 = 1
//   cache[v.id] = nil
//   for _, inp := range v.inputs {
//     nd, ok := g[inp]
//     if !ok { return nil, InvalidGraphErr{"invalid ref"} }
//     comp, err := nd.Compute(g, cache)
//     if err != nil { return nil, err }
//     compt, ok := comp.(float64)
//     if !ok { return nil, InvalidGraphErr{"invalid type"} }
//     res *= compt
//   }
//   cache[v.id] = res
//   return res, nil
// }
//
// type DivisionNode struct {
//   id GraphId
//   inputs []GraphId
// }
// var _ GraphNode = (*DivisionNode)(nil)
// func (v DivisionNode) Compute(g Graph, cache PathSet) (any, error) {
//   cval, ok := cache[v.id]
//   if ok {
//     if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
//     return cval, nil
//   }
//   var res float64 = 1
//   cache[v.id] = nil
//   for i, inp := range v.inputs {
//     nd, ok := g[inp]
//     if !ok { return nil, InvalidGraphErr{"invalid ref"} }
//     comp, err := nd.Compute(g, cache)
//     if err != nil { return nil, err }
//     compt, ok := comp.(float64)
//     if !ok { return nil, InvalidGraphErr{"invalid type"} }
//     if i == 0 {
//       res *= compt
//     } else {
//       res /= compt
//     }
//   }
//   cache[v.id] = res
//   return res, nil
// }
//
// type RandomFloatNode struct{ id GraphId; low, high GraphId }
// var _ GraphNode = (*RandomFloatNode)(nil)
// func (v RandomFloatNode) Compute(g Graph, cache PathSet) (any, error) {
//   cval, ok := cache[v.id]
//   if ok {
//     if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
//     return cval, nil
//   }
//   nd, ok := g[v.high]
//   if !ok { return nil, InvalidGraphErr{"invalid ref"} }
//   comp, err := nd.Compute(g, cache)
//   if err != nil { return nil, err }
//   compt, ok := comp.(float64)
//   if !ok { return nil, InvalidGraphErr{"invalid type"} }
//   nd, ok = g[v.low]
//   if !ok { return nil, InvalidGraphErr{"invalid ref"} }
//   comp, err = nd.Compute(g, cache)
//   if err != nil { return nil, err }
//   compt2, ok := comp.(float64)
//   if !ok { return nil, InvalidGraphErr{"invalid type"} }
//   res := rand.Float64()*(compt-compt2)+compt2
//   cache[v.id] = res
//   return res, nil
// }
//
// type RandomIntegerNode struct{ low, high float64 }
// var _ GraphNode = (*RandomIntegerNode)(nil)
// func (v RandomIntegerNode) Compute(Graph, PathSet) (any, error) {
//   return float64(rand.IntN(high-low)+low), nil
// }
