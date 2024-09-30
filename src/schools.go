package src

import (
	"bytes"
	"encoding/json"
	"errors"
	"html/template"
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

func TeamContestStartEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {
		res := struct {
			OnlineRound types.DateTime `db:"online_round"`
		}{}
		err := dao.DB().
      NewQuery("SELECT online_round FROM contests WHERE id = (SELECT contest FROM teams WHERE id = {:id} LIMIT 1) LIMIT 1").
			Bind(dbx.Params{"id": c.PathParam("id")}).
			One(&res)

		if err != nil { return err }
    
		return c.String(200, strconv.Itoa(int(res.OnlineRound.Time().Sub(time.Now()).Milliseconds())))
	}
}

func SingleContestEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {
		res := struct {
			Name string `db:"name" json:"name"`
			OnlineRound string `db:"online_round" json:"online_round"`
		}{}
		err := dao.DB().
			NewQuery("SELECT name, online_round FROM contests WHERE id = {:id} LIMIT 1").
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

    tmpls, err := dao.FindFirstRecordByData("texts", "name", "mail_check_mail")
    if err != nil { return err }

    var renbuf bytes.Buffer
    tmpl, err := template.New("mail_check_mail").Parse(tmpls.GetString("text"))
    if err != nil { return err }

    err = tmpl.Execute(&renbuf, struct{
      Code,
      Email string
    }{
      res.Code,
      res.Email,
    })
    if err != nil { return err }

    msg := renbuf.String()

    err = mailerc.Send(&mailer.Message{
      From: mail.Address{
        Address: "strela-vlna@gchd.cz",
        Name: "Střela Vlna",
      },
      To: []mail.Address{{Address: res.Email}},
      Subject: "Ověřovací kód emailu",
      HTML: msg,
    })
    if err != nil { return err }
    return c.String(200, "OK")
  }
}

func TeamRegisterEndp(dao *daos.Dao, mailerc mailer.Mailer) echo.HandlerFunc {
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

    eres := struct{ Count int `db:"COUNT(*)"` }{}
    err = dao.DB().
    NewQuery("SELECT COUNT(*) FROM teams WHERE email = {:email} AND contest = {:comp}").
      Bind(dbx.Params{"email": res.Email, "comp": res.ContestId}).
      One(&eres)

    if err != nil { return err }

    if eres.Count > 0 { return errors.New("email already in use")}

    eres = struct{ Count int `db:"COUNT(*)"` }{}
    err = dao.DB().
    NewQuery("SELECT COUNT(*) FROM teams_reg_req WHERE email = {:email} AND contest = {:comp}").
      Bind(dbx.Params{"email": res.Email, "comp": res.ContestId}).
      One(&eres)

    if err != nil { return err }

    if eres.Count > 0 { return errors.New("email already in use")}


    school, err := dao.FindFirstRecordByData("skoly", "plny_nazev", res.SchoolName)
    if err != nil { return err }

    coll, err := dao.FindCollectionByNameOrId("teams_reg_req")
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
    if err != nil { return err }

    return nil
  }
}

func TeamRegisterSendEmail(res *models.Record, dao *daos.Dao, mailerc mailer.Mailer) error {
  tmpls, err := dao.FindFirstRecordByData("texts", "name", "reg_mail")
  if err != nil { return err }

  school, err := dao.FindRecordById("skoly", res.GetString("school"))
  if err != nil { return err }

  comp, err := dao.FindRecordById("contests", res.GetString("contest"))
  if err != nil { return err }

  var renbuf bytes.Buffer
  tmpl, err := template.New("reg_mail").Parse(tmpls.GetString("text"))
  if err != nil { return err }
  err = tmpl.Execute(&renbuf, struct{
    Code,
    CompSubject,
    CompName,
    School,
    TeamName,
    Email,
    Player1,
    Player2,
    Player3,
    Player4,
    Player5,
    OnlineRound,
    FinalRound,
    RegistrationStart,
    RegistrationEnd string
  }{
    res.Id,
    comp.GetString("subject"),
    comp.GetString("name"),
    school.GetString("plny_nazev"),
    res.GetString("name"),
    res.GetString("email"),
    res.GetString("player1"),
    res.GetString("player2"),
    res.GetString("player3"),
    res.GetString("player4"),
    res.GetString("player5"),
    comp.GetDateTime("online_round").Time().Format("1.2.2006 15:04:05"),
    comp.GetDateTime("final_round").Time().Format("1.2.2006 15:04:05"),
    comp.GetDateTime("registration_start").Time().Format("1.2.2006 15:04:05"),
    comp.GetDateTime("registration_end").Time().Format("1.2.2006 15:04:05"),
  })
  if err != nil { return err }

  msg := renbuf.String()

  err = mailerc.Send(&mailer.Message{
    From: mail.Address{
      Address: "strela-vlna@gchd.cz",
      Name: "Střela Vlna",
    },
    To: []mail.Address{{Address: res.GetString("email")}},
    Subject: "Registrace do soutěže" + comp.GetString("name"),
    HTML: msg,
  })
  if err != nil { return err }
  return nil
}

