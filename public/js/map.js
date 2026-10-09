// 序章：国风全景海图（拖动平移、滚轮缩放、点节点出"景·数·批注"）
import { ANCIENT_NODES, ANCIENT_ROUTES, MODERN_NODES, MODERN_ROUTES, COLORS as C } from "./data.js";
import { LANDS, INLAND_SEAS, MAP_W, MAP_H, project, smoothPath, arcPath } from "./geo.js";
import { generatePanel, generateStory } from "./aigc.js";
import { panelFigure, esc } from "./ui.js";

const ROUTE_STYLE = {
  ancient: { trunk: { color: C.ink, width: 3.2, dash: "" }, quanzhou: { color: C.ink, width: 2, dash: "6 6" }, africa: { color: C.ink, width: 2.4, dash: "10 6" } },
  modern: { air: { color: C.cinnabar, width: 3, dash: "" }, rail: { color: C.gold, width: 3, dash: "2 6" }, sea: { color: C.celadonDeep, width: 3, dash: "12 6" } },
};

const SEA_LABELS = {
  ancient: [["南 海", 113, 14], ["西 洋", 72, 2], ["小 西 洋", 50, 8], ["东 洋", 126, 22]],
  modern: [["太平洋", 126, 14], ["印度洋", 76, -4], ["阿拉伯海", 62, 15], ["地中海", 18, 35.5], ["欧亚大陆桥", 70, 47]],
};

let era = "ancient";
const HOME = {
  ancient: { x: project(32, 0)[0], y: 0, w: project(132, 0)[0] - project(32, 0)[0], h: MAP_H },
  modern: { x: 0, y: 0, w: MAP_W, h: MAP_H },
};
let view = { ...HOME.ancient };
let svg, root;

export function initMap() {
  root = document.getElementById("map");
  render();
  bindPanZoom();
  document.querySelectorAll(".seg-btn").forEach((b) =>
    b.addEventListener("click", () => {
      era = b.dataset.era;
      document.querySelectorAll(".seg-btn").forEach((x) => {
        x.classList.toggle("active", x === b);
        x.setAttribute("aria-selected", x === b);
      });
      document.getElementById("scene-card").hidden = true;
      view = { ...HOME[era] };
      render();
    }),
  );
  document.getElementById("zoom-in").onclick = () => zoom(0.75);
  document.getElementById("zoom-out").onclick = () => zoom(1.33);
  document.getElementById("zoom-reset").onclick = () => {
    view = { ...HOME[era] };
    applyView();
  };
}

function baseLayer() {
  let s = `<defs>
    <pattern id="wave" width="40" height="20" patternUnits="userSpaceOnUse">
      <path d="M0,20 a10,10 0 0 1 20,0 a10,10 0 0 1 20,0" fill="none" stroke="${C.celadonDeep}" stroke-width=".8" opacity=".35"/>
    </pattern>
    <filter id="mapInk"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
    <filter id="landWash" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>`;
  s += `<rect x="-400" y="-400" width="${MAP_W + 800}" height="${MAP_H + 800}" fill="#D9E3DC"/>`;
  s += `<rect x="-400" y="-400" width="${MAP_W + 800}" height="${MAP_H + 800}" fill="url(#wave)"/>`;
  // 经纬网
  for (let lon = 0; lon <= 130; lon += 20) {
    const [x] = project(lon, 0);
    s += `<path d="M${x},0 V${MAP_H}" stroke="${C.ink}" stroke-width=".5" opacity=".15"/>`;
  }
  for (let lat = -10; lat <= 50; lat += 20) {
    const [, y] = project(0, lat);
    s += `<path d="M0,${y} H${MAP_W}" stroke="${C.ink}" stroke-width=".5" opacity=".15"/>`;
  }
  // 陆地：先一层晕染，再一层纸色 + 墨线
  let land = "";
  let i = 3;
  for (const pts of Object.values(LANDS)) land += `<path d="${smoothPath(pts, { jitter: 0.8, seed: i++ })}"/>`;
  s += `<g fill="${C.ink}" opacity=".18" filter="url(#landWash)" transform="translate(3,4)">${land}</g>`;
  s += `<g fill="${C.paper}" stroke="${C.ink}" stroke-width="1.6" filter="url(#mapInk)">${land}</g>`;
  let seas = "";
  for (const pts of Object.values(INLAND_SEAS)) seas += `<path d="${smoothPath(pts, { jitter: 0.5, seed: i++ })}"/>`;
  s += `<g fill="#D9E3DC" stroke="${C.ink}" stroke-width="1.2" filter="url(#mapInk)">${seas}</g>`;
  // 罗盘
  s += compass(1300, 560);
  for (const [t, lon, lat] of SEA_LABELS[era]) {
    const [x, y] = project(lon, lat);
    s += `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Ma Shan Zheng',serif" font-size="26" fill="${C.celadonDeep}" opacity=".75" letter-spacing="6">${t}</text>`;
  }
  return s;
}

