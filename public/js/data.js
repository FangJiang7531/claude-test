// 史实与现代物流数据（数字均为公开资料中的常见口径，展示时标注"约"；答辩前建议再核对一次出处）

export const COLORS = {
  paper: "#F3ECDD",
  paperDeep: "#E8DEC8",
  ink: "#22252B",
  inkSoft: "#4A4D52",
  celadon: "#7BA7A0",
  celadonDeep: "#4E7F7A",
  cinnabar: "#B2342A",
  gold: "#C9A14A",
  // 图表系列色（已通过色盲/对比度校验）：古=青花蓝，今=朱砂
  seriesAncient: "#1C6FA0",
  seriesModern: "#B2342A",
};

// ---------- 序章：全景海图节点 ----------
// icon: port(码头牌楼) / depot(官厂) / airport(飞檐) / hub(工坊) / rail(驿) / city(城)
export const ANCIENT_NODES = [
  {
    id: "nanjing", lp: "l", name: "南京·龙江宝船厂", lon: 118.75, lat: 32.05, icon: "depot", scene: "shipyard",
    data: [["宝船厂遗址", "现存 3 道作塘"], ["首航船队", "约 62 艘宝船"], ["随行人员", "约 27,800 余人"]],
    note: "造船即备货：船型按用途分宝船、马船、粮船、坐船、战船，像今天按货类分仓。",
  },
  {
    id: "liujiagang", lp: "r", name: "太仓·刘家港", lon: 121.2, lat: 31.5, icon: "port", scene: "departure",
    data: [["角色", "船队集结出海口"], ["首航时间", "永乐三年（1405）"], ["七下西洋", "1405—1433，历时 28 年"]],
    note: "集结港相当于“始发分拨中心”：人、粮、货在此一次装齐，按编队出发。",
  },
  {
    id: "changle", lp: "r", name: "长乐·太平港", lon: 119.6, lat: 25.95, icon: "port", scene: "monsoon_wait",
    data: [["功能", "候风、补给、修船"], ["出航季", "冬季东北季风"], ["返航季", "夏季西南季风"]],
    note: "“候风”就是削峰：不硬闯逆风，等待可预测的季风窗口——今天叫“预售+分批发货”。",
  },
  {
    id: "quanzhou", lp: "b", name: "泉州", lon: 118.6, lat: 24.9, icon: "port", scene: "trade_port",
    data: [["地位", "宋元“东方第一大港”"], ["郑和行香碑", "永乐十五年（1417）"], ["主要出口", "瓷器、丝绸、茶叶"]],
    note: "泉州是成熟的贸易枢纽：牙行、市舶、仓栈俱全，类似今天的口岸综合保税区。",
  },
  {
    id: "zhancheng", name: "占城", lon: 109.2, lat: 13.8, icon: "port", scene: "trade_port",
    data: [["今地", "越南归仁一带"], ["顺风航程", "约 10 昼夜"], ["作用", "出洋后第一站补给"]],
    note: "第一站补给像“干线首个中转”：把淡水、柴薪补满，后面的长航段才敢放心走。",
  },
  {
    id: "malacca", name: "满剌加·官厂", lon: 102.25, lat: 2.2, icon: "depot", scene: "malacca_depot",
    data: [["设施", "排栅城垣、四门更鼓楼、仓廒"], ["功能", "囤货、分䑸、候风"], ["出处", "马欢《瀛涯胜览》"]],
    note: "船队在此“盖造库藏仓廒，一应钱粮顿在其内”，分头去各国再回此集合——这就是古代的海外仓与中转枢纽。",
  },
  {
    id: "samudera", name: "苏门答剌", lon: 97.1, lat: 5.2, icon: "port", scene: "trade_port",
    data: [["今地", "印尼亚齐一带"], ["角色", "进出印度洋的门户"], ["分䑸", "分队可由此驶向锡兰、榜葛剌"]],
    note: "分䑸（分队）航行：大船队在门户港拆成小队，并行出发，避免全部挤在一条航线上。",
  },
  {
    id: "ceylon", name: "锡兰山", lon: 80.2, lat: 6.0, icon: "port", scene: "trade_port",
    data: [["今地", "斯里兰卡"], ["遗存", "郑和布施锡兰山佛寺碑（1409）"], ["碑文", "汉、泰米尔、波斯三语"]],
    note: "三语石碑说明船队要同时对接多种语言与宗教——今天跨境物流也要多语言报关单证。",
  },
  {
    id: "calicut", name: "古里", lon: 75.8, lat: 11.25, icon: "port", scene: "calicut",
    data: [["今地", "印度卡利卡特"], ["地位", "西洋大国，胡椒集散地"], ["交易方式", "牙人议价、击掌定价"]],
    note: "古里交易“以手指计数，击掌为定”，价格一旦确认不再反悔——像今天的电子订单锁价。",
  },
  {
    id: "hormuz", name: "忽鲁谟斯", lon: 56.3, lat: 27.1, icon: "port", scene: "trade_port",
    data: [["今地", "伊朗霍尔木兹岛"], ["到达", "第四次下西洋起"], ["货物", "宝石、珍珠、地毯"]],
    note: "波斯湾口的转口港，亚非欧商品在此汇聚——类似今天的迪拜中转。",
  },
  {
    id: "mogadishu", name: "木骨都束", lon: 45.3, lat: 2.05, icon: "port", scene: "africa_giraffe",
    data: [["今地", "索马里摩加迪沙"], ["分䑸", "远航至东非"], ["回赠", "狮子、长颈鹿（时称麒麟）"]],
    note: "东非是航路的“最后一公里”：由分队专程送达，而不是让整支船队绕远。",
  },
  {
    id: "malindi", name: "麻林", lon: 40.1, lat: -3.2, icon: "port", scene: "africa_giraffe",
    data: [["今地", "肯尼亚马林迪"], ["事件", "麻林国遣使贡麒麟（1415）"], ["意义", "航迹最南端之一"]],
    note: "长颈鹿被当作祥瑞“麒麟”带回南京——一件“超大件特殊货物”的跨洋运输。",
  },
];

