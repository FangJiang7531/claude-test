// 水墨分镜程序化生成器：根据"场景 + 天气 + 货物 + 拥堵度 + 随机种子"组合出一格 640×400 的国风漫画。
// 离线可用；接入 Claude 后由 /api/panel 生成的 SVG 会替换它（见 aigc.js）。
import { COLORS as C } from "./data.js";

const W = 640, H = 400;

export function rng(seed = 1) {
  let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  next.range = (a, b) => a + (b - a) * next();
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  return next;
}

const f = (n) => Number(n).toFixed(1);
let uid = 0;

function defs(id) {
  return `<defs>
    <filter id="paper-${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="${id % 97}"/>
      <feColorMatrix values="0 0 0 0 .36  0 0 0 0 .30  0 0 0 0 .22  0 0 0 .09 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="bleed-${id}" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="${id % 31}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5"/>
    </filter>
    <filter id="wash-${id}"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="soft-${id}"><feGaussianBlur stdDeviation="1.2"/></filter>
    <linearGradient id="sea-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.celadon}" stop-opacity=".55"/>
      <stop offset="1" stop-color="${C.celadonDeep}" stop-opacity=".85"/>
    </linearGradient>
  </defs>`;
}

// ---------- 背景 ----------
function sky(weather, id, r) {
  const tone = { clear: C.paper, fog: "#E4E0D6", storm: "#9DA3A2", night: "#2A3240" }[weather] || C.paper;
  let s = `<rect width="${W}" height="${H}" fill="${tone}"/>`;
  if (weather === "clear") {
    s += `<circle cx="${f(r.range(420, 560))}" cy="${f(r.range(50, 90))}" r="30" fill="${C.cinnabar}" opacity=".82"/>`;
    s += cloudBand(r.range(60, 200), r.range(70, 110), r, C.inkSoft, 0.18);
  } else if (weather === "fog") {
    for (let i = 0; i < 4; i++)
      s += `<ellipse cx="${f(r.range(0, W))}" cy="${f(r.range(60, 220))}" rx="${f(r.range(140, 260))}" ry="22" fill="#fff" opacity=".5" filter="url(#wash-${id})"/>`;
  } else if (weather === "storm") {
    for (let i = 0; i < 5; i++)
      s += `<ellipse cx="${f(r.range(0, W))}" cy="${f(r.range(20, 120))}" rx="${f(r.range(120, 240))}" ry="${f(r.range(30, 50))}" fill="${C.ink}" opacity=".45" filter="url(#wash-${id})"/>`;
    const lx = r.range(380, 560);
    s += `<path d="M${f(lx)},40 l-18,48 h14 l-22,60 l40,-70 h-14 l16,-38z" fill="${C.gold}" opacity=".9"/>`;
  } else if (weather === "night") {
    for (let i = 0; i < 40; i++)
      s += `<circle cx="${f(r.range(0, W))}" cy="${f(r.range(0, 220))}" r="${f(r.range(0.6, 2))}" fill="${C.paper}" opacity="${f(r.range(0.4, 1))}"/>`;
    s += `<circle cx="${f(r.range(480, 580))}" cy="70" r="26" fill="${C.paper}" opacity=".9"/>`;
  }
  return s;
}

function cloudBand(x, y, r, color, op) {
  // 如意云纹
  let d = `M${f(x)},${f(y)}`;
  let cx = x;
  for (let i = 0; i < 4; i++) {
    const w = r.range(22, 34);
    d += ` q${f(w / 2)},-${f(w * 0.7)} ${f(w)},0`;
    cx += w;
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" opacity="${op}" stroke-linecap="round"/>
    <path d="M${f(x + 10)},${f(y + 8)} h${f(cx - x - 20)}" stroke="${color}" stroke-width="1.5" opacity="${op}"/>`;
}

function mountains(r, id, { base = 250, layers = 3, night = false } = {}) {
  let s = "";
  for (let l = 0; l < layers; l++) {
    const y0 = base - 60 + l * 28;
    const op = night ? 0.25 + l * 0.15 : 0.12 + l * 0.12;
    let d = `M0,${H} L0,${f(y0 + r.range(-10, 20))}`;
    for (let x = 0; x <= W + 60; x += r.range(50, 110)) {
      const peak = y0 - r.range(10, 70) + l * 6;
      d += ` Q${f(x + 25)},${f(peak)} ${f(x + 60)},${f(y0 + r.range(-6, 18))}`;
    }
    d += ` L${W},${H}Z`;
    s += `<path d="${d}" fill="${night ? "#0F141B" : C.ink}" opacity="${f(op)}" filter="url(#bleed-${id})"/>`;
  }
  return s;
}

