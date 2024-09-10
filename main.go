package main

import (
	"log"
	"os"

	"github.com/anteat3r/strelavlna2/src"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func main() {
  app := pocketbase.New()
  src.Dao = app.Dao()

  app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
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

    mailer := app.NewMailClient()

    e.Router.POST(
      "/api/mailcheck",
      src.MailCheckEndp(app.Dao(), mailer),
    )

    e.Router.POST(
      "/api/register",
      src.TeamRegisterEndp(app.Dao(), mailer),
    )

    e.Router.GET(
      "/api/play/:team",
      src.PlayWsEndpoint(app.Dao()),
    )

    // e.Router.POST(
    //   "/api/register",
    //   
    // )

    return nil
  })

  if err := app.Start(); err != nil {
    log.Fatal(err)
  }
}
