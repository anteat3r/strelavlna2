package src

import (
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

const DELIM = "\x00"

func PlayerWsHandleMsg(
  team string,
  msg string,
  perchan chan string,
  tchan *TeamChanMu,
  idx int,
) (oerr error) {
  ActiveContestMu.RLock()
  if ActiveContest == "" {
    ActiveContestMu.RUnlock()
    return dbErr("contest ended")
  }
  ActiveContestMu.RUnlock()
  // defer func(){
  //   if oerr != nil {
  //     sLog("playerevterr", team, msg, oerr.Error())
  //   }
  // }()

  // log.Info("")

  m := strings.Split(msg, DELIM)
  if len(m) == 0 { return eIm(msg) }
  switch m[0] {

  case "sell":
    if len(m) != 2 { return eIm(msg) }
    prob := m[1]
    money, err := DBSell(team, prob)
    if err != nil { return err }
    tchan.Send("sold", prob, strconv.Itoa(money))

  case "buy":
    if len(m) != 2 { return eIm(msg) }
    diff := m[1]
    prob, money, name, text, err := DBBuy(team, diff)
    if err != nil { return err }
    tchan.Send("bought", prob, diff, strconv.Itoa(money), name, text)

  case "buyold":
    if len(m) != 2 { return eIm(msg) }
    diff := m[1]
    prob, money, name, text, err := DBBuyOld(team, diff)
    if err != nil { return err }
    tchan.Send("bought", prob, diff, strconv.Itoa(money), name, text)

  case "solve":
    if len(m) != 3 { return eIm(msg) }
    prob := m[1]
    sol := m[2]
    check, diff, teamname, name, text, err := DBSolve(team, prob, sol)
    if err != nil { return err }
    tchan.Send("solved", prob)
    AdminSend("solved", check, team, prob, diff, teamname, name, text)

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
    for _, c := range text {
      if c == '\x09' { return dbErr("chat", "invalid msg") }
      if c == '\x0b' { return dbErr("chat", "invalid msg") }
    }
    err := DBPlayerMsg(team, prob, text)
    if err != nil { return err }
    tchan.Send("msgsent", prob, text)
    AdminSend("msgrecd", team, prob, text)
    
  case "load":
    if len(m) != 3 { return eIm(msg) }
    res, err := DBPlayerInitLoad(team)
    if err != nil { return err }
    perchan<- "loaded" + 
      strconv.Itoa(res.Money) + DELIM +
      res.Bought + DELIM +
      res.Pending + DELIM +
      res.Name + DELIM +
      res.Player1 + DELIM +
      res.Player2 + DELIM +
      res.Player3 + DELIM +
      res.Player4 + DELIM +
      res.Player5 + DELIM +
      res.Chat

  default:
    return eIm(msg)

  }

  log.Info("playerevt", team, msg)

  return nil
}

func AdminWsHandleMsg(
  email string,
  perchan chan string,
  msg string,
  idx int,
) (oerr error) {
  defer func(){
    if oerr != nil {
      sLog("adminevterr", email, msg, oerr.Error())
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
    // err := DBAdminMsg(team, prob, text)
    // if err != nil { return err }
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
    if len(m) != 2 { return eIm(msg) }
    check := m[1]
    team, prob, err := DBAdminView(check)    
    if err != nil { return err }
    WriteTeamChan(team, "adminfocused", check, prob)
    AdminSend("focused", check, strconv.Itoa(idx))
    
  case "unfocus":
    if len(m) != 1 { return eIm(msg) }
    AdminSend("unfocused", strconv.Itoa(idx))
    
  }

  sLog("adminevt", email, msg)

  return nil
}
