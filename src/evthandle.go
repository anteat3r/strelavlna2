package src

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	log "github.com/anteat3r/golog"
	"github.com/pocketbase/dbx"
	"slices"
)

type InvalidMsgError struct { msg string }
func (e InvalidMsgError) Error() string {
  return `invalid msg "` + e.msg + `"`
}

func eIm(msg string) InvalidMsgError {
  return InvalidMsgError{msg}
}

func sLog(v... any) {
  log.InfoT("%v ", 1, v...)
}

func formTime() string {
  return time.Now().Format("2006-01-02 15:04:05.000000")
}

func JSONlog(id string, admin bool, inc bool, idx int, evt string) {
  fmt.Fprintf(
    os.Stderr,
    `{"time":"%s","id":"%s","admin":%v,"inc":%v,"idx":%d,"evt":"%s"},` + "\n",
    time.Now().Format("2006-01-02T15:04"),
    id, admin, inc, idx, evt,
  )
}

const DELIM = "\x00"

func PlayerWsHandleMsg(
  team string,
  msg string,
  perchan chan string,
  tchan *TeamChanMu,
  idx int,
  teamM TeamM,
) (oerr error) {
  m := strings.Split(msg, DELIM)
  if len(m) == 0 { return eIm(msg) }

  now := time.Now()
  var ok bool
  ActiveContest.RWith(func(v ActiveContStruct) {
    ok = m[0] == "load" || m[0] == "focus" ||
      ( now.After(v.Start) && now.Before(v.End) )
  })
  if !ok { return dbErr("contest not running") }
  readmsg := strings.Join(m, "|")

  defer func(){
    if oerr != nil {
      jerr := strings.ReplaceAll(oerr.Error(), "\x00", "|")
      fmt.Printf("%s *>- %s:%d <-* %s <- %s\n", formTime(), team, idx, jerr, readmsg)
      JSONlog(team, false, true, idx, jerr)
    }
  }()

  // log.Info("")

  switch m[0] {

  case "sell":
    if len(m) != 2 { return eIm(msg) }
    prob := m[1]
    money, err := DBSell(teamM, prob)
    if err != nil { return err }
    tchan.Send("sold", prob, strconv.Itoa(money))

  case "buy":
    if len(m) != 2 { return eIm(msg) }
    diff := m[1]
    prob, money, name, text, img, remcnt, err := DBBuy(teamM, diff)
    if err != nil { return err }
    tchan.Send("bought", prob, diff, strconv.Itoa(money), name, text, img, strconv.Itoa(remcnt))

  // case "buyold":
  //   if len(m) != 2 { return eIm(msg) }
  //   diff := m[1]
  //   prob, money, name, text, err := DBBuyOld(team, diff)
  //   if err != nil { return err }
  //   tchan.Send("bought", prob, diff, strconv.Itoa(money), name, text)

  case "solve":
    if len(m) != 3 { return eIm(msg) }
    prob := m[1]
    sol := m[2]
    check, _, teamname, _, csol, upd, workers, err := DBSolve(teamM, prob, sol)
    if err != nil { return err }
    phash := GetWorker(workers)
    tchan.Send("solved", prob, sol)
    if upd {
      AdminSend("upgraded", check, sol, phash)
    } else {
      AdminSend("solved", check, team, prob, phash, teamname, sol, csol)
    }

  case "focus":
    if len(m) != 2 { return eIm(msg) }
    prob := m[1]
    // text, diff, name, err := DBView(team, prob)
    // if err != nil { return err }
    // perchan<- "viewed" + DELIM + diff + DELIM + name + DELIM + text
    tchan.Send("focused", prob, strconv.Itoa(idx))

  case "unfocus":
    if len(m) != 1 { return eIm(msg) }
    tchan.Send("unfocused", strconv.Itoa(idx))

  case "chat":
    if len(m) != 3 { return eIm(msg) }
    prob := m[1]
    text := m[2]
    if len(text) == 0 { return dbErr("chat", "msg empty") }
    if len(text) > 200 { return dbErr("chat", "msg too long") }
    for _, c := range text {
      if c == '\x09' { return dbErr("chat", "invalid msg") }
      if c == '\x0b' { return dbErr("chat", "invalid msg") }
    }
    upd, teamname, name, diff, check, workers, chat, err := DBPlayerMsg(teamM, prob, text)
    if err != nil { return err }
    tchan.Send("msgsent", prob, text)
    phash := GetWorker(workers)
    if !upd {
      AdminSend("questioned", check, team, teamname, prob, diff, name, text, phash, chat)
    } else {
      AdminSend("msgrecd", check, text)
    }
    
  case "load":
    if len(m) != 1 { return eIm(msg) }
    res, err := DBPlayerInitLoad(teamM, idx)
    if err != nil { return err }
    perchan<- "loaded" + DELIM + res
    tchan.Send("focuscheck")

  case "focuscheck":
    if len(m) != 1 { return eIm(msg) }
    tchan.Send("focuscheck")

  default:
    return eIm(msg)

  }

  fmt.Printf("%s >- %s:%d <- %s\n", formTime(), team, idx, readmsg)
  JSONlog(team, false, true, idx, readmsg)

  return nil
}

