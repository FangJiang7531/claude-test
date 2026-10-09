// 终章：古今对照 + AIGC 结局 + "古今航迹对比海报"
import { COMPARE_DIMS, ANCIENT_NODES, ANCIENT_ROUTES, MODERN_ROUTES, MODERN_NODES, COLORS as C } from "./data.js";
import { LANDS, MAP_W, MAP_H, smoothPath, arcPath } from "./geo.js";
import { generateStory } from "./aigc.js";
import { barChart, esc, hourTick } from "./ui.js";
import { fmtH } from "./sim.js";
import { store } from "./store.js";

let ending = null;

export function initFinale() {
  document.getElementById("compare").innerHTML = COMPARE_DIMS.map(
    (d) => `<div class="dim">
      <h3>${d.name}</h3>
      <div class="era a">古 · 郑和船队</div><p>${esc(d.ancient)}</p>
      <div class="era m">今 · 双十一物流</div><p>${esc(d.modern)}</p>
      <div class="logic">${esc(d.logic)}</div>
    </div>`,
  ).join("");
  document.getElementById("btn-poster").addEventListener("click", drawPoster);
}

// 每次进入终章时刷新（取用户最近一次的选择）
export async function enterFinale() {
  const v = store.voyages.at(-1);
  const o = store.orders.at(-1);
  const ancientDays = v ? v.metrics.days : 32;
  const modernH = o ? o.result.total : 30;

  barChart(document.getElementById("time-chart"), {
    title: "一段航程要多久？",
    sub: `对数刻度 · 单位：小时${v || o ? "（含你在前两章的选择）" : "（示例值，先去前两章体验）"}`,
    log: true,
    tickFormat: hourTick,
    legend: [
      { label: "古 · 郑和船队", color: C.seriesAncient },
      { label: "今 · 双十一物流", color: C.seriesModern },
    ],
    rows: [
      { label: "古·一次往返", value: 600 * 24, color: C.seriesAncient, display: "约 1.5—2 年", tip: "<b>七下西洋</b> 每次往返约 1.5—2 年" },
      { label: v ? `古·${v.leg.from}→${v.leg.to}` : "古·满剌加→古里", value: ancientDays * 24, color: C.seriesAncient, display: `${ancientDays} 日` },
      { label: o ? `今·重庆→${o.dest.name}` : "今·重庆→北京", value: modernH, color: C.seriesModern, display: fmtH(modernH) },
      { label: "今·国内次日达", value: 24, color: C.seriesModern, display: "约 24 小时" },
    ],
    tableHead: ["航程", "耗时"],
  });

  const box = document.getElementById("ending");
  box.innerHTML = `<p class="narr">研墨中，正在为你写结局…</p>`;
  ending = await generateStory("ending", {
    voyage: v ? { leg: `${v.leg.from}→${v.leg.to}`, goods: v.goods.name, weather: v.weather.id, nav: v.nav.name, depot: v.depot, ...v.metrics } : null,
    order: o
      ? { dest: o.dest.name, item: o.item.name, mode: o.mode.name, forward: o.forward, extraHub: o.extraHub, sortSec: o.sortSec, peak: o.peak, total: fmtH(o.result.total), grade: o.result.grade, jamRisk: o.result.jamRisk }
      : null,
  });
  const couplet = ending.couplet?.length === 2 ? ending.couplet : ["宝船候风分䑸去", "锦囊趁夜满天飞"];
  ending.couplet = couplet;
  box.innerHTML = `
    <h3>${esc(ending.title)} <span class="src ${ending.source}">${ending.source === "claude" ? "Claude 生成" : "本地生成"}</span></h3>
    <p class="narr">${esc(ending.narration)}</p>
    <div class="bubbles">${ending.dialogues.map((d) => `<div class="bubble"><b>${esc(d.role)}</b>${esc(d.line)}</div>`).join("")}</div>
    <p class="narr" style="margin-top:10px">批：${esc(ending.annotation)}</p>
    <div class="couplet"><span>${esc(couplet[0])}</span><span>${esc(couplet[1])}</span></div>`;
}

