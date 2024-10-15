package src

import (
	"encoding/json"
	"errors"
	"maps"
	"slices"
	"strings"
	"sync"
	"time"

	log "github.com/anteat3r/golog"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/tools/security"
	"github.com/pocketbase/pocketbase/tools/types"
)

type RWMutexWrap[T any] struct {
  m sync.RWMutex
  v T
}

func (w *RWMutexWrap[T]) With(f func(v *T)) {
  w.m.Lock()
  defer w.m.Unlock()
  f(&w.v)
}

func (w *RWMutexWrap[T]) RWith(f func(v T)) {
  w.m.RLock()
  defer w.m.RUnlock()
  f(w.v)
}

type TeamS struct {
  Money int
  Bought map[ProbM]struct{}
  Pending map[ProbM]struct{}
  Solved map[ProbM]struct{}
  Sold map[ProbM]struct{}
}
type TeamM = *RWMutexWrap[TeamS]

type ProbS struct {
  Id string
  Name string
  Diff string
  Text string
  Img string
  Solution string
}
type ProbM = *RWMutexWrap[ProbS]

type CheckS struct {
  Prob ProbM
  Team TeamM
}
type CheckM = *RWMutexWrap[CheckS]

var (
  _Costs = RWMutexWrap[map[string]int]{v: make(map[string]int)}
  Teams = RWMutexWrap[map[string]TeamM]{v: make(map[string]TeamM)}
  Probs = RWMutexWrap[map[string]ProbM]{v: make(map[string]ProbM)}
  Checks = RWMutexWrap[map[string]CheckM]{v: make(map[string]CheckM)}

  App *pocketbase.PocketBase
)

func GetRandomId() string {
  return security.RandomStringWithAlphabet(
    // security
  )
}

func GetCost(diff string) (res int, ok bool) {
  _Costs.RWith(func(v map[string]int) {
    res, ok = v[diff]
  })
  return
}

func dbErr(args ...string) error {
  return errors.New("err" + DELIM + strings.Join(args, DELIM))
}

func dbClownErr(args ...string) error {
  return errors.New("err" + DELIM + "clown" + DELIM + strings.Join(args, DELIM))
}

func SliceExclude[T comparable](s []T, v T) ([]T, bool) {
  found := false
  for i := range len(s) {
    if s[i] == v {
      found = true
      continue
    }
    if !found { continue }
    s[i-1] = s[i]
  }
  if found {
    return s[:len(s)-1], true
  } else {
    return s, false
  }
}

func DBSell(team TeamM, probid string) (money int, oerr error) {
    var probres ProbM
    var ok bool
    Probs.RWith(func(v map[string]ProbM) { probres, ok = v[probid] })
    if !ok { oerr = dbErr("invalid prob id"); return }

    var diff string
    probres.RWith(func(v ProbS) { diff = v.Diff })
    cost, ok := GetCost("-" + diff)
    if !ok { log.Error("invalid diff", probid, diff) }

    var found bool
    team.With(func(teamS *TeamS) {

      _, ok = teamS.Bought[probres]
      if !ok { oerr = dbErr("sell", "prob not owned") }

      delete(teamS.Bought, probres)
      teamS.Sold[probres] = struct{}{}

      teamS.Money += cost
      money = teamS.Money

    })
    if !found { oerr = dbClownErr("sell", "prob not owned"); return }

  return
}

func DBBuy(team TeamM, diff string) (prob string, money int, name string, text string, img string, oerr error) {
  diffcost, ok := GetCost(diff)
  if !ok { oerr = dbClownErr("buy", "invalid diff"); return }

  team.With(func(teamS *TeamS) {
    if diffcost > teamS.Money { oerr = dbErr("buy", "not enough money"); return }
    var probM ProbM
    Probs.RWith(func(probmap map[string]*RWMutexWrap[ProbS]) {
      for id, probv := range probmap {
        var valid bool
        probv.With(func(probS *ProbS) {
          _, bought := teamS.Bought[probv]
          _, pending := teamS.Bought[probv]
          _, solved := teamS.Bought[probv]
          _, sold := teamS.Bought[probv]
          valid = probS.Diff == diff && 
            !bought &&
            !pending &&
            !solved &&
            !sold
          if !valid { return }
          prob = id
          name = probS.Name
          text = probS.Text
          img = probS.Img
          probM = probv
        })
        if valid { break }
      }
      if prob == "" { oerr = dbErr("no prob found") }
    })

    teamS.Bought[probM] = struct{}{}

    teamS.Money -= diffcost
    money = teamS.Money
  })
  return
}

