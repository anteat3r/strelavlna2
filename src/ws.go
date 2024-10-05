package src

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	log "github.com/anteat3r/golog"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase/daos"
)

var upgrader = websocket.Upgrader{
  ReadBufferSize: 1024,
  WriteBufferSize: 1024,
  CheckOrigin: func(r *http.Request) bool {
    // origin, ok := r.Header["Origin"]
    // if !ok { return false }
    // if len(origin) != 1 { return false }
    // if origin[0] != "https://strela-vlna.gchd.cz" { return false }
    return true
  },
}

type TeamChans []chan string

type TeamChanMu struct {
  mu sync.RWMutex
  ch TeamChans
}
func (c *TeamChanMu) Send(team string, msg... string) {
  resmsg := strings.Join(msg, DELIM)
  c.mu.RLock()
  for _, ch := range c.ch {
    if ch == nil { continue }
    ch<- resmsg
  }
  c.mu.RUnlock()
  fmt.Printf("%v >- %v -> %v", time.Now(), team, resmsg)
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
  ActiveContestStart time.Time
  ActiveContestEnd time.Time
  ActiveContestMu = sync.RWMutex{}

  nErr = errors.New

  TeamChanMap = make(map[string]*TeamChanMu)
  teamChanMapMutex = sync.Mutex{}

  AdminsChans = make(map[string]chan string)
  adminsMutex = sync.RWMutex{}

  Workers = make(map[string]struct{})
  workersMutex = sync.RWMutex{}

  AdminCnt = 0
  adminCntMu = sync.RWMutex{}
)

func AdminSend(msg... string) {
  resmsg := strings.Join(msg, DELIM)
  adminsMutex.RLock()
  for _, ch := range AdminsChans {
    if ch == nil { continue }
    ch<- resmsg
  }
  adminsMutex.RUnlock()
  fmt.Printf("%v >>- -> %v", time.Now(), msg)
}

// func AdminSendIdx(idx int, msg... string) {
//   resmsg := strings.Join(msg, DELIM)
//   adminsMutex.RLock()
//   defer adminsMutex.RUnlock()
//   if len(AdminsChans) >= idx || idx < 0 {
//     fmt.Printf("admin invalid index %v, %v\n", idx, AdminsChans)
//     return
//   }
//   if AdminsChans[idx] != nil {
//     AdminsChans[idx]<- resmsg
//     return
//   }
//   i := 0
//   for _, ch := range AdminsChans {
//     if ch == nil { continue }
//     if i == idx {
//       ch<- resmsg
//       return
//     }
//     i++
//   }
//   fmt.Printf("admin indx not found %v, %v\n", idx, AdminsChans)
// }

func PlayCheckEndpoint(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {

    teamid := c.QueryParam("id")
    if teamid == "" { return c.String(400, "invalid") }

    team, err := dao.FindRecordById("teams", teamid)
    if err != nil {
      _, err := dao.FindAdminById(teamid)
      if err != nil {
        return c.String(400, "invalid")
      } else {
        return c.String(200, "admin")
      }
    }
    cont := team.GetString("contest")

    ActiveContestMu.RLock()
    if cont != ActiveContest { 
      ActiveContestMu.RUnlock()
      return c.String(400, "not ready")
    }
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

    teamrec, err := dao.FindRecordById("teams", teamid)
    if err != nil { return err }
    // cont := team.GetString("contest")

    // ActiveContestMu.RLock()
    // if cont != ActiveContest { return nErr("contest not active") }
    // ActiveContestMu.RUnlock()

    teamChanMapMutex.Lock()
    teamchan, ok := TeamChanMap[teamid]
    if !ok {
      teamchan = &TeamChanMu{sync.RWMutex{}, make([]chan string, 5, 5)}
      TeamChanMap[teamid] = teamchan
    }
    teamChanMapMutex.Unlock()

    i := -1

    teamchan.mu.RLock()
    for j, ch := range teamchan.ch {
      if ch != nil { continue }
      i = j
      break
    }
    teamchan.mu.RUnlock()

    if i == -1 { return errors.New("too many players") }
    perchan := make(chan string, 10)

    teamchan.mu.Lock()
    teamchan.ch[i] = perchan
    teamchan.mu.Unlock()

    conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    if err != nil { return err }

    sLog("player connected", teamrec.GetId(), teamrec.GetString("name"))
    go PlayerWsLoop(conn, teamid, perchan, teamchan, i)

    return nil
  }
}

