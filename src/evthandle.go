package src

import "strings"

type testStringMsg struct { msg string }
func (m testStringMsg) String() string {
  return m.msg
}

type SellMsg struct { prob string }
func (m SellMsg) String() string {
  return "sell:" + m.prob
}

type InvalidMsgError struct { msg string }
func (e InvalidMsgError) Error() string {
  return `invalid msg "` + e.msg + `"`
}

func eIm(msg string) InvalidMsgError {
  return InvalidMsgError{msg}
}

func PlayerWsHandleMsg(
  team string,
  msg string,
  tchan chan string,
  perchan chan string,
) error {
  m := strings.Split(msg, ":")
  if len(m) == 0 { return eIm(msg) }
  switch m[0] {

  case "sell":
    if len(m) != 2 { return eIm(msg) }
    prob := m[1]
    _, err := DBSell(team, prob)
    if err != nil { return err }
    tchan<- "sold:" + prob

  case "buy":
    if len(m) != 2 { return eIm(msg) }
    diff := m[1]
    prob, _, err := DBBuy(team, diff)
    if err != nil { return err }
    tchan<- "bought:" + prob
  }

  return nil
}
