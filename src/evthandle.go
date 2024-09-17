package src

import (
	"strconv"
	"strings"
)

type InvalidMsgError struct { msg string }
func (e InvalidMsgError) Error() string {
  return `invalid msg "` + e.msg + `"`
}

func eIm(msg string) InvalidMsgError {
  return InvalidMsgError{msg}
}

const DELIM = ":"

func PlayerWsHandleMsg(
  team string,
  msg string,
  perchan chan string,
  tchan *TeamChanMu,
  idx int,
) error {
  if ActiveContest == "" { return dbErr("contest ended") }

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
    prob, money, name, err := DBBuy(team, diff)
    if err != nil { return err }
    tchan.Send("bought", prob, diff, strconv.Itoa(money), name)

  case "buyold":
    if len(m) != 2 { return eIm(msg) }
    diff := m[1]
    prob, money, name, err := DBBuyOld(team, diff)
    if err != nil { return err }
    tchan.Send("bought", prob, diff, strconv.Itoa(money), name)

  case "solve":
    if len(m) != 3 { return eIm(msg) }
    prob := m[1]
    sol := m[2]
    name, diff, err := DBSolve(team, prob, sol)
    if err != nil { return err }
    tchan.Send("solved", prob, diff, name)
    AdminSend("solved", prob, diff, name)

  case "view":
    if len(m) != 2 { return eIm(msg) }
    prob := m[1]
    text, err := DBView(team, prob)
    if err != nil { return err }
    perchan<- "view" + DELIM + text
    tchan.Send("focus", strconv.Itoa(idx))

  case "chat":
    if len(m) != 3 { return eIm(msg) }
    prob := m[1]
    text := m[2]
    name, diff, err := DBPlayerMsg(team, prob, text)
    if err != nil { return err }
    tchan.Send("msgsent", prob, text)
    AdminSend("msgrecd", team, prob, text, name, diff)

  }

  return nil
}

func AdminWsHandleMsg(
  perchan chan string,
  msg string,
  idx int,
) error {
  m := strings.Split(msg, DELIM)
  if len(m) == 0 { return eIm(msg) }
  switch m[0] {}

  return nil
}
