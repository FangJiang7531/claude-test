// 第二章：双十一订单 —— 设定策略下单，拖动"锦囊"逐站前进，每站生成分镜、叙事与数据
import { ORDER_ITEMS, DESTINATIONS, MODES, PIPELINE, COLORS as C } from "./data.js";
import { simulateOrder, fmtH } from "./sim.js";
import { generateStory } from "./aigc.js";
import { chips, comicCard, statTile, barChart, esc, hourTick } from "./ui.js";
import { icon } from "./icons.js";
import { store } from "./store.js";

const STAMPS = ["单", "拣", "分", "运", "转", "签"];

export function initOrder() {
  const form = document.getElementById("order-form");
  const f = (name) => form.querySelector(`[data-field="${name}"]`);
  const item = chips(f("item"), ORDER_ITEMS);
  let mode;
  const dest = chips(f("dest"), DESTINATIONS, {
    onChange: () => {
      const d = dest.get();
      if (!d.intl && mode.get().id === "sea") mode.set("air");
      mode.refresh();
    },
  });
  mode = chips(f("mode"), MODES, { disabled: (m) => (dest.get().intl ? false : m.id === "sea") || dest.get().id === "chongqing" });

  const sort = form.sortSec, peak = form.peak;
  const syncOut = () => {
    document.getElementById("out-sort").textContent = sort.value;
    document.getElementById("out-peak").textContent = peak.value;
  };
  sort.oninput = peak.oninput = syncOut;
  syncOut();

  document.getElementById("btn-order").addEventListener("click", () => {
    const input = {
      dest: dest.get(),
      item: item.get(),
      modeId: mode.get().id,
      forward: form.forward.checked,
      extraHub: form.extraHub.checked,
      sortSec: Number(sort.value),
      peak: Number(peak.value),
    };
    const result = simulateOrder(input);
    const run = { ...input, mode: mode.get(), result };
    store.orders.push(run);
    startRun(run);
  });
}

function startRun(run) {
  const pipe = document.getElementById("pipeline");
  const panel = document.getElementById("node-panel");
  const resultEl = document.getElementById("order-result");
  const hint = document.getElementById("drag-hint");
  panel.innerHTML = "";
  resultEl.hidden = true;

  pipe.innerHTML =
    `<div class="ink-progress"></div>` +
    PIPELINE.map(
      (n, i) => `<div class="pnode" data-i="${i}">
        <div class="ring">${icon(n.icon)}</div>
        <div class="nm">${n.name}</div>
        <div class="hrs"></div>
      </div>`,
    ).join("") +
    `<div class="parcel" tabindex="0" role="button" aria-label="锦囊包裹：按回车前进到下一站">${icon("bag")}</div>`;

  const nodes = [...pipe.querySelectorAll(".pnode")];
  const parcel = pipe.querySelector(".parcel");
  const progress = pipe.querySelector(".ink-progress");
  let at = -1;

  const centerOf = (i) => {
    const ring = nodes[i].querySelector(".ring").getBoundingClientRect();
    const box = pipe.getBoundingClientRect();
    return { x: ring.left - box.left + ring.width / 2, y: ring.top - box.top + ring.height / 2 };
  };
  const placeParcel = (i) => {
    const c = centerOf(i);
    parcel.style.left = c.x - 25 + "px";
    parcel.style.top = c.y - 25 + "px";
  };

  const arrive = async (i) => {
    at = i;
    const node = PIPELINE[i];
    const data = run.result.nodes[node.id];
    const el = nodes[i];
    el.classList.remove("target");
    el.classList.add("done");
    if (data.congestion > 0.85) el.classList.add("jam");
    el.insertAdjacentHTML("beforeend", `<span class="stamp">${STAMPS[i]}</span>`);
    el.querySelector(".hrs").textContent = fmtH(data.hours);
    placeParcel(i);
    const first = centerOf(0).x, last = centerOf(nodes.length - 1).x;
    progress.style.left = first + "px";
    progress.style.width = centerOf(i).x - first + "px";
    progress.style.maxWidth = last - first + "px";

    if (i < nodes.length - 1) {
      nodes[i + 1].classList.add("target");
      hint.innerHTML = `把<b>锦囊</b>拖到「${PIPELINE[i + 1].name}」，或选中锦囊按回车。`;
    } else {
      hint.textContent = "包裹已签收。调整左侧策略，再下一单比比看。";
    }

    const placeholder = document.createElement("p");
    placeholder.className = "narr";
    placeholder.textContent = `「${node.name}」研墨中…`;
    panel.prepend(placeholder);

    const story = await generateStory("order", {
      node: { id: node.id, name: node.name, desc: node.desc },
      congestion: Number(data.congestion.toFixed(2)),
      hours: Number(data.hours.toFixed(1)),
      strategy: { forward: run.forward, extraHub: run.extraHub, sortSec: run.sortSec, peak: run.peak, mode: run.modeId },
      item: run.item.name,
      dest: run.dest.name,
    });
    const scene = node.id === "trunk" ? (run.dest.id === "chongqing" ? "last_mile" : { air: "cargo_takeoff", rail: "rail", sea: "container_port" }[run.modeId]) : node.id === "sorting" && data.congestion > 0.85 ? "jam" : node.scene;
    const card = comicCard({
      story,
      scene,
      figOpts: {
        seed: Math.floor(Math.random() * 1e6),
        congestion: data.congestion,
        load: run.forward ? 0.85 : 0.3,
        item: `${run.item.name} ×1`,
        weather: node.id === "trunk" && run.peak >= 4.5 ? "storm" : undefined,
        title: node.name,
        sealText: STAMPS[i],
      },
      stats: [
        { k: "本站耗时", v: fmtH(data.hours) },
        { k: "负荷", v: Math.round(data.congestion * 100), unit: "%", meter: data.congestion * 100 },
        ...data.rows.map(([k, v]) => ({ k, v })),
      ],
    });
    placeholder.replaceWith(card);
    if (i === nodes.length - 1) showResult(run);
  };

  // ---------- 拖拽 ----------
  let drag = null;
  parcel.addEventListener("pointerdown", (e) => {
    if (at >= nodes.length - 1) return;
    parcel.setPointerCapture(e.pointerId);
    const box = pipe.getBoundingClientRect();
    drag = { dx: e.clientX - box.left - parseFloat(parcel.style.left), dy: e.clientY - box.top - parseFloat(parcel.style.top) };
    parcel.classList.add("dragging");
  });
  parcel.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const box = pipe.getBoundingClientRect();
    parcel.style.left = e.clientX - box.left - drag.dx + "px";
    parcel.style.top = e.clientY - box.top - drag.dy + "px";
    const target = nodes[at + 1];
    target.classList.toggle("over", hit(target, e));
  });
  parcel.addEventListener("pointerup", (e) => {
    if (!drag) return;
    drag = null;
    parcel.classList.remove("dragging");
    const target = nodes[at + 1];
    target.classList.remove("over");
    if (hit(target, e)) arrive(at + 1);
    else placeParcel(at);
  });
  parcel.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && at < nodes.length - 1) {
      e.preventDefault();
      arrive(at + 1);
    }
  });

  requestAnimationFrame(() => arrive(0));
  pipe.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hit(nodeEl, e) {
  const r = nodeEl.querySelector(".ring").getBoundingClientRect();
  const pad = 26;
  return e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad;
}