func DBBuyOld(team TeamM, diff string) (prob string, money int, name string, text string, img string, oerr error) {
  diffcost, ok := GetCost(diff)
  if !ok { oerr = dbClownErr("buy", "invalid diff"); return }

  team.With(func(teamS *TeamS) {
    if diffcost > teamS.Money { oerr = dbErr("buy", "not enough money"); return }
    var probM ProbM
    for probv, _ := range teamS.Sold {
      var valid bool
      probv.With(func(probS *ProbS) {
        valid = probS.Diff == diff 
        if !valid { return }
        prob = probS.Id
        name = probS.Name
        text = probS.Text
        img = probS.Img
        probM = probv
      })
      if valid { break }
    }

    if prob == "" { oerr = dbErr("buyold", "no prob found"); return }
    delete(teamS.Sold, probM)
    teamS.Bought[probM] = struct{}{}

    teamS.Money -= diffcost
    money = teamS.Money
  })
  return
}

func DBSolve(team TeamM, prob string, sol string) (check string, diff string, teamname string, name string, csol string, updated bool, workers string, oerr error) {

  var probres ProbM
  var ok bool
  Probs.RWith(func(v map[string]ProbM) { probres, ok = v[prob] })
  if !ok { oerr = dbErr("invalid prob id"); return }

  team.With(func(teamS *TeamS) {
    _, ok = teamS.Bought[probres]
    if !ok { oerr = dbErr("prob not owned") }
    
    delete(teamS.Bought, probres)
    teamS.Pending[probres] = struct{}{}

    Checks.With(func(checksmap *map[string]*RWMutexWrap[CheckS]) {
      // checksmap[]
    })

  })



  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    teamres := struct{
      Name string `db:"name"`
      Bought string `db:"bought"`
      Pending string `db:"pending"`
    }{}
    // err := txDao.DB().
    //   NewQuery("SELECT name, bought, pending FROM teams WHERE id = {:team} LIMIT 1").
    //   Bind(dbx.Params{ "team": team }).
    //   One(&teamres)
    // if err != nil { return err }

    err := txDao.DB().
      Select("name", "bought", "pending").
      From("teams").
      Where(dbx.HashExp{"id": team}).
      Limit(1).
      One(&teamres)
    if err != nil { return err }

    bought := ParseRefList(teamres.Bought)
    pending := ParseRefList(teamres.Pending)
    bought, found := SliceExclude(bought, prob)

    if !found { return dbErr("solve", "prob not owned") }

    pending = append(pending, prob)

    probres := struct{
      Diff string `db:"diff"`
      Name string `db:"name"`
      Text string `db:"text"`
      Sol string `db:"solution"`
      Workers string `db:"workers"`
    }{}
    // err = txDao.DB().
    //   NewQuery("SELECT diff, name, text, workers FROM probs WHERE id = {:prob} LIMIT 1").
    //   Bind(dbx.Params{ "prob": prob }).
    //   One(&probres)
    // if err != nil { return err }

    err = txDao.DB().
      Select("diff", "name", "text", "solution", "workers").
      From("probs").
      Where(dbx.HashExp{"id": prob}).
      Limit(1).
      One(&teamres)
    if err != nil { return err }

    teamname = teamres.Name
    diff = probres.Diff
    name = probres.Name
    csol = probres.Sol
    workers = probres.Workers
    
    // _, err = txDao.DB().
    //   NewQuery("UPDATE teams SET pending = {:pending}, bought = {:bought} WHERE id = {:id}").
    //   Bind(dbx.Params{
    //     "pending": StringifyRefList(pending),
    //     "bought": StringifyRefList(bought),
    //     "id": team,
    //   }).
    //   Execute()
    // if err != nil { return err }

    _, err = txDao.DB().
      Update(
        "teams",
        dbx.Params{
          "pending": StringifyRefList(pending),
          "bought": StringifyRefList(bought),
        },
        dbx.HashExp{"id": team},
      ).
      Execute()
    if err != nil { return err }


    ucres := []struct{
      Id string `db:"id"`
    }{}
    err = txDao.DB().
      NewQuery("UPDATE checks SET solution = {:text}, type = 'sol' WHERE team = {:team} AND prob = {:prob} RETURNING id").
      Bind(dbx.Params{
        "text": sol,
        "team": team,
        "prob": prob,
      }).
      All(&ucres)

    if len(ucres) >= 1 {
      updated = true
      check = ucres[0].Id
      return nil
    }

    check = GetRandomId()
    // _, err = txDao.DB().
    //   NewQuery("INSERT INTO checks (id, team, prob, type, solution, created, updated) VALUES ({:id}, {:team}, {:prob}, 'sol', {:text}, {:created}, {:updated})").
    //   Bind(dbx.Params{
    //     "id": check,
    //     "prob": prob,
    //     "text": sol,
    //     "team": team,
    //     "created": types.NowDateTime(),
    //     "updated": types.NowDateTime(),
    //   }).
    //   Execute()
    // if err != nil { return err }

    _, err = txDao.DB().
      Insert(
        "checks",
        dbx.Params{
          "id": check,
          "prob": prob,
          "text": sol,
          "team": team,
          "created": types.NowDateTime(),
          "updated": types.NowDateTime(),
        },
      ).
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

func DBPlayerMsg(team string, prob string, msg string) (upd bool, teamname string, name string, diff string, check string, workers string, chat string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    teamres := struct{
      Banned bool `db:"banned"`
      Name string `db:"name"`
      Bought string `db:"bought"`
      Pending string `db:"pending"`
      Chat string `db:"chat"`
    }{}
    err := txDao.DB().
      NewQuery("UPDATE teams SET chat = CONCAT(chat, 'p', CHAR(9), {:prob}, CHAR(9), {:text}, CHAR(11)) WHERE id = {:team} RETURNING banned, name, bought, pending, chat").
      Bind(dbx.Params{
        "prob": prob,
        "text": msg,
        "team": team,
      }).
      One(&teamres)

    if err != nil { return err }

    if teamres.Banned { return dbClownErr("chat", "banned") }

    if !slices.Contains(ParseRefList(teamres.Bought), prob) &&
       !slices.Contains(ParseRefList(teamres.Pending), prob) &&
       prob != "" {
      return dbErr("prob not owned")
    }
    
    res := []struct{
      Id string `db:"id"`
    }{}
    // err = txDao.DB().
    //   NewQuery("SELECT id FROM checks WHERE team = {:team} AND prob = {:prob}").
    //   Bind(dbx.Params{
    //     "prob": prob,
    //     "team": team,
    //   }).
    //   All(&res)
    // if err != nil { return err }

    err = txDao.DB().
      Select("id").
      From("checks").
      Where(dbx.HashExp{"team": team, "prob": prob}).
      All(&res)
    if err != nil { return err }
    
    if len(res) >= 1 {  
      check = res[0].Id
      upd = true
      return nil
    }

    chlines := strings.Split(teamres.Chat, "\x0b")
    for i, l := range chlines {
      line := strings.Split(l, "\x09")
      if len(line) <= 1 { continue }
      if line[1] != prob { continue }
      chat += line[0] + "\x09" + line[2]
      if i < len(chlines)-1 { chat += "\x0b" }
    }

    cid := GetRandomId()
    // _, err = txDao.DB().
    //   NewQuery("INSERT INTO checks (id, team, prob, type, solution, created, updated) VALUES ({:id}, {:team}, {:prob}, 'msg', {:text}, {:created}, {:updated})").
    //   Bind(dbx.Params{
    //     "id": cid,
    //     "prob": prob,
    //     "text": msg,
    //     "team": team,
    //     "created": types.NowDateTime(),
    //     "updated": types.NowDateTime(),
    //   }).
    //   Execute()
    // if err != nil { return err }

    txDao.DB().
      Insert(
        "checks",
        dbx.Params{
          "id": cid,
          "prob": prob,
          "text": msg,
          "team": team,
          "created": types.NowDateTime(),
          "updated": types.NowDateTime(),
        },
      ).
      Execute()
    if err != nil { return err }

    probres := struct{
      Diff string `db:"diff"`
      Name string `db:"name"`
      Workers string `db:"workers"`
    }{}
    // err = txDao.DB().
    //   NewQuery("SELECT diff, name, workers FROM probs WHERE id = {:id} LIMIT 1").
    //   Bind(dbx.Params{
    //     "id": prob,
    //   }).
    //   One(&probres)
    // if err != nil { return err }

    err = txDao.DB().
      Select("diff", "name", "workers").
      From("probs").
      Where(dbx.HashExp{"id": prob}).
      Limit(1).
      One(&probres)
    if err != nil { return err }

    diff = probres.Diff
    name = probres.Name
    teamname = teamres.Name
    check = cid
    workers = probres.Workers

    return nil
  })
  return
}

