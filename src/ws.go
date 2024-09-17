package src

import (
	"errors"
	"strings"
	"sync"

	log "github.com/anteat3r/golog"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase/daos"
)

var upgrader = websocket.Upgrader{
  ReadBufferSize: 1024,
  WriteBufferSize: 1024,
}

type TeamChans []chan string
func (c TeamChans) Send(msg... string) {
  resmsg := strings.Join(msg, DELIM)
  for _, ch := range c {
    if ch == nil { continue }
    ch<- resmsg
  }
}

type TeamChanPair struct {
  ln int
  ch TeamChans
}

var (
  ActiveContest = ""

  nErr = errors.New

  TeamChanMap = make(map[string]TeamChanPair)
  teamChanMapMutex = sync.Mutex{}
)

func PlayCheckEndpoint(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {

    teamid := c.QueryParam("id")
    if teamid == "" { return c.String(400, "invalid") }

    team, err := dao.FindRecordById("teams", teamid)
    if err != nil { return c.String(400, "invalid") }
    cont := team.GetString("contest")

    if cont != ActiveContest { return c.String(400, "not running") }

    teamChanMapMutex.Lock()
    players, ok := TeamChanMap[teamid]
    teamChanMapMutex.Unlock()

    if !ok { return c.String(200, "free") }

    if players.ln >= 5 { return c.String(400, "full") }

    return c.String(200, "free")
  }
}
    
/// PathParam team (id of team)
func PlayWsEndpoint(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {

    teamid := c.PathParam("team")
    if teamid == "" { return nErr("invalid team path param") }

    team, err := dao.FindRecordById("teams", teamid)
    if err != nil { return err }
    cont := team.GetString("contest")

    if cont != ActiveContest { return nErr("contest not active") }

    conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    if err != nil { return err }

    teamChanMapMutex.Lock()

    teamchan, ok := TeamChanMap[teamid]
    if !ok {
      teamchan = TeamChanPair{0, TeamChans(make([]chan string, 5, 5))}
      TeamChanMap[teamid] = teamchan
    }
    if teamchan.ln >= 5 { return errors.New("too many players") }
    perchan := make(chan string, 10)
    teamchan.ch[teamchan.ln] = perchan
    teamchan.ln += 1

    teamChanMapMutex.Unlock()

    go PlayerWsLoop(conn, teamid, perchan, teamchan.ch)

    return nil
  }
}

func WriteTeamChan(teamid string, msg string) {
  teamChanMapMutex.Lock()
  res := TeamChanMap[teamid].ch
  teamChanMapMutex.Unlock()
  res.Send(msg)
}

func PlayerWsLoop(
  conn *websocket.Conn,
  team string,
  perchan chan string,
  tchan TeamChans,
) {
  wsrchan := make(chan string)
  go func(){
    for {
      p, rm, err := conn.ReadMessage()
      if err != nil {
        log.Error(err)
        conn.Close()
        break
      }
      if p != websocket.TextMessage {
        log.Error("not text msg: ", p, rm)
        continue
      }
      m := string(rm)
      wsrchan<- m
    }
  }()
  loop: for {
    select {
    case m, ok := <-perchan:
      if !ok {
        log.Info("chan closed")
        break loop
      }
      err := conn.WriteMessage(websocket.TextMessage, []byte(m))
      if err != nil {
        log.Error(err)
        conn.Close()
        break loop
      }
    case m, ok := <-wsrchan:
      if !ok {
        log.Info("r chan closed")
        break loop
      }
      err := PlayerWsHandleMsg(team, m, perchan, tchan)
      if err != nil {
        perchan<- "err" + DELIM + err.Error()
      }
    }
  }
}