function sea(top, r, id, { rough = false } = {}) {
  let s = `<rect x="0" y="${top}" width="${W}" height="${H - top}" fill="url(#sea-${id})"/>`;
  // 海水纹：层叠的半圆鳞浪
  const rows = rough ? 7 : 5;
  for (let row = 0; row < rows; row++) {
    const y = top + 14 + row * ((H - top) / rows);
    const rad = rough ? 16 + row * 2 : 12 + row * 3;
    let d = "";
    for (let x = -rad + (row % 2) * rad; x < W + rad; x += rad * 2) {
      const amp = rough ? r.range(0.8, 1.6) : 1;
      d += `M${f(x)},${f(y)} a${rad},${f(rad * amp)} 0 0 1 ${rad * 2},0 `;
    }
    s += `<path d="${d}" fill="none" stroke="${C.paper}" stroke-width="${rough ? 2.2 : 1.6}" opacity="${rough ? 0.75 : 0.55}"/>`;
  }
  if (rough) {
    // 卷浪
    for (let i = 0; i < 3; i++) {
      const x = r.range(40, W - 80), y = top + r.range(10, 60);
      s += `<path d="M${f(x)},${f(y + 40)} q20,-60 70,-40 q-30,0 -26,22 q8,-10 18,-4" fill="none" stroke="${C.paper}" stroke-width="3" stroke-linecap="round"/>`;
    }
  }
  return s;
}

function rain(r) {
  let d = "";
  for (let i = 0; i < 90; i++) {
    const x = r.range(-40, W), y = r.range(0, H);
    d += `M${f(x)},${f(y)} l-10,26 `;
  }
  return `<path d="${d}" stroke="${C.ink}" stroke-width="1" opacity=".35"/>`;
}

// ---------- 主体 ----------
function ship(x, y, s = 1, { flip = false, masts = 5, sails = C.cinnabar, rock = 0 } = {}) {
  const sx = flip ? -s : s;
  let g = `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rock)}) scale(${f(sx)},${f(s)})">`;
  g += `<path d="M-120,-6 Q-60,30 110,-4 L128,-30 Q124,-6 104,6 Q20,40 -100,22 Q-128,10 -140,-24Z" fill="${C.ink}"/>`;
  g += `<path d="M-110,0 Q0,26 104,-2" fill="none" stroke="${C.gold}" stroke-width="2.4"/>`;
  g += `<circle cx="104" cy="-10" r="4" fill="${C.paper}"/><circle cx="104" cy="-10" r="1.8" fill="${C.cinnabar}"/>`;
  g += `<path d="M-136,-24 h26 v-18 h-22z" fill="${C.ink}"/>`;
  const span = 200 / (masts + 1);
  for (let i = 0; i < masts; i++) {
    const mx = -100 + span * (i + 1);
    const hgt = i === Math.floor(masts / 2) ? 150 : 100 + ((i * 37) % 40);
    g += `<path d="M${f(mx)},0 V${-hgt}" stroke="${C.ink}" stroke-width="3"/>`;
    // 硬帆，带撑条
    const sw = span * 0.95;
    g += `<path d="M${f(mx)},${-hgt + 6} q${f(sw * 0.6)},${f(hgt * 0.15)} ${f(sw * 0.55)},${f(hgt * 0.75)} L${f(mx)},${f(-hgt * 0.18)}z" transform="translate(${f(-mx)},0) translate(${f(mx - sw * 0.1)},0)" fill="${sails}" opacity=".78"/>`;
    for (let b = 1; b < 6; b++) {
      const by = -hgt + 6 + (hgt * 0.7 * b) / 6;
      g += `<path d="M${f(mx - sw * 0.1)},${f(by)} h${f(sw * 0.62)}" stroke="${C.ink}" stroke-width="1" opacity=".6"/>`;
    }
    g += `<path d="M${f(mx)},${-hgt} l14,4 l-14,5z" fill="${C.gold}"/>`;
  }
  return g + "</g>";
}

