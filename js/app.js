const tg = window.Telegram?.WebApp;
tg?.ready?.();

function showApp(){
  document.getElementById("splash-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  tg?.expand?.();
}

/* SPLASH */
const video = document.getElementById("splash-video");
const skip = document.getElementById("splash-skip");

skip.onclick = showApp;
video?.play()?.catch(()=>{});

setTimeout(showApp, 6000);
video.onended = showApp;

/* STATE */
let energy = 999;
const maxEnergy = 1000;

setInterval(()=>{
  if(energy < maxEnergy){
    energy++;
    document.getElementById("energy-text").innerText =
      `${energy} / ${maxEnergy}`;
    document.getElementById("energy-fill").style.width =
      (energy/maxEnergy*100)+"%";
  }
},1000);