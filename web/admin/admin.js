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
  setInterval(function(e){
    x.style.display = "none";
  }, 3270);
} }

const pb = new PocketBase("https://strela-vlna.gchd.cz");
if (pb.authStore.isValid) {
  $("#title").innerHTML = pb.authStore.model.email;
}

$("#auth-login").addEventListener("click", async (e) => {
  let res = await pb.admins.authWithPassword(
    $("#auth-email").value,
    $("#auth-pass").value,
  );
  console.log(res);
});

$("#activec-load").addEventListener("click", async (e) => {clown();
  const res = await fetch(
    "/api/admin/loadactivec",
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  if (sres == "") { sres = "<nil> <nil>" }
  $("#activec-inp").value = sres;
});

$("#activec-set").addEventListener("click", async (e) => {clown();
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

$("#activec-set-empty").addEventListener("click", async (e) => {clown();
  const res = await fetch(
    "/api/admin/setactivecem",
    {headers: {"Authorization": pb.authStore.token},
  })
  console.log(res);
});

$("#costs-load").addEventListener("click", async (e) => {clown();
  const res = await fetch(
    "/api/admin/loadcosts",
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  if (sres == "") { sres = "<nil> <nil>" }
  $("#costs-p").innerHTML = sres;
});

$("#costs-set").addEventListener("click", async (e) => {clown();
  const res = await fetch(
    `/api/admin/setcosts?k=${ $("#costs-key-inp").value }&v=${ $("#costs-val-inp").value }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  console.log(sres);
});

$("#costs-rem").addEventListener("click", async (e) => {clown();
  const res = await fetch(
    `/api/admin/remcosts?k=${ $("#costs-key-inp").value }`,
    {headers: {"Authorization": pb.authStore.token},
  })
  let sres = await res.text();
  console.log(sres);
});