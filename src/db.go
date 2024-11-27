package src

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"slices"
	"strconv"

	// "slices"

	// "slices"
	"sort"
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
  return json.Marshal(struct{V T `json:"v"`}{V: w.v})
}

func (w *RWMutexWrap[T]) UnmarshalJSON(b []byte) error {
  w.m.Lock()
  defer w.m.Unlock()
  var res struct{V T `json:"v"`}
  err := json.Unmarshal(b, &res)
  if err != nil { return err }
  w.v = res.V
  return nil
}

var _ json.Marshaler = (*RWMutexWrap[string])(nil)
var _ json.Unmarshaler = (*RWMutexWrap[string])(nil)

func (w *RWMutexWrap[T]) GetPrimitiveVal() (v T) {
  w.m.RLock()
  defer w.m.RUnlock()
  v = w.v
  return
}

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
  Bought map[string]ProbM `json:"-"`
  Pending map[string]ProbM `json:"-"`
  Solved map[string]ProbM `json:"-"`
  Sold map[string]ProbM `json:"-"`
  Chat []ChatMsg
  Banned bool
  LastBanned time.Time
  ChatChecksCache map[string]string
  SolChecksCache map[string]string
  Players [5]string
  Stats TeamStats
  GenProbCache map[string]int
  GenProbCacheLen int
  RemProbCnt map[string]int
}
type TeamM = *RWMutexWrap[TeamS]

type moneyHistRec struct {
  Money int `json:"money"`
  Time time.Time `json:"time"`
}
type TeamStats struct {
  NumSold map[string]int `json:"numsold"`
  NumBought map[string]int `json:"numbought"`
  NumSolved map[string]int `json:"numsolved"`
  NumIncc map[string]int `json:"numincc"`
  MoneyMade map[string]int `json:"moneymade"`
  MoneyHist []moneyHistRec `json:"moneyhist"`
  Rank int `json:"rank"`
  StatsPublic bool `json:"stats_public"`
  RankPublic bool `json:"rank_public"`
  TeamName string `json:"teamname"`
  Money int `json:"money"`
}

type TeamBackup struct {
  Teams TeamS
  Bought []string
  Pending []string
  Solved []string
  Sold []string
}