type probRes struct {
  Name string `db:"name" json:"name"`
  Diff string `db:"diff" json:"diff"`
  Text string `db:"text" json:"text"`
  Id string `db:"id" json:"id"`
  Img string `db:"img" json:"image"`
}

type teamRes struct {
  Bought []probRes `json:"bought"`
  Pending []probRes `json:"pending"`
  Chat string `json:"chat"`
  Money int `json:"money"`
  Name string `json:"name"`
  OnlineRound int64 `json:"online_round"`
  OnlineRoundEnd int64 `json:"online_round_end"`
  ContestName string `json:"contest_name"`
  ContestInfo string `json:"contest_info"`
  Costs map[string]int `json:"costs"`
  Checks []checkRes `json:"checks"`
  Rank int `json:"rank"`
  NumSold int `json:"numsold"`
  NumSolved int `json:"numsolved"`
  Idx int `json:"idx"`
  Banned bool `json:"banned"`
  Player1 string `json:"player1"`
  Player2 string `json:"player2"`
  Player3 string `json:"player3"`
  Player4 string `json:"player4"`
  Player5 string `json:"player5"`
}

type checkRes struct{
  Prob string `db:"prob" json:"probid"`
  Sol string `db:"solution" json:"solution"`
}

func DBPlayerInitLoad(team string, idx int) (sres string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    teamres := struct {
      Bought string `db:"bought"`
      Pending string `db:"pending"`
      Sold string `db:"sold"`
      Solved string `db:"solved"`
      Chat string `db:"chat"`
      Money int `db:"money"`
      Name string `db:"name"`
      Banned bool `db:"banned"`
      Player1 string `db:"player1"`
      Player2 string `db:"player2"`
      Player3 string `db:"player3"`
      Player4 string `db:"player4"`
      Player5 string `db:"player5"`
      Contest string `db:"contest"`
    }{}
    // err := txDao.DB().
    //   NewQuery("SELECT bought, pending, sold, solved, chat, money, banned, player1, player2, player3, player4, player5, name, contest FROM teams WHERE id = {:team} LIMIT 1").
    //   Bind(dbx.Params{ "team": team }).
    //   One(&teamres)
    // if err != nil { return err }

    err := txDao.DB().
      Select("bought", "pending", "sold", "solved", "chat", "money", "banned", "player1", "player2", "player3", "player4", "player5", "name", "contest").
      From("teams").
      Where(dbx.HashExp{"id": team}).
      Limit(1).
      One(&teamres)
    if err != nil { return err }

    boughtprobsres := []probRes{}
    // err = txDao.DB().
    //   NewQuery("SELECT id, name, diff, text, img FROM probs WHERE id IN " + RefListToInExpr(ParseRefList(teamres.Bought))).
    //   All(&boughtprobsres)
    // if err != nil { return err }

    err = txDao.DB().
      Select("id", "name", "diff", "text", "img").
      From("probs").
      Where(dbx.NewExp("id IN " + RefListToInExpr(ParseRefList(teamres.Bought)))).
      All(&boughtprobsres)
    if err != nil { return err }

    pendingprobsres := []probRes{}
    // err = txDao.DB().
    //   NewQuery("SELECT id, name, diff, text, img FROM probs WHERE id IN " + RefListToInExpr(ParseRefList(teamres.Pending))).
    //   All(&pendingprobsres)
    // if err != nil { return err }

    err = txDao.DB().
      Select("id", "name", "diff", "text", "img").
      From("probs").
      Where(dbx.NewExp("id IN " + RefListToInExpr(ParseRefList(teamres.Pending)))).
      All(&pendingprobsres)
    if err != nil { return err }

    soldres := struct{
      Cnt int `db:"count(*)"`
    }{}
    err = txDao.DB().
      NewQuery("SELECT count(*) FROM probs WHERE id IN " + RefListToInExpr(ParseRefList(teamres.Sold))).
      One(&soldres)
    if err != nil { return err }

    solvedres := struct{
      Cnt int `db:"count(*)"`
    }{}
    err = txDao.DB().
      NewQuery("SELECT count(*) FROM probs WHERE id IN " + RefListToInExpr(ParseRefList(teamres.Solved))).
      One(&solvedres)

    if err != nil { return err }

    contres := struct{
      Name string `db:"name"`
      Info string `db:"info"`
      OnlineRound types.DateTime `db:"online_round"`
      OnlineRoundEnd types.DateTime `db:"online_round_end"`
    }{}
    err = txDao.DB().
      NewQuery("SELECT online_round, online_round_end, name, info FROM contests WHERE id = {:contest} LIMIT 1").
      Bind(dbx.Params{ "contest": teamres.Contest }).
      One(&contres)

    if err != nil { return err }

    checkres := []checkRes{}
    err = txDao.DB().
      NewQuery("SELECT prob, solution FROM checks WHERE team = {:team}").
      Bind(dbx.Params{ "team": team }).
      All(&checkres)

    if err != nil { return err }

    ordelta := contres.OnlineRound.Time().Sub(time.Now()).Milliseconds()
    oredelta := contres.OnlineRoundEnd.Time().Sub(time.Now()).Milliseconds()

    CostsMu.RLock()
    costsc := maps.Clone(Costs)
    CostsMu.RUnlock()

    res := teamRes{
      Bought: boughtprobsres,
      Pending: pendingprobsres,
      Chat: teamres.Chat,
      Money: teamres.Money,
      Name: teamres.Name,
      OnlineRound: ordelta,
      OnlineRoundEnd: oredelta,
      ContestName: contres.Name,
      ContestInfo: contres.Info,
      Checks: checkres,
      Banned: teamres.Banned,
      Player1: teamres.Player1,
      Player2: teamres.Player2,
      Player3: teamres.Player3,
      Player4: teamres.Player4,
      Player5: teamres.Player5,
      Costs: costsc,
      Rank: -1,
      NumSold: soldres.Cnt,
      NumSolved: solvedres.Cnt,
      Idx: idx,
    }

    sresb, _ := json.Marshal(res)
    sres = string(sresb)
    
    return nil
  })
  return
}

