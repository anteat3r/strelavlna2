package src

import (
	"bytes"
	"encoding/json"
	"html"
	"html/template"

	// "fmt"
	"math/rand"
	"net/mail"
	"os"
	"slices"
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

func SetupContEndp() echo.HandlerFunc {
	return func(c echo.Context) error {
    if c.QueryParam("id") == "" { return nErr("empty id") }

    err := DBLoadFromPB(c.QueryParam("id"))
    if err != nil { return err }
    // log.Info("loaded")
    Probs.With(func(v *map[string]*RWMutexWrap[ProbS]) {
      err = DBGenProbWorkers(v)
    })
    if err != nil { return err }
    // Probs.RWith(func(v map[string]*RWMutexWrap[ProbS]) {
    //   for id, pr := range v {
    //     pr.RWith(func(v ProbS) {
    //       log.Info(id, v.Workers)
    //     })
    //   }
    // })
    // log.Info("gened")

    res, err := json.Marshal(DBData)
    if err != nil { return err }

    // Probs.RWith(func(v map[string]*RWMutexWrap[ProbS]) {
    //   for id, pr := range v {
    //     pr.RWith(func(v ProbS) {
    //       log.Info(id, v.Workers)
    //     })
    //   }
    // })

    return c.String(200, string(res))
	}
}

func GetDump() echo.HandlerFunc {
  return func(c echo.Context) error {
    res, err := json.Marshal(DBData)
    if err != nil { return err }
    return c.String(200, string(res))
  }
}

var DIFFS = [3]string{"A", "B", "C"}

func CashEndp(dao *daos.Dao) echo.HandlerFunc {
	return func(c echo.Context) error {
    log.Info("cash hit")
    if c.Request().Header.Get("Authorization") != os.Getenv("CASH_AUTH_TOKEN") { return nErr("invalid auth token") }
    req := make(map[string]string)
    err := json.NewDecoder(c.Request().Body).Decode(&req)
    if err != nil { return err }
    dao.RunInTransaction(func(txDao *daos.Dao) error {
      switch req["typ"] {
      case "overeni":
        tm, err := txDao.FindFirstRecordByData("teams", "card", req["id"])
        if err != nil { return c.String(200, `{"key": "n"}`) }
        return c.JSON(200, map[string]string{
          "key": "k",
          "nazev": tm.GetString("name"),
          "penize": strconv.Itoa(tm.GetInt("score")),
        })
      case "akce":
        switch req["akce"] {
        case "0":
          tm, err := txDao.FindFirstRecordByData("teams", "card", req["id"])
          if err != nil { return c.String(200, `{"key": "n"}`) }
          diffn, err := strconv.Atoi(req["uloha"])
          if err != nil { return err }
          cost, ok := GetCost("+" + DIFFS[diffn])
          if !ok { return c.String(200, `{"key": "n"}`) }
          tm.Set("score", tm.GetInt("score") + cost)
          err = txDao.Save(tm)
          if err != nil { return c.String(200, `{"key": "n"}`) }
          return c.String(200, `{"key": "k"}`)
        case "1":
          tm, err := txDao.FindFirstRecordByData("teams", "card", req["id"])
          if err != nil { return c.String(200, `{"key": "n"}`) }
          diffn, err := strconv.Atoi(req["uloha"])
          if err != nil { return err }
          cost, ok := GetCost(DIFFS[diffn])
          if !ok { return c.String(200, `{"key": "n"}`) }
          if tm.GetInt("score") < cost { return c.String(200, `{"key": "n"}`) }
          tm.Set("score", tm.GetInt("score") - cost)
          err = txDao.Save(tm)
          if err != nil { return c.String(200, `{"key": "n"}`) }
          return c.String(200, `{"key": "k"}`)
        case "2":
          tm, err := txDao.FindFirstRecordByData("teams", "card", req["id"])
          if err != nil { return c.String(200, `{"key": "n"}`) }
          diffn, err := strconv.Atoi(req["uloha"])
          if err != nil { return err }
          cost, ok := GetCost("-" + DIFFS[diffn])
          if !ok { return c.String(200, `{"key": "n"}`) }
          tm.Set("score", tm.GetInt("score") + cost)
          err = txDao.Save(tm)
          if err != nil { return c.String(200, `{"key": "n"}`) }
          return c.String(200, `{"key": "k"}`)
        }
      case "vratit":  
        switch req["akce"] {
        case "0":
          tm, err := txDao.FindFirstRecordByData("teams", "card", req["id"])
          if err != nil { return c.String(200, `{"key": "n"}`) }
          diffn, err := strconv.Atoi(req["uloha"])
          if err != nil { return err }
          cost, ok := GetCost("+" + DIFFS[diffn])
          if !ok { return c.String(200, `{"key": "n"}`) }
          tm.Set("score", tm.GetInt("score") - cost)
          err = txDao.Save(tm)
          if err != nil { return c.String(200, `{"key": "n"}`) }
          return c.String(200, `{"key": "k"}`)
        case "1":
          tm, err := txDao.FindFirstRecordByData("teams", "card", req["id"])
          if err != nil { return c.String(200, `{"key": "n"}`) }
          diffn, err := strconv.Atoi(req["uloha"])
          if err != nil { return err }
          cost, ok := GetCost(DIFFS[diffn])
          if !ok { return c.String(200, `{"key": "n"}`) }
          if tm.GetInt("score") < cost { return c.String(200, `{"key": "n"}`) }
          tm.Set("score", tm.GetInt("score") + cost)
          err = txDao.Save(tm)
          if err != nil { return c.String(200, `{"key": "n"}`) }
          return c.String(200, `{"key": "k"}`)
        case "2":
          tm, err := txDao.FindFirstRecordByData("teams", "card", req["id"])
          if err != nil { return c.String(200, `{"key": "n"}`) }
          diffn, err := strconv.Atoi(req["uloha"])
          if err != nil { return err }
          cost, ok := GetCost("-" + DIFFS[diffn])
          if !ok { return c.String(200, `{"key": "n"}`) }
          tm.Set("score", tm.GetInt("score") - cost)
          err = txDao.Save(tm)
          if err != nil { return c.String(200, `{"key": "n"}`) }
          return c.String(200, `{"key": "k"}`)
        }
      }
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

    if tmpls.GetString("text") == "" { return dbErr("empty tmpls") }

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
    adrs := make([]mail.Address, 0)
    for _, s := range res {
      e := ""
      if s.Email1 != "" {
        e = s.Email1
      } else if s.Email2 != "" {
        e = s.Email2
      }
      if e == "" { continue }
      if strings.Contains(e, ";") {
        e = strings.Split(e, ";")[0]
      }
      addr, err := mail.ParseAddress(e)
      if err != nil {
        log.Error(err)
        continue
      }
      adrs = append(adrs, *addr)
    }
    idx := slices.IndexFunc(adrs, func(v mail.Address) bool {
      return v.Address == "info@skolanaradosti.cz"
    })
    if idx == -1 { return dbErr("index -1") }
    adrs = adrs[idx+1:]
    var _chunks = make([][]mail.Address, 0, (len(adrs)/20)+1)
    for 20 < len(adrs) {
      adrs, _chunks = adrs[20:], append(_chunks, adrs[0:20:20])
    }
    fadrs := append(_chunks, adrs)
    for _, chnk := range fadrs {
      log.Info(chnk, len(chnk[1:]))
      err = mailerc.Send(&mailer.Message{
        From: mail.Address{
          Address: "strela-vlna@gchd.cz",
          Name: "Střela Vlna",
        },
        To: chnk[:1],
        Bcc: chnk[1:],
        Subject: "Pražská střela a Dopplerova vlna 2024",
        HTML: tmpls.GetString("text"),
      })
      if err != nil {
        log.Error(err)
        return err
      }
    }
    return c.String(200, "")
  }
}

func SetupInitLoadData(dao *daos.Dao) error {
  initcont, err := dao.FindFirstRecordByData("texts", "name", "def_activecont")
  if err != nil { return err }

  text_ := initcont.GetString("text")
  text_ = strings.TrimPrefix(text_, "<p>")
  text_ = strings.TrimSuffix(text_, "</p>")

  ActiveContest.With(func(v *ActiveContStruct) {
    v.Id = text_
  })

  initcontstrt, err := dao.FindFirstRecordByData("texts", "name", "def_activecontstart")
  if err != nil { return err }

  text_2 := initcontstrt.GetString("text")
  text_2 = strings.TrimPrefix(text_2, "<p>")
  text_2 = strings.TrimSuffix(text_2, "</p>")
  t, err := time.Parse("2006-01-02T15:04 -0700", text_2)
  if err != nil { panic(err) }

  ActiveContest.With(func(v *ActiveContStruct) {
    v.Start = t
  })

  initcontend, err := dao.FindFirstRecordByData("texts", "name", "def_activecontend")
  if err != nil { return err }

  text_3 := initcontend.GetString("text")
  text_3 = strings.TrimPrefix(text_3, "<p>")
  text_3 = strings.TrimSuffix(text_3, "</p>")
  t2, err := time.Parse("2006-01-02T15:04 -0700", text_3)
  if err != nil { panic(err) }

  ActiveContest.With(func(v *ActiveContStruct) {
    v.End = t2
  })

  initcosts, err := dao.FindFirstRecordByData("texts", "name", "def_costs")
  if err != nil { return err }

  text := initcosts.GetString("text")
  text = strings.TrimPrefix(text, "<p>")
  text = strings.TrimSuffix(text, "</p>")

  for _, l := range strings.Split(text, "; ") {
    vals := strings.Split(l, " = ")
    if len(vals) != 2 { return nErr("invalid costs") }
    val, err := strconv.Atoi(vals[1])
    if err != nil { return err }
    Costs.With(func(v *map[string]int) {
      (*v)[vals[0]] = val
    })
  }
  return nil
}

func UpgradeTeams(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {
    oldc := c.QueryParam("oid")
    if oldc == "" { return c.String(400, "invalid oid") }
    newc := c.QueryParam("nid")
    if newc == "" { return c.String(400, "invalid nid") }

    teams, err := dao.FindRecordsByFilter(
      "teams",
      "contest = {:id}",
      "-score",
      15, 0,
      dbx.Params{"id": oldc},
    )
    if err != nil { return err }

    coll, err := dao.FindCollectionByNameOrId("teams")
    if err != nil { return err }

    for _, tm := range teams {
      ntm := models.NewRecord(coll)
      ntm.Load(tm.PublicExport())
      ntm.Set("contest", newc)
      ntm.Set("score", 100)
      err := dao.SaveRecord(ntm)
      if err != nil { return err }
    }

    return nil
  }
}

type PaperProb struct {
  Diff string
  Name string
  Index int
  Text string
  Img string
  Buy int
  Sell int
  Solve int
  TeamName string
  Id string
}

type PaperSol struct {
  Name string
  Index int
  Solution string
}

type _dbProb struct{
  Id string `db:"id"`
  Name string `db:"name"`
  Diff string `db:"diff"`
  Img string `db:"img"`
  Author string `db:"author"`
  Text string `db:"text"`
  Graph string `db:"graph"`
  Solution string `db:"solution"`
  Infinite bool `db:"infinite"`
}

func latexEscapeComment(s string) string {
  res := s
  res = strings.ReplaceAll(res, `%`, `\%`)
  res = strings.ReplaceAll(res, `<br>`, `\n`)
  return res
}

func latexEscape(s string) string {
  res := s
  res = strings.ReplaceAll(res, `%`, `\%`)
  res = strings.ReplaceAll(res, `{`, `\{`)
  res = strings.ReplaceAll(res, `}`, `\}`)
  res = strings.ReplaceAll(res, `&`, `\&`)
  res = strings.ReplaceAll(res, `^`, `\^`)
  res = strings.ReplaceAll(res, `#`, `\#`)
  res = strings.ReplaceAll(res, `_`, `\_`)
  res = strings.ReplaceAll(res, `$`, `\$`)
  res = strings.ReplaceAll(res, `<br>`, `\n`)
  return res
}

func GenProbPaper(dao *daos.Dao) echo.HandlerFunc {
  return func(c echo.Context) error {
    cid := c.QueryParam("id")
    if cid == "" { return c.String(400, "invalid contest id ") }

    consts := make([]Constant, 0)
    err := App.Dao().DB().
      NewQuery(`select * from consts`).All(&consts)
    if err != nil { return err }
    Consts.With(func(v *map[string]Constant) {
      for _, cnst := range consts {
        (*v)[cnst.Id] = cnst
      }
    })

    probs := make([]_dbProb, 0)
    err = dao.DB().
      NewQuery(`select * from probs where contests like concat("%", {:contest}, "%")`).
      Bind(dbx.Params{"contest": cid}).
      All(&probs)
    if err != nil { return err }

    slices.SortFunc(probs, func(a, b _dbProb) int {
      return len(b.Text) - len(a.Text)
    })

    pprobs := make([]PaperProb, 0, len(probs))
    psols := make([]PaperSol, 0, len(probs))
    i := 1
    for _, pr := range probs {
      buycost, ok := GetCost(pr.Diff)
      if !ok { return nErr("invalid diff") }
      sellcost, ok := GetCost("-" + pr.Diff)
      if !ok { return nErr("invalid diff") }
      solvecost, ok := GetCost("+" + pr.Diff)
      if !ok { return nErr("invalid diff") }
      if pr.Graph == `{"nodes":{"basic":{},"get":{},"set":{}}` {
        pprobs = append(pprobs, PaperProb{
          Id: pr.Id,
          Diff: pr.Diff,
          Name: latexEscape(pr.Name),
          Index: i,
          Text: latexEscapeComment(pr.Text),
          Img: "",
          Buy: buycost,
          Sell: sellcost,
          Solve: solvecost,
        })
        psols = append(psols, PaperSol{
          Name: latexEscape(pr.Name),
          Index: i,
          Solution: latexEscape(pr.Solution),
        })
        i++
        continue
      }
      graph, err := ParseGraph(pr.Graph)
      if err != nil { return err }
      cnt := 1; if pr.Infinite { cnt = 5 }
      for range cnt {
        text, sol, err := graph.Generate(pr.Text, pr.Solution)
        if err != nil { return err }
        pprobs = append(pprobs, PaperProb{
          Id: pr.Id,
          Diff: pr.Diff,
          Name: latexEscape(pr.Name),
          Index: i,
          Text: latexEscapeComment(text),
          Img: "",
          Buy: buycost,
          Sell: sellcost,
          Solve: solvecost,
        })
        psols = append(psols, PaperSol{
          Name: pr.Name,
          Index: i,
          Solution: latexEscape(sol),
        })
        i++
      }
    }

    teams, err := dao.FindRecordsByFilter(
      "teams",
      "contest = {:contest}",
      "created",
      0, 0,
    )
    if err != nil { return err }

    npprobs := make([]PaperProb, 0)
    for _, tm := range teams {
      for _, pr := range pprobs {
        npr := pr
        npr.TeamName = tm.GetString("name")
        npprobs = append(npprobs, pr)
      }
    }

    funcsmap := template.FuncMap{ "iseven": func(i int) bool { return i % 2 == 0 } }

    bts, err := os.ReadFile("/opt/strelavlna2/prob_templ.tex")
    if err != nil { return err }

    tmpl, err := template.New("probs_papers").Funcs(funcsmap).Parse(string(bts))
    if err != nil { return err }

    renbuf := bytes.Buffer{}
    err = tmpl.Execute(&renbuf, pprobs)
    if err != nil { return err }

    papers := renbuf.String()
    papers = html.UnescapeString(papers)
    
    bts, err = os.ReadFile("/opt/strelavlna2/prob_sol_templ.tex")
    if err != nil { return err }

    tmpl, err = template.New("probs_sol_papers").Parse(string(bts))
    if err != nil { return err }

    renbuf = bytes.Buffer{}
    err = tmpl.Execute(&renbuf, pprobs)
    if err != nil { return err }

    papers_sol := renbuf.String()
    papers_sol = html.UnescapeString(papers)

    return c.String(200, papers + "\n\n\n" + papers_sol)
  }
}
