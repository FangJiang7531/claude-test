// AIGC 客户端：优先调用服务端 Claude；不可用时回退到本地"组合式"生成，保证离线也能完整体验。
import { paintScene, rng, SCENE_NAMES } from "./ink.js";

const state = { available: false, model: null, drawWithAI: false, checked: false };

export async function checkAI() {
  if (state.checked) return state;
  state.checked = true;
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    const j = await res.json();
    state.available = !!j.ai;
    state.model = j.model;
  } catch {
    state.available = false;
  }
  return state;
}

export const aiState = state;

async function post(path, body, timeoutMs = 90000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || res.statusText);
    return j;
  } finally {
    clearTimeout(t);
  }
}

// ---------- 第一层：分镜画面 ----------

const WEATHER_WORDS = { clear: "晴空朱日", monsoon: "季风鼓帆", headwind: "逆风雾海", fog: "海雾弥漫", storm: "乌云压海、暴雨如注、浪头卷起", night: "夜空星斗" };

export function buildPanelPrompt(scene, o = {}) {
  const parts = [`国风水墨漫画单格，场景：${SCENE_NAMES[scene] || scene}`];
  if (o.weather) parts.push(`天气：${WEATHER_WORDS[o.weather] || o.weather}`);
  if (o.goodsName) parts.push(`货物：${o.goodsName}`);
  if (o.item) parts.push(`包裹：${o.item}`);
  if (o.congestion != null) parts.push(`拥堵程度：${o.congestion > 0.75 ? "爆仓，包裹堆成小山" : o.congestion > 0.45 ? "繁忙但有序" : "通畅"}`);
  if (o.extra) parts.push(o.extra);
  parts.push("青瓷蓝、朱砂红、黛墨黑、宣纸白、金箔黄；留白；墨线勾勒");
  return parts.join("；");
}

/** 先立刻返回本地画面；若开启 AI 绘制，再异步请求 Claude 生成 SVG 并回调替换 */
export function generatePanel(scene, o, onUpgrade) {
  const local = paintScene(scene, o);
  const prompt = buildPanelPrompt(scene, o);
  if (state.available && state.drawWithAI && onUpgrade) {
    post("/api/panel", { prompt }, 150000)
      .then((j) => onUpgrade({ svg: j.svg, source: "claude", prompt }))
      .catch((e) => onUpgrade({ error: e.message, source: "local", prompt }));
  }
  return { svg: local, source: "local", prompt };
}

// ---------- 第二层：叙事文本 ----------

export async function generateStory(kind, input) {
  if (state.available) {
    try {
      const j = await post("/api/story", { kind, input });
      return { ...j, source: "claude" };
    } catch (e) {
      console.warn("Claude 生成失败，改用本地生成：", e.message);
    }
  }
  const story = LOCAL[kind](input, rng(Date.now() % 100000));
  story.dialogues = story.dialogues.map((d) => (Array.isArray(d) ? { role: d[0], line: d[1] } : d));
  return { ...story, source: "local" };
}

// ---------- 本地组合式生成（离线回退） ----------

const NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
let episode = 0;
const nextNo = () => NUM[episode++ % NUM.length];