func DBAdminGrade(check string, team string, prob string, corr bool) (money int, final bool, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    teamres := struct{
      Money int `db:"money"`
      Bought string `db:"bought"`
      Pending string `db:"pending"`
      Solved string `db:"solved"`
      Banned bool `db:"banned"`
    }{}
    err := txDao.DB().
      NewQuery("SELECT money, bought, pending, solved, banned FROM teams WHERE id = {:team} LIMIT 1").
      Bind(dbx.Params{ "team": team }).
      One(&teamres)

    if err != nil { return err }

    if teamres.Banned { return dbErr("grade", "cannost grade while team is banned") }

    target := ParseRefList(teamres.Bought)
    tstring := "bought"
    if corr {
      target = ParseRefList(teamres.Solved)
      tstring = "solved"
    }
    pending := ParseRefList(teamres.Pending)
    pending, found := SliceExclude(pending, prob)

    if !found { return dbErr("grade", "prob not owned") }

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
    if corr { money += cost }

    _, err = txDao.DB().
      NewQuery("UPDATE teams SET money = {:money}, " + tstring + " = {:target}, pending = {:pending} WHERE id = {:team}").
      Bind(dbx.Params{
        "money": money,
        "target": StringifyRefList(target),
        "pending": StringifyRefList(pending),
        "team": team,
      }).
      Execute()

    if err != nil { return err }

    _, err = txDao.DB().
      NewQuery("DELETE FROM checks WHERE id = {:check}").
      Bind(dbx.Params{ "check": check }).
      Rows()
    if err != nil { return err }

    ActiveContestMu.Lock()
    ac := ActiveContest
    acend := ActiveContestEnd
    ActiveContestMu.Unlock()
    if ac == "" || time.Now().Before(acend) { return nil }

    checkcnt := 0
    err = txDao.DB().
      Select("count(*)").
      From("checks").
      One(&checkcnt)
    if err != nil { return err }

    if checkcnt == 0 { final = true }

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
      NewQuery("DELETE FROM checks WHERE id = {:check} RETURNING team, prob").
      Bind(dbx.Params{ "check": check }).
      One(&checkres)

    if err != nil { return err }

    team = checkres.Team
    prob = checkres.Prob

    return nil
  })
  return
}