function gate(x, y, s = 1) {
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s})" fill="${C.ink}">
    <path d="M-70,-120 Q0,-140 70,-120 Q60,-112 50,-112 H-50 Q-60,-112 -70,-120Z"/>
    <rect x="-56" y="-112" width="112" height="10"/>
    <rect x="-20" y="-100" width="40" height="18" fill="${C.cinnabar}"/>
    <text x="0" y="-86" font-size="12" text-anchor="middle" fill="${C.paper}" font-family="serif">市舶</text>
    <rect x="-52" y="-112" width="8" height="112"/><rect x="44" y="-112" width="8" height="112"/>
    <rect x="-4" y="-112" width="8" height="12"/>
  </g>`;
}

function hall(x, y, w, h, { color = C.ink, roof = C.ink, door = true, label = "" } = {}) {
  const eave = w * 0.18;
  let s = `<g>`;
  s += `<rect x="${f(x)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" fill="${C.paperDeep}" stroke="${color}" stroke-width="2.4"/>`;
  s += `<path d="M${f(x - eave)},${f(y - h + 2)} Q${f(x + w * 0.1)},${f(y - h - 4)} ${f(x + w * 0.2)},${f(y - h - h * 0.45)} H${f(x + w * 0.8)} Q${f(x + w * 0.9)},${f(y - h - 4)} ${f(x + w + eave)},${f(y - h + 2)} Q${f(x + w * 0.5)},${f(y - h - 10)} ${f(x - eave)},${f(y - h + 2)}Z" fill="${roof}"/>`;
  for (let i = 1; i < 6; i++)
    s += `<path d="M${f(x + (w * i) / 6)},${f(y - h)} V${f(y)}" stroke="${color}" stroke-width="1" opacity=".35"/>`;
  if (door) s += `<rect x="${f(x + w * 0.4)}" y="${f(y - h * 0.55)}" width="${f(w * 0.2)}" height="${f(h * 0.55)}" fill="${color}"/>`;
  if (label)
    s += `<rect x="${f(x + w / 2 - 22)}" y="${f(y - h - h * 0.3)}" width="44" height="16" fill="${C.cinnabar}"/><text x="${f(x + w / 2)}" y="${f(y - h - h * 0.3 + 12)}" font-size="11" text-anchor="middle" fill="${C.paper}" font-family="serif">${label}</text>`;
  return s + "</g>";
}

function jar(x, y, s = 1) {
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s})">
    <path d="M-8,-40 h16 v6 q16,8 16,22 q0,12 -10,12 h-28 q-10,0 -10,-12 q0,-14 16,-22z" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.5"/>
    <path d="M-12,-22 q12,8 24,0 M-14,-12 q14,6 28,0" fill="none" stroke="${C.seriesAncient}" stroke-width="2"/>
    <circle cx="0" cy="-17" r="3" fill="${C.seriesAncient}"/>
  </g>`;
}

function bolt(x, y, s = 1, color = C.cinnabar) {
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s})">
    <rect x="-22" y="-14" width="44" height="14" rx="7" fill="${color}"/>
    <path d="M-14,-14 v14 M0,-14 v14 M14,-14 v14" stroke="${C.gold}" stroke-width="1.4"/>
  </g>`;
}

function crate(x, y, s = 1, label = "") {
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s})">
    <rect x="-18" y="-30" width="36" height="30" fill="#B79B6E" stroke="${C.ink}" stroke-width="1.6"/>
    <path d="M-18,-30 L18,0 M18,-30 L-18,0" stroke="${C.ink}" stroke-width="1" opacity=".5"/>
    ${label ? `<text x="0" y="-10" font-size="13" text-anchor="middle" fill="${C.ink}" font-family="serif">${label}</text>` : ""}
  </g>`;
}

function person(x, y, s = 1, { robe = C.ink, hat = "official", pose = 0 } = {}) {
  const hats = {
    official: `<path d="M-9,-58 h18 v-6 h-18z M-15,-60 h-6 M15,-60 h6" stroke="${C.ink}" stroke-width="3" fill="${C.ink}"/>`,
    turban: `<ellipse cx="0" cy="-60" rx="10" ry="6" fill="${C.paper}" stroke="${C.ink}"/>`,
    cap: `<path d="M-9,-58 q9,-12 18,0z" fill="${C.cinnabar}"/>`,
    helmet: `<path d="M-10,-56 q10,-16 20,0 h4" fill="${C.gold}" stroke="${C.ink}"/>`,
  };
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s})">
    <path d="M-14,0 Q-12,-30 -6,-44 H6 Q12,-30 14,0Z" fill="${robe}"/>
    <path d="M-6,-40 L${-18 - pose * 6},${-28 - pose * 12} M6,-40 L${18 + pose * 4},${-24 - pose * 16}" stroke="${robe}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="0" cy="-50" r="7" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.5"/>
    ${hats[hat] || ""}
  </g>`;
}

function giraffe(x, y, s = 1) {
  let spots = "";
  const pts = [[-10, -46], [6, -50], [-2, -38], [12, -40], [0, -60], [-6, -80], [-2, -100]];
  for (const [px, py] of pts) spots += `<circle cx="${px}" cy="${py}" r="3.5" fill="${C.cinnabar}" opacity=".7"/>`;
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s})">
    <path d="M-20,-30 Q0,-58 22,-36 L18,0 M-16,-32 L-18,0 M-6,-34 L-6,0 M12,-36 L12,0" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/>
    <path d="M12,-50 Q-2,-90 -4,-118" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
    <path d="M12,-50 Q-2,-90 -4,-118" stroke="${C.gold}" stroke-width="6" stroke-linecap="round"/>
    <path d="M-4,-118 l-16,4 l2,-8z" fill="${C.gold}" stroke="${C.ink}"/>
    <path d="M-2,-122 v-8 M3,-121 v-8" stroke="${C.ink}" stroke-width="2"/>
    ${spots}
  </g>`;
}

