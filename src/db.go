package src

import (
	"errors"
	"slices"

	"github.com/pocketbase/pocketbase/daos"
)

var (
  Dao *daos.Dao

  Costs = map[string]int{
    "A": 10,
  }

)

func DBSell(team string, prob string) (money int, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {
    rec, err := txDao.FindRecordById("teams", team)
    if err != nil { return err }

    probrec, err := txDao.FindRecordById("probs", prob)
    if err != nil { return err }
    
    bought := rec.GetStringSlice("bought")
    newbought := make([]string, len(bought))

    i := 0
    found := false
    for _, p := range bought {
      if p == prob {
        found = true
        continue
      }
      newbought[i] = p
      i++
    }
    if !found { return errors.New("sell" + DELIM + "prob not owned") }
    newbought = newbought[:len(bought)-1]

    rec.Set("bought", newbought)
    money = rec.GetInt("money")
    rec.Set("money", money + Costs[probrec.GetString("diff")])
    err = txDao.SaveRecord(rec)

    return nil
  })
  return
}

func DBBuy(team string, diff string) (id string, money int, name string, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {
    if _, ok := Costs[diff]; !ok {
      return errors.New("buy" + DELIM + "invalid diff")
    }

    teamrec, err := txDao.FindRecordById("teams", team)
    if err != nil { return err }

    if Costs[diff] > teamrec.GetInt("money") {
      return errors.New("buy" + DELIM + "not enough money")
    }

    comp, err := txDao.FindRecordById("contests", teamrec.GetString("contest"))
    if err != nil { return err }

    found := ""
    for _, probid := range comp.GetStringSlice("probs") {
      if slices.Contains(teamrec.GetStringSlice("bought"), probid) {
        continue
      }

      if slices.Contains(teamrec.GetStringSlice("pending"), probid) {
        continue
      }

      if slices.Contains(teamrec.GetStringSlice("solved"), probid) {
        continue
      }

      if slices.Contains(teamrec.GetStringSlice("sold"), probid) {
        continue
      }

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

    teamrec.Set("money", teamrec.GetInt("money") - Costs[diff])
    teamrec.Set("bought", append(teamrec.GetStringSlice("bought"), found))
    err = txDao.SaveRecord(teamrec)
    if err != nil { return err }

    id = found
    money = teamrec.GetInt("money")
    name = prob.GetString("name")

    return nil
  })
  return
}
