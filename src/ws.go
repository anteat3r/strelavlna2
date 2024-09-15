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
    ch<- resmsg
  }
}

var (
  ActiveContest = "ccwxcxbrroofuzl"

  nErr = errors.New

  TeamChanMap = make(map[string]TeamChans)
  TeamChanMapMutex = sync.Mutex{}
)

func PlayChackEndpoint(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {

    teamid := c.QueryParam("id")
    if teamid == "" { return c.String(400, "") }

    team, err := dao.FindRecordById("teams", teamid)
    if err != nil { return c.String(400, "") }
    cont := team.GetString("contest")

    if cont != ActiveContest { return c.String(400, "") }

    return c.String(200, "")
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

    TeamChanMapMutex.Lock()
    teamchan, ok := TeamChanMap[teamid]
    defer TeamChanMapMutex.Unlock()
    if !ok {
      teamchan = TeamChans(make([]chan string, 0, 5))
      TeamChanMap[teamid] = teamchan
    }
    if len(teamchan) >= 5 { return errors.New("too many players") }
    perchan := make(chan string, 10)
    teamchan = append(teamchan, perchan)

    go PlayerWsLoop(conn, teamid, perchan, teamchan)

    return nil
  }
}

func WriteTeamChan(teamid string, msg string) {
  TeamChanMapMutex.Lock()
  res := TeamChanMap[teamid]
  TeamChanMapMutex.Unlock()
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