function plane(x, y, s = 1, angle = 0, color = C.ink) {
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${angle}) scale(${s})">
    <path d="M-110,0 Q-110,-14 -80,-14 H70 Q100,-14 112,-2 Q100,10 70,10 H-80 Q-110,10 -110,0Z" fill="${color}"/>
    <path d="M-10,-6 L-50,-60 H-34 L30,-6Z M-10,6 L-40,50 H-26 L24,6Z" fill="${color}"/>
    <path d="M-100,-8 L-118,-46 H-104 L-80,-10Z" fill="${C.cinnabar}"/>
    <path d="M-60,-3 H60" stroke="${C.gold}" stroke-width="2"/>
    <ellipse cx="-24" cy="16" rx="12" ry="5" fill="${color}"/>
    <path d="M86,-8 h10" stroke="${C.paper}" stroke-width="3"/>
  </g>`;
}

function bag(x, y, s = 1, color = C.cinnabar) {
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s})">
    <path d="M-7,-24 Q0,-20 7,-24 L5,-19 Q16,-12 13,0 Q10,6 0,6 Q-10,6 -13,0 Q-16,-12 -5,-19Z" fill="${color}" stroke="${C.ink}" stroke-width="1"/>
    <path d="M-9,-19 Q0,-15 9,-19" stroke="${C.gold}" stroke-width="2" fill="none"/>
  </g>`;
}

function conveyor(y, r, count, jam = 0) {
  let s = `<rect x="0" y="${y}" width="${W}" height="18" fill="${C.inkSoft}"/>`;
  for (let x = 10; x < W; x += 26) s += `<circle cx="${x}" cy="${y + 9}" r="5" fill="${C.paperDeep}" opacity=".5"/>`;
  s += `<path d="M0,${y} H${W}" stroke="${C.gold}" stroke-width="2"/>`;
  const n = Math.round(count * (1 + jam * 1.6));
  for (let i = 0; i < n; i++) {
    const x = r.range(10, W - 10);
    const stack = jam > 0.6 && r() < jam - 0.4 ? r.range(1, 3) : 0;
    s += bag(x, y - 2 - stack * 18, r.range(0.8, 1.1), r() < 0.3 ? C.seriesAncient : C.cinnabar);
  }
  return s;
}

function phone(x, y, s, text) {
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s})">
    <rect x="-60" y="-110" width="120" height="220" rx="16" fill="${C.ink}"/>
    <rect x="-52" y="-96" width="104" height="186" rx="6" fill="${C.paper}"/>
    <rect x="-52" y="-96" width="104" height="34" fill="${C.cinnabar}"/>
    <text x="0" y="-74" text-anchor="middle" font-size="15" fill="${C.paper}" font-family="serif">双十一</text>
    <rect x="-40" y="-50" width="80" height="60" fill="${C.paperDeep}"/>
    ${bag(0, -10, 1.4)}
    <text x="0" y="34" text-anchor="middle" font-size="11" fill="${C.ink}">${text}</text>
    <rect x="-36" y="50" width="72" height="24" rx="12" fill="${C.cinnabar}"/>
    <text x="0" y="66" text-anchor="middle" font-size="11" fill="${C.paper}">付尾款</text>
  </g>`;
}

function rider(x, y, s = 1) {
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s})">
    <circle cx="-30" cy="0" r="16" fill="none" stroke="${C.ink}" stroke-width="5"/>
    <circle cx="40" cy="0" r="16" fill="none" stroke="${C.ink}" stroke-width="5"/>
    <path d="M-30,0 L-10,-26 H24 L40,0 M24,-26 L20,-50 H8" fill="none" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-56" y="-60" width="36" height="32" fill="${C.cinnabar}"/>
    <path d="M-50,-44 h24" stroke="${C.gold}" stroke-width="2"/>
    ${person(0, -26, 0.9, { robe: C.seriesAncient, hat: "helmet", pose: 1 })}
    <path d="M-80,-10 h-30 M-84,-24 h-40 M-78,4 h-24" stroke="${C.ink}" stroke-width="2" opacity=".5"/>
  </g>`;
}

