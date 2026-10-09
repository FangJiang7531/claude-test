// 共用的界面组件：分镜画框、漫画格、选项签、提示框、条形图
import { generatePanel, aiState } from "./aigc.js";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** 在容器里画一格分镜；若开启 AI 精绘，完成后自动替换为 Claude 画的 SVG */
export function panelFigure(container, scene, opts) {
  const { svg, prompt } = generatePanel(scene, opts, (up) => {
    const box = container.querySelector(".panel-img");
    if (!box) return;
    box.classList.remove("loading");
    if (up.svg) {
      const img = new Image();
      img.alt = opts.title || scene;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(up.svg);
      box.innerHTML = "";
      box.append(img);
      box.insertAdjacentHTML("beforeend", `<span class="badge">Claude 精绘</span>`);
    } else {
      box.querySelector(".badge").textContent = "本地生成（精绘失败）";
    }
  });
  const loading = aiState.available && aiState.drawWithAI;
  container.innerHTML = `
    <div class="panel-img ${loading ? "loading" : ""}">${svg}<span class="badge">程序化水墨</span></div>
    <details class="prompt"><summary>画面提示词</summary>${esc(prompt)}</details>`;
}

/** 一格完整的漫画：画面 + 回目 + 旁白 + 对白 + 竖排批注 + 数据 */
export function comicCard({ story, scene, figOpts, stats = [] }) {
  const el = document.createElement("article");
  el.className = "comic";
  el.innerHTML = `
    <div class="comic-head">
      <h3>${esc(story.title)}</h3>
      <span class="src ${story.source}">${story.source === "claude" ? "Claude 生成文本" : "本地组合生成"}</span>
    </div>
    <div class="fig"></div>
    <div>
      <p class="narr">${esc(story.narration)}</p>
      <div class="bubbles">${(story.dialogues || []).map((d) => `<div class="bubble"><b>${esc(d.role)}</b>${esc(d.line)}</div>`).join("")}</div>
    </div>
    <div class="annot">${esc(story.annotation)}</div>
    ${stats.length ? `<div class="stats">${stats.map(statTile).join("")}</div>` : ""}`;
  panelFigure(el.querySelector(".fig"), scene, figOpts);
  return el;
}

