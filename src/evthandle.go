package src

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	log "github.com/anteat3r/golog"
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

const DELIM = "\x00"

func PlayerWsHandleMsg(
  team string,
  msg string,
  perchan chan string,
  tchan *TeamChanMu,
  idx int,
) (oerr error) {
  m := strings.Split(msg, DELIM)
  if len(m) == 0 { return eIm(msg) }

  now := time.Now()
  ActiveContestMu.RLock()
  if m[0] != "load" &&
     !( now.After(ActiveContestStart) &&
     now.Before(ActiveContestEnd) ) {
    ActiveContestMu.RUnlock()
    return dbErr("contest not running")
  }
  ActiveContestMu.RUnlock()
  readmsg := strings.Join(m, "|")

  defer func(){
    if oerr != nil {
      fmt.Printf("%s *>- %s:%d <-* %s <- %s\n", formTime(), team, idx, strings.ReplaceAll(oerr.Error(), "\x00", "|"), readmsg)
    }
  }()

  // log.Info("")

  switch m[0] {

  case "sell":
    if len(m) != 2 { return eIm(msg) }
    prob := m[1]
    money, err := DBSell(team, prob)
    if err != nil { return err }
    tchan.Send(team, "sold", prob, strconv.Itoa(money))

  case "buy":
    if len(m) != 2 { return eIm(msg) }
    diff := m[1]
    prob, money, name, text, img, err := DBBuy(team, diff)
    if err != nil { return err }
    tchan.Send(team, "bought", prob, diff, strconv.Itoa(money), name, text, img)

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
    check, _, teamname, _, csol, upd, workers, err := DBSolve(team, prob, sol)
    if err != nil { return err }
    phash := HashId(workers)
    tchan.Send(team, "solved", prob, sol)
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
    tchan.Send(team, "focused", prob, strconv.Itoa(idx))

  case "unfocus":
    if len(m) != 1 { return eIm(msg) }
    tchan.Send(team, "unfocused", strconv.Itoa(idx))

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
    upd, teamname, name, diff, check, workers, chat, err := DBPlayerMsg(team, prob, text)
    if err != nil { return err }
    tchan.Send(team, "msgsent", prob, text)
    phash := HashId(workers)
    if !upd {
      AdminSend("questioned", check, team, teamname, prob, diff, name, text, phash, chat)
    } else {
      AdminSend("msgrecd", check, text)
    }
    
  case "load":
    if len(m) != 1 { return eIm(msg) }
    res, err := DBPlayerInitLoad(team, idx)
    if err != nil { return err }
    perchan<- "loaded" + DELIM + res
    tchan.Send(team, "focuscheck")

  case "focuscheck":
    if len(m) != 1 { return eIm(msg) }
    tchan.Send(team, "focuscheck")

  default:
    return eIm(msg)

  }

  fmt.Printf("%s >- %s:%d <- %s\n", formTime(), team, idx, readmsg)

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
      fmt.Printf("%s *>>- %s <-* %s <- %s\n", formTime(), id, strings.ReplaceAll(oerr.Error(), "\x00", "|"), readmsg)
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
    money, err := DBAdminGrade(check, team, prob, corr)
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
    teamChanMapMutex.Lock()
    for id, tc := range TeamChanMap {
      tc.Send(id, "gotinfo", info)
    }
    teamChanMapMutex.Unlock()
    AdminSend("gotinfo", info)

  case "work":
    if len(m) != 1 { return eIm(msg) }
    workersMutex.Lock()
    Workers[id] = struct{}{}
    workersMutex.Unlock()
    res, err := DBReAssign()
    if err != nil { return err }
    AdminSend("reassigned", res)
    perchan<- "working"

  case "unwork":
    if len(m) != 1 { return eIm(msg) }
    workersMutex.Lock()
    delete(Workers, id)
    workersMutex.Unlock()
    res, err := DBReAssign()
    if err != nil { return err }
    AdminSend("reassigned", res)
    perchan<- "unworking"

  case "chngprob":
    if len(m) != 6 { return eIm(msg) }
    prob := m[1]
    ndiff := m[2]
    nname := m[3]
    ntext := m[4]
    nsol := m[5]
    teams, err := DBAdminEditProb(prob, ndiff, nname, ntext, nsol)
    if err != nil { return err }
    for _, t := range teams {
      WriteTeamChan(t, "probchngd", ndiff, nname, ntext, nsol)
    }
    AdminSend("probchngd", ndiff, nname, ntext, nsol)

  case "parselog":
    if len(m) != 1 { return eIm(msg) }
    log, err := LoadLog()
    if err != nil { return err }
    teamChanMapMutex.Lock()
    for t, c := range TeamChanMap {
      tlog := FilterLogTeam(log, t)
      c.Send(t, "gotlog", strings.Join(tlog, "\n"))
    }
    teamChanMapMutex.Unlock()

  }

  fmt.Printf("%s >>- %s <- %s\n", formTime(), id, readmsg)

  return nil
}

func LoadLog() ([]string, error) {
  bts, err := os.ReadFile("/opt/strelavlna2/sv2.log")
  if err != nil { return nil, err }
  lns := strings.Split(string(bts), "\n")
  flns := make([]string, 0, len(lns) / 100)
  for _, l := range lns {
    if !strings.Contains(l, "bought") &&
       !strings.Contains(l, "solved") { continue }
    flns = append(flns, l)
  }
  return flns, nil
}

func FilterLogTeam(log []string, team string) []string {
  flog := make([]string, len(log) / 100)
  for _, l := range log {
    if !strings.Contains(l, team) { continue }
    flog = append(flog, l)
  }
  return flog
}

