package main

import (
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/anteat3r/strelavlna2/src"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/cron"
	"github.com/pocketbase/pocketbase/tools/types"

	log "github.com/anteat3r/golog"
)

func customHTTPErrorHandler(c echo.Context, err error) {
	code := http.StatusInternalServerError
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
	}

  c.String(code, err.Error())
}


func main() {
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
          dt := rec.GetDateTime("updated").Time()
          if !time.Now().After(dt.Add(time.Hour * 6)) { continue }
          err = src.TeamRegisterSendEmail(rec, app.Dao(), mailerc)
          if err != nil { log.Error(err) }
          ndt, _ := types.ParseDateTime(time.Now().Add(time.Hour * 24 * 7 * 10000))
          rec.Set("updated", ndt)
          err = app.Dao().SaveRecord(rec)
          if err != nil { log.Error(err) }
        }
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

    e.Router.GET(
      "/",
      func(c echo.Context) error {
        return c.Redirect(301, "/about_us/")
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
        return c.JSON(200, coll.Schema)
      },
      // apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/loadactivec",
      func(c echo.Context) error {
        src.ActiveContestMu.RLock()
        res := src.ActiveContest
        src.ActiveContestMu.RUnlock()
        return c.String(200, res)
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/setactivec",
      func(c echo.Context) error {
        log.Info(c.QueryParams())
        if c.QueryParam("i") == "" {
          log.Info("soadij")
          return c.String(400, "invalid param")
        }
        log.Info("asod")
        src.ActiveContestMu.Lock()
        log.Info("asod")
        src.ActiveContest = c.QueryParam("i")
        log.Info("asod")
        src.ActiveContestMu.Unlock()
        log.Info("asod")
        app.Logger().Info(`ActiveContest set to "` + c.QueryParam("i") + `" by ` + apis.RequestInfo(c).Admin.Email)
        return c.String(200, "")
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/setactivecem",
      func(c echo.Context) error {
        src.ActiveContestMu.Lock()
        src.ActiveContest = ""
        src.ActiveContestMu.Unlock()
        app.Logger().Info(`ActiveContest set to "" by ` + apis.RequestInfo(c).Admin.Email)
        return c.String(200, "")
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/loadcosts",
      func(c echo.Context) error {
        res := ""
        src.CostsMu.RLock()
        for k, v := range src.Costs {
          res += k + " -> " + strconv.Itoa(v) + "<br>"
        }
        src.CostsMu.RUnlock()
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
        src.CostsMu.Lock()
        src.Costs[k] = vint
        src.CostsMu.Unlock()  
        app.Logger().Info(`Costs "` + k + `" set to "` + v + `" by ` + apis.RequestInfo(c).Admin.Email)
        return c.String(200, "ok")
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/remcosts",
      func(c echo.Context) error {
        k := c.QueryParam("k")
        if k == "" { return c.String(400, "invalid param") }
        src.CostsMu.Lock()
        delete(src.Costs, k)
        src.CostsMu.Unlock()
        app.Logger().Info(`Costs "` + k + `" removed by ` + apis.RequestInfo(c).Admin.Email)
        return c.String(200, "ok")
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/probhash",
      src.ProbWorkEndp(app.Dao()),
    )

    e.Router.GET(
      "/api/admin/contsetup",
      src.SetupContEndp(app.Dao()),
    )

    initcont, err := app.Dao().FindFirstRecordByData("texts", "name", "def_activecont")
    if err != nil { return err }

    text_ := initcont.GetString("text")
    text_ = strings.TrimPrefix(text_, "<p>")
    text_ = strings.TrimSuffix(text_, "</p>")

    src.ActiveContest = text_

    initcosts, err := app.Dao().FindFirstRecordByData("texts", "name", "def_costs")
    if err != nil { return err }

    text := initcosts.GetString("text")
    text = strings.TrimPrefix(text, "<p>")
    text = strings.TrimSuffix(text, "</p>")

    for _, l := range strings.Split(text, "; ") {
      vals := strings.Split(l, " = ")
      if len(vals) != 2 { return errors.New("invalid costs") }
      val, err := strconv.Atoi(vals[1])
      if err != nil { return err }
      src.Costs[vals[0]] = val
    }

    cll, err := app.Dao().FindCollectionByNameOrId("checks")
    if err != nil { panic(err) }
    src.ChecksColl = cll

    return nil
  })

  src.App = app

  if err := app.Start(); err != nil {
    panic(err)
  }
}
