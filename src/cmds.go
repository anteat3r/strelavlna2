package src

import (
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/types"

	log "github.com/anteat3r/golog"
)

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

func LoadProbEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {
		f, _ := os.ReadFile("/opt/strelavlna2/ulohy1.tsv")
		lines := strings.Split(string(f), "&^&")
		data := [][]string{}
		for _, l := range lines {
			data = append(data, strings.Split(l, "#"))
		}
		coll, _ := dao.FindCollectionByNameOrId("probs")
		for _, l := range data {
			rec := models.NewRecord(coll)
      if len(l) < 6 {
        log.Info(l)
        continue
      }
      tp := "math"
      if l[0] == "F" {
        tp = "physics"
      }
			rec.Set("type", tp)
			rec.Set("name", l[0] + l[1])
			rec.Set("solution", l[2])
			rec.Set("diff", l[3])
			rec.Set("text", l[5])
			dao.SaveRecord(rec)
		}
		return nil
	}
}

const ProbWorkCharOffset = 0x21

func ProbWorkEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {

    res := []struct{
      Id string `db:"id"`
      Workers string `db:"workers"`
    }{}
    err := dao.DB().NewQuery("SELECT id, workers FROM probs").All(&res)
    if err != nil { return err }

    adminres := []struct{
      Id string `db:"id"`
      Email string `db:"email"`
    }{}
    err = dao.DB().NewQuery("SELECT id, email FROM _admins").All(&adminres)
    if err != nil { return err }

    admins := make([]string, len(adminres))
    for i := range adminres { admins[i] = adminres[i].Id }

    for _, p := range res {
      for i := range admins {
          j := rand.Intn(i + 1)
          admins[i], admins[j] = admins[j], admins[i]
      }
      wrk := strings.Join(admins, " ")
      _, err := dao.DB().NewQuery("UPDATE probs SET workers = {:workers} WHERE id = {:id}").
      Bind(dbx.Params{ "workers": wrk, "id": p.Id }).
      Execute()
      if err != nil { log.Error(err) }
    }

		return nil
	}
}

    //
    // e.Router.GET(
    //   "/api/admin/sendspam",
    //   func(c echo.Context) error {
    //     comp, err := app.Dao().FindRecordById("contests", c.QueryParam("id"))
    //     if err != nil { return err }
    //
    //     tmpls, err := app.Dao().FindFirstRecordByData("texts", "name", "spam_mail")
    //     if err != nil { return err }
    //
    //     var renbuf bytes.Buffer
    //     tmpl, err := template.New("mail_check_mail").Parse(tmpls.GetString("text"))
    //     if err != nil { return err }
    //
    //     err = tmpl.Execute(&renbuf, struct{
    //       CompSubject,
    //       CompName,
    //       OnlineRound,
    //       FinalRound,
    //       RegistrationStart,
    //       RegistrationEnd string
    //     }{
    //       comp.GetString("subject"),
    //       comp.GetString("name"),
    //       comp.GetDateTime("online_round").Time().Format("1.2.2006 15:04:05"),
    //       comp.GetDateTime("final_round").Time().Format("1.2.2006 15:04:05"),
    //       comp.GetDateTime("registration_start").Time().Format("1.2.2006 15:04:05"),
    //       comp.GetDateTime("registration_end").Time().Format("1.2.2006 15:04:05"),
    //     })
    //     if err != nil { return err }
    //
    //     msg := renbuf.String()
    //
    //     res := []struct{
    //       Email1 string `db:"email_1"`
    //       Email2 string `db:"email_2"`
    //     }{}
    //     err = app.Dao().DB().NewQuery("SELECT email_1, email_2 FROM skoly WHERE email_1 != '' OR email_2 != ''").
    //       All(&res)
    //     if err != nil { return err }
    //     for _, s := range res {
    //       var e string
    //       if s.Email1 != "" { e = s.Email1 } else if s.Email2 != "" { e = s.Email2 }
    //       mailerc.Send(&mailer.Message{
    //         From: mail.Address{
    //           Address: "strela-vlna@gchd.cz",
    //           Name: "Střela Vlna",
    //         },
    //         To: []mail.Address{{Address: e}},
    //         Subject: "",
    //         HTML: msg,
    //       })
    //     }
    //     return c.String(200, "")
    //   },
    //   // apis.RequireAdminAuth(),
    // )
    //
    //