export const ANCIENT_ROUTES = [
  { id: "trunk", label: "主航线", stops: ["nanjing", "liujiagang", "changle", "zhancheng", "malacca", "samudera", "ceylon", "calicut", "hormuz"] },
  { id: "quanzhou", label: "泉州支线", stops: ["changle", "quanzhou"] },
  { id: "africa", label: "分䑸·东非", stops: ["calicut", "mogadishu", "malindi"] },
];

export const MODERN_NODES = [
  {
    id: "chongqing", lp: "l", name: "重庆·江北机场", lon: 106.55, lat: 29.56, icon: "airport", scene: "order",
    data: [["角色", "西部航空货运枢纽"], ["通道", "西部陆海新通道起点"], ["时效", "国内次日/隔日达"]],
    note: "订单从山城出发：机场、铁路港、果园港三港联动，按时效和成本分流。",
  },
  {
    id: "hangzhou", lp: "r", name: "杭州·电商仓配", lon: 120.15, lat: 30.27, icon: "hub", scene: "forecast_warehouse",
    data: [["双十一起源", "2009 年"], ["关键动作", "预售期提前下沉库存"], ["原理", "预测销量 → 货先到前置仓"]],
    note: "预售把“0 点洪峰”拆成提前几周的涓流：订单还没付尾款，货已经在你家附近的仓里。",
  },
  {
    id: "ezhou", lp: "l", name: "鄂州·花湖机场", lon: 114.9, lat: 30.4, icon: "airport", scene: "hub",
    data: [["定位", "亚洲首个专业货运枢纽机场"], ["投运", "2022 年"], ["模式", "轴辐式：全国货在此中转"]],
    note: "轴辐式网络：不是每两城都直飞，而是全部飞到“轴心”换装再飞出，航线数从 N² 降到 N。",
  },
  {
    id: "shanghai", lp: "t", name: "上海·浦东机场", lon: 121.8, lat: 31.15, icon: "airport", scene: "cargo_takeoff",
    data: [["地位", "全球货邮吞吐前列"], ["国际货运", "通达欧美主要城市"], ["夜航", "货机多在夜间起降"]],
    note: "货机多在夜里飞：白天收货、夜里干线、清晨分拨，把一整天“错峰”接力。",
  },
  {
    id: "hongkong", lp: "b", name: "香港国际机场", lon: 113.9, lat: 22.3, icon: "airport", scene: "cargo_takeoff",
    data: [["地位", "长期位居全球货运量前列"], ["角色", "国际中转"], ["特点", "腹舱 + 全货机"]],
    note: "客机腹舱也装货：旅客头顶上的行李舱下面，可能就是你的双十一包裹。",
  },
  {
    id: "singapore", lp: "b", name: "新加坡", lon: 103.99, lat: 1.36, icon: "port", scene: "container_port",
    data: [["地位", "全球最繁忙集装箱港之一"], ["位置", "马六甲海峡南口"], ["古今", "与满剌加隔海相望"]],
    note: "600 年前郑和在满剌加设官厂，今天海峡另一端的新加坡仍是亚欧航运的咽喉。",
  },
  {
    id: "dubai", name: "迪拜", lon: 55.36, lat: 25.25, icon: "airport", scene: "hub",
    data: [["角色", "亚欧非航空中转"], ["古今", "距忽鲁谟斯约 200 公里"], ["模式", "海空联运"]],
    note: "海运到港、换空运出港：用一段慢而便宜 + 一段快而贵，拼出“性价比”路线。",
  },
  {
    id: "liege", lp: "l", name: "列日·eHub", lon: 5.45, lat: 50.64, icon: "hub", scene: "customs",
    data: [["角色", "跨境电商欧洲枢纽"], ["功能", "清关、分拨"], ["辐射", "欧洲多国"]],
    note: "跨境包裹在这里“集中清关、再拆包”，相当于海外的分拣中心。",
  },
  {
    id: "paris", lp: "b", name: "巴黎·戴高乐机场", lon: 2.55, lat: 49.0, icon: "airport", scene: "last_mile",
    data: [["终点", "末端配送"], ["航空时效", "约 3—7 天门到门"], ["铁路/海运", "约 2—3 周 / 约 5—6 周"]],
    note: "最后一公里：干线再快，最后还是靠一辆小车、一个驿站把包裹送到人手里。",
  },
  {
    id: "duisburg", lp: "t", name: "杜伊斯堡", lon: 6.76, lat: 51.43, icon: "rail", scene: "rail",
    data: [["角色", "中欧班列重要终点"], ["时效", "约 12—18 天"], ["优势", "比海运快、比航空便宜"]],
    note: "中欧班列是第三条路：时间和成本都在海运与航空之间，双十一前常用来提前备货。",
  },
];