func DBAdminView(team string, prob string, sprob bool, schat bool) (text string, sol string, name string, diff string, chat string, banned string, lastbanned string, img string, oerr error) {
  if !sprob && !schat { return }
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    if sprob {
      probres := struct{
        Text string `db:"text"`
        Sol string `db:"solution"`
        Diff string `db:"diff"`
        Name string `db:"name"`
        Img string `db:"img"`
      }{}
      err := txDao.DB().
        NewQuery("SELECT text, solution, diff, name, img FROM probs WHERE id = {:prob} LIMIT 1").
        Bind(dbx.Params{ "prob": prob }).
        One(&probres)

      if err != nil { return err }

      text = probres.Text
      sol = probres.Sol
      diff = probres.Diff
      name = probres.Name
      img = probres.Img
    }

    if schat {
      teamres := struct{
        Chat string `db:"chat"`
        Banned bool `db:"banned"`
        LastBanned types.DateTime `db:"last_banned"`
      }{}
      err := txDao.DB().
        NewQuery("SELECT chat, banned, last_banned FROM teams WHERE id = {:team} LIMIT 1").
        Bind(dbx.Params{ "team": team }).
        One(&teamres)

      if err != nil { return err }

      bres := "no"
      if teamres.Banned {
        bres = "yes"
      }

      chat = ""
      chlines := strings.Split(teamres.Chat, "\x0b")
      for i, l := range chlines {
        line := strings.Split(l, "\x09")
        if len(line) <= 1 { continue }
        if line[1] != prob { continue }
        chat += line[0] + "\x09" + line[2]
        if i < len(chlines)-1 { chat += "\x0b" }
      }

      banned = bres
      lastbanned = teamres.LastBanned.String()
    }

    return nil
  })
  return
}

