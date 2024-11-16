package src

import (
	"encoding/json"
	"errors"
	"io/fs"
	"os"
	"strings"
	"sync"
	"time"

	log "github.com/anteat3r/golog"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/security"
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

func (w *RWMutexWrap[T]) MarshalJSON() ([]byte, error) {
  w.m.RLock()
  defer w.m.RUnlock()
  return json.Marshal(struct{v T}{v: w.v})
}

func (w *RWMutexWrap[T]) UnmarshalJSON(b []byte) error {
  w.m.Lock()
  defer w.m.Unlock()
  var res struct{v T}
  err := json.Unmarshal(b, &res)
  if err != nil { return err }
  w.v = res.v
  return nil
}

func (w *RWMutexWrap[T]) GetPrimitiveVal() (v T) {
  w.m.RLock()
  defer w.m.RUnlock()
  v = w.v
  return
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
  Players [5]string
  Stats TeamStats
}
type TeamM = *RWMutexWrap[TeamS]

type moneyHistRec struct {
  Money int `json:"money"`
  Time time.Time `json:"time"`
}
type TeamStats struct {
  NumSold int `json:"numsold"`
  NumBought int `json:"numbought"`
  NumSolved int `json:"numsolved"`
  MoneyHist []moneyHistRec `json:"moneyhist"`
}

type ProbS struct {
  Id string
  Name string
  Diff string
  Text string
  Img string
  Solution string
  Workers []string
  Graph *Graph
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
  Costs = NewRWMutexWrap(make(map[string]int))
  Teams = NewRWMutexWrap(make(map[string]TeamM))
  Probs = NewRWMutexWrap(make(map[string]ProbM))
  Checks = NewRWMutexWrap(make(map[string]CheckM))
  ContInfo = RWMutexWrap[string]{}
  ContName = NewRWMutexWrap("")

  DBData = map[string]any{
    "costs": &Costs,
    "teams": &Teams,
    "probs": &Probs,
    "checks": &Checks,
    "continfo": &ContInfo,
    "contname": &ContName,
  }

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

      teamS.Stats.MoneyHist = append(teamS.Stats.MoneyHist, moneyHistRec{
        Time: time.Now(),
        Money: money,
      })
      teamS.Stats.NumSold ++

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
    teamS.Stats.MoneyHist = append(teamS.Stats.MoneyHist, moneyHistRec{
      Time: time.Now(),
      Money: money,
    })
    teamS.Stats.NumBought ++
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

    teamname = teamS.Name

    Checks.With(func(checksmap *map[string]*RWMutexWrap[CheckS]) {
      exCheckid, exists := teamS.ChatChecksCache[probres]
      if exists {
        exCheck, ok := (*checksmap)[exCheckid]
        if !ok { oerr = dbErr("solve", "invalid check cache"); return }
        exCheck.With(func(checkS *CheckS) {
          checkS.Msg = false
          checkS.Sol = sol
        })
        updated = true
        csol = sol
        delete(teamS.ChatChecksCache, probres)
        teamS.SolChecksCache[probres] = prob
      } else {
        check := GetRandomId()
        _, ok = (*checksmap)[check]
        if ok { oerr = dbErr("check id collision"); return }
        ncheck := NewRWMutexWrap(CheckS{
          Prob: probres,
          ProbId: prob,
          Team: team,
          TeamId: teamS.Id,
          Msg: false,
          Sol: sol,
        })
        (*checksmap)[check] = &ncheck
        teamS.SolChecksCache[probres] = check
      }
    })
    if oerr != nil { return }
    
    delete(teamS.Bought, probres)
    teamS.Pending[probres] = struct{}{}
  })
  return
}