export function statTile({ k, v, unit = "", meter, grade }) {
  return `<div class="stat ${grade ? "grade" : ""}"><div class="k">${esc(k)}</div><div class="v">${esc(v)}${unit ? `<small>${esc(unit)}</small>` : ""}</div>${
    meter != null ? `<div class="meter" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, meter))}%"></span></div>` : ""
  }</div>`;
}

/** 单选签：返回 getter */
export function chips(container, items, { initial, onChange, disabled = () => false } = {}) {
  let value = initial ?? items[0].id;
  const paint = () => {
    container.innerHTML = items
      .map(
        (it) =>
          `<button type="button" class="chip" data-id="${it.id}" aria-pressed="${it.id === value}" ${disabled(it) ? "disabled" : ""}>${
            it.glyph ? `<span class="g">${esc(it.glyph)}</span>` : ""
          }${esc(it.name || it.label)}</button>`,
      )
      .join("");
    container.querySelectorAll(".chip").forEach((b) =>
      b.addEventListener("click", () => {
        value = b.dataset.id;
        paint();
        onChange?.(value);
      }),
    );
  };
  paint();
  return {
    get: () => items.find((i) => i.id === value),
    set: (id) => {
      value = id;
      paint();
    },
    refresh: paint,
  };
}

// ---------- 提示框 ----------
const tip = () => document.getElementById("tooltip");
export function showTip(html, e) {
  const t = tip();
  t.innerHTML = html;
  t.hidden = false;
  const x = Math.min(window.innerWidth - t.offsetWidth - 8, e.clientX + 14);
  const y = Math.min(window.innerHeight - t.offsetHeight - 8, e.clientY + 14);
  t.style.left = x + "px";
  t.style.top = y + "px";
}
export const hideTip = () => (tip().hidden = true);

/**
 * 横向条形图（单一度量、单一刻度）。rows: [{label, value, color, display, tip}]
 * log=true 时用对数刻度（用于跨数量级的古今时长对比）
 */
export function barChart(container, { title, sub, rows, unit = "", log = false, legend = null, tableHead = ["项目", "数值"], tickFormat }) {
  const W = 560, rowH = 34, padL = 92, padR = 70, top = 8;
  const H = top + rows.length * rowH + 26;
  const max = Math.max(...rows.map((r) => r.value));
  const min = log ? Math.min(...rows.map((r) => r.value)) : 0;
  const lo = log ? Math.pow(10, Math.floor(Math.log10(Math.max(min, 0.01)))) : 0;
  const hi = log ? Math.pow(10, Math.ceil(Math.log10(max))) : niceMax(max);
  const sx = (v) => (log ? ((Math.log10(Math.max(v, lo)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) : v / hi) * (W - padL - padR);
  const ticks = log ? range(Math.log10(lo), Math.log10(hi)).map((p) => Math.pow(10, p)) : [0, hi / 4, hi / 2, (hi * 3) / 4, hi];

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">`;
  s += `<g class="grid">${ticks.map((t) => `<line x1="${padL + sx(t)}" x2="${padL + sx(t)}" y1="${top}" y2="${H - 22}"/>`).join("")}</g>`;
  s += `<g class="axis">${ticks.map((t) => `<text x="${padL + sx(t)}" y="${H - 6}" text-anchor="middle">${tickFormat ? tickFormat(t) : fmtTick(t) + unit}</text>`).join("")}</g>`;
  rows.forEach((r, i) => {
    const y = top + i * rowH + 7;
    const w = Math.max(3, sx(r.value));
    s += `<g class="row" data-i="${i}">
      <rect class="hit" x="0" y="${y - 6}" width="${W}" height="${rowH}"/>
      <text class="lbl" x="${padL - 8}" y="${y + 14}" text-anchor="end">${esc(r.label)}</text>
      <path class="bar" d="M${padL},${y} H${padL + w - 4} q4,0 4,4 V${y + 16} q0,4 -4,4 H${padL}Z" fill="${r.color}"/>
      <text class="val" x="${padL + w + 6}" y="${y + 14}">${esc(r.display ?? r.value)}</text>
    </g>`;
  });
  s += `</svg>`;
  container.innerHTML = `
    <h4>${esc(title)}</h4>${sub ? `<p class="sub">${esc(sub)}</p>` : ""}
    ${legend ? `<div class="chart-legend">${legend.map((l) => `<span><i style="background:${l.color}"></i>${esc(l.label)}</span>`).join("")}</div>` : ""}
    ${s}
    <details class="table-toggle"><summary>查看数据表</summary><table><tr><th>${esc(tableHead[0])}</th><th>${esc(tableHead[1])}</th></tr>${rows
      .map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.display ?? r.value)}</td></tr>`)
      .join("")}</table></details>`;
  container.querySelectorAll("g.row").forEach((g) => {
    const r = rows[+g.dataset.i];
    g.addEventListener("pointermove", (e) => showTip(r.tip || `<b>${esc(r.label)}</b> ${esc(r.display ?? r.value)}`, e));
    g.addEventListener("pointerleave", hideTip);
  });
}

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * p) return m * p;
  return 10 * p;
}
// 小时刻度 → 人读得懂的时长
export function hourTick(h) {
  if (h < 1) return `${Math.round(h * 60)}分`;
  if (h < 48) return `${h}小时`;
  if (h < 24 * 365) return `${+(h / 24).toFixed(1)}天`;
  return `${+(h / 24 / 365).toFixed(1)}年`;
}
function fmtTick(t) {
  if (t >= 1000) return `${t / 1000}k`;
  if (t < 1) return t.toFixed(1);
  return Number.isInteger(t) ? t : t.toFixed(1);
}
