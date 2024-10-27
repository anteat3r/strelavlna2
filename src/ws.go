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
  id string
}
func (c *TeamChanMu) Send(msg... string) {
  resmsg := strings.Join(msg, DELIM)
  readmsg := strings.Join(msg, "|")
  c.mu.RLock()
  for _, ch := range c.ch {
    if ch == nil { continue }
    ch<- resmsg
  }
  c.mu.RUnlock()
  fmt.Printf("%s >- %s   -> %s\n", formTime(), c.id, readmsg)
  JSONlog(c.id, false, false, -1, readmsg)
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

type ActiveContStruct struct {
  Id string
  Start time.Time
  End time.Time
}

var (
  ActiveContest = NewRWMutexWrap(ActiveContStruct{})

  nErr = errors.New

  TeamChanMap = NewRWMutexWrap(make(map[string]*TeamChanMu))
  // TeamChanMap = make(map[string]*TeamChanMu)
  // teamChanMapMutex = sync.Mutex{}

  AdminsChans = NewRWMutexWrap(make(map[string]chan string))
  // AdminsChans = make(map[string]chan string)
  // adminsMutex = sync.RWMutex{}

  // Workers = make(map[string]struct{})
  // workersMutex = sync.RWMutex{}
  Workers = NewRWMutexWrap(make(map[string]struct{}))

  // AdminCnt = NewRWMutexWrap(0)
)

func AdminSend(msg... string) {
  resmsg := strings.Join(msg, DELIM)
  readmsg := strings.Join(msg, "|")
  AdminsChans.RWith(func(v map[string]chan string) {
    for _, ch := range v {
      if ch == nil { continue }
      ch<- resmsg
    }
  })
  fmt.Printf("%s >>- -> %s\n", formTime(), readmsg)
  JSONlog("", true, false, 0, readmsg)
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

    var ok bool
    ActiveContest.RWith(func(v ActiveContStruct) { ok = cont == v.Id })
    if !ok { return c.String(400, "not ready") }

    var players *TeamChanMu
    TeamChanMap.RWith(func(v map[string]*TeamChanMu) {
      players, ok = v[teamid]
    })

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

    var teamchan *TeamChanMu
    var ok bool
    TeamChanMap.With(func(v *map[string]*TeamChanMu) {
      teamchan, ok = (*v)[teamid]
      if !ok {
        teamchan = &TeamChanMu{sync.RWMutex{}, make([]chan string, 5, 5), teamid}
        (*v)[teamid] = teamchan
      }
    })

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

    var team TeamM
    Teams.RWith(func(v map[string]*RWMutexWrap[TeamS]) {
      team, ok = v[teamid]
    })
    if !ok {
      log.Error("invalid teamid", teamid)
      return dbErr("invalid teamid", teamid)
    }

    conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    if err != nil { return err }

    fmt.Printf("%s >- %s:%d + >->\n", formTime(), teamrec.GetId(), i)
    JSONlog(teamid, false, true, i, ":connect")
    go PlayerWsLoop(conn, teamid, perchan, teamchan, i, team)

    return nil
  }
}

func WriteTeamChan(teamid string, msg... string) {
  var res *TeamChanMu
  TeamChanMap.RWith(func(v map[string]*TeamChanMu) {
    res = v[teamid]
  })
  if res == nil { return }
  res.Send(msg...)
}

func PlayerWsLoop(
  conn *websocket.Conn,
  team string,
  perchan chan string,
  tchan *TeamChanMu,
  idx int,
  teamM TeamM,
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
      err := PlayerWsHandleMsg(team, m, perchan, tchan, idx, teamM)
      if err != nil {
        perchan<- "err" + DELIM + err.Error()
      }
    }
  }
  fmt.Printf("%s >- %s:%d - <-< %s\n", formTime(), team, idx, oerr.Error())
  JSONlog(team, false, true, idx, ":disconnect")
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

    var ok bool
    AdminsChans.RWith(func(v map[string]chan string) {
      _, ok = v[adminid]
    })
    if ok { return nErr("admin already connected") }
    perchan := make(chan string, 10)
    AdminsChans.With(func(v *map[string]chan string) {
      (*v)[adminid] = perchan
    })

    conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    if err != nil { return err }

    fmt.Printf("%s >>- %s + >->\n", formTime(), adminrec.GetId())
    JSONlog(adminrec.GetId(), true, true, 0, ":connect")
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
  // adminCntMu.Lock()
  // AdminCnt += 1
  // adminCntMu.Unlock()
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
  fmt.Printf("%s >>- %s - <-< %s\n", formTime(), id, oerr.Error())
  JSONlog(id, true, true, 0, ":disconnect")
  conn.Close()

  err := AdminWsHandleMsg(email, perchan, "unwork", id)
  if err != nil { log.Error(err) }

  AdminsChans.With(func(v *map[string]chan string) {
    delete(*v, id)
  })

  // adminCntMu.Lock()
  // AdminCnt -= 1
  // adminCntMu.Unlock()
  AdminSend("unfocused", id)
}