/*
msg: +chat, -dismiss, -solve
sol: +solve, -grade
*/

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

  if prob == "" {
    team.With(func(teamS *TeamS) {
      teamS.Chat = append(teamS.Chat, ChatMsg{false, nil, team, msg})
      var ok bool
      check, ok = teamS.ChatChecksCache[nil]
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
        v: CheckS{check, nil, prob, team, teamS.Id, true, msg},
      }
      Checks.With(func(checksmap *map[string]*RWMutexWrap[CheckS]) {
        (*checksmap)[check] = ncheck
      })
      teamS.ChatChecksCache[nil] = check
    })

    return
  }

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
    check, ok = teamS.ChatChecksCache[probres]
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

  res := teamRes{ Rank: -1 }
  team.RWith(func(t TeamS) {
    res.Money = t.Money
    res.Name = t.Name
    res.Banned = t.Banned
    res.Player1 = t.Players[0]
    res.Player2 = t.Players[1]
    res.Player3 = t.Players[2]
    res.Player4 = t.Players[3]
    res.Player5 = t.Players[4]
    res.NumSold = len(t.Sold)
    res.NumSolved = len(t.Solved)
    res.Bought = make([]probRes, 0, len(t.Bought))
    for pr, _ := range t.Bought {
      pr.RWith(func(v ProbS) { res.Bought = append(res.Bought, probRes{
        Name: v.Name,
        Id: v.Id,
        Diff: v.Diff,
        Text: v.Text,
        Img: v.Img,
      }) })
    }
    res.Pending = make([]probRes, 0, len(t.Pending))
    for pr, _ := range t.Pending {
      pr.RWith(func(v ProbS) { res.Pending = append(res.Pending, probRes{
        Name: v.Name,
        Id: v.Id,
        Diff: v.Diff,
        Text: v.Text,
        Img: v.Img,
      }) })
    }
    for _, m := range t.Chat {
      chrole := "p"
      if m.Admin { chrole = "a" }
      probid := ""
      if m.Prob != nil { m.Prob.RWith(func(v ProbS) { probid = v.Id }) }
      res.Chat += chrole + "\x09" + probid + "\x09" + m.Text + "\x0b"
    }
    Checks.RWith(func(checksmap map[string]*RWMutexWrap[CheckS]) {
      res.Checks = make([]checkRes, 0, len(t.ChatChecksCache) + len(t.SolChecksCache))
      for p, c := range t.ChatChecksCache {
        probid := ""
        if p != nil { p.RWith(func(v ProbS) { probid = v.Id }) }
        sol := ""
        checksmap[c].RWith(func(v CheckS) { sol = v.Sol })
        res.Checks = append(res.Checks, checkRes{
          Prob: probid,
          Sol: sol,
        })
      }
      for p, c := range t.SolChecksCache {
        probid := ""
        p.RWith(func(v ProbS) { probid = v.Id })
        sol := ""
        checksmap[c].RWith(func(v CheckS) { sol = v.Sol })
        res.Checks = append(res.Checks, checkRes{
          Prob: probid,
          Sol: sol,
        })
      }
    })
  })

  res.Costs = make(map[string]int)
  Costs.RWith(func(vm map[string]int) {
    for k, v := range vm { res.Costs[k] = v }
  })

  ContName.RWith(func(v string) { res.ContestName = v })
  ContInfo.RWith(func(v string) { res.ContestInfo = v })
  ActiveContest.RWith(func(v ActiveContStruct) {
    res.OnlineRound = int64(v.Start.Sub(time.Now()).Milliseconds())
    res.OnlineRoundEnd = int64(v.End.Sub(time.Now()).Milliseconds())
  })

  res.Idx = idx

  bres, err := json.Marshal(res)
  if err != nil { oerr = err; return }

  sres = string(bres)

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
        v.Stats.MoneyHist = append(v.Stats.MoneyHist, moneyHistRec{
          Time: time.Now(),
          Money: money,
        })
        v.Stats.NumSolved ++
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

  if probid == "" {
    var team TeamM
    var ok bool
    Teams.RWith(func(v map[string]TeamM) { team, ok = v[teamid] })
    if !ok { oerr = dbErr("invalid team id"); return }

    team.With(func(v *TeamS) {
      v.Chat = append(v.Chat, ChatMsg{
        true,
        nil,
        team,
        text,
      })
    })
    return
  }

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
    ch, ok := (*v)[checkid]
    if !ok { oerr = dbErr("dismiss", "invalid check id"); return }
    ch.RWith(func(v CheckS) {
      if !v.Msg { oerr = dbErr("dismiss", "cannot dismiss solution check"); return }
      v.Team.With(func(t *TeamS) { delete(t.ChatChecksCache, v.Prob) })
    })
    if oerr != nil { return }
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

  ares := adminInitLoad{ Id: id }
  ActiveContest.RWith(func(v ActiveContStruct) {
    ares.OnlineRound = v.Start.Sub(time.Now()).Milliseconds()
    ares.OnlineRoundEnd = v.End.Sub(time.Now()).Milliseconds()
  })
  ContInfo.RWith(func(v string) { ares.ContestInfo = v })
  ContName.RWith(func(v string) { ares.ContestName = v })

  ares.Banned = make([]adminBannedRes, 0)
  Teams.RWith(func(teammap map[string]*RWMutexWrap[TeamS]) {
    for _, t := range teammap {
      t.RWith(func(v TeamS) {
        if !v.Banned { return }
        ares.Banned = append(ares.Banned, adminBannedRes{
          Id: v.Id,
          LastBanned: v.LastBanned.Format("2006-01-02 15:04:05.000Z"),
        })
      })
    }
  })
  Checks.RWith(func(checkmap map[string]*RWMutexWrap[CheckS]) {
    ares.Checks = make([]adminCheckRes, 0, len(checkmap))
    for _, ch := range checkmap {
      ch.RWith(func(v CheckS) {
        v.Team.RWith(func(t TeamS) {
          if v.Prob == nil {
            if !v.Msg {
              log.Error("prob is nil", v.Id)
              return
            }
            ares.Checks = append(ares.Checks, adminCheckRes{
              Team: t.Id,
              Prob: "",
              Diff: "",
              ProbName: "",
              Id: v.Id,
              Assign: "",
              TeamName: t.Name,
              Type: "msg",
              Solution: v.Sol,
              Work: "",
            })
            return
          }
          v.Prob.RWith(func(p ProbS) {
            ts := "sol"
            if v.Msg { ts = "msg" }
            ares.Checks = append(ares.Checks, adminCheckRes{
              Team: t.Id,
              Prob: p.Id,
              Diff: p.Diff,
              ProbName: p.Name,
              Id: v.Id,
              Assign: GetWorker(p.Workers),
              TeamName: t.Name,
              Type: ts,
              Solution: v.Sol,
              Work: strings.Join(p.Workers, " "),
            })
          })
        })
      })
    }
  })

  bres, err := json.Marshal(ares)
  if err != nil { oerr = err; return }

  res = string(bres)
  return
}

