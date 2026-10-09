// 海图古今 —— 静态资源 + AIGC 接口服务
// 运行：node server.js  （可选环境变量见 README）
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(here, "public");
const PORT = Number(process.env.PORT || 5173);
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const OFFLINE = process.env.AIGC_OFFLINE === "1";

const client = OFFLINE ? null : new Anthropic();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

// ---------- 提示词 ----------

const STYLE_GUIDE = `你是一部国风漫画《海图古今》的编剧。作品把明代郑和下西洋的船队调度，与今天"双十一"高峰下的航空物流系统做古今对照，
核心问题是："在极度拥挤的时候，一套调度系统为什么还能运转？"
写作要求：
- 语言为简体中文，凝练、有画面感，带一点章回体与白描的味道，但现代部分可以用现代口语。
- 史实要准确（如：宝船、刘家港、长乐太平港候风、满剌加官厂囤货、牵星过洋、针路、古里、忽鲁谟斯；现代：预售前置仓、自动分拣、航空货运枢纽、末端驿站）。不确定的数字宁可不写。
- 对白每句不超过 26 个字。旁白不超过 90 个字。批注是给读者看的"这个东西怎么运作"的一句科普，不超过 60 个字。`;

const STORY_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "章回体回目，如 第三回：风暴压港 官厂分仓" },
    narration: { type: "string" },
    dialogues: {
      type: "array",
      items: {
        type: "object",
        properties: { role: { type: "string" }, line: { type: "string" } },
        required: ["role", "line"],
        additionalProperties: false,
      },
    },
    annotation: { type: "string" },
    couplet: {
      type: "array",
      items: { type: "string" },
      description: "一副对仗的上下联，各 7-9 字；无需时可返回空数组",
    },
  },
  required: ["title", "narration", "dialogues", "annotation", "couplet"],
  additionalProperties: false,
};

function storyPrompt(kind, input) {
  const json = JSON.stringify(input, null, 2);
  switch (kind) {
    case "voyage":
      return `为第一章《郑和船队》生成一格漫画的剧情。用户的选择如下（JSON）：\n${json}\n
请根据航段、货物、天气和航法写出：回目、旁白、2-4 句角色对白（角色可以是 郑和、火长、通事、舵工、官厂书吏、古里商人 等），一句调度原理批注，couplet 返回空数组。`;
    case "order":
      return `为第二章《双十一订单》的某个物流节点生成一格漫画剧情。数据如下（JSON）：\n${json}\n
请结合节点名称、当前拥堵程度和用户的策略，写出回目、旁白、2-4 句对白（角色可以是 分拣工、调度员、机长、快递小哥、买家、系统播报 等），一句该节点如何运作的批注，couplet 返回空数组。`;
    case "keyword":
      return `用户输入了一个关键词，请据此即兴写一格漫画剧情：「${input.keyword}」。\n
如果关键词偏古代，就写郑和船队；偏现代，就写航空物流；古今混合就写一位穿越的书吏。写出回目、旁白、2-4 句对白、一句批注，couplet 返回空数组。`;
    case "ending":
      return `用户完成了整段体验，下面是他们的选择和模拟得到的效率数据（JSON）：\n${json}\n
请为终章《古今对照》写一个结局：回目、一段总结旁白（点出古今调度系统在"拥挤时仍能运转"上的共同逻辑：预判、前置、分仓、分流、冗余）、2-3 句古今人物隔空对话（郑和 与 今天的物流调度员），一句批注，并给出一副对联放在 couplet（上联写古、下联写今）。`;
    default:
      throw new Error("unknown kind");
  }
}

const PANEL_SYSTEM = `你是一位国风水墨漫画分镜画师，只用 SVG 作画。
硬性要求：
- 只输出一个完整的 <svg> 元素，不要 markdown 代码块，不要任何解释文字。
- viewBox="0 0 640 400"，不要设置 width/height 属性。
- 禁止 <script>、<foreignObject>、事件属性、外部链接与外部字体、<image>。
- 配色只用：宣纸白 #F3ECDD、黛墨黑 #22252B、青瓷蓝 #7BA7A0 / #4E7F7A、朱砂红 #B2342A、金箔黄 #C9A14A，以及它们的透明度变化。
- 风格：留白、远近山水层次、墨线勾勒、可用 feTurbulence 做纸纹或晕染；画面右上可留一枚朱砂小印。
- 构图像漫画单格：有前景主体、中景、远景，有动势。不要写长段文字，最多 4 个汉字的题字。
- 总长度控制在 9000 字符以内。`;

// ---------- Claude 调用 ----------

async function callClaude({ system, user, maxTokens, schema, effort = "low" }) {
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { effort, ...(schema ? { format: { type: "json_schema", schema } } : {}) },
    // 安全分类器拒答时由服务端自动改投合适的备用模型
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };
  const stream = client.beta.messages.stream(params);
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") {
    const err = new Error("模型拒绝了此次生成");
    err.status = 422;
    throw err;
  }
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!text) throw new Error("模型未返回文本");
  return text;
}

function sanitizeSvg(raw) {
  const start = raw.indexOf("<svg");
  const end = raw.lastIndexOf("</svg>");
  if (start < 0 || end < 0) throw new Error("未生成有效 SVG");
  let svg = raw.slice(start, end + 6);
  svg = svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<image\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(".*?"|'.*?')/gi, "")
    .replace(/(href\s*=\s*["'])(?!#)[^"']*(["'])/gi, "$1#$2");
  if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  return svg;
}

// ---------- HTTP ----------

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": MIME[".json"], "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 64 * 1024) throw Object.assign(new Error("请求体过大"), { status: 413 });
    chunks.push(c);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/status") {
    return sendJson(res, 200, { ai: !OFFLINE, model: OFFLINE ? null : MODEL });
  }
  if (OFFLINE) return sendJson(res, 503, { error: "AIGC 已关闭（AIGC_OFFLINE=1）" });
  if (req.method !== "POST") return sendJson(res, 405, { error: "method not allowed" });

  const body = await readBody(req);

  if (pathname === "/api/story") {
    const { kind, input } = body;
    if (kind === "keyword" && (!input?.keyword || String(input.keyword).length > 40)) {
      return sendJson(res, 400, { error: "关键词需为 1-40 字" });
    }
    const text = await callClaude({
      system: STYLE_GUIDE,
      user: storyPrompt(kind, input || {}),
      maxTokens: 4000,
      schema: STORY_SCHEMA,
    });
    return sendJson(res, 200, JSON.parse(text));
  }

  if (pathname === "/api/panel") {
    const prompt = String(body.prompt || "").slice(0, 600);
    if (!prompt) return sendJson(res, 400, { error: "缺少画面提示词" });
    const text = await callClaude({
      system: PANEL_SYSTEM,
      user: `请画这一格分镜：${prompt}`,
      maxTokens: 16000,
      effort: "medium",
    });
    return sendJson(res, 200, { svg: sanitizeSvg(text) });
  }

  return sendJson(res, 404, { error: "not found" });
}

async function serveStatic(res, pathname) {
  const rel = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404");
  }
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  try {
    if (pathname.startsWith("/api/")) await handleApi(req, res, pathname);
    else await serveStatic(res, pathname);
  } catch (err) {
    const status = err.status && err.status < 600 ? err.status : 502;
    console.error(`[${pathname}]`, err.message);
    if (!res.headersSent) sendJson(res, status, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`海图古今 已启动：http://localhost:${PORT}`);
  console.log(OFFLINE ? "AIGC：离线模式（本地程序化生成）" : `AIGC：Claude (${MODEL})，失败时前端自动回退本地生成`);
});
