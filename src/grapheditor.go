package src

import (
	"encoding/json"
	"math/rand/v2"
)

type GraphNode interface {
  Compute(Graph, PathSet) (any, error)
}

type Graph map[GraphId]GraphNode
type PathSet map[GraphId]struct{}
type GraphId = int

type InvalidGraphErr struct { msg string }
func (e InvalidGraphErr) Error() string { return e.msg }

func ParseNode(graphs string) (Graph, error) {
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

    default:
      return nil, InvalidGraphErr{"invalid node type"} 

    }
    graphres[GraphId(id)] = pnode
  }
  return graphres, nil
}

func (g Graph) Compute(start int) (any, error) {
  nd, ok := g[GraphId(start)]
  if !ok { return nil, InvalidGraphErr{"start not found"} }
  return nd.Compute(g, make(PathSet))
}

type LiteralNode struct{ val any }
var _ GraphNode = (*LiteralNode)(nil)
func (v LiteralNode) Compute(Graph, PathSet) (any, error) {
  return v.val, nil
}

type AdditionNode[T int | float64] struct {
  id GraphId
  inputs []GraphId
}
var _ GraphNode = (*AdditionNode[int])(nil)
var _ GraphNode = (*AdditionNode[float64])(nil)
func (v AdditionNode[T]) Compute(g Graph, cache PathSet) (any, error) {
  if _, ok := cache[v.id]; ok { return nil, InvalidGraphErr{"cyclic ref"} }
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
  delete(cache, v.id)
  return res, nil
}

type RandomFloatNode struct{ low, high float64 }
var _ GraphNode = (*RandomFloatNode)(nil)
func (v RandomFloatNode) Compute(Graph, PathSet) (any, error) {
  return rand.Float64()*(v.high-v.low)+v.low, nil
}