func DBAdminBan(team string) (oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    _, err := txDao.DB().
      NewQuery("UPDATE teams SET banned = TRUE, last_banned = {:last_banned} WHERE id = {:id}").
      Bind(dbx.Params{
        "id": team,
        "last_banned": types.NowDateTime(),
      }).
      Execute()

    if err != nil { return err }

    return nil
  })
  return
}

func DBAdminUnBan(team string) (oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    _, err := txDao.DB().
      NewQuery("UPDATE teams SET banned = FALSE, last_banned = '' WHERE id = {:id}").
      Bind(dbx.Params{ "id": team }).
      Execute()

    if err != nil { return err }

    return nil
  })
  return
}

type adminInitLoad struct {
  Checks []adminCheckRes `json:"checks"` 
  Id string `json:"idx"`
  OnlineRound int64 `json:"online_round"`
  OnlineRoundEnd int64 `json:"online_round_end"`
  ContestName string `json:"contest_name"`
  ContestInfo string `json:"contest_info"`
  Banned []adminBannedRes `json:"banned"`
}

type adminBannedRes struct{
  Id string `db:"id" json:"id"`
  LastBanned string `db:"last_banned" json:"lastbanned"`
}

type adminCheckRes struct {
  Team string `db:"team" json:"teamid"`
  Prob string `db:"prob" json:"probid"`
  Diff string `db:"diff" json:"probdiff"`
  ProbName string `db:"name" json:"probname"`
  Id string `db:"id" json:"id"`
  Assign string `json:"assign"`
  TeamName string `db:"teamname" json:"teamname"`
  Type string `db:"type" json:"type"`
  Solution string `db:"solution" json:"team_message"`
  Work string `db:"workers"`
}

