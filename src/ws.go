package src

import (
	"errors"
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

type CachedProb struct {
  id string
  diff string
}

var (
  ActiveContest = "ccwxcxbrroofuzl"
  ActiveProbs = []CachedProb{}

  nErr = errors.New

  TeamChanMap = make(map[string]chan string)
  TeamChanMapMutex = sync.Mutex{}
)

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
      teamchan = make(chan string, 10)
      TeamChanMap[teamid] = teamchan
    }
    TeamChanMapMutex.Unlock()

    go PlayerWsLoop(conn, teamid, teamchan)

    return nil
  }
}

func WriteTeamChan(teamid string, msg string) {
  TeamChanMapMutex.Lock()
  res := TeamChanMap[teamid]
  TeamChanMapMutex.Unlock()
  res<- msg
}

func PlayerWsLoop(conn *websocket.Conn, team string, tchan chan string) {
  wsrchan := make(chan string)
  perchan := make(chan string)
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
    case m, ok := <-tchan:
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
      err := PlayerWsHandleMsg(team, m, tchan, perchan)
      if err != nil {
        perchan<- "err:" + err.Error()
      }
    }
  }
}

