package main

import (
	"log"
	"os"

	"github.com/labstack/echo/v5"
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
        os.DirFS("./web/public/"),
        false,
      ),
    )
    e.Router.GET("/hello", func(c echo.Context) error {
      return c.String(200, "Hello World!")
    })
    return nil
  })
  if err := app.Start(); err != nil {
    log.Fatal(err)
  }
}
