package src

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand/v2"
	"strconv"
	"strings"

  // log "github.com/anteat3r/golog"
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
      Get map[string]struct{
        RefId string `json:"referenceId,omitempty"`
        Selected bool `json:"selected"`
        Type string `json:"type"`
        Value any `json:"value"`
      } `json:"get"`
      Set map[string]struct{
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
    case "ftostring":
      nnd = FunctionNode{
        wtypes: []DataType{Frac},
        fn: func(i []any) any {
          f := i[0].(Fraction)
          if f.y == 1 { return strconv.Itoa(f.x) }
          return strconv.Itoa(f.x) + "/" + strconv.Itoa(f.y)
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
            rand.Float64()*(i[0].(float64)-i[1].(float64))+i[1].(float64))
        },
      }
    case "randomFloat":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return rand.Float64()*(i[0].(float64)-i[1].(float64))+i[1].(float64)
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
    case "lessthan":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) < i[1].(float64)
        },
      }
    case "greaterthan":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) > i[1].(float64)
        },
      }
    case "lessthanequal":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) <= i[1].(float64)
        },
      }
    case "greaterthanequal":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) >= i[1].(float64)
        },
      }
    case "numbercomparison":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return i[0].(float64) == i[1].(float64)
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
    case "absolute":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.Abs(i[0].(float64))
        },
      }
    case "factorial":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          a := int64(math.Abs(i[0].(float64)))
          res := int64(1)
          for i := int64(2); i <= a; i++ { res *= i }
          return float64(a)
        },
      }
    case "or":
      nnd = FunctionNode{
        wtypes: []DataType{Bool, Bool},
        fn: func(i []any) any {
          return i[0].(bool) || i[1].(bool)
        },
      }
    case "and":
      nnd = FunctionNode{
        wtypes: []DataType{Bool, Bool},
        fn: func(i []any) any {
          return i[0].(bool) && i[1].(bool)
        },
      }
    case "not":
      nnd = FunctionNode{
        wtypes: []DataType{Bool},
        fn: func(i []any) any {
          return !i[0].(bool)
        },
      }
    case "isFinite":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return !math.IsInf(i[0].(float64), 0)
        },
      }
    case "isNaN":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.IsNaN(i[0].(float64))
        },
      }
    case "sin":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.Sin(i[0].(float64))
        },
      }
    case "cos":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.Cos(i[0].(float64))
        },
      }
    case "tan":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.Tan(i[0].(float64))
        },
      }
    case "asin":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.Asin(i[0].(float64))
        },
      }
    case "acos":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.Acos(i[0].(float64))
        },
      }
    case "atan":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.Atan(i[0].(float64))
        },
      }
    case "sqrt":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return math.Sqrt(i[0].(float64))
        },
      }
    case "lcm":
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
          return float64(a * b / res)
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
          return float64(i[0].(Fraction).x)
        },
      }
    case "denominator":
      nnd = FunctionNode{
        wtypes: []DataType{Frac},
        fn: func(i []any) any {
          return float64(i[0].(Fraction).y)
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
    case "fractionmultiplication":
      nnd = FunctionNode{
        wtypes: []DataType{Frac, Frac},
        fn: func(i []any) any {
          a := i[0].(Fraction)
          return a.Mul(i[1].(Fraction))
        },
      }
    case "fractionsubstraction":
      nnd = FunctionNode{
        wtypes: []DataType{Frac, Frac},
        fn: func(i []any) any {
          a := i[0].(Fraction)
          return a.Sub(i[1].(Fraction))
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
    case "overone":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return NewFraction(i[0].(float64), 1)
        },
      }
    case "underone":
      nnd = FunctionNode{
        wtypes: []DataType{Number},
        fn: func(i []any) any {
          return NewFraction(1, i[0].(float64))
        },
      }
    case "fractiontonumber":
      nnd = FunctionNode{
        wtypes: []DataType{Frac},
        fn: func(i []any) any {
          return float64(i[0].(Fraction).x) / float64(i[0].(Fraction).y)
        },
      }
    case "modulo":
      nnd = FunctionNode{
        wtypes: []DataType{Number, Number},
        fn: func(i []any) any {
          return float64(int(i[0].(float64)) % int(i[1].(float64)))
        },
      }
    case "nocachenumber", "nocachestring", "nocachefraction", "nocachebool":
      if len(nd.Inputs) != 1 { return nil, InvalidGraphErr{"invalid nocache node"}}
      nnnd := NoCacheNode{
        id: id,
        inp: nd.Inputs[0],
      }
      graphres[id] = nnnd
      continue
    default:
      return nil, InvalidGraphErr{"unsopportes node " + nd.Type}
    }
    nnd.id = id
    nnd.inputs = nd.Inputs
    graphres[id] = nnd
  }
  for id, nd := range graphinp.Nodes.Get {
    nnd := FunctionNode{}
    switch nd.Type {
    case "number", "string":
      nnd = FunctionNode{
        wtypes: []DataType{},
        fn: func(i []any) any {
          res := nd.Value
          if intres, ok := nd.Value.(int); ok {
            res = float64(intres)
          } 
          return res
        },
      }
    case "constant":
      if nd.RefId == "" {
        return nil, InvalidGraphErr{"invalid constant"}
      }
      var res Constant
      var ok bool
      Consts.RWith(func(v map[string]Constant) { res, ok = v[nd.RefId] })
      if !ok {
        return nil, InvalidGraphErr{"nonexistant constant"}
      }
      nnd = FunctionNode{
        wtypes: []DataType{},
        fn: func(i []any) any {
          return res.Value
        },
      }
    default:
      return nil, InvalidGraphErr{"unsopportes node " + nd.Type}
    }
    nnd.id = id
    nnd.inputs = []GraphId{}
    graphres[id] = nnd
  }
  for id, nd := range graphinp.Nodes.Set {
    if len(nd.Value) < 6 {
      return nil, InvalidGraphErr{"invalid setnode value"}
    }
    var nnd GraphNode
    switch nd.Type {
    case "setstring", "setnumber", "setfraction":
      nnd = SetNode{
        id: id,
        inp: nd.Input,
        name: nd.Value[5:len(nd.Value)-2],
      }
    case "redo":
      nnd = RedoNode{
        id: id,
        inp: nd.Input,
      }
    default:
      return nil, InvalidGraphErr{"unsopportes node " + nd.Type}
    }
    graphres[id] = nnd
  }
  return graphres, nil
}