// PathParam regreq
func TeamRegisterConfirmEndp(dao *daos.Dao, mailerc mailer.Mailer) echo.HandlerFunc {
  return func(c echo.Context) error {
    res, err := dao.FindRecordById("teams_reg_req", c.PathParam("regreq"))
    if err != nil { return err }

    comp, err := dao.FindRecordById("contests", res.GetString("contest"))
    if err != nil { return err }

    if comp.GetDateTime("registration_start").Time().After(time.Now()) {
      return c.String(400, "contest registration has not yet started")
    }

    if comp.GetDateTime("registration_end").Time().Before(time.Now()) {
      return c.String(400, "contest registration has already ended")
    }

    school, err := dao.FindRecordById("skoly", res.GetString("school"))
    if err != nil { return err }

    coll, err := dao.FindCollectionByNameOrId("teams")
    if err != nil { return err }

    rec := models.NewRecord(coll)
    rec.Load(res.PublicExport())

    err = dao.SaveRecord(rec)
    if err != nil { return err }

    err = dao.DeleteRecord(res)
    if err != nil { return err }

    tmpls, err := dao.FindFirstRecordByData("texts", "name", "reg_confirm")
    if err != nil { return err }

    var renbuf bytes.Buffer
    tmpl, err := template.New("reg_confirm").Parse(tmpls.GetString("text"))
    if err != nil { return err }
    err = tmpl.Execute(&renbuf, struct{
      Code,
      CompSubject,
      CompName,
      School,
      TeamName,
      Email,
      Player1,
      Player2,
      Player3,
      Player4,
      Player5,
      OnlineRound,
      FinalRound,
      RegistrationStart,
      RegistrationEnd string
    }{
      rec.Id,
      comp.GetString("subject"),
      comp.GetString("name"),
      school.GetString("plny_nazev"),
      rec.GetString("name"),
      rec.GetString("email"),
      rec.GetString("player1"),
      rec.GetString("player2"),
      rec.GetString("player3"),
      rec.GetString("player4"),
      rec.GetString("player5"),
      comp.GetDateTime("online_round").Time().Format("1.2.2006 15:04:05"),
      comp.GetDateTime("final_round").Time().Format("1.2.2006 15:04:05"),
      comp.GetDateTime("registration_start").Time().Format("1.2.2006 15:04:05"),
      comp.GetDateTime("registration_end").Time().Format("1.2.2006 15:04:05"),
    })
    if err != nil { return err }

    msg := renbuf.String()

    err = mailerc.Send(&mailer.Message{
      From: mail.Address{
        Address: "strela-vlna@gchd.cz",
        Name: "Střela Vlna",
      },
      To: []mail.Address{{Address: res.GetString("email")}},
      Subject: "Potvrzení registrace do soutěže" + comp.GetString("name"),
      HTML: msg,
    })
    if err != nil { return err }
    return c.String(200, "OK")
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

func LoadProbEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {
		f, _ := os.ReadFile("/home/rosta/strelavlna2/ulohy1.tsv")
		lines := strings.Split(string(f), "&^&")
		data := [][]string{}
		for _, l := range lines {
			data = append(data, strings.Split(l, "#"))
		}
		coll, _ := dao.FindCollectionByNameOrId("probs")
		for _, l := range data {
      if len(l) < 5 {
        log.Info(l)
        continue
      }
			rec := models.NewRecord(coll)
			rec.Set("solution", l[1])
			rec.Set("diff", l[2])
			rec.Set("zadani", l[4])
			dao.SaveRecord(rec)
		}
		return nil
	}
}