function stall(x, y, w) {
  return `<g>
    <path d="M${x},${y - 60} L${x + w / 2},${y - 80} L${x + w},${y - 60}Z" fill="${C.cinnabar}" opacity=".85"/>
    <path d="M${x + 6},${y - 60} V${y} M${x + w - 6},${y - 60} V${y}" stroke="${C.ink}" stroke-width="3"/>
    <rect x="${x}" y="${y - 22}" width="${w}" height="22" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="1.5"/>
  </g>`;
}

function skyline(r, base, { chongqing = false } = {}) {
  let s = "";
  for (let x = 0; x < W; x += r.range(28, 52)) {
    const h = r.range(50, chongqing ? 170 : 130);
    s += `<rect x="${f(x)}" y="${f(base - h)}" width="${f(r.range(20, 40))}" height="${f(h)}" fill="${C.ink}" opacity="${f(r.range(0.2, 0.42))}"/>`;
  }
  if (chongqing) {
    // 吊脚楼层叠
    for (let i = 0; i < 4; i++) s += hall(60 + i * 18, base - i * 22, 120 - i * 14, 22, { door: false });
  }
  return s;
}

function starChart(r) {
  // 北辰与华盖：牵星板测量示意
  const stars = [[120, 70], [160, 54], [200, 62], [228, 90], [260, 74], [300, 60]];
  let s = `<path d="M${stars.map((p) => p.join(",")).join(" L")}" fill="none" stroke="${C.gold}" stroke-width="1" opacity=".7" stroke-dasharray="3 4"/>`;
  for (const [x, y] of stars) s += `<circle cx="${x}" cy="${y}" r="3.2" fill="${C.gold}"/>`;
  s += `<circle cx="90" cy="40" r="5" fill="${C.paper}"/><text x="98" y="36" font-size="12" fill="${C.paper}" font-family="serif">北辰</text>`;
  s += `<path d="M380,300 L90,44" stroke="${C.paper}" stroke-width="1" stroke-dasharray="2 5" opacity=".7"/>`;
  return s;
}

function seal(x, y, text, size = 34) {
  const chars = [...text].slice(0, 4);
  const two = chars.length > 2;
  let t = "";
  chars.forEach((ch, i) => {
    const col = two ? (i < 2 ? 1 : 0) : 0;
    const row = two ? i % 2 : i;
    const cx = two ? x + size * (0.27 + col * 0.46) : x + size / 2;
    const cy = y + (two ? size * (0.4 + row * 0.42) : size * (0.38 + row * 0.44));
    t += `<text x="${f(cx)}" y="${f(cy)}" font-size="${f(size * (two ? 0.38 : 0.42))}" text-anchor="middle" fill="${C.paper}" font-family="'Ma Shan Zheng','STKaiti','KaiTi',serif">${ch}</text>`;
  });
  const h = two ? size : size * (chars.length > 1 ? 0.95 : 0.6) + 6;
  return `<g opacity=".92"><rect x="${x}" y="${y}" width="${size}" height="${f(h)}" rx="3" fill="${C.cinnabar}"/>${t}</g>`;
}

function verticalTitle(x, y, text) {
  const chars = [...text];
  return chars
    .map((ch, i) => `<text x="${x}" y="${y + i * 22}" font-size="19" text-anchor="middle" fill="${C.ink}" font-family="'Ma Shan Zheng','STKaiti','KaiTi',serif">${ch}</text>`)
    .join("");
}

