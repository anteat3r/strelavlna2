package src

import (
	"encoding/json"
	"math/rand"
	"net/mail"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/mailer"
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

func LoadProbEndpJson(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {
		f, _ := os.ReadFile("/home/strelavlna/probs_o.json")
    res := []struct{
      Model string `json:"model"`
      Id int `json:"pk"`
      Fields struct{
        Type string `json:"typ"`
        State int `json:"stav"`
        Auto int `json:"vyhodnoceni"`
        Diff string `json:"obtiznost"`
        Text string `json:"zadani"`
        Sol string `json:"reseni"`
        Img string `json:"obrazek"`
      } `json:"fields"`
    }{}
    err := json.Unmarshal(f, &res)
    if err != nil { return err }
		coll, _ := dao.FindCollectionByNameOrId("probs_old")
		for _, l := range res {
			rec := models.NewRecord(coll)
      tp := "math"
      if l.Fields.Type == "F" {
        tp = "physics"
      }
      st := "new"
      if l.Fields.State == 1 { st = "ok" }
      if l.Fields.State == 2 { st = "wrong" }
      diff := l.Fields.Diff
      if diff == "B" { diff = "A" }
      if diff == "C" { diff = "B" }
      if diff == "D" { diff = "B" }
      if diff == "E" { diff = "C" }
      if diff == "F" { diff = "C" }
      text := strings.ReplaceAll(l.Fields.Text, "\\$$", "\\$")
      text = strings.ReplaceAll(text, "\\$", "$")
			rec.Set("type", tp)
			rec.Set("name", l.Fields.Type + "-" + strconv.Itoa(l.Id))
			rec.Set("solution", l.Fields.Sol)
			rec.Set("diff", diff)
			rec.Set("text", text)
      rec.Set("state", st)
      rec.Set("auto", l.Fields.Auto == 0)
      rec.Set("img", l.Fields.Img)
      rec.Set("id_otazky", l.Id)
      rec.Set("author", "")
      rec.Set("workers", "")
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

func SetupContEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {

    cont := c.QueryParam("id")
    if cont == "" { return nErr("invalid param") }

    contres := struct{
      Probs string `db:"probs"`
    }{}
    err := dao.DB().NewQuery("SELECT probs FROM contests WHERE id = {:id} LIMIT 1").
      Bind(dbx.Params{ "id": cont }).One(&contres)
    if err != nil { return err }

    _, err = dao.DB().
    NewQuery("UPDATE teams SET chat = '', banned = FALSE, last_banned = '', free = {:probs}, bought = '[]', pending = '[]', solved = '[]', sold = '[]', money = 100 WHERE contest = {:id}").Bind(dbx.Params{ "probs": contres.Probs, "id": cont }).Execute()
    if err != nil { return err }

		return nil
	}
}

func CashBuyEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {

    cost, ok := GetCost(c.QueryParam("d"))
    if !ok { return c.String(400, "invalid diff") }

    team := c.QueryParam("t")

    dao.RunInTransaction(func(txDao *daos.Dao) error {
      teamres := struct{
        Money int `db:"money"`
      }{}
      err := txDao.DB().NewQuery("SELECT money FROM teams WHERE id = {:team} LIMIT 1").
        Bind(dbx.Params{ "team": team }).
        One(&teamres)
      if err != nil { return err }

      if teamres.Money < cost { return nErr("not enough money") }

      _, err = txDao.DB().NewQuery("UPDATE teams SET money = {:money} WHERE id = {:team}").
        Bind(dbx.Params{ "money": teamres.Money - cost, "team": team }).
        Execute()

        return nil

      

    })


		return nil
	}
}

func SendTeams(dao *daos.Dao, mailerc mailer.Mailer, timeout time.Duration) echo.HandlerFunc {
  return func(c echo.Context) error {
    recs, err := dao.FindRecordsByFilter(
      "teams_reg_req",
      `id != ""`,
      "-created",
      0, 0,
    )
    if err != nil {
      return c.String(500, err.Error())
    }
    for _, rec := range recs {
      dt := rec.GetDateTime("updated").Time()
      if !time.Now().After(dt.Add(timeout)) { continue }
      err = TeamRegisterSendEmail(rec, dao, mailerc)
      if err != nil { log.Error(err) }
      ndt, _ := types.ParseDateTime(time.Now().Add(time.Hour * 24 * 7 * 10000))
      rec.Set("updated", ndt)
      err = dao.SaveRecord(rec)
      if err != nil { log.Error(err) }
    }
    return c.String(200, "")
  }
}



func SendSpam(dao *daos.Dao, mailerc mailer.Mailer) echo.HandlerFunc {
  return func(c echo.Context) error {
    // comp, err := dao.FindRecordById("contests", c.QueryParam("id"))
    // if err != nil { return err }

    tmpls, err := dao.FindFirstRecordByData("texts", "name", "spam_mail")
    if err != nil { return err }

    // var renbuf bytes.Buffer
    // tmpl, err := template.New("spam_mail").Parse(tmpls.GetString("text"))
    // if err != nil { return err }
    //
    // err = tmpl.Execute(&renbuf, struct{
    //   CompSubject,
    //   CompName,
    //   OnlineRound,
    //   FinalRound,
    //   RegistrationStart,
    //   RegistrationEnd string
    // }{
    //   comp.GetString("subject"),
    //   comp.GetString("name"),
    //   comp.GetDateTime("online_round").Time().Format("1.2.2006 15:04:05"),
    //   comp.GetDateTime("final_round").Time().Format("1.2.2006 15:04:05"),
    //   comp.GetDateTime("registration_start").Time().Format("1.2.2006 15:04:05"),
    //   comp.GetDateTime("registration_end").Time().Format("1.2.2006 15:04:05"),
    // })
    // if err != nil { return err }
    //
    // msg := renbuf.String()

    res := []struct{
      Email1 string `db:"email_1"`
      Email2 string `db:"email_2"`
    }{}
    err = dao.DB().NewQuery("SELECT email_1, email_2 FROM skoly").
      All(&res)
    if err != nil { return err }
    for _, s := range res {
      e := ""
      if s.Email1 != "" {
        e = s.Email1
      } else if s.Email2 != "" {
        e = s.Email2
      }
      if e == "" { continue }
      log.Info(e)
      err := mailerc.Send(&mailer.Message{
        From: mail.Address{
          Address: "strela-vlna@gchd.cz",
          Name: "Střela Vlna",
        },
        To: []mail.Address{{Address: e}},
        Subject: "Pražská střela a Dopplerova vlna 2024",
        HTML: tmpls.GetString("text"),
      })
      if err != nil { log.Error(err) }
    }
    return c.String(200, "")
  }
}