func WriteTeamChan(teamid string, msg... string) {
  teamChanMapMutex.Lock()
  res := TeamChanMap[teamid]
  if res == nil {
    teamChanMapMutex.Unlock()
    return
  }
  teamChanMapMutex.Unlock()
  res.Send(teamid, msg...)
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
    wsrloop: for {
      p, rm, err := conn.ReadMessage()
      if err != nil {
        close(wsrchan)
        break wsrloop
      }
      if p != websocket.TextMessage {
        perchan<- "err" + DELIM + "not text msg: " + DELIM + strconv.Itoa(p)
        continue
      }
      wsrchan<- string(rm)
    }
  }()
  var oerr error
  loop: for {
    select {
    case m, ok := <-perchan:
      if !ok {
        oerr = nErr("perchan closed")
        break loop
      }
      err := conn.WriteMessage(websocket.TextMessage, []byte(m))
      if err != nil {
        oerr = err
        break loop
      }
    case m, ok := <-wsrchan:
      if !ok {
        oerr = nErr("r chan closed")
        break loop
      }
      err := PlayerWsHandleMsg(team, m, perchan, tchan, idx)
      if err != nil {
        perchan<- "err" + DELIM + err.Error()
      }
    }
  }
  sLog("player quit", team, oerr)
  conn.Close()
  tchan.mu.Lock()
  tchan.ch[idx] = nil
  tchan.mu.Unlock()
  tchan.Send("unfocused", strconv.Itoa(idx))
}

func AdminWsEndpoint(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {

    adminid := c.PathParam("admin")
    if adminid == "" { return nErr("invalid admin path param") }

    adminrec, err := dao.FindAdminById(adminid)
    if err != nil { return err }

    adminsMutex.RLock()
    _, ok := AdminsChans[adminid]
    if ok {
      adminsMutex.RUnlock()
      return nErr("admin already connected")
    }
    adminsMutex.RUnlock()
    perchan := make(chan string, 10)
    adminsMutex.Lock()
    AdminsChans[adminid] = perchan
    adminsMutex.Unlock()

    conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    if err != nil { return err }

    sLog("admin connected", adminrec.GetId(), adminrec.Email)
    go AdminWsLoop(conn, adminrec.Email, perchan, adminid)

    return nil
  }
}

func AdminWsLoop(
  conn *websocket.Conn,
  email string,
  perchan chan string,
  id string,
) {
  adminCntMu.Lock()
  AdminCnt += 1
  adminCntMu.Unlock()
  wsrchan := make(chan string)
  go func(){
    wsrloop: for {
      p, rm, err := conn.ReadMessage()
      if err != nil {
        close(wsrchan)
        break wsrloop
      }
      if p != websocket.TextMessage {
        perchan<- "err" + DELIM + "not text msg: " + DELIM + strconv.Itoa(p)
        continue
      }
      wsrchan<- string(rm)
    }
  }()
  var oerr error
  loop: for {
    select {
    case m, ok := <-perchan:
      if !ok {
        oerr = nErr("perchan closed")
        break loop
      }
      err := conn.WriteMessage(websocket.TextMessage, []byte(m))
      if err != nil {
        oerr = err
        break loop
      }
    case m, ok := <-wsrchan:
      if !ok {
        oerr = nErr("r chan closed")
        break loop
      }
      err := AdminWsHandleMsg(email, perchan, m, id)
      if err != nil {
        perchan<- "err" + DELIM + err.Error()
      }
    }
  }
  sLog("admin quit", oerr)
  conn.Close()

  err := AdminWsHandleMsg(email, perchan, "unwork", id)
  if err != nil { log.Error(err) }

  adminsMutex.Lock()
  delete(AdminsChans, id)
  adminsMutex.Unlock()

  adminCntMu.Lock()
  AdminCnt -= 1
  adminCntMu.Unlock()
  AdminSend("unfocused", id)
}