type ProbS struct {
  Id string
  Name string
  Diff string
  Text string
  Img string
  Solution string
  Workers []string
  Graph Graph
  Author string
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

type Constant struct {
  Id string `db:"id" json:"id"`
  Value float64 `db:"value" json:"value"`
  Name string `db:"name" json:"name"`
  Symbol string `db:"symbol" json:"symbol"`
  Unit string `db:"unit" json:"unit"`
  Desc string `db:"desc" json:"desc"`
  Group string `db:"group" json:"group"`
}

var (
  Costs = NewRWMutexWrap(make(map[string]int))
  Teams = NewRWMutexWrap(make(map[string]TeamM))
  Probs = NewRWMutexWrap(make(map[string]ProbM))
  Checks = NewRWMutexWrap(make(map[string]CheckM))
  ContInfo = NewRWMutexWrap("")
  ContName = NewRWMutexWrap("")
  ContStats = NewRWMutexWrap("")
  ContProbGenCacheLen = NewRWMutexWrap(0)
  ContTeamAdvanceCount = NewRWMutexWrap(0)
  Consts = NewRWMutexWrap(make(map[string]Constant))

  DBData = map[string]any{
    "costs": &Costs,
    "teams": &Teams,
    "probs": &Probs,
    "checks": &Checks,
    "continfo": &ContInfo,
    "contname": &ContName,
    "consts": &Consts,
    "contstats": &ContStats,
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

  team.With(func(teamS *TeamS) {

    _, ok = teamS.Bought[probid]
    if !ok { oerr = dbErr("sell", "prob not owned"); return }

    delete(teamS.Bought, probid)
    teamS.Sold[probid] = probres

    if len(probid) > 15 {
      Probs.With(func(v *map[string]*RWMutexWrap[ProbS]) {
        delete(*v, probid)
      })
    }

    teamS.Money += cost
    money = teamS.Money

    teamS.Stats.MoneyHist = append(teamS.Stats.MoneyHist, moneyHistRec{
      Time: time.Now(),
      Money: money,
    })
    teamS.Stats.NumSold[diff] ++

  })

  return
}

func DBBuy(team TeamM, diff string) (prob string, money int, name string, text string, img string, remcnt int, oerr error) {
  diffcost, ok := GetCost(diff)
  if !ok { oerr = dbClownErr("buy", "invalid diff"); return }

  team.With(func(teamS *TeamS) {
    if diffcost > teamS.Money { oerr = dbErr("buy", "not enough money"); return }
    var probM ProbM
    Probs.RWith(func(probmap map[string]*RWMutexWrap[ProbS]) {
      for id, probv := range probmap {
        if len(id) > 15 { continue }
        var valid bool
        probv.RWith(func(probS ProbS) {
          _, bought := teamS.Bought[id]
          _, pending := teamS.Pending[id]
          _, solved := teamS.Solved[id]
          _, sold := teamS.Sold[id]
          queued := false
          if probS.Graph == nil {
            _, ok := teamS.GenProbCache[probS.Id]
            if ok { queued = true }
          }
          valid = probS.Diff == diff && 
            !bought &&
            !pending &&
            !solved &&
            !sold &&
            !queued
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
    if oerr != nil { return }

    bprob := probM
    var nid string
    probM.RWith(func(v ProbS) {
      nid = v.Id
      teamS.RemProbCnt[diff]--
      remcnt = teamS.RemProbCnt[diff]
      if v.Graph == nil { return }
      var sol string
      var err error
      text, sol, err = v.Graph.Generate(v.Text, v.Solution)
      if err != nil { oerr = err; return }
      nworkers := make([]string, len(v.Workers))
      copy(nworkers, v.Workers)
      nid = v.Id + ":" + GetRandomId()
      nbprob := NewRWMutexWrap(ProbS{
        Id: nid,
        Name: v.Name,
        Diff: v.Diff,
        Text: text,
        Img: v.Img,
        Solution: sol,
        Workers: nworkers,
        Graph: nil,
      })
      bprob = &nbprob
      Probs.With(func(w *map[string]*RWMutexWrap[ProbS]) {
        (*w)[nid] = bprob
      })
      remid := ""
      for id, idx := range teamS.GenProbCache {
        if idx == teamS.GenProbCacheLen-1 { remid = id }
        teamS.GenProbCache[id] = idx+1
      }
      delete(teamS.GenProbCache, remid)
      teamS.GenProbCache[nid] = 0
    })
    prob = nid
    if oerr != nil { return }
    teamS.Bought[nid] = bprob

    teamS.Money -= diffcost
    money = teamS.Money
    teamS.Stats.MoneyHist = append(teamS.Stats.MoneyHist, moneyHistRec{
      Time: time.Now(),
      Money: money,
    })
    teamS.Stats.NumBought[diff] ++
  })
  return
}

func DBBuyOld(team TeamM, diff string) (prob string, money int, name string, text string, img string, oerr error) {
  diffcost, ok := GetCost(diff)
  if !ok { oerr = dbClownErr("buy", "invalid diff"); return }

  team.With(func(teamS *TeamS) {
    if diffcost > teamS.Money { oerr = dbErr("buy", "not enough money"); return }
    var probM ProbM
    for _, probv := range teamS.Sold {
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
    delete(teamS.Sold, prob)
    teamS.Bought[prob] = probM

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
    _, ok = teamS.Bought[prob]
    if !ok { oerr = dbErr("prob not owned"); return }

    teamname = teamS.Name

    Checks.With(func(checksmap *map[string]*RWMutexWrap[CheckS]) {
      exCheckid, exists := teamS.ChatChecksCache[prob]
      if exists {
        exCheck, ok := (*checksmap)[exCheckid]
        check = exCheckid
        if !ok { oerr = dbErr("solve", "invalid check cache"); return }
        exCheck.With(func(checkS *CheckS) {
          checkS.Msg = false
          checkS.Sol = sol
        })
        updated = true
        csol = sol
        delete(teamS.ChatChecksCache, prob)
        teamS.SolChecksCache[prob] = check
      } else {
        ok = true
        for ok {
          check = GetRandomId()
          _, ok = (*checksmap)[check]
        }
        // if ok { oerr = dbErr("check id collision"); return }
        ncheck := NewRWMutexWrap(CheckS{
          Id: check,
          Prob: probres,
          ProbId: prob,
          Team: team,
          TeamId: teamS.Id,
          Msg: false,
          Sol: sol,
        })
        (*checksmap)[check] = &ncheck
        teamS.SolChecksCache[prob] = check
      }
    })
    if oerr != nil { return }
    
    delete(teamS.Bought, prob)
    teamS.Pending[prob] = probres
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
      check, ok = teamS.ChatChecksCache[""]
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
      teamS.ChatChecksCache[""] = check
    })

    return
  }

  log.Info("sadakldj")

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
    _, bought := teamS.Bought[prob]
    _, pending := teamS.Pending[prob]
    if !bought && !pending { oerr = dbErr("chat", "prob not owned"); return }
    teamS.Chat = append(teamS.Chat, ChatMsg{false, probres, team, msg})
    check, ok = teamS.SolChecksCache[prob]
    if ok {
      upd = true
      return
    }
    check, ok = teamS.ChatChecksCache[prob]
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
      log.Info(ocheck)
      ocheck.With(func(checkS *CheckS) {
        checkS.Sol = msg
      })
      return
    }
    for _, m := range teamS.Chat {
      chrole := "p"
      if m.Admin { chrole = "a" }
      // probid := ""
      // if m.Prob != nil { m.Prob.RWith(func(v ProbS) { probid = v.Id }) }
      chat += chrole + "\x09" + m.Text + "\x0b"
    }
    check = GetRandomId()
    ncheck := &RWMutexWrap[CheckS]{
      v: CheckS{check, probres, prob, team, teamS.Id, true, msg},
    }
    Checks.With(func(checksmap *map[string]*RWMutexWrap[CheckS]) {
      (*checksmap)[check] = ncheck
    })
    teamS.ChatChecksCache[prob] = check
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
  Stats string `json:"stats"`
  Consts string `json:"consts"`
  RemProbsCnt map[string]int `json:"remprobscnt"`
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
    for _, pr := range t.Bought {
      pr.RWith(func(v ProbS) { res.Bought = append(res.Bought, probRes{
        Name: v.Name,
        Id: v.Id,
        Diff: v.Diff,
        Text: v.Text,
        Img: v.Img,
      }) })
    }
    res.Pending = make([]probRes, 0, len(t.Pending))
    for _, pr := range t.Pending {
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
        sol := ""
        if _, ok := checksmap[c]; !ok { continue }
        checksmap[c].RWith(func(v CheckS) { sol = v.Sol })
        res.Checks = append(res.Checks, checkRes{
          Prob: p,
          Sol: sol,
        })
      }
      for p, c := range t.SolChecksCache {
        sol := ""
        if _, ok := checksmap[c]; !ok { continue }
        checksmap[c].RWith(func(v CheckS) { sol = v.Sol })
        res.Checks = append(res.Checks, checkRes{
          Prob: p,
          Sol: sol,
        })
      }
    })
    res.RemProbsCnt = make(map[string]int)
    for diff, cnt := range t.RemProbCnt { res.RemProbsCnt[diff] = cnt }
    if t.Stats.StatsPublic {
      resb, err := json.Marshal(t.Stats)
      if err != nil { oerr = err; return }
      res.Stats = string(resb)
    }
  })
  if oerr != nil { return }

  res.Costs = make(map[string]int)
  Costs.RWith(func(vm map[string]int) {
    for k, v := range vm { res.Costs[k] = v }
  })
  Consts.RWith(func(v map[string]Constant) {
    cnstsb, err := json.Marshal(v)
    if err != nil { oerr = err; return }
    res.Consts = string(cnstsb)
  })
  if oerr != nil { return }

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
    var diff string
    var probid string
    prob.RWith(func(v ProbS) { diff = v.Diff; probid = v.Id })
    cost, ok := GetCost("+" + diff)
    if !ok { oerr = dbErr("grade", "invalid cost"); return }

    team.With(func(v *TeamS) {
      if v.Banned { oerr = dbErr("grade", "cannot grade banned team"); return }
      // _, ok = v.Pending[probid]
      // if !ok { oerr = dbErr("grade", "prob not pending"); return }

      target := v.Bought
      if corr {
        target = v.Solved
      }

      delete(v.Pending, probid)
      target[probid] = prob

      delete(v.SolChecksCache, probid)
      // delete(v.ChatChecksCache, probid)
      if corr {
        money = v.Money + cost
        v.Money = money
        v.Stats.MoneyHist = append(v.Stats.MoneyHist, moneyHistRec{
          Time: time.Now(),
          Money: money,
        })
        v.Stats.NumSolved[diff] ++
        v.Stats.MoneyMade[diff] += cost
        if len(probid) > 15 {
          Probs.With(func(w *map[string]*RWMutexWrap[ProbS]) {
            delete(*w, probid)
          })
        }
      } else {
        money = v.Money
        v.Stats.NumIncc[diff] ++
      }

      if oerr != nil { return }

      Checks.With(func(v *map[string]*RWMutexWrap[CheckS]) {
        delete(*v, checkid)
      })

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
      v.Team.With(func(t *TeamS) { 
        delete(t.ChatChecksCache, v.ProbId)
        delete(t.SolChecksCache, v.ProbId)
      })
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
  if !ok && probid != "" { oerr = dbErr("view", "invalid prob id"); return }

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
  ContestStats string `json:"contest_stats"`
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
  ContStats.RWith(func(v string) { ares.ContestStats = v })

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
    resb, fs.FileMode(os.O_WRONLY | os.O_CREATE),
  )
  return err
}

func DBDumpTeams() error {
  resb, err := json.Marshal(&Teams)
  if err != nil { return err }

  ac := ActiveContest.GetPrimitiveVal().Id

  err = os.WriteFile(
    "/opt/strelavlna2/dist/svdataT_" + ac + ".json", 
    resb, fs.FileMode(os.O_WRONLY | os.O_CREATE),
  )
  return err
}

func DBLoadTeamsFromDump() error {
  ac := ActiveContest.GetPrimitiveVal().Id
  resb, err := os.ReadFile("/opt/strelavlna2/dist/svdataT_" + ac + ".json")
  if err != nil { return err }

  err = json.Unmarshal(resb, &Teams)
  if err != nil { return err }

  TeamChanMap.With(func(v *map[string]*TeamChanMu) {
    Teams.RWith(func(w map[string]*RWMutexWrap[TeamS]) {
      for id, _ := range w {
        teamchan := &TeamChanMu{sync.RWMutex{}, make([]chan string, 5), id}
        (*v)[id] = teamchan
      }
    })
  })

  return err
}

func DBLoadFromDump() error {
  ac := ActiveContest.GetPrimitiveVal().Id
  resb, err := os.ReadFile("/opt/strelavlna2/dist/svdata_" + ac + ".json")
  if err != nil { return err }

  err = json.Unmarshal(resb, &DBData)
  if err != nil { return err }

  TeamChanMap.With(func(v *map[string]*TeamChanMu) {
    Teams.RWith(func(w map[string]*RWMutexWrap[TeamS]) {
      for id, _ := range w {
        teamchan := &TeamChanMu{sync.RWMutex{}, make([]chan string, 5), id}
        (*v)[id] = teamchan
      }
    })
  })

  return err
}

func DBLoadFromPB(ac string) error {
  // ac := ActiveContest.GetPrimitiveVal().Id
  Teams = NewRWMutexWrap(make(map[string]TeamM))
  Probs = NewRWMutexWrap(make(map[string]ProbM))
  Checks = NewRWMutexWrap(make(map[string]CheckM))
  ContInfo = NewRWMutexWrap("")
  ContName = NewRWMutexWrap("")
  Consts = NewRWMutexWrap(make(map[string]Constant))
  ContStats = NewRWMutexWrap("")
  consts := make([]Constant, 0)
  err := App.Dao().DB().
    NewQuery(`select * from consts`).All(&consts)
  if err != nil { return err }
  Consts.With(func(v *map[string]Constant) {
    for _, cnst := range consts {
      (*v)[cnst.Id] = cnst
    }
  })
  probs := make([]struct{
    Id string `db:"id"`
    Name string `db:"name"`
    Diff string `db:"diff"`
    Img string `db:"img"`
    Author string `db:"author"`
    Text string `db:"text"`
    Graph string `db:"graph"`
    Solution string `db:"solution"`
    Infinite bool `db:"infinite"`
  }, 0)
  err = App.Dao().DB().
    NewQuery(`select * from probs where contests like concat("%", {:contest}, "%")`).
    Bind(dbx.Params{"contest": ac}).
    All(&probs)
  // err = App.Dao().DB().
  //   NewQuery(`select * from probs where (select probs from contests where id = {:contest} limit 1) like concat("%", id, "%")`).
  //   Bind(dbx.Params{"contest": ac}).
  //   All(&probs)
  if err != nil { return err }
  genprobcnt := 0
  probcnts := make(map[string]int)
  Probs.With(func(v *map[string]*RWMutexWrap[ProbS]) {
    for _, pr := range probs {
      if pr.Author == "" { continue }
      graphs := pr.Graph
      text := pr.Text
      sol := pr.Solution
      inf := pr.Infinite
      var graph Graph
      if graphs != `{"nodes":{"basic":{},"get":{},"set":{}}}` {
        if inf {
          graph, err = ParseGraph(graphs)
          if err != nil { return }
          _, _, err = graph.Generate(text, sol)
          log.Error(pr.Id)
          if err != nil { return }
          genprobcnt++
        } else {
          graph, err = ParseGraph(graphs)
          if err != nil { return }
          text, sol, err = graph.Generate(text, sol)
          log.Error(pr.Id)
          if err != nil { return }
          graph = nil
        }
      }
      newprob := NewRWMutexWrap(ProbS{
        Id: pr.Id,
        Name: pr.Name,
        Diff: pr.Diff,
        Text: text,
        Img: pr.Img,
        Solution: sol,
        Workers: make([]string, 0),
        Graph: graph,
        Author: pr.Author,
      })
      probcnts[pr.Diff]++
      (*v)[pr.Id] = &newprob
    }
  })
  if err != nil { return err }
  teams, err := App.Dao().FindRecordsByFilter(
    "teams",
    `contest = '` + ac + `'`,
    "updated", 0, 0,
  )
  if err != nil { return err }
  Teams.With(func(v *map[string]*RWMutexWrap[TeamS]) {
    for _, tm := range teams {
      newteam := NewRWMutexWrap(TeamS{
        Id: tm.Id,
        Name: tm.GetString("name"),
        Money: tm.GetInt("score"),
        Bought: make(map[string]ProbM),
        Pending: make(map[string]ProbM),
        Solved: make(map[string]ProbM),
        Sold: make(map[string]ProbM),
        Chat: make([]ChatMsg, 0),
        Banned: false,
        LastBanned: time.Time{},
        ChatChecksCache: make(map[string]string),
        SolChecksCache: make(map[string]string),
        GenProbCache: make(map[string]int),
        GenProbCacheLen: genprobcnt / 2,
        RemProbCnt: make(map[string]int),
        Players: [5]string{
          tm.GetString("player1"),
          tm.GetString("player2"),
          tm.GetString("player3"),
          tm.GetString("player4"),
          tm.GetString("player5"),
        },
        Stats: TeamStats{
          NumBought: map[string]int{"A": 0, "B": 0, "C": 0},
          NumSold: map[string]int{"A": 0, "B": 0, "C": 0},
          NumSolved: map[string]int{"A": 0, "B": 0, "C": 0},
          NumIncc: map[string]int{"A": 0, "B": 0, "C": 0},
          MoneyMade: map[string]int{"A": 0, "B": 0, "C": 0},
          MoneyHist: []moneyHistRec{{tm.GetInt("score"), ActiveContest.GetPrimitiveVal().Start,}},
          Rank: -1,
          StatsPublic: false,
          RankPublic: false,
          TeamName: tm.GetString("name"),
        },
      })
      Probs.RWith(func(v map[string]*RWMutexWrap[ProbS]) {
        for name, mp := range map[string]map[string]ProbM{
          "bought": newteam.v.Bought,
          "pending": newteam.v.Pending,
          "solved": newteam.v.Solved,
          "sold": newteam.v.Sold,
        } {
          for _, id := range tm.GetStringSlice(name) {
            pr, ok := v[id]
            if !ok { continue }
            mp[id] = pr
          }
        }
      })
      for diff, cnt := range probcnts { newteam.v.RemProbCnt[diff] = cnt }
      (*v)[tm.Id] = &newteam
    }
  })
  contest, err := App.Dao().FindRecordById("contests", ac)
  if err != nil { return err }
  ContInfo.With(func(v *string) {
    *v = contest.GetString("info")
  })
  ContName.With(func(v *string) {
    *v = contest.GetString("name")
  })
  ContStats.With(func(v *string) {
    *v = contest.GetString("stats")
  })
  ContProbGenCacheLen.With(func(v *int) {
    *v = contest.GetInt("probgencachelen")
  })
  ContTeamAdvanceCount.With(func(v *int) {
    *v = contest.GetInt("advanceteamcount")
  })

  return nil
}

var admins = []string{"a", "b", "c", "d", "e", "f", "g", "h"}
var probs = func() []string {
	problems := make([]string, 20)
	for i := range problems {
		problems[i] = fmt.Sprintf("u%d", i)
	}
	return problems
}()
var sectors = [][][]string{
	{
		{"u0", "u1"}, {"u2", "u3", "u4"}, {"u5"}, {"u6", "u7"},
		{"u8", "u9"}, {"u10", "u11", "u12"}, {"u13", "u14", "u15"}, {"u16", "u17", "u18", "u19"},
	},
}

func newSector() bool {
	ap := make([][]string, len(admins))
	for _, sector := range sectors {
		for i, admin := range sector {
			ap[i] = append(ap[i], admin...)
		}
	}

	sector := make([][]string, len(admins))
	for i := range sector {
		sector[i] = []string{}
	}

	counts := make([]int, len(admins))
	for i, p := range ap {
		counts[i] = len(p)
	}

	added := false
	for _, prob := range probs {
		queue := make([]int, len(counts))
		for i := range queue {
			queue[i] = i
		}

		sort.Slice(queue, func(i, j int) bool {
			return counts[queue[i]] < counts[queue[j]]
		})

		for _, i := range queue {
			// Check if the problem is already assigned to this admin
			found := false
			for _, p := range ap[i] {
				if p == prob {
					found = true
					break
				}
			}
			if found {
				continue
			}

			ap[i] = append(ap[i], prob)
			sector[i] = append(sector[i], prob)
			counts[i]++
			added = true
			break
		}
	}

	sectors = append(sectors, sector)
	return added
}

func compileSectors() [][]string {
	queues := make([][]string, len(probs))
	for i, prob := range probs {
		for _, sector := range sectors {
			for j, admin := range sector {
				for _, p := range admin {
					if p == prob {
						queues[i] = append(queues[i], admins[j])
						break
					}
				}
			}
		}
	}
	return queues
}

func DBGenProbWorkers(probsr *map[string]ProbM) error {
  corrs, err := App.Dao().FindRecordsByFilter(
    "correctors",
    `username != ""`,
    "-created", 0, 0,
  )
  if err != nil { return err }
  admins = make([]string, len(corrs))
  for i, corr := range corrs {
    admins[i] = corr.GetId()
  }
  probs = make([]string, 0, len(*probsr))
  for id, _ := range *probsr {
    probs = append(probs, id)
  }
  sectors = make([][][]string, 1)
  sectors[0] = make([][]string, 0)
  for range admins {
    sectors[0] = append(sectors[0], make([]string, 0))
  }
  for id, pr := range *probsr {
    pr.RWith(func(v ProbS) {
      idx := slices.Index(admins, v.Author)
      sectors[0][idx] = append(sectors[0][idx], id)
    })
  }
  // admins = []string{"a", "b", "c", "d", "e", "f", "g", "h"}
  // probs = func() []string {
  //   problems := make([]string, 20)
  //   for i := range problems {
  //     problems[i] = fmt.Sprintf("u%d", i)
  //   }
  //   return problems
  // }()
  // sectors = [][][]string{
  //   {
  //     {"u0", "u1"}, {"u2", "u3", "u4"}, {"u5"}, {"u6", "u7"},
  //     {"u8", "u9"}, {"u10", "u11", "u12"}, {"u13", "u14", "u15"}, {"u16", "u17", "u18", "u19"},
  //   },
  // }
  log.Info(sectors, probs, admins)

  for newSector() {}
  sectors = sectors[:len(sectors)-1]

  finalsec := compileSectors()

  log.Info(finalsec)



  for i, pr := range finalsec {
    id := probs[i]
    (*probsr)[id].With(func(v *ProbS) {
      v.Workers = pr
      log.Info(id, pr)
    })
  }
  return nil
}

func DBBackTeams() error {
  teamsb := make(map[string]string)
  Teams.RWith(func(v map[string]*RWMutexWrap[TeamS]) {
    for id, tm := range v {
      tm.RWith(func(w TeamS) {
        bck := TeamBackup{
          Teams: w,
          Bought: make([]string, 0),
          Pending: make([]string, 0),
          Solved: make([]string, 0),
          Sold: make([]string, 0),
        }
        for id := range w.Bought { bck.Bought = append(bck.Bought, id) }
        for id := range w.Pending { bck.Pending = append(bck.Pending, id) }
        for id := range w.Solved { bck.Solved = append(bck.Solved, id) }
        for id := range w.Sold { bck.Sold = append(bck.Sold, id) }
        bts, err := json.Marshal(bck)
        if err != nil { log.Error(err); return }
        teamsb[id] = string(bts)
      })
    }
  })
  bts, err := json.Marshal(teamsb)
  if err != nil { return err }

  ac := ActiveContest.GetPrimitiveVal().Id

  err = os.WriteFile(
    "/opt/strelavlna2/dist/svdataB_" + ac + ".json", 
    bts, fs.FileMode(os.O_WRONLY | os.O_CREATE),
  )
  return err
}

func DBUnbackTeams() error {
  ac := ActiveContest.GetPrimitiveVal().Id

  bts, err := os.ReadFile("/opt/strelavlna2/dist/svdataB_" + ac + ".json")
  if err != nil { return err }

  teamsb := make(map[string]string)
  err = json.Unmarshal(bts, &teamsb)
  if err != nil { return err }

  Teams.With(func(v *map[string]*RWMutexWrap[TeamS]) {
    Probs.With(func(u *map[string]*RWMutexWrap[ProbS]) {
      for id, bckrs := range teamsb {
        var bck TeamBackup
        err := json.Unmarshal([]byte(bckrs), &bck)
        if err != nil { log.Error(err); continue }
        (*v)[id].With(func(w *TeamS) {
          nteam := bck.Teams
          for _, prid := range bck.Bought {
            pr, ok := (*u)[prid]
            if !ok { continue }
            nteam.Bought[prid] = pr
          }
          for _, prid := range bck.Pending {
            pr, ok := (*u)[prid]
            if !ok { continue }
            nteam.Pending[prid] = pr
          }
          for _, prid := range bck.Solved {
            pr, ok := (*u)[prid]
            if !ok { continue }
            nteam.Solved[prid] = pr
          }
          for _, prid := range bck.Sold {
            pr, ok := (*u)[prid]
            if !ok { continue }
            nteam.Sold[prid] = pr
          }
          *w = nteam
        })
      }
    })
  })

  return nil
}

func DBLoadFromLog() error {
  bts, err := os.ReadFile("/opt/strelavlna2/sv2.log")
  if err != nil { return err }

  str := string(bts)

  teamsm := make(map[string]int)
  for _, l := range strings.Split(str, "\n") {
    ln := strings.Split(l, " ")
    if len(ln) != 3 { continue }
    if ln[0] != "#money" { continue }
    mn, _ := strconv.Atoi(ln[2])
    teamsm[ln[1]] = mn
  }
  Teams.With(func(v *map[string]*RWMutexWrap[TeamS]) {
    for id, tm := range *v {
      tm.With(func(v *TeamS) {
        v.Money = teamsm[id]
      })
    }
  })
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