// ---------- 海报 ----------
async function drawPoster() {
  await document.fonts?.ready;
  const cv = document.getElementById("poster");
  const ctx = cv.getContext("2d");
  const Wd = cv.width, Ht = cv.height;
  const brush = "'Ma Shan Zheng','STKaiti','KaiTi',serif";
  const sans = "'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif";

  // 宣纸底
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, Wd, Ht);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(90,74,50,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * Wd, Math.random() * Ht, 1.5, 1.5);
  }
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, Wd - 60, Ht - 60);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(44, 44, Wd - 88, Ht - 88);

  // 标题
  ctx.fillStyle = C.ink;
  ctx.font = `110px ${brush}`;
  ctx.textAlign = "center";
  ctx.fillText("古今航迹", Wd / 2, 190);
  ctx.font = `30px ${sans}`;
  ctx.fillStyle = C.inkSoft;
  ctx.fillText("从郑和宝船到双十一货机 · 一张海图上的两种调度", Wd / 2, 245);

  // 地图
  const mx = 90, my = 290, mw = Wd - 180;
  const k = mw / MAP_W, mh = MAP_H * k;
  ctx.save();
  ctx.beginPath();
  ctx.rect(mx, my, mw, mh);
  ctx.clip();
  ctx.fillStyle = "#D9E3DC";
  ctx.fillRect(mx, my, mw, mh);
  ctx.translate(mx, my);
  ctx.scale(k, k);
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.6 / k;
  for (const pts of Object.values(LANDS)) {
    const p = new Path2D(smoothPath(pts));
    ctx.fill(p);
    ctx.stroke(p);
  }
  const byA = Object.fromEntries(ANCIENT_NODES.map((n) => [n.id, n]));
  const byM = Object.fromEntries(MODERN_NODES.map((n) => [n.id, n]));
  ctx.lineCap = "round";
  for (const r of ANCIENT_ROUTES) {
    ctx.strokeStyle = C.seriesAncient;
    ctx.lineWidth = 5;
    ctx.setLineDash(r.id === "trunk" ? [] : [14, 10]);
    ctx.stroke(new Path2D(arcPath(r.stops.map((id) => [byA[id].lon, byA[id].lat]), 0.08)));
  }
  for (const r of MODERN_ROUTES) {
    ctx.strokeStyle = C.seriesModern;
    ctx.lineWidth = 4;
    ctx.setLineDash(r.mode === "air" ? [] : r.mode === "rail" ? [3, 10] : [16, 10]);
    const d = r.path ? smoothPath(r.path, { closed: false }) : arcPath(r.stops.map((id) => [byM[id].lon, byM[id].lat]), 0.16);
    ctx.stroke(new Path2D(d));
  }
  ctx.setLineDash([]);
  ctx.restore();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(mx, my, mw, mh);

  // 图例
  const ly = my + mh + 40;
  ctx.textAlign = "left";
  ctx.font = `26px ${sans}`;
  [[C.seriesAncient, "古 · 郑和船队航迹（1405—1433）"], [C.seriesModern, "今 · 航空 / 班列 / 海运干线"]].forEach(([c, t], i) => {
    const x = mx + i * 520;
    ctx.fillStyle = c;
    ctx.fillRect(x, ly - 18, 40, 8);
    ctx.fillStyle = C.ink;
    ctx.fillText(t, x + 54, ly - 6);
  });

  // 对照数据
  const v = store.voyages.at(-1);
  const o = store.orders.at(-1);
  const colY = ly + 50;
  const col = (x, color, head, lines) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, colY, 470, 56);
    ctx.fillStyle = C.paper;
    ctx.font = `38px ${brush}`;
    ctx.fillText(head, x + 20, colY + 42);
    ctx.fillStyle = C.ink;
    ctx.font = `26px ${sans}`;
    lines.forEach((t, i) => ctx.fillText(t, x + 20, colY + 100 + i * 42));
  };
  col(mx + 40, C.seriesAncient, "古 · 你的船队", v
    ? [`航段：${v.leg.from} → ${v.leg.to}`, `货物：${v.goods.name}　天气：${v.weather.name}`, `航法：${v.nav.name}${v.depot ? "　经官厂" : ""}`, `航期 ${v.metrics.days} 日 · 货损 ${v.metrics.loss}%`, `结局：${v.metrics.grade}`]
    : ["（尚未出航）", "主航线：刘家港 → 古里", "枢纽：满剌加官厂", "节拍：季风"]);
  col(mx + 550, C.seriesModern, "今 · 你的锦囊", o
    ? [`重庆 → ${o.dest.name}（${o.dest.id === "chongqing" ? "同城" : o.mode.name.replace("走", "")}）`, `${o.item.name} · 洪峰 ×${o.peak}`, `${o.forward ? "前置仓" : "中心仓"} · 分拣 ${o.sortSec} 秒/件${o.extraHub ? " · 加节点" : ""}`, `全程 ${fmtH(o.result.total)} · 爆仓风险 ${o.result.jamRisk}%`, `结局：${o.result.grade}`]
    : ["（尚未下单）", "干线：航空 / 班列 / 海运", "枢纽：鄂州 · 迪拜 · 列日", "节拍：小时"]);

  // 五维共同逻辑
  const gy = colY + 340;
  ctx.font = `34px ${brush}`;
  ctx.fillStyle = C.ink;
  ctx.textAlign = "center";
  ctx.fillText("拥挤之中，何以运转？", Wd / 2, gy);
  ctx.font = `24px ${sans}`;
  ctx.fillStyle = C.inkSoft;
  ["预判 —— 古候季风，今看预售", "前置 —— 古设官厂，今建前置仓", "分流 —— 古有分䑸，今有多式联运", "冗余 —— 古以编队互救，今以弹性运力"].forEach((t, i) =>
    ctx.fillText(t, Wd / 2, gy + 48 + i * 38),
  );

  // 对联（竖排）
  const couplet = ending?.couplet || ["宝船候风分䑸去", "锦囊趁夜满天飞"];
  const vText = (text, x, y) => {
    ctx.fillStyle = C.cinnabar;
    ctx.fillRect(x - 30, y - 44, 60, [...text].length * 52 + 24);
    ctx.fillStyle = C.gold;
    ctx.font = `42px ${brush}`;
    ctx.textAlign = "center";
    [...text].forEach((ch, i) => ctx.fillText(ch, x, y + i * 52));
  };
  vText(couplet[0], Wd - 80, colY + 30);
  vText(couplet[1], 80, colY + 30);

  // 落款 + 印章
  ctx.textAlign = "right";
  ctx.fillStyle = C.ink;
  ctx.font = `30px ${brush}`;
  const d = new Date();
  ctx.fillText(`${d.getFullYear()}年${d.getMonth() + 1}月 · 海图古今 观者自题`, Wd - 180, Ht - 90);
  ctx.fillStyle = C.cinnabar;
  ctx.fillRect(Wd - 160, Ht - 150, 84, 84);
  ctx.fillStyle = C.paper;
  ctx.font = `34px ${brush}`;
  ctx.textAlign = "center";
  ctx.fillText("古今", Wd - 118, Ht - 116);
  ctx.fillText("同航", Wd - 118, Ht - 78);

  cv.hidden = false;
  cv.classList.remove("seal-pop");
  void cv.offsetWidth;
  cv.classList.add("seal-pop");
  const a = document.getElementById("btn-download");
  a.href = cv.toDataURL("image/png");
  a.hidden = false;
  cv.scrollIntoView({ behavior: "smooth", block: "center" });
}
