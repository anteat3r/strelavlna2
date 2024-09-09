package src

import (
	"errors"

	"github.com/pocketbase/pocketbase/daos"
)

var (
  Dao *daos.Dao

  costs = map[string]int{
    "A": 10,
  }

)

func DBSell(team string, prob string) (money int, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {
    rec, err := txDao.FindRecordById("teams", team)
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
    if !found { return errors.New("sold:prob not owned") }
    newbought = newbought[:len(bought)-1]

    rec.Set("bought", newbought)
    money = rec.GetInt("money")
    rec.Set("money", money + costs[""])
    err = txDao.SaveRecord(rec)

    return nil
  })
  return
}

func DBBuy(team string, diff string) (id string, money int, err error) {
  err = Dao.RunInTransaction(func(txDao *daos.Dao) error {
    
    return nil
  })
  return
}
