package src

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/types"
)

func SchoolQueryEndp(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {
    res := []struct{Name string `db:"plny_nazev"`}{}
    err := dao.DB().
     NewQuery("SELECT plny_nazev FROM skoly WHERE okres = {:okres}").
     Bind(dbx.Params{
       "okres": c.QueryParam("o"),
     }).All(&res)
    if err != nil { return err }
    nres := ""
    for i, s := range res {
      nres += s.Name
      if i != len(res)-1 { nres += "*" }
    }
    return c.String(200, nres)
  }
}

func tint(s string) int {
  r, _ := strconv.Atoi(s)
  return r
}

func LoadSchoolsEndp(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {
    f, _ := os.ReadFile("/home/rosta/strelavlna2/Skoly.csv")
    lines := strings.Split(string(f), "\n")
    data := [][]string{}
    for _, l := range lines {
      data = append(data, strings.Split(l, "*"))
    }
    coll, _ := dao.FindCollectionByNameOrId("skoly")
    red_cache := make(map[string]bool)
    for _, l := range data {
      rec := models.NewRecord(coll)
      if red_cache[l[0]] { continue }
      if l[26] != "Základní škola" { continue }
      red_cache[l[0]] = true
      rec.Set("red_izo", tint(l[0]))
      rec.Set("ico", tint(l[1]))
      rec.Set("zrizovatel", tint(l[2]))
      rec.Set("uzemi", l[3])
      rec.Set("kraj", l[4])
      rec.Set("okres", l[5])
      rec.Set("spravni_urad", l[6])
      rec.Set("orp", tint(l[7]))
      rec.Set("orp_nazev", l[8])
      rec.Set("plny_nazev", l[9])
      rec.Set("zkraceny_nazev", l[10])
      rec.Set("ulice", l[11])
      rec.Set("c_p", tint(l[12]))
      rec.Set("c_or", tint(l[13]))
      rec.Set("c_obce", l[14])
      rec.Set("psc", tint(l[15]))
      rec.Set("misto", l[16])
      rec.Set("kod_ruian", tint(l[17]))
      rec.Set("telefon", l[18])
      rec.Set("fax", l[19])
      rec.Set("email_1", l[20])
      rec.Set("email_2", l[21])
      rec.Set("www", l[22])
      rec.Set("reditel", l[23])
      rec.Set("izo", tint(l[24]))
      rec.Set("typ", l[25])
      // rec.Set("druh", l[26])
      rec.Set("kapacita", tint(l[34]))
      t, _ := time.Parse("2.1.2006", l[35])
      dt, _ := types.ParseDateTime(t)
      rec.Set("datum_zahajeni_cinnosti", dt)
      dao.SaveRecord(rec)
    }
    return nil
  }
}