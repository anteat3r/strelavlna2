package src

import (
	"errors"
	"fmt"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase/daos"
  log "github.com/anteat3r/golog"
)

var upgrader = websocket.Upgrader{
  ReadBufferSize: 1024,
  WriteBufferSize: 1024,
}

type CachedProb struct {
  id string
  diff string
}

var (
  ActiveContest = ""
  ActiveProbs = []CachedProb{}

  nErr = errors.New

  TeamChanMap = make(map[string]chan Msg)
  TeamChanMapMutex = sync.Mutex{}
)

type Msg fmt.Stringer

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
    if !ok {
      TeamChanMap[teamid] = make(chan Msg)
    }
    TeamChanMapMutex.Unlock()

    go PlayerWsLoop(conn, teamid, teamchan)

    return nil
  }
}

func PlayerWsLoop(conn *websocket.Conn, team string, tchan chan Msg) {
  loop: for {
    select {
    case m, ok := <-tchan:
      if !ok { break loop }
      log.Info(m)
      // PlayerWsHandleMsg(team, m)
    default:
      m, p, e := conn.ReadMessage()
      log.Info(m, p, e)
    }
  }
}

// func PlayerWsHandleMsg(team string, msg Msg) {
//   switch m := msg.(type) {
//
//   }
// }
