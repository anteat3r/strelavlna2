package src

import (
	"encoding/json"
	"errors"
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

type RWMutexWrap[T any] struct {
  m sync.RWMutex
  v T
}

func NewRWMutexWrap[T any](v T) RWMutexWrap[T] {
  return RWMutexWrap[T]{v: v}
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

type ChatMsg struct {
  Admin bool
  Prob ProbM
  Team TeamM
  Text string
}

type TeamS struct {
  Id string
  Name string
  Money int
  Bought map[ProbM]struct{}
  Pending map[ProbM]struct{}
  Solved map[ProbM]struct{}
  Sold map[ProbM]struct{}
  Chat []ChatMsg
  Banned bool
  LastBanned time.Time
  ChatChecksCache map[ProbM]string
  SolChecksCache map[ProbM]string
}
type TeamM = *RWMutexWrap[TeamS]

type ProbS struct {
  Id string
  Name string
  Diff string
  Text string
  Img string
  Solution string
  Workers []string
}
type ProbM = *RWMutexWrap[ProbS]

type CheckS struct {
  Id string
  Prob ProbM
  ProbId string
  Team TeamM
  TeamId string
  Msg bool
  Sol string
}
type CheckM = *RWMutexWrap[CheckS]

var (
  Costs = RWMutexWrap[map[string]int]{v: make(map[string]int)}
  Teams = RWMutexWrap[map[string]TeamM]{v: make(map[string]TeamM)}
  Probs = RWMutexWrap[map[string]ProbM]{v: make(map[string]ProbM)}
  Checks = RWMutexWrap[map[string]CheckM]{v: make(map[string]CheckM)}
  Info = RWMutexWrap[string]{}

  App *pocketbase.PocketBase
)

func GetRandomId() string {
  return security.RandomStringWithAlphabet(
    models.DefaultIdLength,
    models.DefaultIdAlphabet,
  )
}

func GetCost(diff string) (res int, ok bool) {
  Costs.RWith(func(v map[string]int) {
    res, ok = v[diff]
  })
  return
}

func GetWorker(workers []string) (resw string) {
  Workers.RWith(func(v map[string]struct{}) {
    for _, w := range workers {
      _, ok := v[w]
      if ok { 
        resw = w
        return
      }
    }
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

func DBSolve(team TeamM, prob string, sol string) (check string, diff string, teamname string, name string, csol string, updated bool, workers []string, oerr error) {

  var probres ProbM
  var ok bool
  Probs.RWith(func(v map[string]ProbM) { probres, ok = v[prob] })
  if !ok { oerr = dbErr("invalid prob id"); return }

  probres.RWith(func(probS ProbS) {
    diff = probS.Diff
    name = probS.Name
    workers = probS.Workers
  })

  team.With(func(teamS *TeamS) {
    _, ok = teamS.Bought[probres]
    if !ok { oerr = dbErr("prob not owned") }
    
    delete(teamS.Bought, probres)
    teamS.Pending[probres] = struct{}{}

    teamname = teamS.Name

    Checks.With(func(checksmap *map[string]*RWMutexWrap[CheckS]) {
      exists := false
      var exCheck CheckM
      for _, checkM := range *checksmap {
        checkM.RWith(func(checkS CheckS) {
          if checkS.TeamId == teamS.Id &&
             checkS.ProbId == prob {
               exists = true
             }
        })
        if exists { break }
      }
      if exists {
        exCheck.With(func(checkS *CheckS) {
          checkS.Msg = false
          checkS.Sol = sol
        })
        updated = true
        csol = sol
      } else {
        check := GetRandomId()
        (*checksmap)[check] = &RWMutexWrap[CheckS]{v: CheckS{
          Prob: probres,
          ProbId: prob,
          Team: team,
          TeamId: teamS.Id,
          Msg: false,
          Sol: sol,
        }}
      }
    })
  })
  return
}

// func DBView(team string, prob string) (text string, diff string, name string, oerr error) {
//   oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {
//
//     teamrec, err := txDao.FindRecordById("teams", team)
//     if err != nil { return err }
//
//     probrec, err := txDao.FindRecordById("probs", prob)
//     if err != nil { return err }
//
//     if !slices.Contains(teamrec.GetStringSlice("bought"), prob) && 
//          !slices.Contains(teamrec.GetStringSlice("pending"), prob) {
//       return dbClownErr("view", "prob not owned")
//     }
//
//     text = probrec.GetString("text")
//     diff = probrec.GetString("diff")
//     name = probrec.GetString("name")
//
//     return nil
//   })
//   return
// }

func DBPlayerMsg(team TeamM, prob string, msg string) (upd bool, teamname string, name string, diff string, check string, workers []string, chat string, oerr error) {

  var probres ProbM
  var ok bool
  Probs.RWith(func(v map[string]ProbM) { probres, ok = v[prob] })
  if !ok { oerr = dbErr("invalid prob id"); return }

  probres.RWith(func(probS ProbS) {
    diff = probS.Diff
    name = probS.Name
    workers = make([]string, len(probS.Workers))
    copy(workers, probS.Workers)
  })

  team.With(func(teamS *TeamS) {
    _, bought := teamS.Bought[probres]
    _, pending := teamS.Pending[probres]
    if !bought && !pending { oerr = dbErr("chat", "prob not owned"); return }
    teamS.Chat = append(teamS.Chat, ChatMsg{false, probres, team, msg})
    check, ok := teamS.ChatChecksCache[probres]
    if ok {
      var ocheck CheckM
      Checks.RWith(func(checksmap map[string]*RWMutexWrap[CheckS]) {
        for id, chck := range checksmap {
          if id == check {
            ocheck = chck
            break
          }
        }
      })
      upd = true
      ocheck.With(func(checkS *CheckS) {
        checkS.Sol = msg
      })
      return
    }
    check = GetRandomId()
    ncheck := &RWMutexWrap[CheckS]{
      v: CheckS{check, probres, prob, team, teamS.Id, false, msg},
    }
    Checks.With(func(checksmap *map[string]*RWMutexWrap[CheckS]) {
      (*checksmap)[check] = ncheck
    })
    teamS.ChatChecksCache[probres] = check
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

func DBPlayerInitLoad(team TeamM, idx int) (sres string, oerr error) {

  // team.RWith(func(teamS TeamS) {
  //   tRes := teamRes{
  //     nil,
  //     nil,
  //     "",
  //     teamS.Money,
  //     teamS.Name,
  //
  //   }
  // })



  oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {

    // teamres := struct {
    //   Bought string `db:"bought"`
    //   Pending string `db:"pending"`
    //   Sold string `db:"sold"`
    //   Solved string `db:"solved"`
    //   Chat string `db:"chat"`
    //   Money int `db:"money"`
    //   Name string `db:"name"`
    //   Banned bool `db:"banned"`
    //   Player1 string `db:"player1"`
    //   Player2 string `db:"player2"`
    //   Player3 string `db:"player3"`
    //   Player4 string `db:"player4"`
    //   Player5 string `db:"player5"`
    //   Contest string `db:"contest"`
    // }{}
    // err := txDao.DB().
    //   NewQuery("SELECT bought, pending, sold, solved, chat, money, banned, player1, player2, player3, player4, player5, name, contest FROM teams WHERE id = {:team} LIMIT 1").
    //   Bind(dbx.Params{ "team": team }).
    //   One(&teamres)
    // if err != nil { return err }

    // err := txDao.DB().
    //   Select("bought", "pending", "sold", "solved", "chat", "money", "banned", "player1", "player2", "player3", "player4", "player5", "name", "contest").
    //   From("teams").
    //   Where(dbx.HashExp{"id": team}).
    //   Limit(1).
    //   One(&teamres)
    // if err != nil { return err }
    //
    // boughtprobsres := []probRes{}
    // // err = txDao.DB().
    // //   NewQuery("SELECT id, name, diff, text, img FROM probs WHERE id IN " + RefListToInExpr(ParseRefList(teamres.Bought))).
    // //   All(&boughtprobsres)
    // // if err != nil { return err }
    //
    // err = txDao.DB().
    //   Select("id", "name", "diff", "text", "img").
    //   From("probs").
    //   Where(dbx.NewExp("id IN " + RefListToInExpr(ParseRefList(teamres.Bought)))).
    //   All(&boughtprobsres)
    // if err != nil { return err }
    //
    // pendingprobsres := []probRes{}
    // // err = txDao.DB().
    // //   NewQuery("SELECT id, name, diff, text, img FROM probs WHERE id IN " + RefListToInExpr(ParseRefList(teamres.Pending))).
    // //   All(&pendingprobsres)
    // // if err != nil { return err }
    //
    // err = txDao.DB().
    //   Select("id", "name", "diff", "text", "img").
    //   From("probs").
    //   Where(dbx.NewExp("id IN " + RefListToInExpr(ParseRefList(teamres.Pending)))).
    //   All(&pendingprobsres)
    // if err != nil { return err }
    //
    // soldres := struct{
    //   Cnt int `db:"count(*)"`
    // }{}
    // err = txDao.DB().
    //   NewQuery("SELECT count(*) FROM probs WHERE id IN " + RefListToInExpr(ParseRefList(teamres.Sold))).
    //   One(&soldres)
    // if err != nil { return err }
    //
    // solvedres := struct{
    //   Cnt int `db:"count(*)"`
    // }{}
    // err = txDao.DB().
    //   NewQuery("SELECT count(*) FROM probs WHERE id IN " + RefListToInExpr(ParseRefList(teamres.Solved))).
    //   One(&solvedres)
    //
    // if err != nil { return err }
    //
    // contres := struct{
    //   Name string `db:"name"`
    //   Info string `db:"info"`
    //   OnlineRound types.DateTime `db:"online_round"`
    //   OnlineRoundEnd types.DateTime `db:"online_round_end"`
    // }{}
    // err = txDao.DB().
    //   NewQuery("SELECT online_round, online_round_end, name, info FROM contests WHERE id = {:contest} LIMIT 1").
    //   Bind(dbx.Params{ "contest": teamres.Contest }).
    //   One(&contres)
    //
    // if err != nil { return err }
    //
    // checkres := []checkRes{}
    // err = txDao.DB().
    //   NewQuery("SELECT prob, solution FROM checks WHERE team = {:team}").
    //   Bind(dbx.Params{ "team": team }).
    //   All(&checkres)
    //
    // if err != nil { return err }
    //
    // ordelta := contres.OnlineRound.Time().Sub(time.Now()).Milliseconds()
    // oredelta := contres.OnlineRoundEnd.Time().Sub(time.Now()).Milliseconds()
    //
    // CostsMu.RLock()
    // costsc := maps.Clone(Costs)
    // CostsMu.RUnlock()
    //
    // res := teamRes{
    //   Bought: boughtprobsres,
    //   Pending: pendingprobsres,
    //   Chat: teamres.Chat,
    //   Money: teamres.Money,
    //   Name: teamres.Name,
    //   OnlineRound: ordelta,
    //   OnlineRoundEnd: oredelta,
    //   ContestName: contres.Name,
    //   ContestInfo: contres.Info,
    //   Checks: checkres,
    //   Banned: teamres.Banned,
    //   Player1: teamres.Player1,
    //   Player2: teamres.Player2,
    //   Player3: teamres.Player3,
    //   Player4: teamres.Player4,
    //   Player5: teamres.Player5,
    //   Costs: costsc,
    //   Rank: -1,
    //   NumSold: soldres.Cnt,
    //   NumSolved: solvedres.Cnt,
    //   Idx: idx,
    // }
    //
    // sresb, _ := json.Marshal(res)
    // sres = string(sresb)
    
    return nil
  })
  return
}

func DBAdminGrade(checkid string, corr bool) (money int, final bool, oerr error) {

  var check CheckM
  var ok bool
  Checks.RWith(func(v map[string]CheckM) { check, ok = v[checkid] })
  if !ok { oerr = dbErr("invalid check id"); return }

  check.With(func(checkS *CheckS) {
    team := checkS.Team
    prob := checkS.Prob
    var cost int
    prob.RWith(func(v ProbS) { cost, ok = GetCost("+" + v.Diff) })
    if !ok { oerr = dbErr("grade", "invalid cost") }

    team.RWith(func(v TeamS) {
      if v.Banned { oerr = dbErr("grade", "cannot grade banned team"); return }
      _, ok = v.Pending[prob]
      if !ok { oerr = dbErr("grade", "prob not pending"); return }

      target := v.Bought
      if corr {
        target = v.Solved
      }

      delete(target, prob)
      target[prob] = struct{}{}

      if corr {
        money = v.Money + cost
        v.Money = money
      }
    })
    if oerr != nil { return }

    Checks.With(func(v *map[string]*RWMutexWrap[CheckS]) {
      delete(*v, checkid)
    })
  })
  return 
}

func DBAdminMsg(teamid string, probid string, text string) (oerr error) {

  var team TeamM
  var ok bool
  Teams.RWith(func(v map[string]TeamM) { team, ok = v[teamid] })
  if !ok { oerr = dbErr("invalid team id"); return }

  var prob ProbM
  Probs.RWith(func(v map[string]ProbM) { prob, ok = v[probid] })
  if !ok { oerr = dbErr("invalid prob id"); return }

  team.With(func(v *TeamS) {
    v.Chat = append(v.Chat, ChatMsg{
      true,
      prob,
      team,
      text,
    })
  })
  return
}

func DBAdminDismiss(checkid string) (team string, prob string, oerr error) {
  Checks.With(func(v *map[string]*RWMutexWrap[CheckS]) {
    _, ok := (*v)[checkid]
    if !ok { oerr = dbErr("dismiss", "invalid check id"); return }
    delete(*v, checkid)
  })
  return
}

func DBAdminView(teamid string, probid string, sprob bool, schat bool) (text string, sol string, name string, diff string, chat string, banned string, lastbanned string, img string, oerr error) {
  if !sprob && !schat { return }

  var prob ProbM
  var ok bool
  Probs.RWith(func(v map[string]*RWMutexWrap[ProbS]) { prob, ok = v[probid] })
  if !ok { oerr = dbErr("view", "invalid prob id"); return }

  if sprob {
    prob.RWith(func(v ProbS) {
      text = v.Text
      sol = v.Solution
      name = v.Name
      diff = v.Diff
    })
  }

  if schat {
    var team TeamM
    var ok bool
    Teams.RWith(func(v map[string]*RWMutexWrap[TeamS]) { team, ok = v[teamid] })
    if !ok { oerr = dbErr("view", "invalid team id"); return }
    team.RWith(func(v TeamS) {
      banned = "no"
      if v.Banned { banned = "yes" }
      lastbanned = v.LastBanned.Format("2006-01-02 15:04:05.000Z")
      for i, m := range v.Chat {
        if m.Prob != prob { continue }
        chrole := "p"
        if m.Admin { chrole = "a" }
        chat += chrole + "\x09" + m.Text
        if i < len(v.Chat)-1 { chat += "\x0b" }
      }
    })
  }

  return
}

func DBAdminBan(teamid string) (oerr error) {

  var team TeamM
  var ok bool
  Teams.RWith(func(v map[string]*RWMutexWrap[TeamS]) { team, ok = v[teamid] })
  if !ok { oerr = dbErr("ban", "invalid team id"); return }

  team.With(func(v *TeamS) {
    v.Banned = true
    v.LastBanned = time.Now()
  })

  return
}

func DBAdminUnBan(teamid string) (oerr error) {

  var team TeamM
  var ok bool
  Teams.RWith(func(v map[string]*RWMutexWrap[TeamS]) { team, ok = v[teamid] })
  if !ok { oerr = dbErr("unban", "invalid team id"); return }

  team.With(func(v *TeamS) {
    v.Banned = false
    v.LastBanned = time.Time{}
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

    // for i, c := range checkres {
    //   if c.Work == "" { continue }
    //   checkres[i].Assign = GetWorker(c.Work)
    // }

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
  Info.With(func(v *string) { *v = info })
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
        // Assign: HashId(c.Work),
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

