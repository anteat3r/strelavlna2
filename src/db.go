package src

import (
	"database/sql"
	"encoding/json"
	"errors"
	"slices"
	"strings"
	"sync"
	"time"

	log "github.com/anteat3r/golog"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/security"
	"github.com/pocketbase/pocketbase/tools/types"
)

var (
  App *pocketbase.PocketBase

  Costs = map[string]int{
    "A": 10,
  }
  CostsMu = sync.RWMutex{}

  ChecksColl *models.Collection
)
 
func ParseRefList(s string) []string {
  if s == "[]" { return []string{} }
  s = strings.TrimPrefix(s, "[")
  s = strings.TrimSuffix(s, "]")
  res := strings.Split(s, ",")
  for i, s := range res {
    res[i] = strings.Trim(s, `"`)
  }
  return res
}
 
func StringifyRefList(l []string) string {
  res := "["
  for i, s := range l {
    res += `"` + s + `"`
    if i == len(l)-1 { break }
    res += ","
  }
  res += "]"
  return res
}

func RefListToInExpr(l []string) string {
  res := "("
  for i, s := range l {
    res += `'` + s + `'`
    if i == len(l)-1 { break }
    res += ","
  }
  res += ")"
  return res
}

func GetRandomId() string {
  return security.RandomStringWithAlphabet(
    models.DefaultIdLength,
    models.DefaultIdAlphabet,
  )
}

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

func SliceExclude[T comparable](s []T, v T) bool {
  found := false
  for i := range len(s) {
    if s[i] == v {
      found = true
      continue
    }
    if !found { continue }
    s[i-1] = s[i]
  }
  if found { s = s[:len(s)-1] }
  return found
}

func DBSell(team string, prob string) (money int, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    teamres := struct{
      Bought string `db:"bought"`
      Sold string `db:"sold"`
      Money int `db:"money"`
    }{}
    err := txDao.DB().
      NewQuery("SELECT bought, sold, money FROM teams WHERE id = {:team} LIMIT 1").
      Bind(dbx.Params{ "team": team }).
      One(&teamres)
    if err != nil { return err }

    probres := struct{
      Diff string `db:"diff"`
    }{}
    err = txDao.DB().
      NewQuery("SELECT diff FROM probs WHERE id = {:prob} LIMIT 1").
      Bind(dbx.Params{ "prob": prob }).
      One(&probres)
    if err != nil { return err }

    cost, ok := GetCost("-" + probres.Diff)
    if !ok { log.Error("invalid diff", prob, probres.Diff) }

    bought := ParseRefList(teamres.Bought)
    sold := ParseRefList(teamres.Sold)

    found := SliceExclude(bought, prob)
    if !found { return dbClownErr("sell", "prob not owned") }

    sold = append(sold, prob)

    money = teamres.Money + cost

    _, err = txDao.DB().
      NewQuery("UPDATE teams SET money = {:money}, bought = {:bought}, sold = {:sold} WHERE id = {:team}").
      Bind(dbx.Params{
        "money": money,
        "bought": StringifyRefList(bought),
        "sold": StringifyRefList(sold),
        "team": team,
      }).
      Execute()

    if err != nil { return err }

    return nil
  })
  return
}

func dbBuySrc(team string, diff string, srcField string) (prob string, money int, name string, text string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {
    diffcost, ok := GetCost(diff)
    if !ok { return dbClownErr("buy", "invalid diff") }

    teamres := struct{
      Money int `db:"money"`
      Free string `db:"free"`
      Bought string `db:"bought"`
    }{}
    err := txDao.DB().
      NewQuery("SELECT money, free, bought FROM teams WHERE id = {:team} LIMIT 1").
      Bind(dbx.Params{ "team": team }).
      One(&teamres)

    if err != nil { return err }

    if diffcost > teamres.Money {
      return dbErr("buy", "not enough money")
    }

    probres := struct{
      Id string `db:"id"`
      Name string `db:"name"`
      Text string `db:"text"`
    }{}
    err = txDao.DB().
      NewQuery("SELECT id, name, text FROM probs WHERE id IN " +
                RefListToInExpr(ParseRefList(teamres.Free)) +
                " AND diff = {:diff} LIMIT 1").
        Bind(dbx.Params{ "diff": diff }).
        One(&probres)

    if err == sql.ErrNoRows { return dbErr("no prob found") }
    if err != nil { return err }

    prob = probres.Id

    free := ParseRefList(teamres.Free)
    bought := ParseRefList(teamres.Bought)

    found := SliceExclude(free, prob)
    if !found { log.Error("prob not free", team, prob) }

    bought = append(bought, prob)

    money = teamres.Money - diffcost
    name = probres.Name
    text = probres.Text

    _, err = txDao.DB().
      NewQuery("UPDATE teams SET money = {:money}, free = {:free}, bought = {:bought} WHERE id = {:team}").
      Bind(dbx.Params{
        "money": money,
        "free": StringifyRefList(free),
        "bought": StringifyRefList(bought),
        "team": team,
      }).
      Execute()

    if err != nil { return err }

    return nil
  })
  return
}