function compass(x, y) {
  const pts = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const r = k % 2 ? 22 : 46;
    pts.push(`${(x + Math.sin(a) * r).toFixed(1)},${(y - Math.cos(a) * r).toFixed(1)}`);
    const a2 = a + Math.PI / 8;
    pts.push(`${(x + Math.sin(a2) * 9).toFixed(1)},${(y - Math.cos(a2) * 9).toFixed(1)}`);
  }
  return `<g opacity=".7"><circle cx="${x}" cy="${y}" r="56" fill="none" stroke="${C.ink}" stroke-width="1.2"/>
    <polygon points="${pts.join(" ")}" fill="${C.paper}" stroke="${C.ink}"/>
    <text x="${x}" y="${y - 62}" text-anchor="middle" font-family="'Ma Shan Zheng',serif" font-size="18" fill="${C.cinnabar}">子</text>
    <text x="${x}" y="${y + 76}" text-anchor="middle" font-family="'Ma Shan Zheng',serif" font-size="18" fill="${C.ink}">午</text></g>`;
}

function routesLayer() {
  const nodes = era === "ancient" ? ANCIENT_NODES : MODERN_NODES;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const routes = era === "ancient" ? ANCIENT_ROUTES : MODERN_ROUTES;
  let s = "";
  routes.forEach((r, idx) => {
    const coords = r.path || r.stops.map((id) => [byId[id].lon, byId[id].lat]);
    const st = era === "ancient" ? ROUTE_STYLE.ancient[r.id] : ROUTE_STYLE.modern[r.mode];
    const d = r.path ? smoothPath(coords, { closed: false }) : arcPath(coords, era === "ancient" ? 0.08 : 0.16);
    // 墨线延伸：用遮罩做"画出来"的动画，可见线条保留各自的虚实样式
    s += `<mask id="rm-${idx}" maskUnits="userSpaceOnUse"><path class="route draw" d="${d}" stroke="#fff" stroke-width="${st.width + 4}" style="animation-delay:${idx * 0.35}s"/></mask>`;
    s += `<path class="route" d="${d}" stroke="${st.color}" stroke-width="${st.width}" stroke-dasharray="${st.dash}" opacity=".9" mask="url(#rm-${idx})"/>`;
  });
  return s;
}

function nodesLayer() {
  const nodes = era === "ancient" ? ANCIENT_NODES : MODERN_NODES;
  return nodes
    .map((n) => {
      const [x, y] = project(n.lon, n.lat);
      const label = n.name.split("·")[0];
      const lp = n.lp || "r";
      const [tx, ty, anchor] = { r: [22, 5, "start"], l: [-22, 5, "end"], t: [0, -24, "middle"], b: [0, 36, "middle"] }[lp];
      return `<g class="node" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(n.name)}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
        <circle class="ic-bg" r="17"/>
        <use href="#ic-${n.icon}" x="-13" y="-13" width="26" height="26" color="${era === "ancient" ? C.ink : C.cinnabar}"/>
        <text x="${tx}" y="${ty}" text-anchor="${anchor}">${esc(label)}</text>
      </g>`;
    })
    .join("");
}

function render() {
  root.innerHTML = `<svg viewBox="${view.x} ${view.y} ${view.w} ${view.h}" preserveAspectRatio="xMidYMid meet">
        ${baseLayer()}<g>${routesLayer()}</g><g>${nodesLayer()}</g></svg>`;
  svg = root.querySelector("svg");
  svg.querySelectorAll(".route.draw").forEach((p) => p.style.setProperty("--len", Math.ceil(p.getTotalLength())));
  svg.querySelectorAll(".node").forEach((g) => {
    g.addEventListener("click", (e) => {
      if (moved) return;
      openNode(g.dataset.id, g);
    });
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openNode(g.dataset.id, g);
      }
    });
  });
  renderLegend();
}

