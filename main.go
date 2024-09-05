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

  app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
    e.Router.GET(
      "/*",
      apis.StaticDirectoryHandler(
        os.DirFS("../web/"),
        false,
      ),
    )
    e.Router.GET(
      "/school",
      src.SchoolQueryEndp(app.Dao()),
    )
    return nil
  })

  if err := app.Start(); err != nil {
    log.Fatal(err)
  }
}