func DBAdminSetInfo(info string) (oerr error) {
  ContInfo.With(func(v *string) { *v = info })
  return
}

type reassignRes struct {
  Id string `json:"id"`
  Assign string `json:"assign"`
}

func DBReAssign() (res string, oerr error) {

  var reasres []reassignRes
  Checks.RWith(func(checksmap map[string]*RWMutexWrap[CheckS]) {
    reasres = make([]reassignRes, len(checksmap))
    i := 0
    for id, ch := range checksmap {
      ch.RWith(func(v CheckS) {
        if v.Prob == nil {
          reasres[i] = reassignRes{
            Id: id,
            Assign: "",
          }
          return
        }
        v.Prob.RWith(func(p ProbS) {
          reasres[i] = reassignRes{
            Id: id,
            Assign: GetWorker(p.Workers),
          }
        })
      })
      i++
    }
  })

  resb, err := json.Marshal(reasres)
  if err != nil { oerr = err; return }

  res = string(resb)
  return
}

func DBDump() error {
  resb, err := json.Marshal(DBData)
  if err != nil { return err }

  ac := ActiveContest.GetPrimitiveVal().Id

  err = os.WriteFile(
    "/opt/strelavlna2/dist/svdata_" + ac + ".json", 
    resb, fs.FileMode(os.O_WRONLY),
  )
  return err
}

func DBLoadFromDump() error {
  ac := ActiveContest.GetPrimitiveVal().Id
  resb, err := os.ReadFile("/opt/strelavlna2/dist/svdata_" + ac + ".json")
  if err != nil { return err }

  err = json.Unmarshal(resb, &DBData)
  return err
}