async function showResult(run) {
  const el = document.getElementById("order-result");
  const r = run.result;
  el.hidden = false;
  el.innerHTML = `
    <h3>落款：${esc(r.grade)}</h3>
    <div class="stats">
      ${statTile({ k: "全程耗时", v: fmtH(r.total) })}
      ${statTile({ k: "承诺时效", v: fmtH(r.promise) })}
      ${statTile({ k: "单件成本", v: r.cost, unit: "元" })}
      ${statTile({ k: "碳排放", v: r.co2, unit: "kg CO₂" })}
      ${statTile({ k: "爆仓风险", v: r.jamRisk, unit: "%", meter: r.jamRisk })}
      ${statTile({ k: "结局", v: r.grade, grade: true })}
    </div>
    <div class="result-grid">
      <div class="chart-card" id="hours-chart"></div>
      <div id="order-ending"></div>
    </div>
    <table class="runs" aria-label="历次下单对比">
      <tr><th>#</th><th>寄往</th><th>干线</th><th>前置仓</th><th>加节点</th><th>分拣</th><th>洪峰</th><th>全程</th><th>结局</th></tr>
      ${store.orders
        .map(
          (o, i) => `<tr class="${o === run ? "cur" : ""}"><td>${i + 1}</td><td>${esc(o.dest.name)}</td><td>${esc(o.dest.id === "chongqing" ? "同城" : o.mode.name.replace("走", ""))}</td><td>${o.forward ? "✓" : "—"}</td><td>${o.extraHub ? "✓" : "—"}</td><td>${o.sortSec}s</td><td>×${o.peak}</td><td>${fmtH(o.result.total)}</td><td>${esc(o.result.grade)}</td></tr>`,
        )
        .join("")}
    </table>`;

  const rows = PIPELINE.map((n) => {
    const d = r.nodes[n.id];
    return {
      label: n.name,
      value: Math.max(d.hours, 0.1),
      color: C.seriesModern,
      display: fmtH(d.hours),
      tip: `<b>${n.name}</b> ${fmtH(d.hours)}<br>负荷 ${Math.round(d.congestion * 100)}%`,
    };
  });
  const spread = Math.max(...rows.map((x) => x.value)) / Math.min(...rows.map((x) => x.value));
  barChart(document.getElementById("hours-chart"), {
    title: "各节点耗时",
    sub: spread > 80 ? "对数刻度：跨越分钟到天的数量级" : "单位：小时",
    rows,
    tickFormat: hourTick,
    log: spread > 80,
    tableHead: ["节点", "耗时"],
  });

  const ending = document.getElementById("order-ending");
  const story = await generateStory("order", {
    node: { id: "lastmile", name: r.grade === "爆仓延误" ? "爆仓结局" : "签收结局", desc: "整单结局" },
    congestion: Math.min(1, r.maxRho),
    strategy: { forward: run.forward, extraHub: run.extraHub, sortSec: run.sortSec, peak: run.peak, mode: run.modeId },
    item: run.item.name,
    dest: run.dest.name,
    total: fmtH(r.total),
    grade: r.grade,
  });
  ending.append(
    comicCard({
      story,
      scene: r.grade === "爆仓延误" ? "jam" : "delivered",
      figOpts: { seed: Math.floor(Math.random() * 1e6), title: r.grade, sealText: r.grade === "准时达" ? "签收" : "延误" },
    }),
  );
  ending.querySelector(".comic").style.gridTemplateColumns = "1fr";
  ending.querySelector(".annot").style.writingMode = "horizontal-tb";
}
