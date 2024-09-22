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

type TeamChanMu struct {
  mu sync.RWMutex
  ch TeamChans
}
func (c *TeamChanMu) Send(msg... string) {
  resmsg := strings.Join(msg, DELIM)
  c.mu.RLock()
  for _, ch := range c.ch {
    if ch == nil { continue }
    ch<- resmsg
  }
  c.mu.RUnlock()
}
func (c *TeamChanMu) Count() int {
  i := 0
  c.mu.RLock()
  for _, ch := range c.ch {
    if ch == nil { continue }
    i++
  }
  c.mu.RUnlock()
  return i
}

var (
  ActiveContest = ""
  ActiveContestMu = sync.RWMutex{}

  nErr = errors.New

  TeamChanMap = make(map[string]*TeamChanMu)
  teamChanMapMutex = sync.Mutex{}

  AdminsChans = make(TeamChans, 10)
  adminsMutex = sync.RWMutex{}
)

func AdminSend(msg... string) {
  resmsg := strings.Join(msg, DELIM)
  adminsMutex.RLock()
  for _, ch := range AdminsChans {
    if ch == nil { continue }
    ch<- resmsg
  }
  adminsMutex.RUnlock()
}

func PlayCheckEndpoint(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {

    teamid := c.QueryParam("id")
    if teamid == "" { return c.String(400, "invalid") }

    team, err := dao.FindRecordById("teams", teamid)
    if err != nil { return c.String(400, "invalid") }
    cont := team.GetString("contest")

    ActiveContestMu.RLock()
    if cont != ActiveContest { return c.String(400, "not running") }
    ActiveContestMu.RUnlock()

    teamChanMapMutex.Lock()
    players, ok := TeamChanMap[teamid]
    teamChanMapMutex.Unlock()

    if !ok { return c.String(200, "free") }

    if players.Count() >= 5 { return c.String(400, "full") }

    return c.String(200, "free")
  }
}
    
/// PathParam team (id of team)
func PlayWsEndpoint(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {

    teamid := c.PathParam("team")
    if teamid == "" { return nErr("invalid team path param") }

    _, err := dao.FindRecordById("teams", teamid)
    if err != nil { return err }
    // cont := team.GetString("contest")

    // ActiveContestMu.RLock()
    // if cont != ActiveContest { return nErr("contest not active") }
    // ActiveContestMu.RUnlock()

    log.Info(c.Request().Header)
    
    conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    log.Info(err)
    if err != nil { return err }

    teamChanMapMutex.Lock()

    teamchan, ok := TeamChanMap[teamid]
    if !ok {
      teamchan = &TeamChanMu{sync.RWMutex{}, make([]chan string, 5, 5)}
      TeamChanMap[teamid] = teamchan
    }
    teamChanMapMutex.Unlock()

    i := -1

    teamchan.mu.RLock()
    for j, c := range teamchan.ch {
      if c == nil { continue }
      i = j
      break
    }
    teamchan.mu.RUnlock()

    if i == -1 { return errors.New("too many players") }
    perchan := make(chan string, 10)

    teamchan.mu.Lock()
    teamchan.ch[i] = perchan
    teamchan.mu.Unlock()

    go PlayerWsLoop(conn, teamid, perchan, teamchan, i)

    return nil
  }
}

func WriteTeamChan(teamid string, msg... string) {
  teamChanMapMutex.Lock()
  res := TeamChanMap[teamid]
  teamChanMapMutex.Unlock()
  res.Send(msg...)
}

func PlayerWsLoop(
  conn *websocket.Conn,
  team string,
  perchan chan string,
  tchan *TeamChanMu,
  idx int,
) {
  wsrchan := make(chan string)
  go func(){
    for {
      p, rm, err := conn.ReadMessage()
      if err != nil {
        close(wsrchan)
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
        conn.Close()
        tchan.mu.Lock()
        tchan.ch[idx] = nil
        tchan.mu.Unlock()
        break loop
      }
      err := conn.WriteMessage(websocket.TextMessage, []byte(m))
      if err != nil {
        log.Error(err)
        conn.Close()
        tchan.mu.Lock()
        tchan.ch[idx] = nil
        tchan.mu.Unlock()
        break loop
      }
    case m, ok := <-wsrchan:
      if !ok {
        log.Info("r chan closed")
        conn.Close()
        tchan.mu.Lock()
        tchan.ch[idx] = nil
        tchan.mu.Unlock()
        break loop
      }
      err := PlayerWsHandleMsg(team, m, perchan, tchan, idx)
      if err != nil {
        perchan<- "err" + DELIM + err.Error()
      }
    }
  }
}

func AdminWsEndpoint(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {

    adminid := c.PathParam("admin")
    if adminid == "" { return nErr("invalid team path param") }

    _, err := dao.FindAdminById(adminid)
    if err != nil { return err }

    conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    if err != nil { return err }

    adminsMutex.RLock()
    i := -1
    for j, c := range AdminsChans {
      if c == nil { continue }
      i = j
      break
    }
    adminsMutex.RUnlock()
    perchan := make(chan string, 10)
    adminsMutex.Lock()
    if i == -1 { 
      AdminsChans = append(AdminsChans, perchan)
    } else {
      AdminsChans[i] = perchan
    }
    adminsMutex.Lock()

    go AdminWsLoop(conn, perchan, i)

    return nil
  }
}

func AdminWsLoop(
  conn *websocket.Conn,
  perchan chan string,
  idx int,
) {
  wsrchan := make(chan string)
  go func(){
    for {
      p, rm, err := conn.ReadMessage()
      if err != nil {
        close(wsrchan)
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
        conn.Close()
        adminsMutex.Lock()
        AdminsChans[idx] = nil
        adminsMutex.Unlock()
        break loop
      }
      err := conn.WriteMessage(websocket.TextMessage, []byte(m))
      if err != nil {
        log.Error(err)
        conn.Close()
        adminsMutex.Lock()
        AdminsChans[idx] = nil
        adminsMutex.Unlock()
        break loop
      }
    case m, ok := <-wsrchan:
      if !ok {
        log.Info("r chan closed")
        conn.Close()
        adminsMutex.Lock()
        AdminsChans[idx] = nil
        adminsMutex.Unlock()
        break loop
      }
      err := AdminWsHandleMsg(perchan, m, idx)
      if err != nil {
        perchan<- "err" + DELIM + err.Error()
      }
    }
  }
}
