package src

import (
	"encoding/json"
	"math/rand/v2"
	"strconv"
	"strings"
)

type GraphNode interface {
  Compute(Graph, PathSet) (any, error)
}

type Graph map[GraphId]GraphNode
type PathSet map[GraphId]any
type GraphId = int

type InvalidGraphErr struct { msg string }
func (e InvalidGraphErr) Error() string { return e.msg }

func ParseGraph(graphs string) (Graph, error) {
  graphinp := make(map[int]map[string]any, 0)
  err := json.Unmarshal([]byte(graphs), graphinp)
  if err != nil { return nil, err }
  graphres := make(Graph)
  for id, nd := range graphinp {
    var pnode GraphNode
    switch nd["type"] {

    case "literal":
      val, ok := nd["value"]
      if !ok { return nil, InvalidGraphErr{"invalid node inp"} }
      pnode = LiteralNode{val}

    case "randfloat":
      low, ok := nd["low"].(float64)
      if !ok { return nil, InvalidGraphErr{"invalid node inp"} }
      high, ok := nd["low"].(float64)
      if !ok { return nil, InvalidGraphErr{"invalid node inp"} }
      pnode = RandomFloatNode{low, high}

    case "intaddition":
      inps, ok := nd["inputs"].([]int)
      if !ok { return nil, InvalidGraphErr{"invalid node inp"} }
      pnode = AdditionNode[int]{GraphId(id), ([]GraphId)(inps)}

    case "startfloat":
      inp, ok := nd["input"].(int)
      if !ok { return nil, InvalidGraphErr{"invalid node inp"} }
      name, ok := nd["value"].(string)
      if !ok { return nil, InvalidGraphErr{"invalid node inp"} }
      pnode = StartNode[float64]{name, GraphId(inp)}

    default:
      return nil, InvalidGraphErr{"invalid node type"} 

    }
    graphres[GraphId(id)] = pnode
  }
  return graphres, nil
}

func (g Graph) Generate(text, sol string) (string, string, error) {
  cache := make(PathSet)
  for _, nd := range g {
    strnd, ok := nd.(StartNode[string])
    if ok {
      ndres, err := strnd.Compute(g, cache)
      if err != nil { return "", "", err }
      ndresstr, ok := ndres.(string)
      if !ok { return "", "", InvalidGraphErr{"invalid ret type"} }
      text = strings.ReplaceAll(text, "`" + strnd.name + "`", ndresstr)
      sol = strings.ReplaceAll(sol, "`" + strnd.name + "`", ndresstr)
      continue
    }
    fltnd, ok := nd.(StartNode[float64])
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

type LiteralNode struct{ val any }
var _ GraphNode = (*LiteralNode)(nil)
func (v LiteralNode) Compute(Graph, PathSet) (any, error) {
  return v.val, nil
}

type StartNode[T float64 | string] struct{
  name string
  inp GraphId
}
var _ GraphNode = (*StartNode[float64])(nil)
func (v StartNode[T]) Compute(g Graph, cache PathSet) (any, error) {
  cval, ok := cache[v.inp]
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
  return compt, nil
}

type AdditionNode[T int | float64] struct {
  id GraphId
  inputs []GraphId
}
var _ GraphNode = (*AdditionNode[int])(nil)
var _ GraphNode = (*AdditionNode[float64])(nil)
func (v AdditionNode[T]) Compute(g Graph, cache PathSet) (any, error) {
  cval, ok := cache[v.id]
  if ok {
    if cval == nil { return nil, InvalidGraphErr{"cyclic ref"} }
    return cval, nil
  }
  var res T
  cache[v.id] = struct{}{}
  for _, inp := range v.inputs {
    nd, ok := g[inp]
    if !ok { return nil, InvalidGraphErr{"invalid ref"} }
    comp, err := nd.Compute(g, cache)
    if err != nil { return nil, err }
    compt, ok := comp.(T)
    if !ok { return nil, InvalidGraphErr{"invalid type"} }
    res += compt
  }
  cache[v.id] = res
  return res, nil
}

type RandomFloatNode struct{ low, high float64 }
var _ GraphNode = (*RandomFloatNode)(nil)
func (v RandomFloatNode) Compute(Graph, PathSet) (any, error) {
  return rand.Float64()*(v.high-v.low)+v.low, nil
}