const LOCAL = {
  voyage(inp, r) {
    const { leg, goods, weather, nav, metrics } = inp;
    const wTitle = { monsoon: "顺风张十二帆", headwind: "逆风缓行", storm: "风暴压船" }[weather.id];
    const nTitle = nav.id === "stars" ? "牵星过洋" : "依针沿岸";
    const narr = {
      monsoon: [`东北季风正劲，${leg.from}外海一夜千里。`, `风从背后推来，十二帆尽张，船队如雁阵南下。`],
      headwind: [`风向忽转，船只得之字抢风，${leg.to}仿佛远了一倍。`, `海雾起，旗号难辨，各船以鼓声相应。`],
      storm: [`未至${leg.to}，黑云压海，浪高过舷。`, `暴雨如注，宝船居中，马船、粮船环列以挡风浪。`],
    }[weather.id];
    const navNarr = nav.id === "stars"
      ? "火长举牵星板，量北辰几指，定下针位直穿大洋。"
      : "舵工依航海图上的山形、岛屿逐一对照，沿岸而行。";
    const lines = {
      monsoon: [["郑和", `趁风！今夜务必过${leg.base}。`], ["火长", "针位丙午，风顺，可再添两帆。"]],
      headwind: [["舵工", "逆风，只能抢风走之字。"], ["郑和", "不急。粮水尚足，宁慢勿险。"]],
      storm: [["火长", "风暴来了！各船收帆！"], ["郑和", "宝船居中，粮船靠拢，夜间以灯笼为号！"], ["通事", "瓷货舱已用茶叶塞满，不怕颠。"]],
    }[weather.id];
    const goodsLine = [["通事", `这船${goods.name}，到了${leg.to}可换${goods.back}。`]];
    return {
      title: `第${nextNo()}回：${wTitle} ${nTitle}`,
      narration: `${r.pick(narr)}${navNarr}此段约行 ${metrics.days} 日。`,
      dialogues: [...lines, ...goodsLine].slice(0, 4),
      annotation: weather.id === "storm" ? "编队航行就是冗余设计：大船居中，小船环列，一船有难，他船可救、可分载。" : goods.note,
      couplet: [],
    };
  },

  order(inp, r) {
    const { node, congestion, strategy, item, dest } = inp;
    if (inp.grade) {
      const jam = inp.grade === "爆仓延误";
      return {
        title: `第${nextNo()}回：${jam ? "洪峰压仓 锦囊迟来" : "锦囊入户 朱印落款"}`,
        narration: jam
          ? `全程 ${inp.total}。分拣线负荷过满，包裹在工坊里排起长龙——就像船队没有候风、硬闯逆风。`
          : `全程 ${inp.total}，${item}送到了${dest}。零点的洪峰被前置、分拣、干线、枢纽一层层摊薄。`,
        dialogues: jam
          ? [["买家", "说好的“极速达”呢？"], ["调度员", "下次得提前下沉库存，再加一条分拣线。"]]
          : [["买家", "这么快就到了！"], ["快递小哥", "货早就在你家附近的仓里等着了。"]],
        annotation: jam ? "排队论：负荷率一旦逼近 100%，等待时间不是线性增加，而是急剧爆炸。" : "让系统在拥挤时仍能运转的秘诀：把峰值“提前”和“分散”，让每个节点都留有余量。",
        couplet: [],
      };
    }
    const level = congestion > 0.75 ? "high" : congestion > 0.45 ? "mid" : "low";
    const T = {
      order: {
        narration: { low: "零点的钟声刚落，订单像落叶一样飘进系统。", mid: "零点，千万个“付尾款”同时按下，服务器像庙会一样热闹。", high: "零点洪峰！订单一秒数十万笔，系统闸门全开。" },
        lines: [["买家", `${item}，拍下了！`], ["系统播报", `订单已生成，目的地：${dest}。`]],
        note: "预售让用户提前付定金，平台据此预测销量，把货提前搬到离你最近的仓里。",
      },
      warehouse: {
        narration: { low: "前置仓里货架整齐，拣货员推车穿行。", mid: "仓里灯火通明，拣货单一张接一张地吐出来。", high: "货架被搬空大半，补货车在门口排成长龙。" },
        lines: [["拣货员", strategy.forward ? "这货预售期就到仓了，直接拣！" : "得从中心仓调货，再等等……"], ["调度员", "按波次拣货，别乱！"]],
        note: "“波次拣货”把同一区域的订单合并处理，拣货员少走路，效率翻倍。",
      },
      sorting: {
        narration: { low: "交叉带分拣机轻快地转着，包裹各归其道。", mid: "分拣线满载运转，扫码声此起彼伏。", high: "包裹堆成了小山，分拣线一刻不停仍追不上来货。" },
        lines: [["分拣工", level === "high" ? "顶不住了，申请开临时线！" : "扫码、落格，一秒一件。"], ["系统播报", `当前分拣耗时每件 ${strategy.sortSec} 秒。`]],
        note: "交叉带分拣机读取面单条码，在小车经过对应格口时把包裹“倒”进去，像驿站分信。",
      },
      trunk: {
        narration: { low: "货机在夜色中起飞，机腹里装满锦囊般的包裹。", mid: "跑道上货机一架接一架，地勤推着集装板小跑。", high: "运力吃紧，平台临时加开包机，铁路与卡车一起分流。" },
        lines: [["机长", "货已配平，申请起飞。"], ["调度员", strategy.mode === "air" ? "航空走主干，最快！" : strategy.mode === "rail" ? "走班列，慢一点但稳。" : "走海运，便宜，就是要等。"]],
        note: "干线运输是成本最大的一段：航空快而贵，铁路居中，海运慢而便宜，按时效需求搭配。",
      },
      hub: {
        narration: { low: "枢纽里集装板拆开重组，包裹换乘下一程。", mid: "枢纽像一座不夜城，几十条航线在此交汇。", high: "枢纽爆满，系统把部分包裹改道到备用分拨中心。" },
        lines: [["调度员", "轴心换装，四十分钟内必须出港。"], ["分拣工", "这一板去西南，那一板去华北！"]],
        note: "轴辐式网络：所有货先集中到轴心再分发，用一次换装换来航线数量的大幅减少。",
      },
      lastmile: {
        narration: { low: "快递小哥骑着电动车穿过街巷，把锦囊送到门口。", mid: "驿站门口排起了长队，取件码一串接一串。", high: "末端堆积，驿站临时加人，夜里十点还在派件。" },
        lines: [["快递小哥", `${dest}的包裹，到了！`], ["买家", "比我想象得快！"]],
        note: "最后一公里成本占整个物流的很大比例：驿站和快递柜把“送到门”变成“顺路取”。",
      },
    }[node.id];
    return {
      title: `第${nextNo()}回：${node.name}${level === "high" ? "告急" : level === "mid" ? "繁忙" : "顺畅"}`,
      narration: T.narration[level],
      dialogues: T.lines,
      annotation: T.note,
      couplet: [],
    };
  },

  keyword(inp, r) {
    const k = inp.keyword;
    const ancient = /泉州|古里|宝船|郑和|满剌加|马六甲|季风|瓷|丝|忽鲁谟斯|锡兰|麒麟|明|针路|牵星/.test(k);
    const modern = /重庆|巴黎|双十一|爆仓|快递|机场|航空|物流|订单|分拣|班列|跨境|仓/.test(k);
    if (ancient && modern) {
      return {
        title: `第${nextNo()}回：书吏夜读航海图 醒来身在分拣场`,
        narration: `一位官厂书吏翻到「${k}」四字，忽觉眼前一花——再睁眼，传送带上锦囊川流不息。`,
        dialogues: [["书吏", "此处莫非也是官厂？仓廒竟会自己走！"], ["分拣工", "大哥，扫码枪拿好，今天双十一。"], ["书吏", "原来六百年后，还是先囤、再分、后运。"]],
        annotation: "古今调度的骨架相同：预判需求、提前囤货、分路并行、关键节点留余量。",
        couplet: [],
      };
    }
    if (ancient) {
      return {
        title: `第${nextNo()}回：${k.slice(0, 8)} 宝船扬帆`,
        narration: `船队为「${k}」而动：粮船先行，宝船居中，水船随后，旗号连绵十余里。`,
        dialogues: [["郑和", "粮水按人头备足，每船分舱，不可混装。"], ["火长", "待北风一起，便可开洋。"]],
        annotation: "船队按功能分船：粮船、水船、马船各司其职，相当于今天的“专线专仓”。",
        couplet: [],
      };
    }
    return {
      title: `第${nextNo()}回：${k.slice(0, 8)} 锦囊启程`,
      narration: `「${k}」——系统读到这个词，调度大屏上立刻亮起一条朱砂色的路线。`,
      dialogues: [["调度员", "先查前置仓库存，再算干线运力。"], ["系统播报", "已分配最优路线，预计时效刷新中……"], ["快递小哥", "收到，马上出发！"]],
      annotation: "智能调度会同时比较几十条路线的时效、成本与拥堵，选出当下最合适的一条。",
      couplet: [],
    };
  },

  ending(inp, r) {
    const { voyage, order } = inp;
    const good = order?.grade === "准时达";
    return {
      title: `终回：一纸海图 古今同航`,
      narration: `六百年前，宝船候季风、设官厂、分䑸而行；今天，货机趁夜航、建前置仓、分流多路。${good ? "你的包裹准时抵达，" : "你的包裹虽有波折，"}而让系统在拥挤中运转的，始终是那几件事：预判、前置、分仓、分流、留余量。`,
      dialogues: [
        ["郑和", "我等候风而行，你们候什么？"],
        ["调度员", "我们候“预售数据”，算准了再发货。"],
        ["郑和", voyage?.weather === "storm" ? "风暴里靠编队冗余，想来你们也一样。" : "原来古今都怕挤，都靠分。"],
      ],
      annotation: "拥挤不可消除，但可以被“提前”和“分散”：时间上削峰，空间上分仓。",
      couplet: r() > 0.5 ? ["宝船候风分䑸去", "锦囊趁夜满天飞"] : ["牵星过洋凭季候", "分拣连夜靠云算"],
    };
  },
};