func DBLoadFromPB(ac string) error {
  // ac := ActiveContest.GetPrimitiveVal().Id
  Teams = NewRWMutexWrap(make(map[string]TeamM))
  Probs = NewRWMutexWrap(make(map[string]ProbM))
  Checks = NewRWMutexWrap(make(map[string]CheckM))
  ContInfo = NewRWMutexWrap("")
  ContName = NewRWMutexWrap("")
  teams, err := App.Dao().FindRecordsByFilter(
    "teams",
    `contest = "` + ac + `"`,
    "updated", 0, 0,
  )
  if err != nil { return err }
  Teams.With(func(v *map[string]*RWMutexWrap[TeamS]) {
    for _, tm := range teams {
      newteam := NewRWMutexWrap(TeamS{
        Id: tm.Id,
        Name: tm.GetString("name"),
        Money: 0,
        Bought: make(map[ProbM]struct{}),
        Pending: make(map[ProbM]struct{}),
        Solved: make(map[ProbM]struct{}),
        Sold: make(map[ProbM]struct{}),
        Chat: make([]ChatMsg, 0),
        Banned: false,
        LastBanned: time.Time{},
        ChatChecksCache: make(map[ProbM]string),
        SolChecksCache: make(map[ProbM]string),
        Players: [5]string{
          tm.GetString("player1"),
          tm.GetString("player2"),
          tm.GetString("player3"),
          tm.GetString("player4"),
          tm.GetString("player5"),
        },
        Stats: TeamStats{
          NumBought: 0,
          NumSold: 0,
          NumSolved: 0,
          MoneyHist: make([]moneyHistRec, 0),
        },
      })
      (*v)[tm.Id] = &newteam
    }
  })
  probs := make([]map[string]any, 0)
  App.Dao().DB().
    NewQuery(`select count(*) from probs where (select probs from contests where id = {:contest} limit 1) like concat("%", id, "%")`).
    Bind(dbx.Params{"contest": ac}).
    Execute()
  if err != nil { return err }
  Probs.With(func(v *map[string]*RWMutexWrap[ProbS]) {
    for _, pr := range probs {
      graphs := pr["graph"].(string)
      var graph Graph
      if graphs != "" {
        graph, err = ParseGraph(graphs)
        if err != nil { return }
      }
      newprob := NewRWMutexWrap(ProbS{
        Id: pr["id"].(string),
        Name: pr["name"].(string),
        Diff: pr["diff"].(string),
        Text: pr["text"].(string),
        Img: pr["img"].(string),
        Solution: pr["solution"].(string),
        Workers: make([]string, 0),
        Graph: &graph,
      })
      (*v)[pr["id"].(string)] = &newprob
    }
  })
  if err != nil { return err }
  contest, err := App.Dao().FindRecordById("contests", ac)
  if err != nil { return err }
  ContInfo.With(func(v *string) {
    *v = contest.GetString("info")
  })
  ContName.With(func(v *string) {
    *v = contest.GetString("name")
  })

  return nil
}

func DBGenProbWorkers(map[string]ProbM) error {
  return nil
}

// func DBAdminEditProb(prob string, ndiff string, nname string, ntext string, nsol string) (teams []string, oerr error) {
//   oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {
//
//     _, err := txDao.DB().
//       NewQuery("UPDATE probs SET diff = {:diff}, name = {:name}, text = {:text}, solution = {:sol} WHERE id = {:id}").
//       Bind(dbx.Params{
//         "diff": ndiff,
//         "name": nname,
//         "text": ntext,
//         "solution": nsol,
//         "id": prob,
//       }).Execute()
//     if err != nil { return err }
//
//     teamres := []string{}
//     err = txDao.DB().
//       NewQuery("SELECT id FROM teams WHERE bought LIKE {:prob} OR pending LIKE {:prob}").
//       Bind(dbx.Params{ "prob": prob }).
//       All(&teamres)
//     if err != nil { return nil }
//
//     teams = teamres
//
//     return nil
//   })
//   return
// }

// func DBSaveLog(team string, log string) (oerr error) {
//   oerr = App.Dao().RunInTransaction(func(txDao *daos.Dao) error {
//     _, err := txDao.DB().Update(
//         "teams",
//         dbx.Params{"log": log},
//         dbx.HashExp{"id": team},
//       ).Execute()
//     return err
//   })
//   return
// }
//