export const MODERN_ROUTES = [
  { id: "air", label: "航空干线", mode: "air", stops: ["chongqing", "ezhou", "shanghai", "dubai", "paris"] },
  { id: "air2", label: "国际快线", mode: "air", stops: ["hangzhou", "liege"] },
  { id: "hk", label: "华南出海", mode: "air", stops: ["ezhou", "hongkong", "singapore"] },
  {
    id: "rail", label: "中欧班列", mode: "rail",
    path: [[106.55, 29.56], [108.9, 34.3], [103.8, 36.0], [87.6, 43.8], [82.6, 45.2], [71.4, 51.1], [52, 54], [37.6, 55.75], [21, 52.2], [6.76, 51.43]],
  },
  {
    id: "sea", label: "远洋海运", mode: "sea",
    path: [[121.8, 31.15], [119.5, 24.5], [114.5, 21.5], [109.5, 12], [104.5, 1.6], [103.99, 1.2], [98, 5.5], [80, 5.3], [57, 13], [44, 12.2], [41.5, 15], [34.5, 26.5], [32.5, 29.9], [32.4, 31.5], [25, 34.2], [12.5, 37.3], [8, 37.8], [-5.6, 35.9], [-9.8, 37.5], [-9.6, 43.5], [-5, 48.2], [1.5, 50.5], [4.1, 51.95]],
  },
];

// ---------- 第一章：郑和船队 ----------
export const LEGS = [
  { id: "leg1", from: "刘家港", to: "占城", distance: 1, days: 12, base: "近海", scene: "departure" },
  { id: "leg2", from: "占城", to: "满剌加", distance: 1.1, days: 20, base: "南海", scene: "malacca_depot" },
  { id: "leg3", from: "满剌加", to: "古里", distance: 1.6, days: 32, base: "印度洋", scene: "calicut" },
  { id: "leg4", from: "古里", to: "忽鲁谟斯", distance: 1.3, days: 26, base: "阿拉伯海", scene: "trade_port" },
  { id: "leg5", from: "古里", to: "木骨都束", distance: 1.7, days: 34, base: "分䑸远航", scene: "africa_giraffe" },
];

export const GOODS = [
  { id: "porcelain", name: "青花瓷", glyph: "瓷", fragile: 0.9, value: 1.0, back: "胡椒、苏木", note: "瓷器怕颠，装舱时以茶叶、稻草填缝，大件压舱。" },
  { id: "silk", name: "丝绸", glyph: "绸", fragile: 0.2, value: 1.2, back: "宝石、珍珠", note: "丝绸轻而贵，怕潮，需油布裹扎放在上层干舱。" },
  { id: "tea", name: "茶叶", glyph: "茶", fragile: 0.3, value: 0.7, back: "香料、乳香", note: "茶叶吸味吸潮，既是商品，也常用作瓷器的填充物。" },
  { id: "coin", name: "铜钱铁器", glyph: "钱", fragile: 0.1, value: 0.8, back: "象牙、犀角", note: "铜钱沉重，可兼作压舱物，让船身更稳。" },
];

