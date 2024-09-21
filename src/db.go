package src

import (
	"errors"
	"slices"
	"strings"
	"sync"

	log "github.com/anteat3r/golog"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/models"
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

func dbErr(args... string) error {
  return errors.New(strings.Join(args, DELIM))
}

func dbClownErr(args... string) error {
  return errors.New("clown" + DELIM + strings.Join(args, DELIM))
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
    if !found { return dbClownErr("sell", "prob not owned") }

    rec.Set("bought", newbought)
    rec.Set("sold", append(rec.GetStringSlice("sold"), prob))
    money = rec.GetInt("money")
    cost, ok := GetCost("-" + probrec.GetString("diff"))
    if !ok { log.Error("invalid diff", prob, probrec.PublicExport()) }
    rec.Set("money", money + cost)
    err = txDao.SaveRecord(rec)

    return nil
  })
  return
}

func dbBuySrc(team string, diff string, srcField string) (id string, money int, name string, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {
    diffcost, ok := GetCost(diff)
    if !ok {
      return dbClownErr("buy", "invalid diff")
    }

    teamrec, err := txDao.FindRecordById("teams", team)
    if err != nil { return err }

    if diffcost > teamrec.GetInt("money") {
      return dbErr("buy", "not enough money")
    }

    found := ""
    for _, probid := range teamrec.GetStringSlice(srcField) {
      prob, err := txDao.FindRecordById("probs", probid)
      if err != nil { return err }

      if prob.GetString("diff") != diff {
        continue
      }

      found = probid
    }

    if found == "" {
      return dbErr("buy", "no prob found")
    }

    prob, err := txDao.FindRecordById("probs", found)
    if err != nil { return err }

    newfree, _ := SliceExclude(teamrec.GetStringSlice(srcField), found)

    teamrec.Set(srcField, newfree)
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

func DBBuy(team string, diff string) (id string, money int, name string, oerr error) {
  return dbBuySrc(team, diff, "free")
}

func DBBuyOld(team string, diff string) (id string, money int, name string, oerr error) {
  return dbBuySrc(team, diff, "solved")
}

func DBSolve(team string, prob string, sol string) (check string, diff string, teamname string, name string, text string, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {

    teamrec, err := txDao.FindRecordById("teams", team)
    if err != nil { return err }

    probrec, err := txDao.FindRecordById("probs", prob)
    if err != nil { return err }

    newbought, found := SliceExclude(teamrec.GetStringSlice("bought"), prob)
    if !found { return dbClownErr("solve", "prob not bought") }

    teamrec.Set("bought", newbought)
    teamrec.Set("pending", append(teamrec.GetStringSlice("pending"), prob))

    err = txDao.SaveRecord(teamrec)
    if err != nil { return err }

    coll, _ := txDao.FindCollectionByNameOrId("checks")
    checkrec := models.NewRecord(coll)

    checkrec.Set("type", "sol")
    checkrec.Set("team", team)
    checkrec.Set("prob", prob)
    checkrec.Set("solution", sol)
    err = txDao.SaveRecord(checkrec)
    if err != nil { return err }

    check = checkrec.GetId()
    name = probrec.GetString("name")
    diff = probrec.GetString("diff")
    teamname = probrec.GetString("name")
    text = probrec.GetString("text")

    return nil
  })
  return
}

func DBView(team string, prob string) (text string, diff string, name string, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {

    teamrec, err := txDao.FindRecordById("teams", team)
    if err != nil { return err }

    probrec, err := txDao.FindRecordById("probs", prob)
    if err != nil { return err }

    if !slices.Contains(teamrec.GetStringSlice("bought"), prob) && 
         !slices.Contains(teamrec.GetStringSlice("pending"), prob) {
      return dbClownErr("view", "prob not owned")
    }

    text = probrec.GetString("text")
    diff = probrec.GetString("diff")
    name = probrec.GetString("name")

    return nil
  })
  return
}

func DBPlayerMsg(team string, prob string, msg string) (oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {

    teamrec, err := txDao.FindRecordById("teams", team)
    if err != nil { return err }

    if prob != "" &&
       !slices.Contains(teamrec.GetStringSlice("bought"), prob) && 
       !slices.Contains(teamrec.GetStringSlice("pending"), prob) {
      return dbClownErr("view", "prob not owned")
    }

    coll, _ := txDao.FindCollectionByNameOrId("chat")
    msgrec := models.NewRecord(coll)

    msgrec.Set("team", team)
    msgrec.Set("prob", prob)
    msgrec.Set("type", "player")
    msgrec.Set("text", msg)
    err = txDao.SaveRecord(msgrec)
    if err != nil { return err }

    coll2, _ := txDao.FindCollectionByNameOrId("checks")
    check := models.NewRecord(coll2)

    check.Set("type", "msg")
    check.Set("team", team)
    check.Set("prob", prob)
    check.Set("solution", "")
    err = txDao.SaveRecord(check)
    if err != nil { return err }

    return nil
  })
  return
}

