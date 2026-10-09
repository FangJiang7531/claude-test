// 第一章：郑和船队 —— 选择航段/货物/天气/航法/是否经官厂 → AIGC 分镜 + 叙事 + 推演数据
import { LEGS, GOODS, WEATHERS, NAVS } from "./data.js";
import { simulateVoyage } from "./sim.js";
import { generateStory } from "./aigc.js";
import { chips, comicCard } from "./ui.js";
import { store } from "./store.js";

export function initVoyage() {
  const form = document.getElementById("voyage-form");
  const f = (name) => form.querySelector(`[data-field="${name}"]`);
  const leg = chips(f("leg"), LEGS.map((l) => ({ ...l, name: `${l.from}→${l.to}` })));
  const goods = chips(f("goods"), GOODS);
  const weather = chips(f("weather"), WEATHERS);
  const nav = chips(f("nav"), NAVS.map((n) => ({ ...n, glyph: n.id === "stars" ? "星" : "针" })));
  const strip = document.getElementById("voyage-strip");
  const btn = document.getElementById("btn-voyage");

  btn.addEventListener("click", async () => {
    const choice = {
      leg: leg.get(),
      goods: goods.get(),
      weather: weather.get(),
      nav: nav.get(),
      depot: form.depot.checked,
    };
    const metrics = simulateVoyage(choice);
    store.voyages.push({ ...choice, metrics });
    btn.disabled = true;
    btn.textContent = "研墨中…";
    const story = await generateStory("voyage", {
      leg: choice.leg,
      goods: choice.goods,
      weather: choice.weather,
      nav: choice.nav,
      depot: choice.depot,
      metrics,
    });
    btn.disabled = false;
    btn.textContent = "画此一回";

    // 风暴优先画风暴；牵星远洋且天气晴好时画夜航观星；否则画航段对应场景
    const scene =
      choice.weather.id === "storm" ? "storm" : choice.nav.id === "stars" && choice.weather.id === "monsoon" ? "star_nav" : choice.leg.scene;
    const card = comicCard({
      story,
      scene,
      figOpts: {
        seed: Math.floor(Math.random() * 1e6),
        weather: choice.weather.sky,
        goods: choice.goods.id,
        goodsName: choice.goods.name,
        load: choice.depot ? 0.8 : 0.3,
        sealText: "宝船",
        title: `${choice.leg.from}至${choice.leg.to}`,
        extra: `航法：${choice.nav.name}${choice.depot ? "；途经满剌加官厂" : ""}`,
      },
      stats: [
        { k: "航期", v: metrics.days, unit: "日" },
        { k: "货损率", v: metrics.loss, unit: "%", meter: metrics.loss * 2 },
        { k: "补给压力", v: metrics.supply, unit: "%", meter: metrics.supply },
        { k: "风险指数", v: metrics.risk, unit: "", meter: metrics.risk },
        { k: "可换回", v: choice.goods.back },
        { k: "此回结局", v: metrics.grade, grade: true },
      ],
    });
    strip.querySelector(".empty")?.remove();
    strip.prepend(card);
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  bindKeyword("kw-1", "btn-kw-1", strip);
}

export function bindKeyword(inputId, btnId, strip) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  const go = async () => {
    const keyword = input.value.trim();
    if (!keyword) {
      input.focus();
      return;
    }
    btn.disabled = true;
    const story = await generateStory("keyword", { keyword });
    btn.disabled = false;
    const modern = /重庆|巴黎|双十一|爆仓|快递|机场|航空|物流|订单|分拣|班列|跨境/.test(keyword);
    const scene = /爆仓|拥堵|堵/.test(keyword) ? "jam" : /风暴|暴风|台风/.test(keyword) ? "storm" : modern ? "cargo_takeoff" : "departure";
    const card = comicCard({
      story,
      scene,
      figOpts: { seed: Math.floor(Math.random() * 1e6), title: keyword.slice(0, 8), sealText: "即兴", extra: `关键词：${keyword}`, congestion: scene === "jam" ? 0.95 : undefined },
    });
    strip.querySelector(".empty")?.remove();
    strip.prepend(card);
  };
  btn.addEventListener("click", go);
  input.addEventListener("keydown", (e) => e.key === "Enter" && go());
}