func DBAdminInitLoad(id string) (res string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    banres := []adminBannedRes{}
    err := txDao.DB().
      NewQuery("SELECT id, last_banned FROM teams WHERE banned = TRUE").
      All(&banres)
    if err != nil { return err }

    checkres := []adminCheckRes{}
    err = txDao.DB().
      NewQuery("SELECT checks.team, checks.prob, checks.id, checks.type, checks.solution, teams.name AS teamname, probs.diff, probs.name, probs.workers FROM checks INNER JOIN teams ON teams.id = checks.team INNER JOIN probs ON probs.id = checks.prob").
      All(&checkres)
    if err != nil { return err }

    gcheckres := []struct{
      Team string `db:"team"`
      Id string `db:"id"`
      Assign string `json:"assign"`
      TeamName string `db:"teamname"`
      Type string `db:"type"`
      Solution string `db:"solution"`
    }{}
    err = txDao.DB().
      NewQuery("SELECT checks.team, checks.prob, checks.id, checks.type, checks.solution, teams.name AS teamname FROM checks INNER JOIN teams ON teams.id = checks.team WHERE checks.prob = ''").
      All(&gcheckres)
    if err != nil { return err }

    for _, c := range gcheckres {
      checkres = append(checkres, adminCheckRes{
        Team: c.Team,
        Id: c.Id,
        Assign: c.Assign,
        TeamName: c.TeamName,
        Type: c.Type,
        Solution: c.Solution,
      })
    }

    for i, c := range checkres {
      if c.Work == "" { continue }
      checkres[i].Assign = HashId(c.Work)
    }

    ActiveContestMu.RLock()
    ac := ActiveContest
    ActiveContestMu.RUnlock()

    contres := struct{
      OnlineRound types.DateTime `db:"online_round"`
      OnlineRoundEnd types.DateTime `db:"online_round_end"`
      Name string `db:"name"`
      Info string `db:"info"`
    }{}
    err = txDao.DB().
      NewQuery("SELECT online_round, online_round_end, name, info FROM contests WHERE id = {:contest} LIMIT 1").
      Bind(dbx.Params{ "contest": ac }).
      One(&contres)

    ordelta := contres.OnlineRound.Time().Sub(time.Now()).Milliseconds()
    oredelta := contres.OnlineRoundEnd.Time().Sub(time.Now()).Milliseconds()

    resr := adminInitLoad{
      Checks: checkres,
      Id: id,
      OnlineRound: ordelta,
      OnlineRoundEnd: oredelta,
      Banned: banres,
      ContestName: contres.Name,
      ContestInfo: contres.Info,
    }

    resb, err := json.Marshal(resr)
    if err != nil { return err }

    res = string(resb)

    return nil
  })
  return
}

func DBAdminSetInfo(info string) (oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    ActiveContestMu.RLock()
    res := ActiveContest
    ActiveContestMu.RUnlock()

    _, err := txDao.DB().
      NewQuery("UPDATE contests SET info = {:info} WHERE id = {:contest}").
      Bind(dbx.Params{ "contest": res, "info": info }).
      Execute()
    if err != nil { return err }

    return nil
  })
  return
}

type reassignRes struct {
  Id string `json:"id"`
  Assign string `json:"assign"`
}

func DBReAssign() (res string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {
    
    checkres := []struct{
      Id string `db:"id"`
      Work string `db:"workers"`
    }{}
    err := txDao.DB().
      NewQuery("SELECT checks.id, probs.workers FROM checks INNER JOIN probs ON probs.id = checks.prob").
      All(&checkres)
    if err != nil { return err }

    resl := make([]reassignRes, len(checkres))
    for i, c := range checkres {
      resl[i] = reassignRes{
        Id: c.Id,
        Assign: HashId(c.Work),
      }
    }

    resb, err := json.Marshal(resl)
    if err != nil { return err }

    res = string(resb)

    return nil

  })
  return
}

func DBAdminEditProb(prob string, ndiff string, nname string, ntext string, nsol string) (teams []string, oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    _, err := txDao.DB().
      NewQuery("UPDATE probs SET diff = {:diff}, name = {:name}, text = {:text}, solution = {:sol} WHERE id = {:id}").
      Bind(dbx.Params{
        "diff": ndiff,
        "name": nname,
        "text": ntext,
        "solution": nsol,
        "id": prob,
      }).Execute()
    if err != nil { return err }

    teamres := []string{}
    err = txDao.DB().
      NewQuery("SELECT id FROM teams WHERE bought LIKE {:prob} OR pending LIKE {:prob}").
      Bind(dbx.Params{ "prob": prob }).
      All(&teamres)
    if err != nil { return nil }

    teams = teamres

    return nil
  })
  return
}

func DBSaveLog(team string, log string) (oerr error) {
  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {
    _, err := txDao.DB().Update(
        "teams",
        dbx.Params{"log": log},
        dbx.HashExp{"id": team},
      ).Execute()
    return err
  })
  return
}