// ---------- 场景 ----------
const SCENES = {
  shipyard(r, o, id) {
    let s = sky("clear", id, r) + mountains(r, id, { base: 220, layers: 2 });
    s += `<rect x="0" y="250" width="${W}" height="150" fill="${C.celadon}" opacity=".5"/>`;
    s += `<path d="M60,260 V120 M200,260 V100 M60,120 L200,100" stroke="${C.ink}" stroke-width="4"/>`;
    s += ship(330, 280, 1.2, { masts: 9, sails: "none" });
    for (let i = 0; i < 6; i++) s += person(140 + i * 70, 380, 0.9, { robe: C.inkSoft, hat: "cap", pose: r() });
    s += crate(560, 370, 1.2, "木") + crate(600, 370, 1.2, "钉");
    return s;
  },
  departure(r, o, id) {
    const weather = o.weather || "clear";
    let s = sky(weather, id, r) + mountains(r, id, { base: 210, layers: 2 });
    s += sea(250, r, id, { rough: weather === "storm" });
    s += gate(80, 300, 0.8);
    s += ship(400, 300, 1.15, { masts: 9 });
    s += ship(170, 250, 0.45, { masts: 5 }) + ship(590, 255, 0.4, { masts: 4 }) + ship(520, 230, 0.3, { masts: 3 });
    if (weather === "storm") s += rain(r);
    return s;
  },
  monsoon_wait(r, o, id) {
    let s = sky("fog", id, r) + mountains(r, id, { base: 230, layers: 3 });
    s += sea(270, r, id);
    for (let i = 0; i < 5; i++) s += ship(80 + i * 130, 300 + (i % 2) * 18, 0.38, { masts: 5, flip: i % 2 === 1 });
    s += `<path d="M380,120 q40,-30 90,-10 q-30,-6 -40,14" fill="none" stroke="${C.inkSoft}" stroke-width="3"/>`;
    s += `<text x="470" y="140" font-size="16" fill="${C.ink}" font-family="'Ma Shan Zheng',serif">候风</text>`;
    s += person(560, 280, 1.1, { hat: "official" });
    return s;
  },
  storm(r, o, id) {
    let s = sky("storm", id, r);
    s += sea(200, r, id, { rough: true });
    s += ship(320, 270, 1.05, { masts: 9, rock: r.range(-12, -6) });
    s += ship(560, 230, 0.35, { masts: 4, rock: 10 });
    s += rain(r);
    return s;
  },
  star_nav(r, o, id) {
    let s = sky("night", id, r) + starChart(r);
    s += mountains(r, id, { base: 300, layers: 1, night: true });
    s += sea(300, r, id);
    s += ship(420, 330, 0.8, { masts: 7, sails: C.inkSoft });
    s += person(380, 300, 0.9, { hat: "official", pose: 1 });
    s += `<rect x="350" y="236" width="18" height="18" fill="${C.gold}" opacity=".9"/>`;
    return s;
  },
  malacca_depot(r, o, id) {
    let s = sky(o.weather === "storm" ? "storm" : "clear", id, r) + mountains(r, id, { base: 200, layers: 2 });
    s += `<rect x="0" y="230" width="${W}" height="170" fill="${C.paperDeep}"/>`;
    // 排栅城垣
    for (let x = 0; x < W; x += 12) s += `<path d="M${x},230 V200 l4,-8 l4,8" fill="${C.ink}" stroke="${C.ink}" stroke-width="3"/>`;
    s += hall(60, 330, 170, 70, { label: "官厂" }) + hall(300, 330, 140, 60, { label: "仓廒" });
    s += hall(480, 330, 110, 90, { door: true, label: "更鼓" });
    const n = 4 + Math.round((o.load || 0.5) * 6);
    for (let i = 0; i < n; i++) s += (i % 2 ? jar : crate)(60 + i * 52, 380, 0.9);
    if (o.weather === "storm") s += rain(r);
    return s;
  },
  trade_port(r, o, id) {
    let s = sky(o.weather || "clear", id, r) + mountains(r, id, { base: 210, layers: 2 });
    s += sea(240, r, id, { rough: o.weather === "storm" });
    s += `<rect x="0" y="300" width="${W}" height="100" fill="${C.paperDeep}"/>`;
    s += ship(470, 270, 0.7, { masts: 6 });
    s += stall(40, 380, 110) + stall(170, 380, 110);
    s += jar(70, 360) + bolt(120, 360) + bolt(210, 360, 1, C.seriesAncient) + jar(240, 360, 0.9);
    s += person(310, 390, 1, { hat: "official" }) + person(360, 390, 1, { hat: "turban", robe: C.seriesAncient, pose: 1 });
    if (o.weather === "storm") s += rain(r);
    return s;
  },
  calicut(r, o, id) {
    let s = sky("clear", id, r) + mountains(r, id, { base: 220, layers: 2 });
    s += `<rect x="0" y="250" width="${W}" height="150" fill="${C.paperDeep}"/>`;
    // 椰树
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 170 + r.range(-20, 20);
      s += `<path d="M${x},260 q-10,-80 6,-150" stroke="${C.ink}" stroke-width="5" fill="none"/>`;
      for (let k = 0; k < 6; k++)
        s += `<path d="M${x + 6},110 q${f(Math.cos(k) * 40)},${f(-10 + Math.sin(k) * 20)} ${f(Math.cos(k) * 70)},${f(20 + Math.sin(k) * 20)}" stroke="${C.celadonDeep}" stroke-width="4" fill="none"/>`;
    }
    s += person(250, 370, 1.3, { hat: "official", pose: 1 });
    s += person(390, 370, 1.3, { hat: "turban", robe: C.seriesAncient, pose: 1 });
    s += `<path d="M300,300 l20,-10 l20,10" stroke="${C.cinnabar}" stroke-width="4" fill="none"/><text x="320" y="282" text-anchor="middle" font-size="14" fill="${C.cinnabar}" font-family="serif">击掌</text>`;
    s += (o.goods === "silk" ? bolt : o.goods === "tea" || o.goods === "coin" ? crate : jar)(160, 380, 1.3);
    s += crate(470, 380, 1.1, "椒") + crate(510, 380, 1.1, "椒");
    return s;
  },
  africa_giraffe(r, o, id) {
    let s = sky("clear", id, r);
    s += `<rect x="0" y="250" width="${W}" height="150" fill="${C.gold}" opacity=".35"/>`;
    s += sea(300, r, id);
    s += ship(480, 310, 0.6, { masts: 6 });
    s += giraffe(200, 330, 1.4);
    s += person(300, 340, 1, { hat: "official", pose: 1 }) + person(110, 340, 1, { hat: "turban", robe: C.cinnabar });
    s += `<text x="230" y="150" font-size="18" fill="${C.ink}" font-family="'Ma Shan Zheng',serif">麒麟</text>`;
    return s;
  },
  // ---------- 现代 ----------
  order(r, o, id) {
    let s = sky("night", id, r);
    s += skyline(r, 360, { chongqing: true });
    s += `<rect x="0" y="360" width="${W}" height="40" fill="${C.ink}"/>`;
    s += phone(470, 200, 0.95, o.item || "火锅底料 ×1");
    s += `<text x="80" y="90" font-size="40" fill="${C.cinnabar}" font-family="'Ma Shan Zheng',serif">00:00</text>`;
    return s;
  },
  forecast_warehouse(r, o, id) {
    let s = `<rect width="${W}" height="${H}" fill="${C.paperDeep}"/>`;
    for (let col = 0; col < 6; col++)
      for (let row = 0; row < 4; row++) {
        const x = 30 + col * 100, y = 90 + row * 70;
        s += `<rect x="${x}" y="${y}" width="80" height="6" fill="${C.ink}"/>`;
        const fill = Math.min(1, (o.load ?? 0.5) + r.range(-0.3, 0.3));
        for (let k = 0; k < Math.round(fill * 4); k++) s += crate(x + 12 + k * 18, y, 0.55);
      }
    s += `<path d="M0,370 H${W}" stroke="${C.ink}" stroke-width="3"/>`;
    s += person(560, 370, 1, { robe: C.seriesAncient, hat: "cap", pose: 1 });
    s += `<text x="40" y="50" font-size="15" fill="${C.ink}">预测销量 ↑  提前下沉</text>`;
    return s;
  },
  sorting(r, o, id) {
    const jam = o.congestion ?? 0.4;
    let s = `<rect width="${W}" height="${H}" fill="${C.paperDeep}"/>`;
    // 工坊屋架
    s += `<path d="M0,60 L320,10 L640,60" fill="none" stroke="${C.ink}" stroke-width="6"/>`;
    for (let x = 40; x < W; x += 120) s += `<path d="M${x},50 V120" stroke="${C.ink}" stroke-width="3"/>`;
    s += conveyor(170, r, 10, jam) + conveyor(260, r, 9, jam) + conveyor(350, r, 8, jam);
    for (let i = 0; i < 3; i++) s += `<path d="M${120 + i * 200},188 l40,72" stroke="${C.gold}" stroke-width="3"/>`;
    for (let i = 0; i < 3; i++) s += person(80 + i * 220, 160, 0.8, { robe: C.seriesAncient, hat: "cap", pose: r() });
    if (jam > 0.7) s += `<text x="420" y="130" font-size="24" fill="${C.cinnabar}" font-family="'Ma Shan Zheng',serif">爆仓！</text>`;
    return s;
  },
  hub(r, o, id) {
    let s = sky(o.weather || "clear", id, r);
    s += `<rect x="0" y="260" width="${W}" height="140" fill="${C.inkSoft}" opacity=".85"/>`;
    s += hall(140, 260, 360, 80, { label: "枢纽" });
    for (let i = 0; i < 4; i++) s += plane(80 + i * 160, 320 + (i % 2) * 30, 0.42, 0, C.ink);
    for (let i = 0; i < 7; i++) s += crate(40 + i * 90, 395, 0.7);
    return s;
  },
  cargo_takeoff(r, o, id) {
    const weather = o.weather || "night";
    let s = sky(weather === "clear" ? "night" : weather, id, r);
    s += mountains(r, id, { base: 300, layers: 2, night: weather !== "storm" });
    s += `<rect x="0" y="330" width="${W}" height="70" fill="${C.ink}"/>`;
    for (let x = 0; x < W; x += 40) s += `<rect x="${x}" y="360" width="20" height="4" fill="${C.gold}"/>`;
    s += plane(360, 200, 1.1, -14, weather === "storm" ? C.ink : C.paperDeep);
    s += hall(30, 330, 120, 40, { door: false });
    if (weather === "storm") s += rain(r);
    return s;
  },
  container_port(r, o, id) {
    let s = sky("clear", id, r) + sea(250, r, id);
    s += `<path d="M80,300 L560,300 L540,340 L100,340Z" fill="${C.ink}"/>`;
    const cols = [C.cinnabar, C.seriesAncient, C.gold, C.celadonDeep];
    for (let i = 0; i < 18; i++) s += `<rect x="${110 + (i % 9) * 48}" y="${270 - Math.floor(i / 9) * 22}" width="44" height="20" fill="${r.pick(cols)}"/>`;
    s += `<path d="M520,300 V120 H380 M520,120 h40" stroke="${C.ink}" stroke-width="5" fill="none"/>`;
    return s;
  },
  rail(r, o, id) {
    let s = sky(o.weather === "storm" ? "storm" : "clear", id, r) + mountains(r, id, { base: 260, layers: 3 });
    s += `<rect x="0" y="320" width="${W}" height="80" fill="${C.gold}" opacity=".3"/>`;
    s += `<path d="M0,340 H${W} M0,350 H${W}" stroke="${C.ink}" stroke-width="2"/>`;
    for (let i = 0; i < 7; i++)
      s += `<rect x="${20 + i * 88}" y="290" width="82" height="44" fill="${i === 0 ? C.cinnabar : C.seriesAncient}" stroke="${C.ink}" stroke-width="2"/><circle cx="${40 + i * 88}" cy="338" r="6" fill="${C.ink}"/><circle cx="${82 + i * 88}" cy="338" r="6" fill="${C.ink}"/>`;
    return s;
  },
  customs(r, o, id) {
    let s = `<rect width="${W}" height="${H}" fill="${C.paperDeep}"/>`;
    s += hall(60, 340, 520, 180, { label: "清关" });
    s += conveyor(350, r, 8, o.congestion ?? 0.3);
    s += person(320, 250, 1.1, { robe: C.seriesAncient, hat: "cap", pose: 1 });
    s += seal(410, 180, "放行", 50);
    return s;
  },
  last_mile(r, o, id) {
    let s = sky(o.weather || "clear", id, r);
    s += skyline(r, 300);
    s += `<rect x="0" y="300" width="${W}" height="100" fill="${C.inkSoft}" opacity=".7"/>`;
    s += `<path d="M0,350 H${W}" stroke="${C.paper}" stroke-width="3" stroke-dasharray="30 20"/>`;
    s += hall(470, 300, 130, 60, { label: "驿站" });
    s += rider(240, 360, 1);
    if (o.weather === "storm") s += rain(r);
    return s;
  },
  jam(r, o, id) {
    return SCENES.sorting(r, { ...o, congestion: 0.95 }, id);
  },
  delivered(r, o, id) {
    let s = `<rect width="${W}" height="${H}" fill="${C.paper}"/>`;
    s += hall(160, 340, 320, 140, { label: "家" });
    s += person(320, 360, 1.4, { robe: C.seriesAncient, hat: "cap", pose: 1 });
    s += bag(360, 300, 2);
    return s;
  },
};