func AdminWsHandleMsg(
  email string,
  perchan chan string,
  msg string,
  id string,
) (oerr error) {
  readmsg := strings.ReplaceAll(msg, "\x00", "|")
  defer func(){
    if oerr != nil {
      jerr := strings.ReplaceAll(oerr.Error(), "\x00", "|")
      fmt.Printf("%s *>>- %s <-* %s <- %s\n", formTime(), id, jerr, readmsg)
      JSONlog(id, true, true, 0, jerr)
    }
  }()

  m := strings.Split(msg, DELIM)
  if len(m) == 0 { return eIm(msg) }
  switch m[0] {

  case "grade":
    if len(m) != 5 { return eIm(msg) }
    check := m[1]
    team := m[2]
    prob := m[3]
    rcorr := m[4]
    corr := rcorr == "yes"
    money, _, err := DBAdminGrade(check, corr)
    if err != nil { return err }
    WriteTeamChan(team, "graded", prob, rcorr, strconv.Itoa(money))
    AdminSend("graded", prob, check)

  case "chat":
    if len(m) != 4 { return eIm(msg) }
    team := m[1]
    prob := m[2]
    text := m[3]
    err := DBAdminMsg(team, prob, text)
    if err != nil { return err }
    WriteTeamChan(team, "msgrecd", prob, text)
    AdminSend("msgsent", team, prob, text)

  case "dismiss":
    if len(m) != 2 { return eIm(msg) }
    check := m[1]
    team, prob, err := DBAdminDismiss(check)
    if err != nil { return err }
    WriteTeamChan(team, "dismissed", prob)
    AdminSend("dismissed", check)
    
  case "focus":
    if len(m) != 6 { return eIm(msg) }
    check := m[1]
    prob := m[2]
    team := m[3]
    sprobt := m[4]
    sprob := sprobt == "yes"
    schatt := m[5]
    schat := schatt == "yes"
    text, sol, name, diff, chat, banned, _, img, err := DBAdminView(team, prob, sprob, schat)    
    if err != nil { return err }
    if sprob {
      perchan<- "viewedprob" + DELIM +
                 prob + DELIM +
                 name + DELIM +
                 diff + DELIM +
                 sol + DELIM +
                 text + DELIM +
                 img
    }
    if schat {
      perchan<- "viewedchat" + DELIM +
                 prob + DELIM +
                 team + DELIM +
                 banned + DELIM +
                 chat
    }
    WriteTeamChan(team, "adminfocused", check, prob)
    AdminSend("focused", check, id)
    
  case "unfocus":
    if len(m) != 1 { return eIm(msg) }
    AdminSend("unfocused", id)

  case "focuscheck":
    if len(m) != 1 { return eIm(msg) }
    AdminSend("focuscheck")

  case "ban":
    if len(m) != 2 { return eIm(msg) }
    team := m[1]
    err := DBAdminBan(team)
    if err != nil { return err }
    AdminSend("banned", team)
    WriteTeamChan(team, "banned")

  case "unban":
    if len(m) != 2 { return eIm(msg) }
    team := m[1]
    err := DBAdminUnBan(team)
    if err != nil { return err }
    AdminSend("unbanned", team)
    WriteTeamChan(team, "unbanned")

  case "load":
    if len(m) != 1 { return eIm(msg) }
    res, err := DBAdminInitLoad(id)
    if err != nil { return err }
    perchan<- "loaded" + DELIM + res

  case "setinfo":
    if len(m) != 2 { return eIm(msg) }
    info := m[1]
    err := DBAdminSetInfo(info)
    if err != nil { return err }
    TeamChanMap.RWith(func(v map[string]*TeamChanMu) {
      for _, tc := range v {
        tc.Send("gotinfo", info)
      }
    })
    AdminSend("gotinfo", info)

  case "work":
    if len(m) != 1 { return eIm(msg) }
    Workers.With(func(v *map[string]struct{}) {
      (*v)[id] = struct{}{}
    })
    res, err := DBReAssign()
    if err != nil { return err }
    AdminSend("reassigned", res)
    perchan<- "working"

  case "unwork":
    if len(m) != 1 { return eIm(msg) }
    Workers.With(func(v *map[string]struct{}) {
      delete(*v, id)
    })
    res, err := DBReAssign()
    if err != nil { return err }
    AdminSend("reassigned", res)
    perchan<- "unworking"

  // case "chngprob":
  //   if len(m) != 6 { return eIm(msg) }
  //   prob := m[1]
  //   ndiff := m[2]
  //   nname := m[3]
  //   ntext := m[4]
  //   nsol := m[5]
  //   teams, err := DBAdminEditProb(prob, ndiff, nname, ntext, nsol)
  //   if err != nil { return err }
  //   for _, t := range teams {
  //     WriteTeamChan(t, "probchngd", ndiff, nname, ntext, nsol)
  //   }
  //   AdminSend("probchngd", ndiff, nname, ntext, nsol)

  case "senddata":
    if len(m) != 1 { return eIm(msg) }
    scores := []teamData{}
    Teams.RWith(func(v map[string]*RWMutexWrap[TeamS]) {
      for id, tm := range v {
        var mn int
        tm.RWith(func(t TeamS) { mn = t.Money })
        scores = append(scores, teamData{
          id: id,
          money: mn,
        })
      }
    })
    slices.SortFunc(scores, func(i, j teamData) int {
      if i.money > j.money { return -1 }
      if i.money < j.money { return 1 }
      return 0
    })
    fulldata := "{"
    Teams.RWith(func(v map[string]*RWMutexWrap[TeamS]) {
      for id, tm := range v {
        var data string
        var money int
        tm.With(func(t *TeamS) {
          idx := slices.IndexFunc(scores, func(a teamData) bool { return a.id == id })
          t.Stats.Rank = idx+1
          t.Stats.StatsPublic = true
          t.Stats.Money = t.Money
          bts, err := json.Marshal(t.Stats)
          if err != nil { log.Error(err) }
          data = string(bts)
          money = t.Money
        })
        WriteTeamChan(id, "gotdata", data)
        fulldata += `"` + id + `":` + data + ","
        _, err := App.Dao().DB().NewQuery("update teams set score = {:score} where id = {:id}").
        Bind(dbx.Params{"score": money, "id": id}).Execute()
        if err != nil { log.Error(err) }
      }
    })
    fulldata = strings.TrimSuffix(fulldata, ",")
    fulldata += "}"
    ContStats.With(func(v *string) { *v = fulldata })
    ac := ActiveContest.GetPrimitiveVal().Id
    _, err := App.Dao().DB().NewQuery("update contests set stats = {:stats} where id = {:id}").
    Bind(dbx.Params{"stats": fulldata, "id": ac}).Execute()
    if err != nil { log.Error(err) }
    AdminSend("finalstats", fulldata)


  case "sendlowerrank":
    if len(m) != 1 { return eIm(msg) }
    Teams.RWith(func(v map[string]*RWMutexWrap[TeamS]) {
      for id, tm := range v {
        lower := true
        tm.With(func(v *TeamS) {
          lower = v.Stats.Rank > ContTeamAdvanceCount.GetPrimitiveVal()
          if lower { v.Stats.RankPublic = true }
        })
        if !lower { continue }
        WriteTeamChan(id, "showrank")
      }
    })

  case "sendallranks":
    if len(m) != 1 { return eIm(msg) }
    Teams.RWith(func(v map[string]*RWMutexWrap[TeamS]) {
      for id, tm := range v {
        tm.With(func(v *TeamS) { v.Stats.RankPublic = true })
        WriteTeamChan(id, "showrank")
      }
    })

  case "sendrank":
    if len(m) != 2 { return eIm(msg) }
    team := m[1]
    var ok bool
    Teams.RWith(func(v map[string]*RWMutexWrap[TeamS]) {
      var tm TeamM
      tm, ok = v[team]
      if !ok { return }
      tm.With(func(v *TeamS) { v.Stats.RankPublic = true })
    })
    if !ok { return }
    WriteTeamChan(team, "showrank")
    AdminSend("ranksent", team)

  }

  fmt.Printf("%s >>- %s <- %s\n", formTime(), id, readmsg)
  JSONlog(id, true, true, 0, readmsg)

  return nil
}

type teamData struct{
  id string
  money int
}

// func LoadLog() ([]string, error) {
//   bts, err := os.ReadFile("/opt/strelavlna2/sv2j.log")
//   if err != nil { return nil, err }
//   lns := strings.Split(string(bts), "\n")
//   flns := make([]string, 0, len(lns) / 100)
//   for _, l := range lns {
//     if !strings.Contains(l, "bought") &&
//        !strings.Contains(l, "graded") &&
//        !strings.Contains(l, "solved") { continue }
//     flns = append(flns, l)
//   }
//   return flns, nil
// }
//
// func FilterLogTeam(log []string, team string) []string {
//   flog := make([]string, len(log) / 100)
//   for _, l := range log {
//     if !strings.Contains(l, team) { continue }
//     flog = append(flog, l)
//   }
//   err := DBSaveLog(team, strings.Join(log, "\n"))
//   if err != nil { fmt.Println("err saving log", err.Error())}
//   return flog
// }
//