export const WEATHERS = [
  { id: "monsoon", name: "顺季风", glyph: "顺", speed: 1.0, risk: 0.05, sky: "clear" },
  { id: "headwind", name: "逆风", glyph: "逆", speed: 0.62, risk: 0.12, sky: "fog" },
  { id: "storm", name: "海上风暴", glyph: "暴", speed: 0.5, risk: 0.35, sky: "storm" },
];

export const NAVS = [
  { id: "coastal", name: "沿岸针路", detail: "按《郑和航海图》针位沿岸标记航行，稳但绕远", distance: 1.18, risk: 0.6 },
  { id: "stars", name: "牵星过洋", detail: "以牵星板量北辰、华盖高度，直穿大洋，快但考验火长", distance: 0.9, risk: 1.15 },
];

// ---------- 第二章：双十一订单 ----------
export const ORDER_ITEMS = [
  { id: "hotpot", name: "火锅底料", glyph: "锅", weight: 1.2 },
  { id: "tea", name: "一盒茶叶", glyph: "茶", weight: 0.5 },
  { id: "phone", name: "新款手机", glyph: "机", weight: 0.4 },
  { id: "porcelain", name: "青花茶具", glyph: "瓷", weight: 1.6 },
];

export const DESTINATIONS = [
  { id: "beijing", name: "北京", intl: false, km: 1750 },
  { id: "chongqing", name: "重庆同城", intl: false, km: 25 },
  { id: "paris", name: "巴黎", intl: true, km: 8100 },
];

export const MODES = [
  { id: "air", name: "走航空", glyph: "空", speedKmh: 700, costPerKg: 28, co2PerKgKm: 0.0006 },
  { id: "rail", name: "走铁路", glyph: "铁", speedKmh: 40, costPerKg: 9, co2PerKgKm: 0.00003 },
  { id: "sea", name: "走海路", glyph: "海", speedKmh: 12, costPerKg: 3, co2PerKgKm: 0.000015 },
];

// 物流链节点；capacity = 每小时处理量（相对单位），scene 对应水墨分镜
export const PIPELINE = [
  { id: "order", name: "下单", icon: "phone", scene: "order", desc: "0 点付尾款，订单进入系统" },
  { id: "warehouse", name: "仓储", icon: "depot", scene: "forecast_warehouse", desc: "拣货、打包、贴面单" },
  { id: "sorting", name: "分拣", icon: "hub", scene: "sorting", desc: "交叉带分拣机按目的地分流" },
  { id: "trunk", name: "干线", icon: "airport", scene: "cargo_takeoff", desc: "航空 / 铁路 / 海运干线" },
  { id: "hub", name: "枢纽", icon: "port", scene: "hub", desc: "目的地枢纽二次分拨" },
  { id: "lastmile", name: "末端", icon: "rider", scene: "last_mile", desc: "驿站与快递员完成最后一公里" },
];

// 终章五个对比维度
export const COMPARE_DIMS = [
  {
    id: "route", name: "航线",
    ancient: "依季风定航期，沿《郑和航海图》针路，主航线 + 分䑸支线",
    modern: "依算法定线路，航空、铁路、海运多式联运，干线 + 支线",
    logic: "把一条拥挤的大路，拆成主干 + 多条并行小路",
  },
  {
    id: "hub", name: "枢纽",
    ancient: "满剌加、古里设官厂：囤货、分䑸、候风、集合",
    modern: "鄂州、迪拜、列日：轴辐式中转，集中换装再分发",
    logic: "在关键位置建“仓 + 转运站”，让货先停一停、再分流",
  },
  {
    id: "time", name: "时效",
    ancient: "一次往返约 1.5—2 年，以季风为节拍",
    modern: "国内次日达、跨境 3—7 天，以小时为节拍",
    logic: "节拍越快，越依赖精确的预判与排程",
  },
  {
    id: "risk", name: "风险",
    ancient: "风暴、触礁、疫病、海盗；以编队冗余、分舱、备船应对",
    modern: "爆仓、天气停飞、清关延误；以前置仓、弹性运力、多路线应对",
    logic: "冗余不是浪费，是系统在拥挤时仍能运转的余量",
  },
  {
    id: "global", name: "全球化",
    ancient: "朝贡与互市并行，瓷器、丝绸换胡椒、宝石",
    modern: "跨境电商，平台 + 海外仓，商品与数据同时流动",
    logic: "流动的从货物，扩展到了信息、资金与信任",
  },
];