func DBPlayerInitLoad(team string) (money int, boughtprobs string, pendingprobs string, checks string, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {

    teamrec, err := txDao.FindRecordById("teams", team)
    if err != nil { return err }

    money = teamrec.GetInt("money")

    for _, p := range teamrec.GetStringSlice("bought") {
      probrec, err := txDao.FindRecordById("probs", p)
      if err != nil { return err }
      boughtprobs += probrec.GetId() + DELIM + 
        probrec.GetString("diff") + DELIM +
        probrec.GetString("name") + DELIM
    }
    boughtprobs += DELIM

    for _, p := range teamrec.GetStringSlice("pending") {
      probrec, err := txDao.FindRecordById("probs", p)
      if err != nil { return err }
      pendingprobs += probrec.GetId() + DELIM + 
        probrec.GetString("diff") + DELIM +
        probrec.GetString("name") + DELIM
    }

    res := []struct{ Id string `db:"id"` }{}
    err = txDao.DB().NewQuery("SELECT ids FROM check WHERE team = {:team} AND type = 'msg'").
      Bind(dbx.Params{
        "team": team,
      }).
      All(&res)
    if err != nil { return err }

    for _, c := range res { checks += c.Id + DELIM }
    
    return nil
  })
  return
}

func DBAdminGrade(check string, corr bool) (team string, prob string, money int, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {

    checkrec, err := txDao.FindRecordById("checks", check)
    if err != nil { return err }

    prob = checkrec.GetString("prob")
    team = checkrec.GetString("team")

    teamrec, err := txDao.FindRecordById("teams", checkrec.GetString("team"))
    if err != nil { return err }

    probrec, err := txDao.FindRecordById("probs", prob)
    if err != nil { return err }

    newpending, found := SliceExclude(teamrec.GetStringSlice("pending"), prob)

    if !found { return dbErr("grade", "prob not pending") }

    teamrec.Set("pending", newpending)
    if corr {
      diffrew, ok := GetCost("+" + probrec.GetString("diff"))
      if !ok { return dbErr("grade", "invalid diff") }

      teamrec.Set("money", teamrec.GetInt("money") + diffrew)
      teamrec.Set("solved", append(teamrec.GetStringSlice("solved"), prob))
    } else {
      teamrec.Set("bought", append(teamrec.GetStringSlice("bought"), prob))
    }

    err = txDao.SaveRecord(teamrec)
    if err != nil { return err }

    money = teamrec.GetInt("money")

    err = txDao.DeleteRecord(checkrec)
    if err != nil { return err }

    return nil
  })
  return 
}

func DBAdminMsg(team string, prob string, text string) (oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {

    teamrec, err := txDao.FindRecordById("teams", team)
    if err != nil { return err }

    if !slices.Contains(teamrec.GetStringSlice("bought"), prob) && 
         !slices.Contains(teamrec.GetStringSlice("pending"), prob) {
      return dbClownErr("view", "prob not owned")
    }

    coll, _ := txDao.FindCollectionByNameOrId("chat")
    msgrec := models.NewRecord(coll)

    msgrec.Set("team", team)
    msgrec.Set("prob", prob)
    msgrec.Set("type", "admin")
    msgrec.Set("text", text)
    err = txDao.SaveRecord(msgrec)
    if err != nil { return err }

    return nil
  })
  return
}

func DBAdminDismiss(check string) (team string, prob string, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {

    checkrec, err := txDao.FindRecordById("checks", check)
    if err != nil { return err }

    teamrec, err := txDao.FindRecordById("teams", checkrec.GetString("team"))
    if err != nil { return err }

    teamrec.Set("checks", teamrec.GetInt("checks")-1)
    err = txDao.SaveRecord(teamrec)
    if err != nil { return err }

    team = teamrec.GetId()
    prob= checkrec.GetString("prob")

    err = txDao.DeleteRecord(checkrec)
    if err != nil { return err }

    return nil
  })
  return
}

func DBAdminView(check string) (team string, prob string, oerr error) {
  oerr = Dao.RunInTransaction(func(txDao *daos.Dao) error {

    checkrec, err := txDao.FindRecordById("checks", check)
    if err != nil { return err }

    probrec, err := txDao.FindRecordById("probs", checkrec.GetString("prob"))
    if err != nil { return err }

    teamrec, err := txDao.FindRecordById("teams", checkrec.GetString("team"))
    if err != nil { return err }
    
    prob = probrec.GetId()
    team = teamrec.GetId()

    // diff = probrec.GetString("diff")
    // teamname = teamrec.GetString("name")
    // name = probrec.GetString("name")
    // text = probrec.GetString("text")
    
    return nil
  })
  return
}
