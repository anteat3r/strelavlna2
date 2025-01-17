package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/anteat3r/strelavlna2/src"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/cron"
	"github.com/pocketbase/pocketbase/tools/types"

	log "github.com/anteat3r/golog"
	"github.com/joho/godotenv"
)

func customHTTPErrorHandler(c echo.Context, err error) {
	code := http.StatusInternalServerError
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
	}

  c.String(code, err.Error())
}

func pickProbs(m map[string]src.ProbM) []string {
  res := make([]string, 0)
  for id, _ := range m {
    if len(id) > 15 { continue }
    res = append(res, id)
  }
  return res
}


func main() {
  err := godotenv.Load()
  if err != nil { fmt.Println(err) }

  app := pocketbase.New()

  app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
    e.Router.HTTPErrorHandler = customHTTPErrorHandler
    mailerc := app.NewMailClient()

    sched := cron.New()

    sched.MustAdd(
      "emailsend",
      "@hourly",
      func() {
        recs, err := app.Dao().FindRecordsByFilter(
          "teams_reg_req",
          `id != ""`,
          "-created",
          0, 0,
        )
        if err != nil {
          if err.Error() != "sql: no rows in result set" {
            log.Error(err)
          }
          return
        }
        for _, rec := range recs {
          dt := rec.GetDateTime("last_sent").Time()
          if !time.Now().After(dt.Add(time.Minute)) { continue }
          err = src.TeamRegisterSendEmail(rec, app.Dao(), mailerc)
          if err != nil { log.Error(err) }
          ndt, _ := types.ParseDateTime(time.Now().Add(time.Hour * 24 * 7 * 10000))
          rec.Set("last_sent", ndt)
          err = app.Dao().SaveRecord(rec)
          if err != nil { log.Error(err) }
        }
      },
    )

    sched.MustAdd(
      "backscore",
      "*/1 * * * *",
      func() {
        if src.ActiveContest.GetPrimitiveVal().Id == "" { return }
        log.Info("backuping")
        src.Teams.RWith(func(v map[string]src.TeamM) {
          for id, tm := range v {
            // log.Info(id)
            tm.RWith(func(w src.TeamS) {
              money := w.Money
              bought := pickProbs(w.Bought)
              pending := pickProbs(w.Pending)
              solved := pickProbs(w.Solved)
              sold := pickProbs(w.Sold)
              for _, mp := range []map[string]src.ProbM{ w.Bought, w.Pending } {
                for id, pr := range mp {
                  if len(id) <= 15 { continue }
                  pr.RWith(func(u src.ProbS) {
                    cost, _ := src.GetCost(u.Diff)
                    money += cost
                  })
                }
              }
              encstats, err := json.Marshal(w.Stats)
              if err != nil { log.Error(err); return }
              encchat, err := json.Marshal(w.Chat)
              if err != nil { log.Error(err); return }
              checkscache := make([]string, 0, len(w.ChatChecksCache) + len(w.SolChecksCache))
              src.Checks.RWith(func(v map[string]*src.RWMutexWrap[src.CheckS]) {
                for _, chid := range w.ChatChecksCache {
                  // log.Info(chid, prid)
                  check, ok := v[chid]
                  if !ok { continue }
                  var chres []byte
                  check.RWith(func(v src.CheckS) {
                    if len(v.ProbId) > 15 { ok = false; return }
                    chres, err = json.Marshal(v)
                    if err != nil { log.Error(err); ok = false }
                  })
                  if !ok { continue }
                  checkscache = append(checkscache, string(chres))
                }
                for _, chid := range w.SolChecksCache {
                  // log.Info(chid, prid)
                  check, ok := v[chid]
                  if !ok { continue }
                  var chres []byte
                  check.RWith(func(v src.CheckS) {
                    if len(v.ProbId) > 15 { ok = false; return }
                    chres, err = json.Marshal(v)
                    if err != nil { log.Error(err); ok = false }
                  })
                  if !ok { continue }
                  checkscache = append(checkscache, string(chres))
                }
              })
              encchecks, err := json.Marshal(checkscache)
              if err != nil { log.Error(err); return }
              _, err = app.Dao().DB().
                Update(
                  "teams",
                  dbx.Params{
                    "score": money,
                    "bought": src.StringifyRefList(bought),
                    "pending": src.StringifyRefList(pending),
                    "solved": src.StringifyRefList(solved),
                    "sold": src.StringifyRefList(sold),
                    "stats": string(encstats),
                    "chat": string(encchat),
                    "checks": string(encchecks),
                  },
                  dbx.HashExp{"id": id},
                ).
                Execute()
              if err != nil { log.Error(err) }
            })
          }
        })
        log.Info("backuping done")
      },
    )

    sched.Start()

    e.Router.GET(
      "/*",
      apis.StaticDirectoryHandler(
        os.DirFS("../web/"),
        false,
      ),
    )

    urls := make(map[string]string)
    data, err := os.ReadFile("urls.json")
    if err == nil {
      err = json.Unmarshal(data, &urls)
      if err != nil { log.Error(err) }
    } else {
      log.Error(err)
    }
    e.Router.GET(
      "/api/short/set",
      func(c echo.Context) error {
        key := c.QueryParam("k")
        _, ok := urls[key]
        if ok { return c.String(400, "already exists") }
        urls[key] = c.QueryParam("v")
        res, err := json.Marshal(urls)
        if err != nil { return c.String(400, err.Error()) }
        err = os.WriteFile("urls.json", res, 0666)
        if err != nil { return c.String(400, err.Error()) }
        return c.String(200, "")
      },
    )
    e.Router.GET(
      "/shrt/:name",
      func(c echo.Context) error {
        url, ok := urls[c.PathParam("name")]
        if !ok { return c.String(400, "not found") }
        return c.Redirect(301, url)
      },
    )
    e.Router.GET(
      "/s/:name",
      func(c echo.Context) error {
        url, ok := urls[c.PathParam("name")]
        if !ok { return c.String(400, "not found") }
        return c.Redirect(301, url)
      },
    )

    // PathParams o (okres)
    e.Router.GET(
      "/api/schools",
      src.SchoolQueryEndp(app.Dao()),
    )

    e.Router.GET(
      "/api/school/:id",
      src.SingleSchoolEndp(app.Dao()),
    )

    e.Router.GET(
      "/api/contest/:id",
      src.SingleContestEndp(app.Dao()),
    )

    e.Router.GET(
      "/api/contests",
      src.ContestsEndp(app.Dao(), false),
    )

    e.Router.GET(
      "/api/teamcontstart/:id",
      src.TeamContestStartEndp(app.Dao()),
    )

    e.Router.GET(
      "/api/contests/after",
      src.ContestsEndp(app.Dao(), true),
    )

    e.Router.POST(
      "/api/mailcheck",
      src.MailCheckEndp(app.Dao(), mailerc),
    )

    e.Router.POST(
      "/api/register",
      src.TeamRegisterEndp(app.Dao(), mailerc),
    )

    e.Router.GET(
      "/api/regconfirm/:regreq",
      src.TeamRegisterConfirmEndp(app.Dao(), mailerc),
    )

    e.Router.GET(
      "/api/login",
      src.PlayCheckEndpoint(app.Dao()),
    )

    e.Router.GET(
      "/api/play/:team",
      src.PlayWsEndpoint(app.Dao()),
    )

    e.Router.GET(
      "/ws/admin/play/:admin",
      src.AdminWsEndpoint(app.Dao()),
    )

    e.Router.GET(
      "/api/admin/migrateregreq",
      src.SendTeams(app.Dao(), mailerc, time.Millisecond),
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/schema",
      func(c echo.Context) error {
        coll, err := app.Dao().FindCollectionByNameOrId(c.QueryParam("c"))
        if err != nil { return err }
        return c.JSON(200, coll)
      },
      // apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/query",
      func(c echo.Context) error {
        rows, err := app.Dao().DB().NewQuery(c.QueryParam("q")).Rows()
        if err != nil { return err }
        
        res := make([]map[string]string, 0)
        for rows.Next() {
          nullmap := make(dbx.NullStringMap)
          rows.ScanMap(nullmap)
          defmap := make(map[string]string)
          for k, v := range nullmap { defmap[k] = v.String }
          res = append(res, defmap)
        }
        if rows.Err() != nil { return rows.Err() }
        
        return c.JSON(200, res)
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/local/query",
      func(c echo.Context) error {

        if os.Getenv("LOCAL_KEY") != c.Request().Header.Get("Authorization") {
          return c.String(400, "invalid auth key")
        }

        rows, err := app.Dao().DB().NewQuery(c.QueryParam("q")).Rows()
        if err != nil { return err }
        
        res := make([]map[string]string, 0)
        for rows.Next() {
          nullmap := make(dbx.NullStringMap)
          rows.ScanMap(nullmap)
          defmap := make(map[string]string)
          for k, v := range nullmap { defmap[k] = v.String }
          res = append(res, defmap)
        }
        if rows.Err() != nil { return rows.Err() }
        
        return c.JSON(200, res)
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/loadactivec",
      func(c echo.Context) error {
        var res string
        src.ActiveContest.RWith(func(v src.ActiveContStruct) {
          res = v.Id
        })
        return c.String(200, res)
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/loadactivecstart",
      func(c echo.Context) error {
        var res time.Time
        src.ActiveContest.RWith(func(v src.ActiveContStruct) {
          res = v.Start
        })
        return c.String(200, res.Format("2006-01-02T15:04"))
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/loadactivecend",
      func(c echo.Context) error {
        var res time.Time
        src.ActiveContest.RWith(func(v src.ActiveContStruct) {
          res = v.End
        })
        return c.String(200, res.Format("2006-01-02T15:04"))
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/setactivecstart",
      func(c echo.Context) error {
        if c.QueryParam("i") == "" {
          return c.String(400, "invalid param")
        }
        t, err := time.Parse("2006-01-02T15:04 -0700", c.QueryParam("i") + " +0100")
        if err != nil { return err }
        src.ActiveContest.With(func(v *src.ActiveContStruct) {
          v.Start = t
        })
        _, err = app.Dao().DB().Update(
          "texts",
          dbx.Params{"text": "<p>" + c.QueryParam("i") + " +0100</p>"},
          dbx.HashExp{"name": "def_activecontstart"},
        ).Execute()
        if err != nil { return err }
        return c.String(200, "")
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/setactivecend",
      func(c echo.Context) error {
        if c.QueryParam("i") == "" {
          return c.String(400, "invalid param")
        }
        t, err := time.Parse("2006-01-02T15:04 -0700", c.QueryParam("i") + " +0100")
        if err != nil { return err }
        src.ActiveContest.With(func(v *src.ActiveContStruct) {
          v.End = t
        })
        _, err = app.Dao().DB().Update(
          "texts",
          dbx.Params{"text": "<p>" + c.QueryParam("i") + " +0100</p>"},
          dbx.HashExp{"name": "def_activecontend"},
        ).Execute()
        if err != nil { return err }
        return c.String(200, "")
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/setactivec",
      func(c echo.Context) error {
        if c.QueryParam("i") == "" {
          return c.String(400, "invalid param")
        }
        src.ActiveContest.With(func(v *src.ActiveContStruct) {
          v.Id = c.QueryParam("i")
        })
        _, err = app.Dao().DB().Update(
          "texts",
          dbx.Params{"text": "<p>" + c.QueryParam("i") + "</p>"},
          dbx.HashExp{"name": "def_activecont"},
        ).Execute()
        if err != nil { return err }
        return c.String(200, "")
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/setactivecem",
      func(c echo.Context) error {
        src.ActiveContest.With(func(v *src.ActiveContStruct) {
          v.Id = ""
        })
        _, err = app.Dao().DB().Update(
          "texts",
          dbx.Params{"text": "<p></p>"},
          dbx.HashExp{"name": "def_activecont"},
        ).Execute()
        if err != nil { return err }
        return c.String(200, "")
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/loadcosts",
      func(c echo.Context) error {
        res := ""
        src.Costs.RWith(func(v map[string]int) {
          for k, v := range v {
            res += k + " -> " + strconv.Itoa(v) + "<br>"
          }
        })
        return c.String(200, res)
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/setcosts",
      func(c echo.Context) error {
        k := c.QueryParam("k")
        if k == "" { return c.String(400, "invalid param") }
        v := c.QueryParam("v")
        if v == "" { return c.String(400, "invalid param") }
        vint, err := strconv.Atoi(v)
        if err != nil { return c.String(400, err.Error()) }
        src.Costs.With(func(v *map[string]int) {
          (*v)[k] = vint
        })
        sres := ""
        src.Costs.RWith(func(vmap map[string]int) {
          for k, v := range vmap {
            sres += k + " = " + strconv.Itoa(v) + "; "
          }
        })
        sres = strings.TrimSuffix(sres, "; ")
        return c.String(200, "ok")
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/remcosts",
      func(c echo.Context) error {
        k := c.QueryParam("k")
        if k == "" { return c.String(400, "invalid param") }
        src.Costs.With(func(v *map[string]int) {
          delete(*v, k)
        })
        sres := ""
        src.Costs.RWith(func(vmap map[string]int) {
          for k, v := range vmap {
            sres += k + " = " + strconv.Itoa(v) + "; "
          }
        })
        sres = strings.TrimSuffix(sres, "; ")
        return c.String(200, "ok")
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/probhash",
      src.ProbWorkEndp(app.Dao()),
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/contsetup",
      src.SetupContEndp(),
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/sendspam",
      src.SendSpam(app.Dao(), mailerc),
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/getdump",
      src.GetDump(),
      apis.RequireAdminAuth(),
    )

    // e.Router.GET(
    //   "/api/test/probgen",
    //   func(c echo.Context) error {
    //     prob, err := app.Dao().FindRecordById("probs", c.QueryParam("id"))
    //     if err != nil { return err }
    //     g, err := src.ParseGraph(prob.GetString("graph"))
    //     if err != nil { return err }
    //     text, sol, err := g.Generate(prob.GetString("text"), prob.GetString("solution"))
    //     if err != nil { return err }
    //     return c.String(200, text + "\n\n\n\n" + sol)
    //   },
    // )
    //

    e.Router.GET(
      "/api/admin/loadteams",
      func(c echo.Context) error {
        return src.DBLoadTeamsFromDump()
      },
      apis.RequireAdminAuth(),
    )

    e.Router.POST(
      "/api/cash",
      src.CashEndp(app.Dao()),
    )

    e.Router.GET(
      "/api/admin/paperprobs",
      src.GenProbPaper(app.Dao()),
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/upgradeteams",
      src.UpgradeTeams(app.Dao()),
      apis.RequireAdminAuth(),
    )


    err = src.SetupInitLoadData(app.Dao())
    if err != nil { return err }

    // if src.ActiveContest.GetPrimitiveVal().Id != "" {
    //   err = src.DBUnbackTeams()
    //   if err != nil { log.Error(err) }
    // }

    return nil
  })

  app.OnRecordAfterUpdateRequest("probs").Add(func(e *core.RecordUpdateEvent) error {
    src.Probs.RWith(func(v map[string]*src.RWMutexWrap[src.ProbS]) {
      pr, ok := v[e.Record.Id]
      if !ok { return }
      pr.With(func(v *src.ProbS) {
        v.Text = e.Record.GetString("text")
        v.Solution = e.Record.GetString("solution")
      })
    })
    return nil
  })

  src.App = app

  if err := app.Start(); err != nil {
    panic(err)
  }
}
