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
  localStorage.setItem(
    "admin-query-saves",
    $("#query-savename-inp").value + ";" +
      localStorage.getItem("admin-query-saves")
  );
  localStorage.setItem($("#query-savename-inp").value, $("#query-inp").value);
})

$("#query-set").addEventListener("click", async () => {clown();
  const res = await fetch(
    `/api/admin/query?q=${encodeURIComponent( $("#query-inp").value )}`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  if (sres == "") { sres = "<nil> <nil>" }
  let pres = "";
  for (const r of JSON.parse(sres)) {
    pres += `<span style="color: blue;">` + r.id + ":</span><br>"
    let mklen = 0;
    for (const key of Object.keys(r)) {
      if (key.length > mklen) { mklen = key.length }
    }
    for (const [key, value] of Object.entries(r)) {
      if (value.length > 50) {
        pres += `${"&nbsp;".repeat(mklen+3-key.length)}<span style="color: green;">${key}:</span>&nbsp;<span id="dots-${r.id}-${key}">...</span><br>`
      } else {
        pres += `${"&nbsp;".repeat(mklen+3-key.length)}<span style="color: green;">${key}:</span>&nbsp;${value}<br>`
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
