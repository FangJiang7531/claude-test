// 第三层交互：用户行为 → 模拟数据 → 不同结局。模型刻意简化，便于讲清"为什么拥挤时还能运转"。
import { MODES } from "./data.js";

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// ---------- 第一章：船队航段 ----------
export function simulateVoyage({ leg, goods, weather, nav, depot }) {
  const days = Math.round((leg.days * nav.distance) / weather.speed + (depot ? 3 : 0));
  const risk = weather.risk * nav.risk * (depot ? 0.75 : 1);
  const loss = clamp(0.01 + goods.fragile * risk * 0.55, 0, 0.6);
  const supply = clamp((days / 45) * (depot ? 0.6 : 1));
  const value = Math.round(goods.value * (1 - loss) * 100);
  const grade = loss < 0.08 && supply < 0.6 ? "满载而归" : loss < 0.2 ? "有惊无险" : "折损过半";
  return {
    days,
    loss: Math.round(loss * 100),
    supply: Math.round(supply * 100),
    risk: Math.round(clamp(risk) * 100),
    value,
    grade,
  };
}

// ---------- 第二章：双十一订单 ----------
const queue = (lambda, mu, service) => {
  const rho = lambda / mu;
  // ρ<0.95 用 M/M/1 近似；超过则积压按线性增长估计
  const wait = rho < 0.95 ? (service * rho) / (1 - rho) : 6 + (rho - 0.95) * 40;
  return { rho, wait };
};

const PROMISE_H = { domestic: 48, local: 12, air: 168, rail: 480, sea: 1080 };

export function simulateOrder({ dest, item, modeId, forward, extraHub, sortSec, peak }) {
  const local = dest.id === "chongqing";
  const mode = MODES.find((m) => m.id === modeId) || MODES[0];
  const nodes = {};

  nodes.order = { hours: 0.1, congestion: clamp((peak - 1) / 4), rows: [["洪峰倍数", `×${peak.toFixed(1)}`], ["下单到出库指令", "约 6 分钟"]] };

  // 仓储：有前置仓则就近拣货，否则需从中心仓调拨
  const whBase = forward ? 2 : 10;
  const wq = queue(900 * peak * (forward ? 0.55 : 1), 5000, 0.4);
  nodes.warehouse = {
    hours: whBase + wq.wait,
    congestion: clamp(wq.rho),
    rows: [["库存位置", forward ? "前置仓（预售期已下沉）" : "中心仓 → 调拨"], ["仓内耗时", `${(whBase + wq.wait).toFixed(1)} 小时`]],
  };

  // 分拣：每件耗时决定处理能力；增加分仓 = 多一个分拣中心并行
  const mu = (7200 / sortSec) * (extraHub ? 1.5 : 1);
  const lambda = 900 * peak * (forward ? 0.75 : 1);
  const sq = queue(lambda, mu, 0.5);
  nodes.sorting = {
    hours: 0.5 + sq.wait,
    congestion: clamp(sq.rho),
    rows: [["处理能力", `${Math.round(mu)} 件/时`], ["到达量", `${Math.round(lambda)} 件/时`], ["负荷率", `${Math.round(sq.rho * 100)}%`]],
  };

  // 干线
  let trunkH, km;
  if (local) {
    trunkH = 1;
    km = dest.km;
  } else {
    const factor = { air: 1.1, rail: 1.3, sea: 2.4 }[mode.id];
    const dwell = { air: dest.intl ? 18 : 4, rail: dest.intl ? 72 : 8, sea: 240 }[mode.id];
    const speed = mode.id === "rail" && !dest.intl ? 60 : mode.id === "rail" ? 30 : mode.id === "sea" ? 30 : mode.speedKmh;
    km = dest.km * factor;
    // 高峰期航空舱位紧张：洪峰越高，等舱越久
    const capWait = mode.id === "air" ? Math.max(0, peak - 2.5) * (extraHub ? 2 : 4) : 0;
    trunkH = km / speed + dwell + capWait;
  }
  nodes.trunk = {
    hours: trunkH,
    congestion: clamp(mode.id === "air" ? (peak - 1) / 4 : 0.3),
    rows: [["方式", local ? "同城车配" : mode.name.replace("走", "")], ["运距", `约 ${Math.round(km).toLocaleString()} 公里`], ["耗时", fmtH(trunkH)]],
  };

  const hq = queue(lambda * 0.6, extraHub ? 4200 : 2600, 0.6);
  nodes.hub = {
    hours: (extraHub ? 1.5 : 3) + hq.wait,
    congestion: clamp(hq.rho),
    rows: [["枢纽数", extraHub ? "2（主枢纽 + 备用分拨）" : "1"], ["换装耗时", fmtH((extraHub ? 1.5 : 3) + hq.wait)]],
  };

  const lastCong = clamp(peak / 5);
  nodes.lastmile = {
    hours: 3 + lastCong * 8,
    congestion: lastCong,
    rows: [["末端方式", "驿站 / 快递柜 / 上门"], ["派送耗时", fmtH(3 + lastCong * 8)]],
  };

  const total = Object.values(nodes).reduce((s, n) => s + n.hours, 0);
  const promise = local ? PROMISE_H.local : dest.intl ? PROMISE_H[mode.id] : PROMISE_H.domestic;
  const maxRho = Math.max(sq.rho, hq.rho, wq.rho);
  const grade = total <= promise * 0.85 ? "准时达" : total <= promise * 1.25 ? "略有延误" : "爆仓延误";
  const kg = item.weight;
  const cost = local ? 6 : kg * mode.costPerKg * (dest.intl ? 1 : 0.18) + 3 + (forward ? 1.5 : 0) + (extraHub ? 1 : 0);
  const co2 = local ? 0.05 : kg * km * mode.co2PerKgKm;

  return {
    nodes,
    total,
    promise,
    grade,
    cost: Math.round(cost * 10) / 10,
    co2: Math.round(co2 * 100) / 100,
    jamRisk: Math.round(clamp((maxRho - 0.6) / 0.6) * 100),
    maxRho,
  };
}

export function fmtH(h) {
  if (h < 1) return `${Math.round(h * 60)} 分钟`;
  if (h < 48) return `${h.toFixed(1)} 小时`;
  return `${(h / 24).toFixed(1)} 天`;
}
