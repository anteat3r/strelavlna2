import PocketBase from '../pocketbase.es.mjs';

function $(a) { return document.querySelector(a); }
function clown() {  {
  if (pb.authStore.isValid) { return; }
  let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - 50;
  let x = $("#cat");
  x.width = vw;
  x.height = 1080/1920*vw;
  x.style.display = "block";
  x.play();
  setInterval(function(){
    x.style.display = "none";
  }, 3270);
} }

const pb = new PocketBase("https://strela-vlna.gchd.cz");
if (pb.authStore.isValid) {
  $("#title").innerHTML = pb.authStore.model.email;
}

$("#auth-login").addEventListener("click", async () => {
  let res = await pb.admins.authWithPassword(
    $("#auth-email").value,
    $("#auth-pass").value,
  );
  console.log(res);
});

$("#activec-load").addEventListener("click", async () => {clown();
  const res = await fetch(
    "/api/admin/loadactivec",
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  if (sres == "") { sres = "<nil> <nil>" }
  $("#activec-inp").value = sres;
});

$("#activec-set").addEventListener("click", async () => {clown();
  let payload = $("#activec-inp").value;
  if (payload == "<nil> <nil>") {
    alert("invalid contest");
    return;
  }
  const res = await fetch(
    `/api/admin/setactivec?i=${ payload }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  console.log(res);
});

$("#activec-set-empty").addEventListener("click", async () => {clown();
  const res = await fetch(
    "/api/admin/setactivecem",
    {headers: {"Authorization": pb.authStore.token},
  })
  console.log(res);
});

$("#costs-load").addEventListener("click", async () => {clown();
  const res = await fetch(
    "/api/admin/loadcosts",
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  if (sres == "") { sres = "<nil> <nil>" }
  $("#costs-p").innerHTML = sres;
});

$("#costs-set").addEventListener("click", async () => {clown();
  const res = await fetch(
    `/api/admin/setcosts?k=${ $("#costs-key-inp").value }&v=${ $("#costs-val-inp").value }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  console.log(sres);
});

$("#costs-rem").addEventListener("click", async () => {clown();
  const res = await fetch(
    `/api/admin/remcosts?k=${ $("#costs-key-inp").value }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  console.log(sres);
});

$("#hash-set").addEventListener("click", async () => {clown();
  const res = await fetch(
    `/api/admin/probhash?s=${ $("#hash-inp").value }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  console.log(sres);
});

$("#setup-set").addEventListener("click", async () => {clown();
  const res = await fetch(
    `/api/admin/contsetup?id=${ $("#setup-inp").value }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  console.log(sres);
});

$("#papers-set").addEventListener("click", async () => {clown();
  const res = await fetch(
    `/api/admin/paperprobs?id=${ $("#papers-inp").value }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  console.log(sres);
  if (!res.ok) { alert(sres); return; }
  $("#papers-p").innerHTML = sres.split("\n\n\n")[2];
});

$("#upgrade-set").addEventListener("click", async () => {clown();
  const res = await fetch(
    `/api/admin/upgradeteams?oid=${ $("#upgrade-old-inp").value }&nid=${ $("#upgrade-new-inp").value }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  console.log(sres);
  if (!res.ok) { alert(sres); return; }
  alert(res.status);
});

$("#migrate-set").addEventListener("click", async () => {clown();
  const res = await fetch(
    `/api/admin/migrateregreq`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  console.log(sres);
});

let querySavesStr = localStorage.getItem("admin-query-saves");
if (querySavesStr == null) {
  localStorage.setItem("admin-query-saves", "");
  querySavesStr = "";
}
let querySaves = querySavesStr.split(";");
let nQuerySavesHtml = "";
for (let k of querySaves) {
  if (k == "") continue;
  nQuerySavesHtml += `<button id="query-savebtn-${k}">${k}</button>`;
}
$("#query-saves").innerHTML = nQuerySavesHtml;
for (let k of querySaves) {
  if (k == "") continue;
  nQuerySavesHtml += `<button id="query-savebtn-${k}">${k}</button>`;
  $(`#query-savebtn-${k}`).addEventListener("click", () => {
    $("#query-inp").value = localStorage.getItem(`query-save-${k}`);
  })
}

$("#query-save-add").addEventListener("click", () => {
  if (!localStorage.getItem("admin-query-saves").includes($("#query-savename-inp").value)) {
    localStorage.setItem(
      "admin-query-saves",
      $("#query-savename-inp").value + ";" +
        localStorage.getItem("admin-query-saves")
    );
  }
  localStorage.setItem("query-save-" + $("#query-savename-inp").value, $("#query-inp").value);
})

$("#query-set").addEventListener("click", async () => {clown();
  const res = await fetch(
    `/api/admin/query?q=${encodeURIComponent( $("#query-inp").value )}`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  if (!res.ok) {
    alert(sres);
    return;
  }
  if (sres == "") { sres = "<nil> <nil>" }
  let pres = "";
  for (const r of JSON.parse(sres)) {
    // pres += `<span style="color: blue;">` + r.id + ":</span><br>"
    let mklen = 0;
    for (const key of Object.keys(r)) {
      if (key.length > mklen) { mklen = key.length }
    }
    for (const [key, value] of Object.entries(r)) {
      if (value.length > 50) {
        pres += `${"&nbsp;".repeat(mklen-key.length)}<span style="color: green;">${key}:</span>&nbsp;<span id="dots-${r.id}-${key}">...</span><br>`
      } else {
        pres += `${"&nbsp;".repeat(mklen-key.length)}<span style="color: green;">${key}:</span>&nbsp;${value}<br>`
      }
    }
    pres += "<br>"
  }
  $("#query-p").innerHTML = pres;
  for (const r of JSON.parse(sres)) {
    for (const [key, value] of Object.entries(r)) {
      if (value.length > 50) {
        $(`#dots-${r.id}-${key}`).addEventListener("click", () => {
          if ($(`#dots-${r.id}-${key}`).innerText == "...") {
            $(`#dots-${r.id}-${key}`).innerText = value;
          } else {
            $(`#dots-${r.id}-${key}`).innerText = "...";
          }
        })
      }
    }
  }
});

$("#activecstrt-set").addEventListener("click", async () => {clown();
  let payload = $("#activecstrt-inp").value;
  const res = await fetch(
    `/api/admin/setactivecstart?i=${ payload }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  console.log(res);
});

$("#activecend-set").addEventListener("click", async () => {clown();
  let payload = $("#activecend-inp").value;
  const res = await fetch(
    `/api/admin/setactivecend?i=${ payload }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  console.log(res);
});

$("#activecstrt-load").addEventListener("click", async () => {clown();
  const res = await fetch(
    "/api/admin/loadactivecstart",
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  $("#activecstrt-inp").value = sres;
});

$("#activecend-load").addEventListener("click", async () => {clown();
  const res = await fetch(
    "/api/admin/loadactivecend",
    {headers: {"authorization": pb.authStore.token},
  })
  let sres = await res.text();
  $("#activecend-inp").value = sres;
});

$("#mail-set").addEventListener("click", async () => {clown();
  if (!confirm("Vááážně?")) return;
  const res = await fetch(
    "/api/admin/sendspam",
    {headers: {"authorization": pb.authStore.token},
  })
  let sres = await res.text();
  alert(`${res.status}: ${sres}`)
});

$("#dump-set").addEventListener("click", async () => {clown();
  const res = await fetch(
    `/api/admin/getdump`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  if (!res.ok) {
    alert(sres);
    return;
  }
  $("#dump-p").innerHTML = sres;
});

let dashboard = new Map();

$("#dashboard-s").addEventListener("click", async () => {
  let teams = await pb.collection("teams").getList(1, 30, {
    filter: "contest = 'ommq0ktvg397pow'",
  })
  console.log(teams);
  for (let it of teams.items) {
    dashboard.set(it.id, {name: it.name, score: it.score})
  }
  let sres = "";
  let arr = Array.from(dashboard.values());
  arr.sort((a, b) => b.score - a.score)
  for (let it of arr) {
    sres += `<li>${it.name}:${" ".repeat(30-it.name.length)}${it.score}</li>`;
  }
  console.log(sres);
  $("#dashboard").innerHTML = sres;
  pb.collection("teams").subscribe("*", (e) => {
    if (e.action != "update") { return; }
    if (e.record.contest != "ommq0ktvg397pow") { return; }
    dashboard.set(e.record.id, {name: e.record.name, score: e.record.score});
    let sres = "";
    let arr = Array.from(dashboard.values());
    arr.sort((a, b) => b.score - a.score)
    for (let [idx, it] of arr) {
      sres += `<li>${idx+1}. ${it.name}:${" ".repeat(30-it.name.length)}${it.score}</li>`;
    }
    console.log(sres);
    $("#dashboard").innerHTML = sres;
  })
});