function renderLegend() {
  const el = document.getElementById("map-legend");
  if (era === "ancient") {
    el.innerHTML = `<span><i style="border-color:${C.ink}"></i>主航线</span><span><i style="border-color:${C.ink};border-top-style:dashed"></i>分䑸支线</span><span>节点：码头牌楼 / 官厂</span>`;
  } else {
    el.innerHTML = `<span><i style="border-color:${C.cinnabar}"></i>航空</span><span><i style="border-color:${C.gold};border-top-style:dotted"></i>中欧班列</span><span><i style="border-color:${C.celadonDeep};border-top-style:dashed"></i>海运</span><span>节点：飞檐机场 / 工坊枢纽</span>`;
  }
}

async function openNode(id, g) {
  const nodes = era === "ancient" ? ANCIENT_NODES : MODERN_NODES;
  const n = nodes.find((x) => x.id === id);
  svg.querySelectorAll(".node.sel").forEach((x) => x.classList.remove("sel"));
  g.classList.add("sel");
  const card = document.getElementById("scene-card");
  card.hidden = false;
  const seed = Math.floor(Math.random() * 1e6);
  card.innerHTML = `
    <h3><span>${esc(n.name)}</span><button class="close" aria-label="关闭">×</button></h3>
    <div class="card-grid">
      <div>
        <div class="fig"></div>
        <dl class="data-rows">${n.data.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
        <p class="narr ai-narr" style="margin-top:10px"></p>
        <button class="btn" data-act="story" style="font-size:.85rem">AIGC 讲讲这里</button>
        <button class="btn" data-act="redraw" style="font-size:.85rem">换一幅</button>
      </div>
      <div class="annot">${esc(n.note)}</div>
    </div>`;
  const fig = card.querySelector(".fig");
  const draw = (s) => panelFigure(fig, n.scene, { seed: s, sealText: era === "ancient" ? "明" : "今", title: n.name.split("·").pop() });
  draw(seed);
  card.querySelector(".close").onclick = () => {
    card.hidden = true;
    g.classList.remove("sel");
  };
  card.querySelector('[data-act="redraw"]').onclick = () => draw(Math.floor(Math.random() * 1e6));
  card.querySelector('[data-act="story"]').onclick = async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = "研墨中…";
    const story = await generateStory("keyword", { keyword: `${era === "ancient" ? "郑和船队到" : "双十一包裹经过"}${n.name}` });
    const p = card.querySelector(".ai-narr");
    p.innerHTML = `<b>${esc(story.title)}</b><br>${esc(story.narration)}<br>${story.dialogues.map((d) => `「${esc(d.role)}」${esc(d.line)}`).join("<br>")}`;
    btn.disabled = false;
    btn.textContent = "再讲一段";
  };
}

// ---------- 平移缩放 ----------
let moved = false;
function applyView() {
  svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.w} ${view.h}`);
}
function zoom(factor, cx = 0.5, cy = 0.5) {
  const nw = Math.min(MAP_W * 1.2, Math.max(MAP_W / 6, view.w * factor));
  const nh = (nw / view.w) * view.h;
  view.x += (view.w - nw) * cx;
  view.y += (view.h - nh) * cy;
  view.w = nw;
  view.h = nh;
  applyView();
}
function bindPanZoom() {
  let start = null;
  root.addEventListener("pointerdown", (e) => {
    start = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    moved = false;
  });
  window.addEventListener("pointermove", (e) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    if (!moved) return;
    const rect = root.getBoundingClientRect();
    const scale = Math.max(view.w / rect.width, view.h / rect.height);
    view.x = start.vx - dx * scale;
    view.y = start.vy - dy * scale;
    applyView();
  });
  window.addEventListener("pointerup", () => {
    start = null;
    setTimeout(() => (moved = false), 0);
  });
  root.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const rect = root.getBoundingClientRect();
      zoom(e.deltaY > 0 ? 1.12 : 0.89, (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
    },
    { passive: false },
  );
  root.addEventListener("keydown", (e) => {
    const step = view.w * 0.08;
    const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (k) {
      view.x += k[0];
      view.y += k[1];
      applyView();
    }
    if (e.key === "+" || e.key === "=") zoom(0.8);
    if (e.key === "-") zoom(1.25);
  });
}