func (g Graph) Generate(text, sol string) (string, string, error) {
  redos := 10
  redol: for redos > 0 {
    redos--
    cache := make(PathSet)
    ntext := text
    nsol := sol
    for id, nd := range g {
      redond, ok := nd.(RedoNode)
      if ok {
        ndres, err := redond.Compute(g, cache)
        if err != nil { return "", "", err }
        if ndres.(bool) {
          fmt.Println("redoing")
          continue redol
        }
      }
      setnd, ok := nd.(SetNode)
      if ok {
        ndres, err := nd.Compute(g, cache)
        if err != nil { return "", "", err }
        var ndresstr string
        switch ndt := ndres.(type) {
        case string: ndresstr = ndt
        case float64: ndresstr = strconv.FormatFloat(ndt, 'g', -1, 64)
        case bool: ndresstr = strconv.FormatBool(ndt)
        case Fraction: ndresstr = strconv.Itoa(ndt.x) + "/" + strconv.Itoa(ndt.y)
          if ndt.y == 1 { ndresstr = strconv.Itoa(ndt.x) }
        default:
          fmt.Printf("%v %T %v %v\n", ndres, ndres, nd, id)
          return "", "", InvalidGraphErr{"invalid ret type"} 
        }
        fmt.Println(setnd.name)
        ntext = strings.ReplaceAll(ntext, "`" + setnd.name + "`", ndresstr)
        nsol = strings.ReplaceAll(nsol, "`" + setnd.name + "`", ndresstr)
        continue
      }
    }
    return ntext, nsol, nil
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
    if !ok { return nil, InvalidGraphErr{"invalid type" + v.id} }
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

type SetNode struct{
  id GraphId
  name string
  inp GraphId
}
var _ GraphNode = (*SetNode)(nil)
func (v SetNode) Compute(g Graph, cache PathSet) (any, error) {
  cval, ok := cache[v.id]
  if ok {
    if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
    return cval, nil
  }
  cache[v.id] = nil
  nd, ok := g[v.inp]
  if !ok { return nil, InvalidGraphErr{"invalid ref"} }
  comp, err := nd.Compute(g, cache)
  if err != nil { return nil, err }
  cache[v.id] = comp
  return comp, nil
}

type RedoNode struct {
  id GraphId
  inp GraphId
}
var _ GraphNode = (*RedoNode)(nil)
func (v RedoNode) Compute(g Graph, cache PathSet) (any, error) {
  cval, ok := cache[v.id]
  if ok {
    if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
    return cval, nil
  }
  cache[v.id] = nil
  nd, ok := g[v.inp]
  if !ok { return nil, InvalidGraphErr{"invalid ref"} }
  comp, err := nd.Compute(g, cache)
  if err != nil { return nil, err }
  compt, ok := comp.(bool)
  if !ok { return nil, InvalidGraphErr{"invalid type"} }
  cache[v.id] = compt
  return compt, nil
}

type NoCacheNode struct {
  id GraphId
  inp GraphId
}
var _ GraphNode = (*NoCacheNode)(nil)
func (v NoCacheNode) Compute(g Graph, cache PathSet) (any, error) {
  cval, ok := cache[v.id]
  if ok {
    if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
    return cval, nil
  }
  newcache := make(PathSet)
  newcache[v.id] = nil
  nd, ok := g[v.inp]
  if !ok { return nil, InvalidGraphErr{"invalid ref"} }
  comp, err := nd.Compute(g, newcache)
  if err != nil { return nil, err }
  cache[v.id] = comp
  return comp, nil
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
