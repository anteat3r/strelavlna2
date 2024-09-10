package src

import (
	"encoding/json"
	"net/mail"
	"os"
	"strconv"
	"strings"
	"time"

	log "github.com/anteat3r/golog"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/mailer"
	"github.com/pocketbase/pocketbase/tools/types"
)

func SchoolQueryEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {
		res := []struct {
			Name string `db:"plny_nazev"`
		}{}
		err := dao.DB().
			NewQuery("SELECT plny_nazev FROM skoly WHERE okres LIKE {:okres}").
			Bind(dbx.Params{
				"okres": c.QueryParam("o") + "%",
			}).All(&res)
		if err != nil {
			return err
		}
		nres := ""
		for i, s := range res {
			nres += s.Name
			if i != len(res)-1 {
				nres += "*"
			}
		}
		return c.String(200, nres)
	}
}

func ContestsEndp(dao *daos.Dao, after bool) echo.HandlerFunc {
	return func(c echo.Context) error {
		res := []struct {
			Id                string         `db:"id" json:"id"`
			Subject           string         `db:"subject" json:"subject"`
			Name              string         `db:"name" json:"name"`
			OnlineRound       types.DateTime `db:"online_round" json:"online_round"`
			FinalRound        types.DateTime `db:"final_round" json:"final_round"`
			RegistrationStart types.DateTime `db:"registration_start" json:"registration_start"`
			RegistrationEnd   types.DateTime `db:"registration_end" json:"registration_end"`
		}{}
		var err error
		if after {
			err = dao.DB().
				NewQuery("SELECT * FROM contests WHERE registration_start < date('now')").
				All(&res)
		} else {
			err = dao.DB().
				NewQuery("SELECT * FROM contests").
				All(&res)
		}
		if err != nil {
			log.Error(err)
			return err
		}
		out, err := json.Marshal(res)
		if err != nil {
			return err
		}
		return c.String(200, string(out))
	}
}

func SingleSchoolEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {
		res := struct {
			Name string `db:"plny_nazev" json:"plny_nazev"`
		}{}
		err := dao.DB().
			NewQuery("SELECT plny_nazev FROM skoly WHERE id = {:id} LIMIT 1").
			Bind(dbx.Params{"id": c.PathParam("id")}).
			One(&res)
		if err != nil {
			return err
		}
		out, err := json.Marshal(res)
		if err != nil {
			return err
		}
		return c.String(200, string(out))
	}
}

func SingleContestEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {
		res := struct {
			Name string `db:"name" json:"name"`
		}{}
		err := dao.DB().
			NewQuery("SELECT name FROM contests WHERE id = {:id} LIMIT 1").
			Bind(dbx.Params{"id": c.PathParam("id")}).
			One(&res)
		if err != nil {
			return err
		}
		out, err := json.Marshal(res)
		if err != nil {
			return err
		}
		return c.String(200, string(out))
	}
}

func MailCheckEndp(dao *daos.Dao, mailerc mailer.Mailer) echo.HandlerFunc {
  return func(c echo.Context) error {
    res := struct{
      Email string `json:"email"`
      Code string `json:"code"`
    }{}
    err := c.Bind(&res)
    if err != nil { return err }
    err = mailerc.Send(&mailer.Message{
      From: mail.Address{
        Address: "strela-vlna@gchd.cz",
        Name: "Střela Vlna boťák",
      },
      To: []mail.Address{{Address: res.Email}},
      Subject: "Ověřovací kód emailu",
      HTML: "Nebudu to zdržovat: " + res.Code,
    })
    if err != nil { return err }
    return c.String(200, "OK")
  }
}

func TeamRegisterEndp(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {
    res := struct{
      ContestId string `form:"id"`
      TeamName string `form:"team_name"`
      Email string `form:"team_email"`
      PlayerName1 string `form:"player_name_1"`
      PlayerName2 string `form:"player_name_2"`
      PlayerName3 string `form:"player_name_3"`
      PlayerName4 string `form:"player_name_4"`
      PlayerName5 string `form:"player_name_5"`
      SchoolName string `form:"school_name"`
    }{}
    err := c.Bind(&res)
    if err != nil { return err }

    comp, err := dao.FindRecordById("contests", res.ContestId)
    if err != nil { return err }

    if comp.GetDateTime("registration_start").Time().After(time.Now()) {
      return c.String(400, "contest registration has not yet started")
    }

    if comp.GetDateTime("registration_end").Time().Before(time.Now()) {
      return c.String(400, "contest registration has already ended")
    }

    school, err := dao.FindFirstRecordByData("skoly", "plny_nazev", res.SchoolName)
    if err != nil { return err }

    coll, err := dao.FindCollectionByNameOrId("teams")
    if err != nil { return err }

    rec := models.NewRecord(coll)
    rec.Set("contest", comp.Id)
    rec.Set("school", school.Id)
    rec.Set("name", res.TeamName)
    rec.Set("email", res.Email)
    rec.Set("player1", res.PlayerName1)
    rec.Set("player2", res.PlayerName2)
    rec.Set("player3", res.PlayerName3)
    rec.Set("player4", res.PlayerName4)
    rec.Set("player5", res.PlayerName5)

    err = dao.SaveRecord(rec)
    log.Info(rec.Id)
    return c.String(500, "DEBUG")

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
			if red_cache[l[0]] {
				continue
			}
			if l[26] != "Základní škola" {
				continue
			}
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