func DBBuy(team string, diff string) (id string, money int, name string, text string, oerr error) {
  return dbBuySrc(team, diff, "free")
}

func DBBuyOld(team string, diff string) (id string, money int, name string, text string, oerr error) {
  return dbBuySrc(team, diff, "solved")
}

func DBSolve(team string, prob string, sol string) (check string, diff string, teamname string, name string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    teamres := struct{
      Name string `db:"name"`
      Bought string `db:"bought"`
      Pending string `db:"pending"`
    }{}
    err := txDao.DB().
      NewQuery("SELECT name, bought, pending FROM teams WHERE id = {:team} LIMIT 1").
      Bind(dbx.Params{ "team": team }).
      One(&teamres)

    if err != nil { return err }

    bought := ParseRefList(teamres.Bought)
    pending := ParseRefList(teamres.Pending)
    found := SliceExclude(bought, prob)

    if !found { return dbErr("solve", "prob not owned") }

    pending = append(pending, prob)

    probres := struct{
      Diff string `db:"diff"`
      Name string `db:"name"`
      Text string `db:"text"`
    }{}
    err = txDao.DB().
      NewQuery("SELECT diff, name, text FROM probs WHERE id = {:prob} LIMIT 1").
      Bind(dbx.Params{ "prob": prob }).
      One(&probres)

    if err != nil { return err }

    teamname = teamres.Name
    diff = probres.Diff
    name = probres.Name

    check = GetRandomId()
    _, err = txDao.DB().
      NewQuery("INSERT INTO checks (id, team, prob, type, text, created, updated) VALUES ({:id}, {:team}, {:prob}, 'sol', {:text}, {:created}, {:updated})").
      Bind(dbx.Params{
        "id": GetRandomId(),
        "prob": prob,
        "text": sol,
        "team": team,
        "created": types.NowDateTime(),
        "updated": types.NowDateTime(),
      }).
      Execute()

    if err != nil { return err }

    return nil
  })
  return
}

func DBView(team string, prob string) (text string, diff string, name string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

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
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    _, err := txDao.DB().
      NewQuery("UPDATE teams SET chat = CONCAT(chat, 'p', CHAR(9), {:prob}, CHAR(9), {:text}, CHAR(11)) WHERE id = {:team}").
      Bind(dbx.Params{
        "prob": prob,
        "text": msg,
        "team": team,
      }).
      Execute()

    if err != nil { return err }
    
    res := []struct{
      Id string `db:"id"`
    }{}
    err = txDao.DB().
      NewQuery("UPDATE checks SET solution = {:text} WHERE team = {:team} AND prob = {:prob} AND type = 'msg' RETURNING id").
      Bind(dbx.Params{
        "prob": prob,
        "text": msg,
        "team": team,
      }).
      All(&res)
    if err != nil { return err }
    
    if len(res) == 1 { return nil }

    _, err = txDao.DB().
    NewQuery("INSERT INTO checks (id, team, prob, type, solution, created, updated) VALUES ({:id}, {:team}, {:prob}, 'msg', {:text}, {:created}, {:updated})").
      Bind(dbx.Params{
        "id": GetRandomId(),
        "prob": prob,
        "text": msg,
        "team": team,
        "created": types.NowDateTime(),
        "updated": types.NowDateTime(),
      }).
      Execute()

    if err != nil { return err }

    return nil
  })
  return
}

type probRes struct {
  Name string `db:"name" json:"name"`
  Diff string `db:"diff" json:"diff"`
  Text string `db:"text" json:"text"`
  Id string `db:"id" json:"id"`
}

type teamRes struct {
  Bought []probRes `json:"bought"`
  Pending []probRes `json:"pending"`
  Chat string `json:"chat"`
  Money int `json:"money"`
  Name string `json:"name"`
  OnlineRound int64 `json:"online_round"`
  OnlineRoundEnd int64 `json:"online_round_end"`
  Player1 string `json:"player1"`
  Player2 string `json:"player2"`
  Player3 string `json:"player3"`
  Player4 string `json:"player4"`
  Player5 string `json:"player5"`
}

