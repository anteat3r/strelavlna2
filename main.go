package main

import (
	"net/http"
	"os"
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
  src.Dao = app.Dao()

  app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
    e.Router.HTTPErrorHandler = customHTTPErrorHandler
    mailer := app.NewMailClient()

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
        if err != nil { log.Error(err); return }
        for _, rec := range recs {
          dt := rec.GetDateTime("updated").Time()
          if !time.Now().After(dt.Add(time.Hour * 6)) { continue }
          err = src.TeamRegisterSendEmail(rec, app.Dao(), mailer)
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

    e.Router.File("/archive", "../web/archive.html")
    e.Router.File("/register", "../web/register.html")
    e.Router.File("/rules", "../web/rules.html")
    e.Router.File("/this_year", "../web/this_year.html")

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
      "/api/contests/after",
      src.ContestsEndp(app.Dao(), true),
    )

    e.Router.POST(
      "/api/mailcheck",
      src.MailCheckEndp(app.Dao(), mailer),
    )

    e.Router.POST(
      "/api/register",
      src.TeamRegisterEndp(app.Dao(), mailer),
    )

    e.Router.GET(
      "/api/regconfirm/:regreq",
      src.TeamRegisterConfirmEndp(app.Dao(), mailer),
    )

    e.Router.GET(
      "/api/validate_play",
      src.PlayChackEndpoint(app.Dao()),
    )

    e.Router.GET(
      "/api/play/:team",
      src.PlayWsEndpoint(app.Dao()),
    )

    e.Router.GET(
      "/api/admin/loadactivec",
      func(c echo.Context) error {
        return c.String(200, src.ActiveContest)
      },
      apis.RequireAdminAuth(),
    )

    e.Router.GET(
      "/api/admin/setactivec",
      func(c echo.Context) error {
        if c.QueryParam("i") == "" {
          return c.String(400, "invalid param")
        }
        src.ActiveContest = c.QueryParam("i")
        return c.String(200, "")
      },
      apis.RequireAdminAuth(),
    )

    // e.Router.POST(
    //   "/api/register",
    //   
    // )

    return nil
  })

  if err := app.Start(); err != nil {
    panic(err)
  }
}
