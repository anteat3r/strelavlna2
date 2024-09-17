package src

import (
	"errors"
	"sync"

	"github.com/pocketbase/pocketbase/daos"
  log "github.com/anteat3r/golog"
)

var (
  Dao *daos.Dao

  Costs = map[string]int{
    "A": 10,
  }
  CostsMu = sync.RWMutex{}
)

func GetCost(diff string) (int, bool) {
  CostsMu.RLock()
  res, ok := Costs[diff]
  CostsMu.RUnlock()
  return res, ok
}

func SliceExclude[T comparable](s []T, v T) (res []T, found bool) {
  i := 0
  found = false
  res = make([]T, len(s))
  for _, p := range s {
    if p == v {
      found = true
      continue
    }
    res[i] = p
    i++
  }
  if found {
    res = res[:len(s)-1]
  }
  return
}

func DBSell(team string, prob string) (money int, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {
    rec, err := txDao.FindRecordById("teams", team)
    if err != nil { return err }

    probrec, err := txDao.FindRecordById("probs", prob)
    if err != nil { return err }
    
    bought := rec.GetStringSlice("bought")

    newbought, found := SliceExclude(bought, prob)
    if !found { return errors.New("sell" + DELIM + "prob not owned") }

    rec.Set("bought", newbought)
    rec.Set("sold", append(rec.GetStringSlice("sold"), prob))
    money = rec.GetInt("money")
    cost, ok := GetCost(probrec.GetString("diff"))
    if !ok { log.Error("invalid diff", prob, probrec.PublicExport()) }
    rec.Set("money", money + cost)
    err = txDao.SaveRecord(rec)

    return nil
  })
  return
}

func DBBuy(team string, diff string) (id string, money int, name string, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {
    diffcost, ok := GetCost(diff)
    if !ok {
      return errors.New("buy" + DELIM + "invalid diff")
    }

    teamrec, err := txDao.FindRecordById("teams", team)
    if err != nil { return err }

    if diffcost > teamrec.GetInt("money") {
      return errors.New("buy" + DELIM + "not enough money")
    }

    found := ""
    for _, probid := range teamrec.GetStringSlice("free") {
      prob, err := txDao.FindRecordById("probs", probid)
      if err != nil { return err }

      if prob.GetString("diff") != diff {
        continue
      }

      found = probid
    }

    if found == "" {
      return errors.New("buy" + DELIM + "no prob found")
    }

    prob, err := txDao.FindRecordById("probs", found)
    if err != nil { return err }

    newfree, _ := SliceExclude(teamrec.GetStringSlice("free"), found)

    teamrec.Set("free", newfree)
    teamrec.Set("bought", append(teamrec.GetStringSlice("bought"), found))
    teamrec.Set("money", teamrec.GetInt("money") - diffcost)
    err = txDao.SaveRecord(teamrec)
    if err != nil { return err }

    id = found
    money = teamrec.GetInt("money")
    name = prob.GetString("name")

    return nil
  })
  return
}