func DBPlayerInitLoad(team string) (sres string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    teamres := struct {
      Bought string `db:"bought"`
      Pending string `db:"pending"`
      Chat string `db:"chat"`
      Money int `db:"money"`
      Name string `db:"name"`
      Player1 string `db:"player1"`
      Player2 string `db:"player2"`
      Player3 string `db:"player3"`
      Player4 string `db:"player4"`
      Player5 string `db:"player5"`
      Contest string `db:"contest"`
    }{}
    err := txDao.DB().
      NewQuery("SELECT bought, pending, chat, money, player1, player2, player3, player4, player5, name, contest FROM teams WHERE id = {:team} LIMIT 1").
      Bind(dbx.Params{ "team": team }).
      One(&teamres)

    if err != nil { return err }

    boughtprobsres := []probRes{}
    err = txDao.DB().
      NewQuery("SELECT id, name, diff, text FROM probs WHERE id IN " + RefListToInExpr(ParseRefList(teamres.Bought))).
      All(&boughtprobsres)

    if err != nil { return err }

    pendingprobsres := []probRes{}
    err = txDao.DB().
      NewQuery("SELECT id, name, diff, text FROM probs WHERE id IN " + RefListToInExpr(ParseRefList(teamres.Pending))).
      All(&pendingprobsres)

    if err != nil { return err }

    contres := struct{
      OnlineRound types.DateTime `db:"online_round"`
      OnlineRoundEnd types.DateTime `db:"online_round_end"`
    }{}
    err = txDao.DB().
      NewQuery("SELECT online_round, online_round_end FROM contests WHERE id = {:contest} LIMIT 1").
      Bind(dbx.Params{ "contest": teamres.Contest }).
      One(&contres)

    if err != nil { return err }

    ordelta := contres.OnlineRound.Time().Sub(time.Now()).Milliseconds()
    oredelta := contres.OnlineRoundEnd.Time().Sub(time.Now()).Milliseconds()

    res := teamRes{
      Bought: boughtprobsres,
      Pending: pendingprobsres,
      Chat: teamres.Chat,
      Money: teamres.Money,
      Name: teamres.Name,
      OnlineRound: ordelta,
      OnlineRoundEnd: oredelta,
      Player1: teamres.Player1,
      Player2: teamres.Player2,
      Player3: teamres.Player3,
      Player4: teamres.Player4,
      Player5: teamres.Player5,
    }

    sresb, _ := json.Marshal(res)
    sres = string(sresb)
    
    return nil
  })
  return
}

func DBAdminGrade(check string, team string, prob string, corr bool) (money int, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    teamres := struct{
      Money int `db:"money"`
      Bought string `db:"bought"`
      Pending string `db:"pending"`
      Solved string `db:"solved"`
    }{}
    err := txDao.DB().
      NewQuery("SELECT money, bought, pending, solved FROM teams WHERE id = {:team} LIMIT 1").
      Bind(dbx.Params{ "team": team }).
      One(&teamres)

    if err != nil { return err }

    target := ParseRefList(teamres.Bought)
    tstring := "bought"
    if corr {
      target = ParseRefList(teamres.Solved)
      tstring = "solved"
    }
    pending := ParseRefList(teamres.Pending)
    found := SliceExclude(pending, prob)

    if !found { return dbErr("solve", "prob not owned") }

    target = append(target, prob)

    probres := struct{
      Diff string `db:"diff"`
      Name string `db:"name"`
      Text string `db:"text"`
    }{}
    err = txDao.DB().
      NewQuery("SELECT diff, name, text FROM probs WHERE id = {:prob} LIMIT 1").
      Bind(dbx.Params{ "prob": prob }).
      One(&probres)

    if err != nil { return err }

    cost, ok := GetCost("+" + probres.Diff)
    if !ok { log.Error("invalid diff", team, prob) }

    money = teamres.Money
    if corr {
      money += cost
    }

    _, err = txDao.DB().
      NewQuery("UPDATE teams SET money = {:money}, " + tstring + " = {:target}, pending = {:pending} WHERE id = {:team}").
      Bind(dbx.Params{
        "money": money,
        "target": target,
        "pending": pending,
        "team": team,
      }).
      Execute()

    if err != nil { return err }

    _, err = txDao.DB().
      NewQuery("DELETE FROM checks WHERE id = {:check} LIMIT 1").
      Bind(dbx.Params{ "check": check }).
      Execute()

    if err != nil { return err }

    return nil
  })
  return 
}

func DBAdminMsg(team string, prob string, text string) (oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    _, err := txDao.DB().
      NewQuery("UPDATE teams SET chat = CONCAT(chat, 'a', CHAR(9), {:prob}, CHAR(9), {:text}, CHAR(11)) WHERE id = {:team}").
      Bind(dbx.Params{
        "prob": prob,
        "text": text,
        "team": team,
      }).
      Execute()

    if err != nil { return err }
    
    return nil
  })
  return
}

func DBAdminDismiss(check string) (team string, prob string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    checkres := struct{
      Team string `db:"team"`
      Prob string `db:"prob"`
    }{}
    err := txDao.DB().
      NewQuery("DELETE FROM checks WHERE id = {:check} LIMIT 1 RETURNING (team, prob)").
      Bind(dbx.Params{ "check": check }).
      One(&checkres)

    if err != nil { return err }

    team = checkres.Team
    prob = checkres.Prob

    return nil
  })
  return
}

func DBAdminView(prob string) (text string, sol string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    probres := struct{
      Text string `db:"text"`
      Sol string `db:"solution"`
    }{}
    err := txDao.DB().
      NewQuery("SELECT text, solution FROM probs WHERE id = {:prob} LIMIT 1").
      Bind(dbx.Params{ "prob": prob }).
      One(&probres)

    if err != nil { return err }

    text = probres.Text
    sol = probres.Sol
    
    return nil
  })
  return
}

