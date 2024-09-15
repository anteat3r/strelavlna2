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
  tchan TeamChans,
) error {
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
    prob, money, err := DBBuy(team, diff)
    if err != nil { return err }
    tchan.Send("bought", prob)
  }

  return nil
}