export const SCENE_NAMES = {
  shipyard: "宝船厂造船", departure: "宝船出港", monsoon_wait: "候风", storm: "海上风暴", star_nav: "牵星过洋",
  malacca_depot: "满剌加官厂", trade_port: "港口互市", calicut: "古里交易", africa_giraffe: "麒麟入舱",
  order: "零点下单", forecast_warehouse: "前置仓", sorting: "分拣工坊", hub: "航空枢纽", cargo_takeoff: "货机起飞",
  container_port: "集装箱港", rail: "中欧班列", customs: "清关", last_mile: "最后一公里", jam: "爆仓", delivered: "签收",
};

/**
 * 绘制一格分镜
 * @param {string} scene  场景键
 * @param {object} o      { seed, weather, goods, load, congestion, item, title, sealText }
 */
export function paintScene(scene, o = {}) {
  const id = ++uid;
  const r = rng(o.seed ?? Date.now());
  const painter = SCENES[scene] || SCENES.departure;
  const body = painter(r, o, id);
  const title = o.title || SCENE_NAMES[scene] || "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">
    ${defs(id)}
    <g>${body}</g>
    <rect width="${W}" height="${H}" filter="url(#paper-${id})" fill="#fff"/>
    <rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="${C.ink}" stroke-width="3"/>
    <rect x="${W - 46}" y="18" width="30" height="${title.length * 22 + 14}" fill="${C.paper}" opacity=".88"/>
    ${verticalTitle(W - 31, 40, title)}
    ${seal(W - 50, H - 58, o.sealText || "海图", 36)}
  </svg>`;
}

export { seal as sealSvg };
