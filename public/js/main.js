import { ICON_SYMBOLS } from "./icons.js";
import { checkAI, aiState } from "./aigc.js";
import { initMap } from "./map.js";
import { initVoyage } from "./voyage.js";
import { initOrder } from "./order.js";
import { initFinale, enterFinale } from "./finale.js";

document.getElementById("icon-defs").innerHTML = ICON_SYMBOLS;

function go(id) {
  document.querySelectorAll(".chapter").forEach((c) => c.classList.toggle("active", c.id === id));
  document.querySelectorAll(".rail-item").forEach((b) => b.classList.toggle("active", b.dataset.go === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", "#" + id);
  if (id === "finale") enterFinale();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-go]");
  if (t) go(t.dataset.go);
});

async function boot() {
  initMap();
  initVoyage();
  initOrder();
  initFinale();

  const st = await checkAI();
  const el = document.getElementById("ai-status");
  if (st.available) {
    el.innerHTML = `AIGC<b>Claude 已接入</b>`;
    el.title = `模型：${st.model}`;
    const wrap = document.getElementById("ai-draw-wrap");
    wrap.hidden = false;
    wrap.querySelector("input").addEventListener("change", (e) => (aiState.drawWithAI = e.target.checked));
  } else {
    el.innerHTML = `AIGC<b>本地生成</b>`;
    el.title = "未连接 AI 服务：画面与文本由本地程序化生成";
  }
}

const cover = document.getElementById("cover");
const app = document.getElementById("app");
function open() {
  cover.classList.add("leaving");
  app.hidden = false;
  boot();
  const hash = location.hash.slice(1);
  if (["prologue", "ch1", "ch2", "finale"].includes(hash)) go(hash);
  setTimeout(() => cover.remove(), 700);
}
document.getElementById("btn-open").addEventListener("click", open);
if (location.hash) open();
