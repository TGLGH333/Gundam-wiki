"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Role = "guest" | "user" | "editor" | "admin";
type Section = "home" | "wiki" | "wiki-index" | "search" | "gallery" | "publish" | "forum" | "tools" | "collections" | "series" | "calendar" | "admin" | "profile" | "login" | "post-detail" | "forum-publish" | "work-detail" | "tool-detail" | "member-profile";
type WikiPage = {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  kit?: string;
  grade?: string;
  scale?: string;
  release?: string;
  price?: string;
  views: number;
  likes: number;
  status: "published" | "pending" | "locked";
  revision: number;
  updatedAt: string;
  imageUrl?: string;
};
type Revision = { id: number; pageId: number; revision: number; content: string; summary: string; editor: string; status: "approved" | "pending" | "rejected"; createdAt: string; imageUrl?: string };
type Work = { id: number; title: string; kit: string; desc: string; tags: string[]; author: string; authorId?: string; authorAvatar?: string; likes: number; comments: number; color: string; createdAt: string; imageUrl?: string };
type Post = { id: number; board: string; title: string; content: string; tags: string[]; author: string; authorId?: string; authorAvatar?: string; imageUrl?: string; replies: number; likes: number; pinned?: boolean; featured?: boolean; createdAt: string };
type Tool = { id: number; name: string; brand: string; category: string; price: string; rating: number; reviews: number; specs: string[]; pros: string[]; tags: string[] };
type SearchScope = "all" | "wiki" | "works" | "tools" | "forum";
type CollectionStatus = "wishlist" | "planned" | "completed" | "abandoned";
type CollectionItem = { pageId: number; status: CollectionStatus; targetPrice?: string; addedAt: string };
type AdvancedFilters = { grade: string; scale: string; year: string; difficulty: string };
type ReleaseItem = { id: number; name: string; grade: string; date: string; status: "情报流出" | "官方确认" | "封绘公开" | "发售中" | "再贩" };
type User = { id: string; username: string; nickname: string; role: Role; score: number; status?: "active" | "suspended"; avatarUrl?: string };
type ManagedUser = { id: string; email: string; username: string; display_name?: string; role: "user" | "admin"; account_status: "active" | "suspended"; contribution_score: number; created_at: string };
type TargetType = "post" | "work" | "tool";
type CommunityComment = { id: number; targetType: TargetType; targetId: number; author: string; userId: string; content: string; rating?: number; createdAt: string };
type CommunityLike = { id: string; targetType: "post" | "work"; targetId: number; userId: string };
type RemoteWikiPage = Omit<WikiPage, "updatedAt" | "imageUrl"> & { updated_at: string; image_url?: string };
type RemoteRevision = Omit<Revision, "pageId" | "createdAt" | "imageUrl"> & { page_id: number; created_at: string; image_url?: string };
type RemoteWork = Omit<Work, "desc" | "createdAt" | "imageUrl" | "authorId" | "authorAvatar"> & { description: string; image_url?: string; user_id?: string; author_avatar?: string; created_at: string };
type RemotePost = Omit<Post, "createdAt" | "imageUrl" | "authorId" | "authorAvatar"> & { image_url?: string; user_id?: string; author_avatar?: string; created_at: string };

const categories = ["入门指南", "制作技法", "模型图鉴", "工具材料", "涂装技法", "改造进阶", "场景制作", "常见问题"];
const boards = ["新套件讨论", "技法问答", "工具避雷", "作品交流", "涂装讨论", "改造创意", "站务公告", "自由讨论"];
const knowledgeThumbnails = [
  "https://staticcdn.bandaihobbysite.cn/www/uploads/20250522/bfca47f78bb04e36d2fbbd277191bba1.jpg",
  "https://staticcdn.bandaihobbysite.cn/www/uploads/20260519/9f16d988469bdd7f1f81de964c95e0c5.jpg",
  "https://staticcdn.bandaihobbysite.cn/www/uploads/20260514/bdabc6eab9621c6ca938a4624f5ff7c2.jpg",
];
const roleText: Record<Role, string> = { guest: "访客", user: "注册用户", editor: "编辑者", admin: "管理员" };

const seedWiki: WikiPage[] = [
  {
    id: 1,
    title: "RG 元祖高达 Ver.2.0",
    slug: "rg-rx78-2-ver2",
    category: "模型图鉴",
    summary: "RG系列15周年纪念作品，采用全新进阶MS关节，1/144比例下拥有优秀可动与分件精度。",
    content:
      "## 套件概览\nRG 元祖高达 Ver.2.0 是面向进阶玩家与素组玩家都很友好的套件。板件分色细致，核心白蓝红黄配色基本无需补色。\n\n## 制作建议\n1. 先阅读说明书并按躯干、头部、四肢分盒收纳。\n2. 水口建议二段剪，外甲使用 800→1200 号砂纸轻磨。\n3. 肩部与裙甲可动结构较密，组装后不要强行掰动。\n\n## 推荐技法\n- 灰色渗线液用于白色外甲。\n- 深灰或黑色渗线液用于蓝色、红色件。\n- 水贴完成后喷一层消光保护漆。",
    tags: ["素组友好", "RG", "元祖", "2024新品"],
    kit: "RX-78-2 Gundam",
    grade: "RG",
    scale: "1/144",
    release: "2024",
    price: "3,500日元",
    views: 24820,
    likes: 913,
    status: "published",
    revision: 3,
    updatedAt: "2026-07-09",
  },
  {
    id: 2,
    title: "新手素组全流程",
    slug: "basic-assembly-guide",
    category: "入门指南",
    summary: "从开盒检查、剪件、水口处理到贴纸与消光的第一只高达完整路线。",
    content:
      "## 准备工具\n入门阶段建议准备剪钳、笔刀、镊子、打磨棒、收纳盒。不要一开始就购买整套喷涂设备。\n\n## 标准流程\n开盒检查 → 按板件编号剪件 → 二段剪 → 水口修整 → 分部件组装 → 贴纸/水贴 → 渗线 → 消光。\n\n## 常见误区\n不要直接贴近零件一剪到底；不要在未测试的零件上使用强溶剂渗线液；透明件尽量不要打磨。",
    tags: ["新手友好", "素组", "水口处理"],
    views: 16500,
    likes: 621,
    status: "published",
    revision: 2,
    updatedAt: "2026-07-08",
  },
  {
    id: 3,
    title: "渗线教程：让刻线更立体",
    slug: "panel-lining-guide",
    category: "制作技法",
    summary: "讲解渗线笔、珐琅渗线液、水性渗线液的适用场景与安全注意事项。",
    content:
      "## 渗线材料选择\n白色外甲适合浅灰，蓝红黄外甲适合深灰，机械内构可使用黑色。\n\n## 操作步骤\n在光滑表面点入渗线液，让液体沿刻线自然流动，等待半干后用棉签蘸稀释剂擦除溢出部分。\n\n## 注意\nABS件和受力关节不要大量使用强溶剂，避免开裂。",
    tags: ["进阶", "渗线", "新手友好"],
    views: 12800,
    likes: 480,
    status: "published",
    revision: 1,
    updatedAt: "2026-07-06",
  },
  {
    id: 4,
    title: "剪钳选购指南：神之手、田宫与入门钳对比",
    slug: "nipper-buying-guide",
    category: "工具材料",
    summary: "按预算与使用场景拆解剪钳选择，覆盖二段剪、单刃钳维护与替代方案。",
    content:
      "## 选择逻辑\n预算有限先买一把结实的双刃钳，后续再补单刃精修钳。\n\n## 维护建议\n单刃钳不要剪透明件、粗流道和金属线；使用后擦干并涂少量防锈油。",
    tags: ["工具", "剪钳", "性价比之选"],
    views: 20450,
    likes: 745,
    status: "published",
    revision: 2,
    updatedAt: "2026-07-07",
  },
];

const gbaseProducts = [
  ["最佳机甲收藏 1/144 高达基地限定 RX-78-2 高达（复刻版）（高达基地配色）", "91元", "2026年5月发售", "3489"],
  ["1/1 高达基地限定 高达模型君 DX套装（附属板件Ver.再现用零件）（涂装专用版）", "84元", "2026年5月发售", "3488"],
  ["HG 1/144 高达基地限定 Ξ高达/佩涅罗佩 浮游导弹特效件套装", "161元", "2026年5月发售", "3487"],
  ["RG 1/144 高达基地限定 ZGMF-X10A 自由高达 Ver.GCP（SPECIAL COATING）", "595元", "2026年4月发售", "3490"],
  ["软胶 哈罗（绿）", "63元", "2026年4月发售", "3486"],
  ["RG 1/144 高达基地限定 艾比安高达（特别涂装版）", "750元", "2026年4月发售", "3485"],
  ["MG 1/100 高达基地限定 异端高达红色机 [再生塑料配色/荧光粉]", "360元", "2026年4月发售", "3483"],
  ["MG 1/100 高达基地限定 飞翼零式高达EW Ver.Ka [再生塑料配色/荧光粉]", "435元", "2026年4月发售", "3482"],
  ["RG 1/144 高达基地限定 RX-78-2 高达 Ver.2.0（高达基地配色）", "266元", "2026年4月发售", "3481"],
  ["MG 1/100 高达基地限定 吉姆狙击特装型（机动战士Z高达版）", "360元", "2026年2月28日发售", "3431"],
  ["ENTRY GRADE 1/144 ν高达（阿克西斯冲击概念配色）", "98元", "2026年2月7日发售", "3432"],
  ["ENTRY GRADE 1/144 高达基地限定 创制强袭高达 超银河（涂装专用版）", "85元", "2026年1月17日发售", "3430"],
  ["模型用多功能工具盒（高达基地配色版）", "154元", "2026年1月17日发售", "3429"],
  ["MG 1/100 高达基地限定 德天使高达（彩色透明版）", "602元", "2025年12月20日发售", "3300"],
  ["1/550 α-瓦索龙（机械光泽版）", "105元", "2025年12月12日发售", "3303"],
  ["RE/100 1/100 乍得·多加（邱尼·盖斯机）（特别涂装版）", "693元", "2025年12月12日发售", "3302"],
  ["MG 1/100 高达基地限定 战国异端顽驮无（机械光泽版）", "420元", "2025年12月12日发售", "3299"],
  ["HAROPLA SIDE-F限定 哈罗 [SIDE-F 配色]", "79元", "2025年11月20日发售", "3201"],
  ["HAROPLA 高达基地限定 哈罗（金银电镀套装）", "280元", "2025年11月20日发售", "3200"],
  ["MG 1/100 高达基地限定 百式 Ver.2.0（机械内构电镀配色）", "1,200元", "2025年11月20日发售", "3199"],
  ["Figure-rise Standard 高达基地限定 露娜玛丽亚·霍克 [高达基地配色]", "280元", "2025年11月发售", "3197"],
  ["Figure-rise Standard 高达基地限定 普露兹 [高达基地配色]", "280元", "2025年11月发售", "3196"],
  ["RG 1/144 ν高达（双飞翼浮游炮装备型）", "378元", "2025年10月31日发售", "3301"],
  ["HG 1/144 高达基地限定 独角兽高达3号机凤凰（毁灭模式）金银电镀套装", "1,400元", "2025年10月18日发售", "3195"],
  ["RG 1/144 高达基地限定 ZGMF-X10A 自由高达 Ver.GCP 未启动形态", "263元", "2025年9月发售", "3167"],
  ["HG 高达基地限定 梅德", "140元", "2025年9月10日发售", "3194"],
  ["HG 1/144 高达基地限定 瓦基尔（高达头&精神感应板搭载型）", "280元", "2025年9月10日发售", "3193"],
  ["MGSD 高达基地限定 高达巴巴托斯（铁血电镀配色）", "488元", "2025年6月27日发售", "3132"],
  ["HG 1/144 高达基地限定 Z高达 [U.C.0088]（生物传感器印象色）", "196元", "2025年5月24日发售", "3026"],
  ["RG 1/144 高达基地限定 神高达 超级模式", "1,125元", "2025年4月25日发售", "3019"],
] as const;

seedWiki.push(...gbaseProducts.map(([name, price, releaseDate, productId], index): WikiPage => {
  const grade = name.match(/^(ENTRY GRADE|Figure-rise Standard|HAROPLA|MGSD|RE\/100|MG|RG|HG)/)?.[1] ?? "其他";
  const scale = name.match(/1\/\d+/)?.[0];
  const year = releaseDate.match(/\d{4}/)?.[0] ?? "2025";
  const finish = name.match(/（([^）]*(?:配色|涂装|电镀|透明|光泽)[^）]*)）|\[([^\]]*(?:配色|荧光)[^\]]*)\]/)?.slice(1).find(Boolean);
  return { id: 100 + index, title: name, slug: `gbase-product-${productId}`, category: "模型图鉴", summary: `高达基地相关商品，官方参考价 ${price}，${releaseDate}。${finish ? `特色版本：${finish}。` : ""}`, content: `## 商品概览\n${name}\n\n## 官方信息\n- 官方参考价：${price}\n- 发售时间：${releaseDate}\n- 产品级别：${grade}\n- 比例：${scale ?? "未标注"}\n- 商品页面：https://www.bandaihobbysite.cn/index/index/detail/id/${productId}\n\n## 收藏提示\n高达基地限定及特殊配色商品的实际到货、库存与销售方式以官方门店公告为准。`, tags: ["高达基地", "限定商品", grade, year, ...(finish ? [finish] : [])], kit: name.replace(/^(ENTRY GRADE|Figure-rise Standard|HAROPLA|MGSD|RE\/100|MG|RG|HG)\s*(1\/\d+)?\s*/, ""), grade, scale, release: year, price, views: 1800 + index * 137, likes: 45 + index * 9, status: "published", revision: 1, updatedAt: "2026-07-11" };
}));

const seedRevisions: Revision[] = [
  { id: 1, pageId: 1, revision: 1, content: seedWiki[0].content.slice(0, 160), summary: "创建RG元祖2.0基础条目", editor: "demo_editor", status: "approved", createdAt: "2026-07-01" },
  { id: 2, pageId: 1, revision: 2, content: seedWiki[0].content.slice(0, 320), summary: "补充制作建议", editor: "demo_editor", status: "approved", createdAt: "2026-07-05" },
  { id: 3, pageId: 1, revision: 3, content: seedWiki[0].content, summary: "加入渗线与水贴建议", editor: "admin", status: "approved", createdAt: "2026-07-09" },
  { id: 4, pageId: 2, revision: 2, content: seedWiki[1].content, summary: "完善新手常见误区", editor: "demo_editor", status: "pending", createdAt: "2026-07-09" },
];

const seedWorks: Work[] = [
  { id: 1, title: "RG 元祖2.0 午夜蓝改色", kit: "RG 元祖高达 Ver.2.0", desc: "使用郡士水性漆，午夜蓝主色搭配钛白，轻度旧化。", tags: ["全喷涂", "改色", "RG"], author: "老刚", likes: 238, comments: 42, color: "from-blue-900 to-cyan-500", createdAt: "07-09" },
  { id: 2, title: "MGEX 强袭自由金属骨架", kit: "MGEX 强袭自由", desc: "金色骨架分色补涂，外甲珍珠白半光效果。", tags: ["MGEX", "金属质感"], author: "大师", likes: 512, comments: 88, color: "from-amber-400 to-yellow-100", createdAt: "07-08" },
  { id: 3, title: "HG 水星魔女素组记录", kit: "HG 风灵高达", desc: "零喷涂素组，重点记录贴纸替换水贴后的效果。", tags: ["新手友好", "素组"], author: "小星", likes: 76, comments: 15, color: "from-rose-500 to-violet-500", createdAt: "07-06" },
];

const seedPosts: Post[] = [
  { id: 1, board: "站务公告", title: "共建邀请：首批编辑者招募中", content: "欢迎有图文教程经验的玩家参与冷启动内容建设。", tags: ["站务", "编辑招募"], author: "管理员", replies: 31, likes: 128, pinned: true, featured: true, createdAt: "07-09" },
  { id: 2, board: "技法问答", title: "RG元祖2.0肩部无缝应该怎么处理？", content: "肩甲结构比较复杂，想做全喷涂前先确认处理顺序。", tags: ["RG", "无缝处理", "技法求助"], author: "小星", replies: 18, likes: 36, createdAt: "07-08" },
  { id: 3, board: "工具避雷", title: "单刃钳崩口后还能修吗？", content: "剪透明件时崩了一小块，想知道是否还能继续用。", tags: ["单刃钳", "工具维护"], author: "老刚", replies: 22, likes: 44, featured: true, createdAt: "07-07" },
];

const seedTools: Tool[] = [
  { id: 1, name: "SPN-120 单刃剪钳", brand: "神之手", category: "剪钳/水口钳", price: "¥320-420", rating: 4.8, reviews: 126, specs: ["单刃", "适合精修", "需注意维护"], pros: ["水口白痕少", "手感细腻", "适合二段剪"], tags: ["单刃钳", "水口处理", "进阶工具"] },
  { id: 2, name: "田宫 74035 精密剪钳", brand: "田宫", category: "剪钳/水口钳", price: "¥130-180", rating: 4.5, reviews: 89, specs: ["双刃", "耐用", "入门友好"], pros: ["耐用度高", "维护简单", "泛用性强"], tags: ["双刃钳", "新手工具", "水口处理"] },
  { id: 3, name: "郡士 WC01 黑色渗线液", brand: "郡士", category: "渗线工具", price: "¥28-38", rating: 4.6, reviews: 203, specs: ["水性", "黑色", "适合深色阴影"], pros: ["流动性好", "味道较轻", "易清理"], tags: ["渗线", "水性工具", "涂装辅助"] },
];

const seedReleases: ReleaseItem[] = [
  { id: 1, name: "RG 夏亚专用扎古 Ver.2.0", grade: "RG", date: "2026-07-18", status: "封绘公开" },
  { id: 2, name: "MGEX 命运高达", grade: "MGEX", date: "2026-08-08", status: "官方确认" },
  { id: 3, name: "HGUC Ξ高达 再贩", grade: "HG", date: "2026-08-22", status: "再贩" },
  { id: 4, name: "PGU 独角兽高达", grade: "PG", date: "2026-09-12", status: "情报流出" },
];

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readListStore<T>(key: string, fallback: T[]): T[] {
  const value = readStore<unknown>(key, fallback);
  return Array.isArray(value) && value.length > 0 ? value as T[] : fallback;
}

function writeStore<T>(key: string, value: T) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

function markdownToHtml(text: string) {
  return text
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) return `<h3>${escapeHtml(line.slice(3))}</h3>`;
      if (line.startsWith("- ")) return `<li>${escapeHtml(line.slice(2))}</li>`;
      if (/^\d+\. /.test(line)) return `<li>${escapeHtml(line.replace(/^\d+\. /, ""))}</li>`;
      if (!line.trim()) return "";
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("");
}

export default function Home() {
  const [section, setSection] = useState<Section>("home");
  const [wiki, setWiki] = useState<WikiPage[]>(seedWiki);
  const [revisions, setRevisions] = useState<Revision[]>(seedRevisions);
  const [works, setWorks] = useState<Work[]>(seedWorks);
  const [posts, setPosts] = useState<Post[]>(seedPosts);
  const [tools, setTools] = useState<Tool[]>(seedTools);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [likes, setLikes] = useState<CommunityLike[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [selectedPostId, setSelectedPostId] = useState(seedPosts[0]?.id ?? 1);
  const [selectedWorkId, setSelectedWorkId] = useState(seedWorks[0]?.id ?? 1);
  const [selectedToolId, setSelectedToolId] = useState(seedTools[0]?.id ?? 1);
  const [selectedMember, setSelectedMember] = useState<{ id?: string; username: string; avatarUrl?: string }>({ username: "guest" });
  const [selectedWikiId, setSelectedWikiId] = useState(1);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({ grade: "", scale: "", year: "", difficulty: "" });
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [tutorialProgress, setTutorialProgress] = useState<Record<string, boolean>>({});
  const [usefulVotes, setUsefulVotes] = useState<Record<number, "useful" | "not-useful">>({});
  const [ownedTools, setOwnedTools] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);
  const [compare, setCompare] = useState(false);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<string | null>(null);
  const supabaseEnabled = isSupabaseConfigured();
  const [user, setUser] = useState<User>({ id: "guest", username: "guest", nickname: "游客", role: "guest", score: 0, status: "active" });
  const [notice, setNotice] = useState(supabaseEnabled ? "正在连接 Supabase…" : "尚未配置 Supabase，当前使用浏览器本地数据。");

  async function applyAuthenticatedUser(authUser: { id: string; email?: string }) {
    const supabase = createSupabaseBrowserClient();
    const profileResult = await supabase?.from("profiles").select("*").eq("id", authUser.id).single();
    const profile = profileResult?.data as { username?: string; display_name?: string; role?: "user" | "admin"; account_status?: "active" | "suspended"; contribution_score?: number; avatar_url?: string } | null;
    const role: Role = profile?.role === "admin" ? "admin" : "user";
    const status = profile?.account_status ?? "active";
    const email = authUser.email ?? "user@example.com";
    if (status === "suspended") {
      await supabase?.auth.signOut();
      setSupabaseUser(null);
      setUser({ id: "guest", username: "guest", nickname: "游客", role: "guest", score: 0, status: "active" });
      setNotice("该账号已被管理员停用，请联系管理员。");
      return { role, status };
    }
    setSupabaseUser(email);
    const username = profile?.username || profile?.display_name || email.split("@")[0];
    setUser({ id: authUser.id, username, nickname: username, role, score: profile?.contribution_score ?? 0, status, avatarUrl: profile?.avatar_url });
    if (role === "admin") {
      const usersResult = await supabase?.from("profiles").select("*").order("created_at", { ascending: false });
      if (usersResult?.data) setManagedUsers(usersResult.data as ManagedUser[]);
    }
    return { role, status };
  }

  useEffect(() => {
    const storedWiki = readListStore("gundam_wiki_pages", seedWiki);
    setWiki([...storedWiki, ...seedWiki.filter((seed) => !storedWiki.some((item) => item.id === seed.id))]);
    setRevisions(readListStore("gundam_wiki_revisions", seedRevisions));
    setWorks(readListStore("gundam_wiki_works", seedWorks));
    setPosts(readListStore("gundam_wiki_posts", seedPosts));
    setComments(readStore("gundam_community_comments", []));
    setLikes(readStore("gundam_community_likes", []));
    setCollections(readStore("gundam_model_collections", []));
    setTutorialProgress(readStore("gundam_tutorial_progress", {}));
    setUsefulVotes(readStore("gundam_useful_votes", {}));
    setOwnedTools(readStore("gundam_owned_tools", []));
    const storedUser = readStore<User>("gundam_wiki_user", { id: "guest", username: "guest", nickname: "游客", role: "guest", score: 0, status: "active" });
    setUser({ ...storedUser, id: storedUser.id ?? storedUser.username });
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    Promise.all([
      supabase.from("wiki_pages").select("*").order("id"),
      supabase.from("wiki_revisions").select("*").order("revision"),
      supabase.from("works").select("*").order("id", { ascending: false }),
      supabase.from("forum_posts").select("*").order("id", { ascending: false }),
      supabase.from("tools").select("*").order("rating", { ascending: false }),
      supabase.from("community_comments").select("*").order("id"),
      supabase.from("community_likes").select("*").order("id"),
      supabase.auth.getUser(),
    ]).then(([wikiResult, revisionResult, workResult, postResult, toolResult, commentResult, likeResult, authResult]) => {
      if (wikiResult.data?.length) setWiki([...wikiResult.data.map((item: RemoteWikiPage) => ({
        ...item,
        tags: Array.isArray(item.tags) ? item.tags : [],
        content: item.content ?? "",
        summary: item.summary ?? "",
        views: item.views ?? 0,
        likes: item.likes ?? 0,
        revision: item.revision ?? 1,
        imageUrl: item.image_url,
        updatedAt: item.updated_at ?? new Date().toISOString().slice(0, 10),
      })) as WikiPage[], ...seedWiki.filter((seed) => !wikiResult.data?.some((item: { id: number }) => item.id === seed.id))]);
      if (revisionResult.data?.length) setRevisions(revisionResult.data.map((item: RemoteRevision) => ({ id: item.id, pageId: item.page_id, revision: item.revision, content: item.content, summary: item.summary, editor: item.editor, status: item.status, imageUrl: item.image_url, createdAt: item.created_at })) as Revision[]);
      if (workResult.data?.length) setWorks(workResult.data.map((item: RemoteWork) => ({ id: item.id, title: item.title, kit: item.kit, desc: item.description, tags: item.tags, author: item.author, likes: item.likes, comments: item.comments, color: item.color, imageUrl: item.image_url, authorId: item.user_id, authorAvatar: item.author_avatar, createdAt: item.created_at })) as Work[]);
      if (postResult.data?.length) setPosts(postResult.data.map((item: RemotePost) => ({ id: item.id, board: item.board, title: item.title, content: item.content, author: item.author, tags: Array.isArray(item.tags) ? item.tags : [], replies: item.replies, likes: item.likes, pinned: item.pinned, featured: item.featured, imageUrl: item.image_url, authorId: item.user_id, authorAvatar: item.author_avatar, createdAt: item.created_at })) as Post[]);
      if (toolResult.data?.length) setTools(toolResult.data.map((item: Tool) => ({ ...item, tags: Array.isArray(item.tags) ? item.tags : [] })) as Tool[]);
      if (commentResult.data?.length) setComments(commentResult.data.map((item: { id: number; target_type: TargetType; target_id: number; author: string; user_id: string; content: string; rating?: number; created_at: string }) => ({ id: item.id, targetType: item.target_type, targetId: item.target_id, author: item.author, userId: item.user_id, content: item.content, rating: item.rating, createdAt: item.created_at })));
      if (likeResult.data?.length) setLikes(likeResult.data.map((item: { id: string; target_type: "post" | "work"; target_id: number; user_id: string }) => ({ id: item.id, targetType: item.target_type, targetId: item.target_id, userId: item.user_id })));
      if (authResult.data.user?.email) void applyAuthenticatedUser(authResult.data.user);
      else {
        setSupabaseUser(null);
        setUser({ id: "guest", username: "guest", nickname: "游客", role: "guest", score: 0, status: "active" });
      }
      setRemoteLoaded(true);
      setNotice("Supabase 已连接，云端内容与账号服务可用。");
    }).catch(() => {
      setRemoteLoaded(false);
      setNotice("Supabase 暂时不可用，已切换到浏览器本地数据。");
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.email ?? null;
      if (email) void applyAuthenticatedUser(session!.user);
      else {
        setSupabaseUser(null);
        setUser({ id: "guest", username: "guest", nickname: "游客", role: "guest", score: 0, status: "active" });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => writeStore("gundam_wiki_pages", wiki), [wiki]);
  useEffect(() => writeStore("gundam_wiki_revisions", revisions), [revisions]);
  useEffect(() => writeStore("gundam_wiki_works", works), [works]);
  useEffect(() => writeStore("gundam_wiki_posts", posts), [posts]);
  useEffect(() => writeStore("gundam_community_comments", comments), [comments]);
  useEffect(() => writeStore("gundam_community_likes", likes), [likes]);
  useEffect(() => writeStore("gundam_wiki_user", user), [user]);
  useEffect(() => writeStore("gundam_model_collections", collections), [collections]);
  useEffect(() => writeStore("gundam_tutorial_progress", tutorialProgress), [tutorialProgress]);
  useEffect(() => writeStore("gundam_useful_votes", usefulVotes), [usefulVotes]);
  useEffect(() => writeStore("gundam_owned_tools", ownedTools), [ownedTools]);

  useEffect(() => {
    if (!remoteLoaded || !supabaseUser) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const timer = window.setTimeout(async () => {
      const wikiRows = wiki.map(({ updatedAt, imageUrl, ...item }) => ({ ...item, image_url: imageUrl ?? null, updated_at: updatedAt }));
      const revisionRows = revisions.map((item) => ({ id: item.id, page_id: item.pageId, revision: item.revision, content: item.content, summary: item.summary, editor: item.editor, status: item.status, image_url: item.imageUrl ?? null, created_at: item.createdAt }));
      const workRows = works.map((item) => ({ id: item.id, title: item.title, kit: item.kit, description: item.desc, tags: item.tags, author: item.author, user_id: item.authorId ?? null, author_avatar: item.authorAvatar ?? null, likes: item.likes, comments: item.comments, color: item.color, image_url: (item as Work & { imageUrl?: string }).imageUrl ?? null, created_at: item.createdAt }));
      const postRows = posts.map((item) => ({ id: item.id, board: item.board, title: item.title, content: item.content, author: item.author, user_id: item.authorId ?? null, author_avatar: item.authorAvatar ?? null, image_url: item.imageUrl ?? null, tags: item.tags ?? [], replies: item.replies, likes: item.likes, pinned: Boolean(item.pinned), featured: Boolean(item.featured), created_at: item.createdAt }));
      const tasks: { name: string; run: () => Promise<{ data: unknown; error: { message: string } | null }> }[] = [
        ...(user.role === "admin" ? [{ name: "知识库", run: async () => {
          const result = await supabase.from("wiki_pages").upsert(wikiRows);
          if (result.error && /image_url|schema cache|column/i.test(result.error.message)) return supabase.from("wiki_pages").upsert(wikiRows.map(({ image_url: _imageUrl, ...row }) => row));
          return result;
        } }] : []),
        { name: "编辑记录", run: async () => {
          const result = await supabase.from("wiki_revisions").upsert(revisionRows);
          if (result.error && /image_url|schema cache|column/i.test(result.error.message)) return supabase.from("wiki_revisions").upsert(revisionRows.map(({ image_url: _imageUrl, ...row }) => row));
          return result;
        } },
        { name: "作品", run: () => supabase.from("works").upsert(workRows) },
        { name: "讨论", run: async () => {
          const result = await supabase.from("forum_posts").upsert(postRows);
          if (result.error && /tags|schema cache|column/i.test(result.error.message)) {
            return supabase.from("forum_posts").upsert(postRows.map(({ tags: _tags, ...row }) => row));
          }
          return result;
        } },
        ...(user.role === "admin" ? [{ name: "工具", run: async () => {
          const result = await supabase.from("tools").upsert(tools);
          if (result.error && /tags|schema cache|column/i.test(result.error.message)) {
            return supabase.from("tools").upsert(tools.map(({ tags: _tags, ...tool }) => tool));
          }
          return result;
        } }] : []),
      ];
      const results = await Promise.all(tasks.map(async (task) => ({ name: task.name, result: await task.run() })));
      const failed = results.filter(({ result }) => result.error).map(({ name }) => name);
      if (failed.length) setNotice(`${failed.join("、")}云端同步失败，本地副本仍然安全保存。`);
      else setNotice("云端内容已同步。");
    }, 800);
    return () => window.clearTimeout(timer);
  }, [wiki, revisions, works, posts, tools, remoteLoaded, supabaseUser, user.role]);

  const selectedWiki = wiki.find((item) => item.id === selectedWikiId) ?? wiki[0];
  const selectedPost = posts.find((item) => item.id === selectedPostId) ?? posts[0];
  const selectedWork = works.find((item) => item.id === selectedWorkId) ?? works[0];
  const selectedTool = tools.find((item) => item.id === selectedToolId) ?? tools[0];
  const hotTerms = ["RG元祖2.0", "渗线", "神之手剪钳", "MGEX强袭自由", "无缝处理"];
  const pendingCount = revisions.filter((item) => item.status === "pending").length + wiki.filter((item) => item.status === "pending").length;

  const allTags = useMemo(() => Array.from(new Set([
    ...wiki.flatMap((item) => item.tags ?? []),
    ...works.flatMap((item) => item.tags ?? []),
    ...tools.flatMap((item) => item.tags ?? []),
    ...posts.flatMap((item) => item.tags ?? []),
  ])).sort((a, b) => a.localeCompare(b, "zh-CN")), [wiki, works, tools, posts]);

  const searchResults = useMemo(() => {
    const key = query.trim().toLowerCase();
    const tag = selectedTag.trim().toLowerCase();
    const matchesText = (values: string[]) => !key || values.join(" ").toLowerCase().includes(key);
    const matchesTag = (tags: string[]) => !tag || tags.some((item) => item.toLowerCase() === tag);
    const inScope = (scope: SearchScope) => searchScope === "all" || searchScope === scope;
    const matchesAdvanced = (item: { grade?: string; scale?: string; release?: string; tags?: string[] }) =>
      (!advancedFilters.grade || item.grade === advancedFilters.grade) &&
      (!advancedFilters.scale || item.scale === advancedFilters.scale) &&
      (!advancedFilters.year || item.release === advancedFilters.year) &&
      (!advancedFilters.difficulty || (item.tags ?? []).includes(advancedFilters.difficulty));
    const wikiResults = inScope("wiki") ? wiki
      .filter((item) => matchesText([item.title, item.summary, item.content, ...(item.tags ?? [])]) && matchesTag(item.tags ?? []) && matchesAdvanced(item))
      .map((item) => ({ type: "知识库", scope: "wiki" as SearchScope, title: item.title, desc: item.summary, id: item.id, tags: item.tags ?? [], imageUrl: item.imageUrl })) : [];
    const workResults = inScope("works") ? works
      .filter((item) => matchesText([item.title, item.kit, item.desc, ...(item.tags ?? [])]) && matchesTag(item.tags ?? []) && (!advancedFilters.grade || item.kit.startsWith(advancedFilters.grade)) && (!advancedFilters.difficulty || item.tags.includes(advancedFilters.difficulty)))
      .map((item) => ({ type: "作品", scope: "works" as SearchScope, title: item.title, desc: item.desc, id: item.id, tags: item.tags ?? [], imageUrl: (item as Work & { imageUrl?: string }).imageUrl })) : [];
    const toolResults = inScope("tools") ? tools
      .filter((item) => matchesText([item.name, item.brand, item.category, ...item.specs, ...(item.tags ?? [])]) && matchesTag(item.tags ?? []))
      .map((item) => ({ type: "工具", scope: "tools" as SearchScope, title: item.name, desc: `${item.brand} · ${item.category} · ${item.rating}分`, id: item.id, tags: item.tags ?? [], imageUrl: undefined })) : [];
    const postResults = inScope("forum") ? posts
      .filter((item) => matchesText([item.title, item.content, item.board, ...(item.tags ?? [])]) && matchesTag(item.tags ?? []))
      .map((item) => ({ type: "讨论", scope: "forum" as SearchScope, title: item.title, desc: item.content, id: item.id, tags: item.tags?.length ? item.tags : [item.board], imageUrl: undefined })) : [];
    return [...wikiResults, ...workResults, ...toolResults, ...postResults];
  }, [query, selectedTag, searchScope, advancedFilters, wiki, works, tools, posts]);

  async function handleSupabaseAuth(action: "signin" | "signup" | "signout", email = "", password = "", portal: "user" | "admin" = "user", username = "") {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setNotice("请先配置 Supabase 环境变量。");
      return;
    }
    if (action === "signout") {
      await supabase.auth.signOut();
      setNotice("已安全退出账号。");
      setSection("home");
      return;
    }
    if (action === "signup") {
      const normalized = username.trim();
      if (!/^[\p{L}\p{N}_]{2,24}$/u.test(normalized)) { setNotice("用户名需为 2–24 位，只能包含文字、数字和下划线。"); return; }
      const availability = await supabase.rpc("is_username_available", { candidate: normalized });
      if (availability.error || availability.data !== true) { setNotice("该用户名已被使用，请更换一个用户名。"); return; }
      const result = await supabase.auth.signUp({ email, password, data: { username: normalized, display_name: normalized } });
      setNotice(result.error ? result.error.message : "注册成功，请前往邮箱完成验证后登录。");
      return;
    }
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error || !result.data?.user) {
      setNotice(result.error?.message ?? "登录失败，请检查邮箱和密码。");
      return;
    }
    const account = await applyAuthenticatedUser(result.data.user);
    if (account.status === "suspended") {
      await supabase.auth.signOut();
      setNotice("该账号已被管理员停用，请联系管理员。");
      return;
    }
    if (portal === "admin" && account.role !== "admin") {
      await supabase.auth.signOut();
      setNotice("该账号没有管理员权限，请使用普通用户入口登录。");
      return;
    }
    setNotice(account.role === "admin" ? "管理员登录成功。" : "用户登录成功。");
    setSection(account.role === "admin" && portal === "admin" ? "admin" : "home");
  }

  function login(role: Role) {
    const demoName = role === "admin" ? "admin" : role === "editor" ? "demo_editor" : "xiaoxing";
    const next: User = role === "guest" ? { id: "guest", username: "guest", nickname: "游客", role, score: 0, status: "active" } : { id: demoName, username: demoName, nickname: demoName, role, score: role === "admin" ? 999 : role === "editor" ? 100 : 10, status: "active" };
    setUser(next);
    setNotice(`已切换为${roleText[role]}，可体验对应权限。`);
  }

  function openWiki(id: number) {
    setSelectedWikiId(id);
    setSection("wiki");
    setEditing(false);
    setCompare(false);
  }

  function openPost(id: number) { setSelectedPostId(id); setSection("post-detail"); }
  function openWork(id: number) { setSelectedWorkId(id); setSection("work-detail"); }
  function openTool(id: number) { setSelectedToolId(id); setSection("tool-detail"); }
  function openMember(member: { id?: string; username: string; avatarUrl?: string }) { setSelectedMember(member); setSection(member.id === user.id ? "profile" : "member-profile"); }

  function addComment(targetType: TargetType, targetId: number, content: string, rating?: number) {
    if (user.role === "guest") { setNotice("请先登录后再发表评论。"); return false; }
    const nextComment: CommunityComment = { id: Date.now(), targetType, targetId, author: user.nickname, userId: user.id, content, rating, createdAt: new Date().toLocaleString("zh-CN", { hour12: false }) };
    const nextComments = [...comments, nextComment];
    setComments(nextComments);
    void createSupabaseBrowserClient()?.from("community_comments").upsert([{ id: nextComment.id, target_type: nextComment.targetType, target_id: nextComment.targetId, author: nextComment.author, user_id: nextComment.userId, content: nextComment.content, rating: nextComment.rating ?? null, created_at: nextComment.createdAt }]);
    if (targetType === "post") setPosts((list) => list.map((item) => item.id === targetId ? { ...item, replies: item.replies + 1 } : item));
    if (targetType === "work") setWorks((list) => list.map((item) => item.id === targetId ? { ...item, comments: item.comments + 1 } : item));
    if (targetType === "tool" && rating) {
      const ratings = nextComments.filter((item) => item.targetType === "tool" && item.targetId === targetId && item.rating).map((item) => item.rating as number);
      const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
      setTools((list) => list.map((item) => item.id === targetId ? { ...item, rating: Number(average.toFixed(1)), reviews: ratings.length } : item));
    }
    setNotice("评论已发布。");
    return true;
  }

  function toggleLike(targetType: "post" | "work", targetId: number) {
    if (user.role === "guest") { setNotice("请先登录后再点赞。"); return; }
    const id = `${targetType}-${targetId}-${user.id}`;
    const liked = likes.some((item) => item.id === id);
    if (liked) void createSupabaseBrowserClient()?.from("community_likes").delete().eq("id", id);
    else void createSupabaseBrowserClient()?.from("community_likes").upsert([{ id, target_type: targetType, target_id: targetId, user_id: user.id }]);
    setLikes((list) => liked ? list.filter((item) => item.id !== id) : [...list, { id, targetType, targetId, userId: user.id }]);
    if (targetType === "post") setPosts((list) => list.map((item) => item.id === targetId ? { ...item, likes: Math.max(0, item.likes + (liked ? -1 : 1)) } : item));
    else setWorks((list) => list.map((item) => item.id === targetId ? { ...item, likes: Math.max(0, item.likes + (liked ? -1 : 1)) } : item));
    setNotice(liked ? "已取消点赞。" : "点赞成功。");
  }

  function deleteComment(id: number) {
    if (user.role !== "admin") return;
    const comment = comments.find((item) => item.id === id);
    setComments((list) => list.filter((item) => item.id !== id));
    void createSupabaseBrowserClient()?.from("community_comments").delete().eq("id", String(id));
    if (comment?.targetType === "post") setPosts((list) => list.map((item) => item.id === comment.targetId ? { ...item, replies: Math.max(0, item.replies - 1) } : item));
    if (comment?.targetType === "work") setWorks((list) => list.map((item) => item.id === comment.targetId ? { ...item, comments: Math.max(0, item.comments - 1) } : item));
    if (comment?.targetType === "tool" && comment.rating) {
      const remaining = comments.filter((item) => item.id !== id && item.targetType === "tool" && item.targetId === comment.targetId && item.rating).map((item) => item.rating as number);
      const average = remaining.length ? remaining.reduce((sum, value) => sum + value, 0) / remaining.length : 0;
      setTools((list) => list.map((item) => item.id === comment.targetId ? { ...item, rating: Number(average.toFixed(1)), reviews: remaining.length } : item));
    }
    setNotice("评论已由管理员删除。");
  }

  function deleteEntry(type: "wiki" | "work" | "post" | "tool", id: number) {
    if (user.role !== "admin") return;
    const table = type === "wiki" ? "wiki_pages" : type === "work" ? "works" : type === "post" ? "forum_posts" : "tools";
    void createSupabaseBrowserClient()?.from(table).delete().eq("id", String(id));
    if (type === "wiki") { setWiki((list) => list.filter((item) => item.id !== id)); setRevisions((list) => list.filter((item) => item.pageId !== id)); void createSupabaseBrowserClient()?.from("wiki_revisions").delete().eq("page_id", String(id)); }
    if (type === "work") setWorks((list) => list.filter((item) => item.id !== id));
    if (type === "post") setPosts((list) => list.filter((item) => item.id !== id));
    if (type === "tool") setTools((list) => list.filter((item) => item.id !== id));
    const targetType = type === "post" ? "post" : type === "work" ? "work" : type === "tool" ? "tool" : null;
    if (targetType) comments.filter((item) => item.targetType === targetType && item.targetId === id).forEach((item) => void createSupabaseBrowserClient()?.from("community_comments").delete().eq("id", String(item.id)));
    if (targetType) setComments((list) => list.filter((item) => !(item.targetType === targetType && item.targetId === id)));
    if (targetType === "post" || targetType === "work") {
      likes.filter((item) => item.targetType === targetType && item.targetId === id).forEach((item) => void createSupabaseBrowserClient()?.from("community_likes").delete().eq("id", item.id));
      setLikes((list) => list.filter((item) => !(item.targetType === targetType && item.targetId === id)));
    }
    setNotice("条目及其关联互动已删除。");
  }

  async function changeUsername(nextUsername: string) {
    const normalized = nextUsername.trim();
    if (!/^[\p{L}\p{N}_]{2,24}$/u.test(normalized)) { setNotice("用户名需为 2–24 位，只能包含文字、数字和下划线。"); return false; }
    const supabase = createSupabaseBrowserClient();
    if (!supabase || user.role === "guest") { setNotice("请先登录后再修改用户名。"); return false; }
    const result = await supabase.rpc("change_username", { new_username: normalized });
    if (result.error) { setNotice(result.error.message.includes("USERNAME_TAKEN") ? "该用户名已被占用。" : result.error.message); return false; }
    const oldUsername = user.username;
    setUser((current) => ({ ...current, username: normalized, nickname: normalized }));
    setComments((list) => list.map((item) => item.userId === user.id ? { ...item, author: normalized } : item));
    setWorks((list) => list.map((item) => item.author === oldUsername ? { ...item, author: normalized } : item));
    setPosts((list) => list.map((item) => item.author === oldUsername ? { ...item, author: normalized } : item));
    setNotice("用户名修改成功。");
    return true;
  }

  async function changeAvatar(file: File) {
    if (user.role === "guest") { setNotice("请先登录后再上传头像。"); return false; }
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) { setNotice("头像仅支持 JPG、PNG 或 WebP 格式。"); return false; }
    if (file.size > 5 * 1024 * 1024) { setNotice("头像图片不能超过 5MB。"); return false; }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      const avatarUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
      setUser((current) => ({ ...current, avatarUrl }));
      setNotice("头像已保存在当前浏览器中。");
      return true;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar.${extension}`;
    const upload = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upload.error) { setNotice(upload.error.message); return false; }
    const publicUrl = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    const profile = await supabase.rpc("change_avatar", { new_avatar_url: publicUrl });
    if (profile.error) { setNotice(profile.error.message); return false; }
    setUser((current) => ({ ...current, avatarUrl: publicUrl }));
    setNotice("头像更新成功。");
    return true;
  }

  async function updateManagedUser(id: string, role: "user" | "admin", status: "active" | "suspended") {
    const result = await createSupabaseBrowserClient()?.rpc("admin_update_user", { target_user_id: id, new_role: role, new_status: status });
    if (result?.error) { setNotice(result.error.message); return; }
    setManagedUsers((list) => list.map((item) => item.id === id ? { ...item, role, account_status: status } : item));
    setNotice("用户账号设置已更新。");
  }

  async function deleteManagedUser(id: string) {
    if (id === user.id) { setNotice("不能删除当前正在登录的管理员账号。"); return; }
    const result = await createSupabaseBrowserClient()?.rpc("admin_delete_user", { target_user_id: id });
    if (result?.error) { setNotice(result.error.message); return; }
    setManagedUsers((list) => list.filter((item) => item.id !== id));
    setNotice("用户账号已删除。");
  }

  function updateCollection(pageId: number, status: CollectionStatus, targetPrice = "") {
    if (user.role === "guest") { setNotice("登录后即可建立个人模型清单。"); setSection("login"); return; }
    setCollections((list) => [{ pageId, status, targetPrice: targetPrice || undefined, addedAt: new Date().toISOString().slice(0, 10) }, ...list.filter((item) => item.pageId !== pageId)]);
    setNotice("已更新到个人模型清单。");
  }

  function toggleTutorialStep(pageId: number, step: number) {
    const key = `${pageId}-${step}`;
    setTutorialProgress((current) => ({ ...current, [key]: !current[key] }));
  }

  function voteUseful(pageId: number, vote: "useful" | "not-useful") {
    setUsefulVotes((current) => ({ ...current, [pageId]: vote }));
    setNotice(vote === "useful" ? "感谢反馈，这篇内容已标记为有帮助。" : "已提交复核反馈，管理员会关注内容质量。");
  }

  function submitSearch(value = query) {
    const next = value.trim();
    if (!next && !selectedTag && searchScope === "all") return;
    setQuery(next);
    if (next) setSelectedTag("");
    setSection("search");
  }

  function searchByTag(tag: string) {
    setQuery("");
    setSelectedTag(tag);
    setSearchScope("all");
    setFiltersOpen(false);
    setSection("search");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Header section={section} setSection={setSection} user={user} login={login} pendingCount={pendingCount} supabaseEnabled={supabaseEnabled} supabaseUser={supabaseUser} onAuth={handleSupabaseAuth} query={query} setQuery={setQuery} submitSearch={submitSearch} onOpenFilters={() => { setFiltersOpen(true); setSection("search"); }} />
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-blue-100 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-lg backdrop-blur">{notice}</div>

        {section === "login" && <LoginSection supabaseEnabled={supabaseEnabled} onAuth={handleSupabaseAuth} />}
        {section === "wiki-index" && <WikiIndexSection pages={wiki} onOpen={openWiki} onBack={() => setSection("wiki")} />}
        {section === "home" && <HomeSection wiki={wiki} works={works} posts={posts} hotTerms={hotTerms} query={query} setQuery={setQuery} submitSearch={submitSearch} openWiki={openWiki} setSection={setSection} filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} selectedTag={selectedTag} setSelectedTag={setSelectedTag} searchScope={searchScope} setSearchScope={setSearchScope} allTags={allTags} advancedFilters={advancedFilters} setAdvancedFilters={setAdvancedFilters} />}
        {section === "wiki" && selectedWiki && <WikiSection page={selectedWiki} pages={wiki} revisions={revisions.filter((item) => item.pageId === selectedWiki.id)} user={user} editing={editing} setEditing={setEditing} compare={compare} setCompare={setCompare} onSelect={openWiki} onViewAll={() => setSection("wiki-index")} supabaseEnabled={supabaseEnabled} setNotice={setNotice} onTagSearch={searchByTag} collection={collections.find((item) => item.pageId === selectedWiki.id)} onCollection={updateCollection} tutorialProgress={tutorialProgress} onToggleStep={toggleTutorialStep} usefulVote={usefulVotes[selectedWiki.id]} onVoteUseful={voteUseful} onSave={(nextContent, summary, tags, imageUrl) => {
          const nextRev = selectedWiki.revision + 1;
          const needReview = user.role === "user";
          setWiki((list) => list.map((item) => item.id === selectedWiki.id ? { ...item, content: needReview ? item.content : nextContent, tags, imageUrl: needReview ? item.imageUrl : imageUrl, revision: needReview ? item.revision : nextRev, status: needReview ? "pending" : item.status, updatedAt: new Date().toISOString().slice(0, 10) } : item));
          setRevisions((list) => [...list, { id: Date.now(), pageId: selectedWiki.id, revision: nextRev, content: nextContent, summary, editor: user.nickname, status: needReview ? "pending" : "approved", imageUrl, createdAt: new Date().toISOString().slice(0, 10) }]);
          setEditing(false);
          setNotice(needReview ? "编辑已进入审核队列，管理员通过后会发布。" : "条目已发布新版本，版本历史已同步记录。")
        }} />}
        {section === "wiki" && !selectedWiki && <section className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><h1 className="text-2xl font-black">知识库正在恢复</h1><p className="mt-3 text-slate-500">暂未读取到有效条目，请重新加载默认内容。</p><button onClick={() => { setWiki(seedWiki); setSelectedWikiId(seedWiki[0].id); }} className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white">恢复默认条目</button></section>}
        {section === "search" && <SearchSection query={query} setQuery={setQuery} results={searchResults} hotTerms={hotTerms} submitSearch={submitSearch} openWiki={openWiki} openWork={openWork} openTool={openTool} openPost={openPost} filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} selectedTag={selectedTag} setSelectedTag={setSelectedTag} searchScope={searchScope} setSearchScope={setSearchScope} allTags={allTags} advancedFilters={advancedFilters} setAdvancedFilters={setAdvancedFilters} />}
        {section === "gallery" && <CloudGallerySection works={works} setSection={setSection} openWork={openWork} onTagSearch={searchByTag} onOpenMember={openMember} />}
        {section === "work-detail" && selectedWork && <CommunityDetail type="work" item={selectedWork} comments={comments.filter((comment) => comment.targetType === "work" && comment.targetId === selectedWork.id)} liked={likes.some((like) => like.targetType === "work" && like.targetId === selectedWork.id && like.userId === user.id)} onBack={() => setSection("gallery")} onLike={() => toggleLike("work", selectedWork.id)} onComment={(content) => addComment("work", selectedWork.id, content)} canModerate={user.role === "admin"} onDeleteComment={deleteComment} onTagSearch={searchByTag} onOpenMember={openMember} />}
        {section === "publish" && <CloudPublishSection user={user} works={works} setWorks={setWorks} setSection={setSection} setNotice={setNotice} supabaseEnabled={supabaseEnabled} />}
        {section === "forum" && <ForumSection posts={posts} user={user} openPost={openPost} setSection={setSection} onTagSearch={searchByTag} onOpenMember={openMember} />}
        {section === "forum-publish" && <ForumPublishSection posts={posts} setPosts={setPosts} user={user} setNotice={setNotice} setSection={setSection} supabaseEnabled={supabaseEnabled} />}
        {section === "post-detail" && selectedPost && <CommunityDetail type="post" item={selectedPost} comments={comments.filter((comment) => comment.targetType === "post" && comment.targetId === selectedPost.id)} liked={likes.some((like) => like.targetType === "post" && like.targetId === selectedPost.id && like.userId === user.id)} onBack={() => setSection("forum")} onLike={() => toggleLike("post", selectedPost.id)} onComment={(content) => addComment("post", selectedPost.id, content)} canModerate={user.role === "admin"} onDeleteComment={deleteComment} onTagSearch={searchByTag} onOpenMember={openMember} />}
        {section === "tools" && <ToolsSection tools={tools} user={user} setTools={setTools} setNotice={setNotice} openTool={openTool} onTagSearch={searchByTag} ownedTools={ownedTools} setOwnedTools={setOwnedTools} />}
        {section === "collections" && <CollectionsSection collections={collections} wiki={wiki} onOpen={openWiki} onUpdate={updateCollection} onRemove={(pageId) => setCollections((list) => list.filter((item) => item.pageId !== pageId))} />}
        {section === "tool-detail" && selectedTool && <ToolDetail tool={selectedTool} owned={ownedTools.includes(selectedTool.id)} onToggleOwned={() => setOwnedTools((list) => list.includes(selectedTool.id) ? list.filter((id) => id !== selectedTool.id) : [...list, selectedTool.id])} onTagSearch={searchByTag} comments={comments.filter((comment) => comment.targetType === "tool" && comment.targetId === selectedTool.id)} onBack={() => setSection("tools")} onReview={(content, rating) => addComment("tool", selectedTool.id, content, rating)} canModerate={user.role === "admin"} onDeleteComment={deleteComment} />}
        {section === "series" && <SeriesSection />}
        {section === "calendar" && <ReleaseCalendarSection releases={seedReleases} />}
        {section === "member-profile" && <PublicProfileSection member={selectedMember} works={works} posts={posts} openWork={openWork} openPost={openPost} />}
        {section === "admin" && <AdminSection user={user} wiki={wiki} setWiki={setWiki} revisions={revisions} setRevisions={setRevisions} works={works} posts={posts} tools={tools} comments={comments} managedUsers={managedUsers} pendingCount={pendingCount} setNotice={setNotice} onDeleteEntry={deleteEntry} onDeleteComment={deleteComment} onUpdateUser={updateManagedUser} onDeleteUser={deleteManagedUser} />}
        {section === "profile" && <ProfileSection user={user} wiki={wiki} works={works} posts={posts} onChangeUsername={changeUsername} onChangeAvatar={changeAvatar} />}
      </div>
    </main>
  );
}

function Header({ section, setSection, user, login, pendingCount, supabaseEnabled, supabaseUser, onAuth, query, setQuery, submitSearch, onOpenFilters }: { section: Section; setSection: (s: Section) => void; user: User; login: (r: Role) => void; pendingCount: number; supabaseEnabled: boolean; supabaseUser: string | null; onAuth: (action: "signin" | "signup" | "signout", email?: string, password?: string, portal?: "user" | "admin", username?: string) => Promise<void>; query: string; setQuery: (query: string) => void; submitSearch: (value?: string) => void; onOpenFilters: () => void }) {
  const nav: { key: Section; label: string }[] = [
    { key: "home", label: "首页" }, { key: "wiki", label: "知识库" }, { key: "gallery", label: "作品" }, { key: "forum", label: "讨论" }, { key: "tools", label: "工具" }, { key: "collections", label: "清单" }, { key: "series", label: "系列" }, { key: "calendar", label: "发售" },
    ...(user.role === "admin" ? [{ key: "admin" as Section, label: "管理" }] : []),
  ];
  return <header className="sticky top-3 z-20 mb-4 px-3 py-2 backdrop-blur-xl">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(240px,360px)_auto]">
      <div className="flex min-w-0 items-center gap-0.5 sm:gap-1 lg:overflow-hidden">
        <button onClick={() => setSection("home")} className="mr-0.5 flex shrink-0 items-center gap-2 rounded-xl px-0.5 py-1 text-left sm:mr-1 sm:px-1.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">G</span><span className="hidden text-sm font-black xl:block">GUNPLA WIKI</span></button>
        <nav className="flex min-w-0 flex-1 flex-nowrap justify-between gap-0.5 lg:justify-start lg:gap-1">{nav.map((item) => <button key={item.key} onClick={() => setSection(item.key)} className={`whitespace-nowrap rounded-lg px-1 py-1.5 text-[9px] font-bold transition sm:rounded-xl sm:px-2.5 sm:text-xs ${section === item.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>{item.label}{item.key === "admin" && pendingCount > 0 ? ` ${pendingCount}` : ""}</button>)}</nav>
      </div>
      <div className="col-span-2 row-start-2 flex w-full min-w-0 items-center gap-1.5 rounded-xl border border-white/20 bg-white p-1.5 shadow-lg lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mx-auto lg:max-w-[360px]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submitSearch()} placeholder="搜索套件、作品、帖子或工具" className="min-w-0 flex-1 rounded-lg border-0 px-3 py-2 text-sm outline-none" />
        <button onClick={onOpenFilters} className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">筛选</button>
        <button onClick={() => submitSearch()} className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white">搜索</button>
      </div>
      <div className="col-start-2 row-start-1 flex shrink-0 items-center justify-end gap-0.5 sm:gap-1 lg:col-start-3">
        {supabaseEnabled ? (supabaseUser ? <button onClick={() => onAuth("signout")} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 px-0 text-[10px] font-bold text-slate-500 sm:h-auto sm:w-auto sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-xs">退<span className="hidden sm:inline">出</span></button> : <button onClick={() => setSection("login")} className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 px-0 text-[10px] font-bold text-white sm:h-auto sm:w-auto sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">登<span className="hidden sm:inline">录</span></button>) : <button onClick={() => login("admin")} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 px-0 text-[10px] font-bold sm:h-auto sm:w-auto sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-xs">演<span className="hidden sm:inline">示</span></button>}
        <button onClick={() => setSection("profile")} aria-label="进入账号页面" title="账号页面" className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-slate-100 p-0 text-slate-500 shadow-md ring-1 ring-slate-200 transition hover:ring-2 hover:ring-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{user.avatarUrl ? <img src={user.avatarUrl} alt="用户头像" className="h-full w-full object-cover" /> : <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 5.5V22h16v-2.5C20 16.67 17.33 14 12 14Z" /></svg>}</button>
      </div>
    </div>
  </header>;
}

function AuthControls({ currentEmail, onAuth }: { currentEmail: string | null; onAuth: (action: "signin" | "signup" | "signout", email?: string, password?: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (currentEmail) return <button onClick={() => onAuth("signout")} className="rounded-full border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700">{currentEmail} · 退出</button>;
  return <div className="flex flex-wrap gap-2">
    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="邮箱" className="w-36 rounded-full border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-300" />
    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密码" className="w-28 rounded-full border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-300" />
    <button disabled={!email || password.length < 6} onClick={() => onAuth("signin", email, password)} className="rounded-full bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300">登录</button>
    <button disabled={!email || password.length < 6} onClick={() => onAuth("signup", email, password)} className="rounded-full border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 disabled:text-slate-300">注册</button>
  </div>;
}


function LoginSection({ supabaseEnabled, onAuth }: { supabaseEnabled: boolean; onAuth: (action: "signin" | "signup" | "signout", email?: string, password?: string, portal?: "user" | "admin", username?: string) => Promise<void> }) {
  const [portal, setPortal] = useState<"user" | "admin">("user");
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (!registering || !/^[\p{L}\p{N}_]{2,24}$/u.test(username.trim())) { setUsernameAvailable(null); return; }
    setCheckingUsername(true);
    const timer = window.setTimeout(async () => {
      const result = await createSupabaseBrowserClient()?.rpc("is_username_available", { candidate: username.trim() });
      setUsernameAvailable(result?.data === true);
      setCheckingUsername(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [username, registering]);

  async function submit() {
    setSubmitting(true);
    await onAuth(registering ? "signup" : "signin", email.trim(), password, portal, username);
    setSubmitting(false);
  }

  return <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[.85fr_1.15fr]">
    <div className="rounded-[2rem] border border-white/20 bg-white p-8 shadow-xl">
      <div className="font-mono text-xs tracking-[.3em] text-blue-600">IDENTITY ACCESS / 01</div>
      <h1 className="mt-6 text-5xl font-black leading-none">进入<br />高达模型档案库</h1>
      <p className="mt-6 text-slate-500">普通用户可以参与条目编辑、发布作品与社区讨论；管理员账号拥有审核与后台管理权限。</p>
      <div className="mt-10 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-4"><b>普通用户</b><p className="mt-2 text-xs text-slate-500">邮箱注册 · 内容贡献 · 作品发布</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><b>管理员</b><p className="mt-2 text-xs text-slate-500">内容审核 · 条目管理 · 社区治理</p></div>
      </div>
    </div>
    <div className="rounded-[2rem] border border-white/20 bg-white p-8 shadow-xl">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-2">
        <button onClick={() => { setPortal("user"); setRegistering(false); }} className={`rounded-xl px-4 py-3 font-bold ${portal === "user" ? "bg-blue-600 text-white" : "text-slate-500"}`}>普通用户入口</button>
        <button onClick={() => { setPortal("admin"); setRegistering(false); }} className={`rounded-xl px-4 py-3 font-bold ${portal === "admin" ? "bg-blue-600 text-white" : "text-slate-500"}`}>管理员入口</button>
      </div>
      <div className="mt-8">
        <div className="text-sm font-bold text-blue-600">{portal === "admin" ? "ADMIN AUTHORIZATION" : registering ? "CREATE ACCOUNT" : "MEMBER LOGIN"}</div>
        <h2 className="mt-2 text-3xl font-black">{portal === "admin" ? "管理员登录" : registering ? "注册普通用户" : "普通用户登录"}</h2>
        {portal === "admin" && <p className="mt-3 text-sm text-slate-500">仅已被授予管理员角色的账号可以进入后台。</p>}
        {!supabaseEnabled && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">尚未配置 Supabase 环境变量，云端登录暂不可用。</div>}
        <div className="mt-6 space-y-4">
          {registering && <div><Field label="用户名" value={username} onChange={setUsername} /><div className={`mt-2 text-xs font-bold ${usernameAvailable ? "text-green-600" : "text-red-500"}`}>{checkingUsername ? "正在检查用户名…" : usernameAvailable === true ? "用户名可以使用" : usernameAvailable === false ? "用户名已被占用" : "2–24 位文字、数字或下划线"}</div></div>}
          <Field label="邮箱地址" value={email} onChange={setEmail} />
          <label className="block"><span className="text-sm font-bold text-slate-500">密码</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" /></label>
          <button disabled={!supabaseEnabled || submitting || !email.includes("@") || password.length < 6 || (registering && usernameAvailable !== true)} onClick={submit} className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white disabled:bg-slate-300">{submitting ? "处理中…" : portal === "admin" ? "验证管理员身份" : registering ? "创建账号" : "登录"}</button>
        </div>
        {portal === "user" && <button onClick={() => setRegistering(!registering)} className="mt-5 text-sm font-bold text-blue-600">{registering ? "已有账号？返回登录" : "没有账号？使用邮箱注册"}</button>}
      </div>
    </div>
  </section>;
}

function SearchFilters({ open, selectedTag, setSelectedTag, searchScope, setSearchScope, allTags, advancedFilters, setAdvancedFilters }: { open: boolean; selectedTag: string; setSelectedTag: (tag: string) => void; searchScope: SearchScope; setSearchScope: (scope: SearchScope) => void; allTags: string[]; advancedFilters: AdvancedFilters; setAdvancedFilters: (filters: AdvancedFilters) => void }) {
  if (!open) return null;
  const scopes: { value: SearchScope; label: string }[] = [{ value: "all", label: "全部版面" }, { value: "wiki", label: "知识库" }, { value: "works", label: "作品" }, { value: "tools", label: "工具" }, { value: "forum", label: "讨论" }];
  return <div className="mt-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-xl">
    <div className="text-xs font-black tracking-[.18em] text-slate-400">按版面筛选</div>
    <div className="mt-3 flex flex-wrap gap-2">{scopes.map((item) => <button key={item.value} onClick={() => setSearchScope(item.value)} className={`rounded-full px-3 py-2 text-xs font-bold ${searchScope === item.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{item.label}</button>)}</div>
    <div className="mt-5 flex items-center justify-between"><div className="text-xs font-black tracking-[.18em] text-slate-400">按标签筛选</div>{selectedTag && <button onClick={() => setSelectedTag("")} className="text-xs font-bold text-blue-600">清除标签</button>}</div>
    <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-auto">{allTags.map((tag) => <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${selectedTag === tag ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}>#{tag}</button>)}</div>
    <div className="mt-5 text-xs font-black tracking-[.18em] text-slate-400">模型高级筛选</div>
    <div className="mt-3 grid gap-2 sm:grid-cols-4"><select value={advancedFilters.grade} onChange={(e) => setAdvancedFilters({ ...advancedFilters, grade: e.target.value })} className="rounded-xl px-3 py-2 text-sm"><option value="">全部等级</option>{["HG","RG","MG","MGEX","PG","SD"].map((value) => <option key={value}>{value}</option>)}</select><select value={advancedFilters.scale} onChange={(e) => setAdvancedFilters({ ...advancedFilters, scale: e.target.value })} className="rounded-xl px-3 py-2 text-sm"><option value="">全部比例</option>{["1/144","1/100","1/60","1/48"].map((value) => <option key={value}>{value}</option>)}</select><select value={advancedFilters.year} onChange={(e) => setAdvancedFilters({ ...advancedFilters, year: e.target.value })} className="rounded-xl px-3 py-2 text-sm"><option value="">全部年份</option>{["2026","2025","2024","2023"].map((value) => <option key={value}>{value}</option>)}</select><select value={advancedFilters.difficulty} onChange={(e) => setAdvancedFilters({ ...advancedFilters, difficulty: e.target.value })} className="rounded-xl px-3 py-2 text-sm"><option value="">全部难度</option>{["素组友好","新手友好","需要补色","需要无缝","进阶"].map((value) => <option key={value}>{value}</option>)}</select></div>
  </div>;
}

function HomeSection({ wiki, works, posts, hotTerms, query, setQuery, submitSearch, openWiki, setSection, filtersOpen, setFiltersOpen, selectedTag, setSelectedTag, searchScope, setSearchScope, allTags, advancedFilters, setAdvancedFilters }: { wiki: WikiPage[]; works: Work[]; posts: Post[]; hotTerms: string[]; query: string; setQuery: (q: string) => void; submitSearch: (value?: string) => void; openWiki: (id: number) => void; setSection: (s: Section) => void; filtersOpen: boolean; setFiltersOpen: (open: boolean) => void; selectedTag: string; setSelectedTag: (tag: string) => void; searchScope: SearchScope; setSearchScope: (scope: SearchScope) => void; allTags: string[]; advancedFilters: AdvancedFilters; setAdvancedFilters: (filters: AdvancedFilters) => void }) {
  return <section className="space-y-6">
    <div className="flex flex-wrap items-center gap-2 px-1 text-xs text-slate-500"><span>热门搜索</span>{hotTerms.map((term) => <button key={term} onClick={() => { setQuery(term); submitSearch(term); }} className="rounded-full border border-white/20 bg-white px-3 py-1.5 font-bold text-slate-600">{term}</button>)}</div>
    <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-8 text-white shadow-2xl sm:p-12">
      <div className="mb-8 flex flex-wrap gap-2">{categories.slice(0, 4).map((item) => <span key={item} className="rounded-full bg-white/10 px-3 py-1.5 text-xs backdrop-blur">{item}</span>)}</div>
      <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-6xl">高达模型制作知识与作品社区</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">查找制作教程、套件资料与工具评价，也可以分享作品、参与讨论并共同完善知识库。</p>
      <div className="mt-8 flex flex-wrap gap-3">{wiki[0] && <button onClick={() => openWiki(wiki[0].id)} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">浏览知识库</button>}<button onClick={() => setSection("gallery")} className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white">查看作品</button></div>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{wiki.slice(0,2).map((item) => <button key={item.id} onClick={() => openWiki(item.id)} className="group overflow-hidden rounded-[1.5rem] bg-white text-left shadow-xl"><div className="model-cover h-44 bg-gradient-to-br from-slate-950 via-blue-800 to-cyan-400 p-5"><span className="text-xs font-bold tracking-[.2em] text-white/70">本周热门套件</span><div className="mt-16 text-xl font-black text-white">{item.title}</div></div><div className="p-4 text-sm text-slate-500">{item.grade ?? item.category} · {item.views.toLocaleString()} 浏览</div></button>)}{works.slice(0,2).map((work) => { const imageUrl=(work as Work & {imageUrl?:string}).imageUrl; return <button key={work.id} onClick={() => setSection("gallery")} className="overflow-hidden rounded-[1.5rem] bg-white text-left shadow-xl">{imageUrl ? <img src={imageUrl} alt={work.title} className="h-44 w-full object-cover" /> : <div className={`h-44 bg-gradient-to-br ${work.color}`} />}<div className="p-4"><div className="text-xs font-bold text-blue-600">最新素组展示</div><b className="mt-1 block">{work.title}</b></div></button>; })}</div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="最新作品" action="查看全部" onAction={() => setSection("gallery")}><div className="grid gap-3">{works.map((work) => <button onClick={() => setSection("gallery")} key={work.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-left"><div className={`h-16 w-20 rounded-xl bg-gradient-to-br ${work.color}`} /><div><div className="font-bold">{work.title}</div><div className="text-xs text-slate-500">{work.kit}</div><div className="mt-1 text-xs text-slate-400">♥ {work.likes} · 评论 {work.comments}</div></div></button>)}</div></Panel>
      <Panel title="社区动态" action="去讨论" onAction={() => setSection("forum")}><div className="space-y-3">{posts.map((post) => <button onClick={() => setSection("forum")} key={post.id} className="block w-full rounded-2xl border border-slate-100 p-4 text-left"><div className="text-xs font-semibold text-blue-600">{post.board}</div><div className="mt-1 font-bold">{post.title}</div><div className="mt-2 text-xs text-slate-400">{post.replies} 回复 · {post.likes} 赞</div></button>)}</div></Panel>
    </div>
  </section>;
}

function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return <div className="rounded-[1.75rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/50"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">{title}</h2>{action && <button onClick={onAction} className="text-sm font-bold text-blue-600 hover:text-blue-800">{action}</button>}</div>{children}</div>;
}
function WikiIndexSection({ pages, onOpen, onBack }: { pages: WikiPage[]; onOpen: (id: number) => void; onBack: () => void }) {
  const [keyword, setKeyword] = useState("");
  const [grade, setGrade] = useState("");
  const filtered = pages.filter((item) => (!keyword.trim() || [item.title, item.summary, item.kit ?? "", ...item.tags].join(" ").toLowerCase().includes(keyword.trim().toLowerCase())) && (!grade || item.grade === grade));
  return <section className="space-y-6"><div className="rounded-[2rem] bg-white p-7 shadow-xl"><button onClick={onBack} className="text-sm font-bold text-blue-600">← 返回当前条目</button><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><div className="text-xs font-bold tracking-[.22em] text-blue-600">COMPLETE MODEL ARCHIVE</div><h1 className="mt-2 text-4xl font-black">全部知识库</h1><p className="mt-2 text-slate-500">共 {pages.length} 条资料，可按名称、机体、标签和等级快速查找。</p></div><div className="flex w-full gap-2 sm:w-auto"><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索知识库" className="min-w-0 flex-1 rounded-xl px-4 py-2 sm:w-64" /><select value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded-xl px-3 py-2"><option value="">全部等级</option>{Array.from(new Set(pages.map((item) => item.grade).filter(Boolean))).map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <button key={item.id} onClick={() => onOpen(item.id)} className="overflow-hidden rounded-[1.5rem] bg-white text-left shadow-xl transition hover:-translate-y-1"><img src={item.imageUrl ?? knowledgeThumbnails[item.id % knowledgeThumbnails.length]} alt={item.title} className="h-44 w-full object-cover" /><div className="p-5"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{item.grade ?? item.category}</span><span className="text-xs text-slate-400">v{item.revision}</span></div><h2 className="mt-4 text-xl font-black">{item.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{item.summary}</p><div className="mt-4 flex flex-wrap gap-2">{item.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">#{tag}</span>)}</div><div className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-400">{item.scale ?? "比例未标注"} · {item.release ?? "年份未标注"} · {item.views.toLocaleString()} 浏览</div></div></button>)}</div>{filtered.length === 0 && <div className="rounded-3xl bg-white p-10 text-center text-slate-400 shadow-xl">没有找到符合条件的知识库条目。</div>}</section>;
}


function WikiSection({ page, pages, revisions, user, editing, setEditing, compare, setCompare, onSelect, onViewAll, onSave, onTagSearch, collection, onCollection, tutorialProgress, onToggleStep, usefulVote, onVoteUseful, supabaseEnabled, setNotice }: { page: WikiPage; pages: WikiPage[]; revisions: Revision[]; user: User; editing: boolean; setEditing: (v: boolean) => void; compare: boolean; setCompare: (v: boolean) => void; onSelect: (id: number) => void; onViewAll: () => void; onSave: (content: string, summary: string, tags: string[], imageUrl?: string) => void; onTagSearch: (tag: string) => void; collection?: CollectionItem; onCollection: (pageId: number, status: CollectionStatus, targetPrice?: string) => void; tutorialProgress: Record<string, boolean>; onToggleStep: (pageId: number, step: number) => void; usefulVote?: "useful" | "not-useful"; onVoteUseful: (pageId: number, vote: "useful" | "not-useful") => void; supabaseEnabled: boolean; setNotice: (notice: string) => void }) {
  const [content, setContent] = useState(page.content);
  const [summary, setSummary] = useState("补充条目内容");
  const [tagText, setTagText] = useState(page.tags.join(","));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [workbench, setWorkbench] = useState(false);
  const [compactSteps, setCompactSteps] = useState(false);
  const [targetPrice, setTargetPrice] = useState(collection?.targetPrice ?? "");
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const tutorialSteps = useMemo(() => page.content.split("\n").filter((line) => /^\d+\.\s/.test(line) || line.includes("→")).flatMap((line) => line.includes("→") ? line.split("→") : [line.replace(/^\d+\.\s*/, "")]).map((line) => line.trim()).filter(Boolean), [page.content]);
  const steps = tutorialSteps.length ? tutorialSteps : ["准备工具与确认板件", "完成主要零件处理", "检查细节并进行最终组装"];
  const completedSteps = steps.filter((_, index) => tutorialProgress[`${page.id}-${index}`]).length;
  const canEdit = user.role !== "guest" && page.status !== "locked";

  useEffect(() => { setContent(page.content); setTagText(page.tags.join(",")); setTargetPrice(collection?.targetPrice ?? ""); }, [page.id, page.content, page.tags, collection?.targetPrice]);
  useEffect(() => {
    if (!editing) return;
    const timer = window.setTimeout(() => { writeStore(`gundam_wiki_draft_${page.id}`, { content, summary, tagText }); setDraftSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })); }, 1000);
    return () => window.clearTimeout(timer);
  }, [editing, page.id, content, summary, tagText]);

  async function submitEdit() {
    setUploading(true);
    let imageUrl = page.imageUrl;
    if (imageFile && supabaseEnabled) {
      const supabase = createSupabaseBrowserClient();
      const extension = imageFile.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const result = await supabase?.storage.from("wiki-images").upload(path, imageFile, { upsert: false });
      if (result?.error) { setNotice(result.error.message); setUploading(false); return; }
      imageUrl = supabase?.storage.from("wiki-images").getPublicUrl(path).data.publicUrl;
    }
    onSave(content, summary, tagText.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean), imageUrl);
    localStorage.removeItem(`gundam_wiki_draft_${page.id}`);
    setUploading(false); setImageFile(null);
  }

  return <section className={`wiki-page grid gap-6 lg:grid-cols-[300px_1fr] ${workbench ? "workbench-mode" : ""}`}>
    {!workbench && <aside className="space-y-4">
      <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-xl shadow-slate-200/60">
        {page.imageUrl ? <img src={page.imageUrl} alt={page.title} className="h-64 w-full object-cover" /> : <div className="model-cover grid h-64 place-items-end bg-gradient-to-br from-blue-950 via-blue-700 to-cyan-400 p-5"><div><div className="text-xs font-bold tracking-[.25em] text-white/60">BANDAI MODEL ARCHIVE</div><div className="mt-2 text-2xl font-black text-white">{page.kit ?? page.title}</div></div></div>}
        <div className="grid grid-cols-2 gap-2 p-4 text-sm">{[["📐 比例", page.scale ?? "—"], ["🧩 等级", page.grade ?? "—"], ["📅 发售", page.release ?? "—"], ["💴 定价", page.price ?? "—"]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-400">{label}</div><b className="mt-1 block">{value}</b></div>)}</div>
      </div>
      <div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200/60"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-400">知识库目录</span>{pages.length > 10 && <button onClick={onViewAll} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-blue-600">查看全部</button>}</div>{pages.slice(0, 10).map((item) => <button key={item.id} onClick={() => onSelect(item.id)} className={`mb-2 flex w-full items-center gap-3 overflow-hidden rounded-2xl p-2 text-left transition ${item.id === page.id ? "bg-blue-600 text-white" : "bg-slate-50 hover:bg-blue-50"}`}><img src={item.imageUrl ?? knowledgeThumbnails[item.id % knowledgeThumbnails.length]} alt="" className="h-12 w-14 shrink-0 rounded-xl object-cover" /><span className="min-w-0"><span className="block truncate font-bold">{item.title}</span><span className="text-xs opacity-70">{item.category} · v{item.revision}</span></span></button>)}</div>
      <div className="rounded-[1.75rem] bg-white p-5 shadow-xl"><h3 className="text-lg font-black">加入我的清单</h3><select value={collection?.status ?? ""} onChange={(e) => e.target.value && onCollection(page.id, e.target.value as CollectionStatus, targetPrice)} className="mt-3 w-full rounded-xl px-3 py-2"><option value="">选择清单</option><option value="wishlist">想买清单</option><option value="planned">想做清单</option><option value="completed">已做清单</option><option value="abandoned">弃坑清单</option></select><input value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} onBlur={() => collection && onCollection(page.id, collection.status, targetPrice)} placeholder="预期入手价格" className="mt-2 w-full rounded-xl px-3 py-2" /></div>
    </aside>}
    <article className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><div className="mb-2 flex flex-wrap gap-2">{page.tags.map((tag) => <button key={tag} onClick={() => onTagSearch(tag)} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100">#{tag}</button>)}</div><h1 className="text-3xl font-black">{page.title}</h1><p className="mt-3 max-w-3xl text-slate-600">{page.summary}</p><div className="mt-3 text-sm text-slate-400">v{page.revision} · {page.updatedAt} 更新 · {page.views.toLocaleString()}浏览 · {page.likes}赞</div></div><div className="flex flex-wrap gap-2"><button onClick={() => window.print()} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold">打印模式</button><button onClick={() => setWorkbench(!workbench)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">{workbench ? "退出工作台" : "工作台模式"}</button><button onClick={() => setCompare(!compare)} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold">版本历史</button><button disabled={!canEdit} onClick={() => setEditing(!editing)} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300">{canEdit ? "编辑条目" : "访客只读"}</button></div></div>
      {editing ? <div className="grid gap-5 xl:grid-cols-2"><div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-bold text-slate-500">Wiki语法编辑</label><span className="text-xs text-green-600">{draftSavedAt ? `${draftSavedAt} 已自动保存草稿` : "草稿将在编辑时自动保存"}</span></div><textarea value={content} onChange={(e) => setContent(e.target.value)} className="h-[460px] w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm outline-none focus:border-blue-300" /><input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="编辑摘要，5-200字符" className="mt-3 w-full rounded-2xl px-4 py-3" /><input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="自定义标签，用逗号分隔" className="mt-3 w-full rounded-2xl px-4 py-3" /><label className="mt-3 block"><span className="text-sm font-bold text-slate-500">条目图片</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-2xl border border-dashed p-4" /></label><button onClick={submitEdit} disabled={uploading || summary.length < 5} className="mt-3 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white disabled:bg-slate-300">{uploading ? "上传中…" : "预览确认并提交审核"}</button></div><Preview content={content} /></div> : compare ? <RevisionView revisions={revisions} /> : <div className="space-y-6">
        <div className="rounded-3xl bg-slate-50 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-bold tracking-[.2em] text-blue-600">TUTORIAL PROGRESS</div><h2 className="mt-1 text-xl font-black">制作步骤 · {completedSteps}/{steps.length}</h2></div><button onClick={() => setCompactSteps(!compactSteps)} className="rounded-xl bg-white px-3 py-2 text-xs font-bold">{compactSteps ? "图文模式" : "紧凑模式"}</button></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white"><div className="h-full bg-blue-600 transition-all" style={{ width: `${completedSteps / steps.length * 100}%` }} /></div><div className={`mt-5 grid gap-3 ${compactSteps ? "sm:grid-cols-2" : ""}`}>{steps.map((step, index) => { const done = tutorialProgress[`${page.id}-${index}`]; return <button key={`${step}-${index}`} onClick={() => onToggleStep(page.id, index)} className={`flex gap-4 rounded-2xl border p-4 text-left ${done ? "border-green-300 bg-green-50" : "border-slate-100 bg-white"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-black ${done ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}>{done ? "✓" : index + 1}</span><span><b className="block">{step}</b><span className="mt-1 block text-xs text-slate-400">预计 {8 + index * 3} 分钟 · {index > 2 ? "进阶" : "基础"}</span></span></button>; })}</div></div>
        <Preview content={page.content} />
        <div className="rounded-3xl bg-slate-50 p-5"><div className="text-xs font-bold tracking-[.2em] text-blue-600">COLOR RECIPE</div><h2 className="mt-1 text-xl font-black">配色方案</h2><div className="mt-4 grid gap-3 sm:grid-cols-4">{[["#E9E7DF","钛白","郡士 H1"],["#174A9B","高达蓝","田宫 X-4"],["#B62930","高达红","郡士 H3"],["#D4A82E","机体黄","田宫 X-8"]].map(([color,name,code]) => <div key={name} className="rounded-2xl bg-white p-3"><div className="h-16 rounded-xl border" style={{ background: color }} /><b className="mt-2 block">{name}</b><span className="text-xs text-slate-400">{code} · {color}</span></div>)}</div></div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 p-5"><div><b>这篇内容对你有帮助吗？</b><p className="mt-1 text-sm text-slate-400">92% 的玩家认为该条目有帮助</p></div><div className="flex gap-2"><button onClick={() => onVoteUseful(page.id, "useful")} className={`rounded-xl px-4 py-2 font-bold ${usefulVote === "useful" ? "bg-green-600 text-white" : "bg-green-50 text-green-700"}`}>有用</button><button onClick={() => onVoteUseful(page.id, "not-useful")} className={`rounded-xl px-4 py-2 font-bold ${usefulVote === "not-useful" ? "bg-red-600 text-white" : "bg-slate-100"}`}>需要改进</button></div></div>
      </div>}
    </article>
  </section>;
}

function Preview({ content }: { content: string }) {
  return <div className="prose-view rounded-3xl bg-slate-50 p-6" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />;
}

function RevisionView({ revisions }: { revisions: Revision[] }) {
  return <div className="space-y-3">{revisions.map((rev) => <div key={rev.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap justify-between gap-2"><b>版本 v{rev.revision}</b><span className={`rounded-full px-3 py-1 text-xs font-bold ${rev.status === "approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{rev.status === "approved" ? "已通过" : "待审核"}</span></div><div className="mt-2 text-sm text-slate-500">{rev.editor} · {rev.createdAt} · {rev.summary}</div><div className="mt-3 rounded-2xl bg-white p-3 text-sm text-slate-600">{rev.content.slice(0, 220)}...</div></div>)}</div>;
}

function SearchSection({ query, setQuery, results, hotTerms, submitSearch, openWiki, openWork, openTool, openPost, filtersOpen, setFiltersOpen, selectedTag, setSelectedTag, searchScope, setSearchScope, allTags, advancedFilters, setAdvancedFilters }: { query: string; setQuery: (q: string) => void; results: { type: string; scope: SearchScope; title: string; desc: string; id: number; tags: string[]; imageUrl?: string }[]; hotTerms: string[]; submitSearch: () => void; openWiki: (id: number) => void; openWork: (id: number) => void; openTool: (id: number) => void; openPost: (id: number) => void; filtersOpen: boolean; setFiltersOpen: (open: boolean) => void; selectedTag: string; setSelectedTag: (tag: string) => void; searchScope: SearchScope; setSearchScope: (scope: SearchScope) => void; allTags: string[]; advancedFilters: AdvancedFilters; setAdvancedFilters: (filters: AdvancedFilters) => void }) {
  function openResult(item: { scope: SearchScope; id: number }) {
    if (item.scope === "wiki") openWiki(item.id);
    if (item.scope === "works") openWork(item.id);
    if (item.scope === "tools") openTool(item.id);
    if (item.scope === "forum") openPost(item.id);
  }
  return <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">全文搜索</h1><p className="mt-1 text-sm text-slate-500">跨知识库、作品、工具与讨论版面查找内容</p></div>{(selectedTag || searchScope !== "all") && <button onClick={() => { setSelectedTag(""); setSearchScope("all"); }} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">清除全部筛选</button>}</div>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitSearch()} placeholder="输入关键词" className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-300" /><button onClick={() => setFiltersOpen(!filtersOpen)} className={`rounded-2xl px-5 py-3 font-bold ${filtersOpen || selectedTag || searchScope !== "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>筛选</button><button onClick={() => submitSearch()} className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">搜索</button></div>
    <SearchFilters open={filtersOpen} selectedTag={selectedTag} setSelectedTag={setSelectedTag} searchScope={searchScope} setSearchScope={setSearchScope} allTags={allTags} advancedFilters={advancedFilters} setAdvancedFilters={setAdvancedFilters} />
    <div className="mt-3 flex flex-wrap gap-2">{hotTerms.map((term) => <button key={term} onClick={() => setQuery(term)} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{term}</button>)}</div>
    {(selectedTag || searchScope !== "all") && <div className="mt-5 flex flex-wrap gap-2 text-sm"><span className="text-slate-400">当前条件</span>{searchScope !== "all" && <span className="rounded-full bg-slate-900 px-3 py-1 text-white">版面：{{ wiki: "知识库", works: "作品", tools: "工具", forum: "讨论", all: "全部" }[searchScope]}</span>}{selectedTag && <span className="rounded-full bg-blue-600 px-3 py-1 text-white">标签：#{selectedTag}</span>}</div>}
    <div className="mt-6 space-y-3">{results.length ? results.map((item) => <article key={`${item.type}-${item.id}`} className="grid overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-blue-50 sm:grid-cols-[180px_1fr]"><button onClick={() => openResult(item)} className="block min-h-36 w-full text-left">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full min-h-36 w-full object-cover" /> : <div className="grid h-full min-h-36 place-items-center bg-gradient-to-br from-blue-950 via-blue-700 to-cyan-400 p-4 text-center text-xs font-black tracking-[.18em] text-white">{item.type}<br />MODEL ARCHIVE</div>}</button><div className="p-5"><button onClick={() => openResult(item)} className="block w-full text-left"><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">{item.type}</span><div className="mt-3 text-xl font-black">{item.title}</div><div className="mt-2 text-slate-600">{item.desc}</div></button><div className="mt-3 flex flex-wrap gap-2">{item.tags.map((tag) => <button key={tag} onClick={() => { setSelectedTag(tag); setSearchScope("all"); setQuery(""); }} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">#{tag}</button>)}</div></div></article>) : <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">没有符合当前关键词和筛选条件的内容。</div>}</div>
  </section>;
}

function GallerySection({ works, setSection }: { works: Work[]; setSection: (s: Section) => void }) {
  return <section><div className="mb-5 flex items-center justify-between"><h1 className="text-3xl font-black">作品展示</h1><button onClick={() => setSection("publish")} className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white">发布作品</button></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{works.map((work) => <div key={work.id} className="overflow-hidden rounded-[1.75rem] bg-white shadow-xl shadow-slate-200/60"><div className={`h-52 bg-gradient-to-br ${work.color}`} /><div className="p-5"><div className="text-xl font-black">{work.title}</div><div className="mt-1 text-sm text-slate-500">{work.kit} · by {work.author}</div><p className="mt-3 text-slate-600">{work.desc}</p><div className="mt-4 flex flex-wrap gap-2">{work.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{tag}</span>)}</div><div className="mt-4 text-sm text-slate-400">♥ {work.likes} · 评论 {work.comments} · {work.createdAt}</div></div></div>)}</div></section>;
}

function PublishSection({ user, works, setWorks, setSection, setNotice }: { user: User; works: Work[]; setWorks: (w: Work[]) => void; setSection: (s: Section) => void; setNotice: (n: string) => void }) {
  const [title, setTitle] = useState("RG 元祖2.0 全喷涂改色");
  const [kit, setKit] = useState("RG 元祖高达 Ver.2.0");
  const [desc, setDesc] = useState("使用了郡士水性漆，主色为午夜蓝 + 钛白调配，追加少量银色干扫。");
  const [tags, setTags] = useState("全喷涂,改色,RG");
  const canPublish = user.role !== "guest";
  return <section className="grid gap-6 lg:grid-cols-[1fr_320px]"><div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60"><h1 className="text-3xl font-black">发布作品</h1><div className="mt-6 space-y-4"><Field label="作品标题 *" value={title} onChange={setTitle} /><Field label="使用套件" value={kit} onChange={setKit} /><div><label className="text-sm font-bold text-slate-500">图片上传 *</label><div className="mt-2 grid h-48 place-items-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50 text-center text-blue-700"><div><div className="text-4xl">＋</div><div className="font-bold">拖拽图片到此处，或点击选择</div><div className="text-sm">演示版会生成占位图，支持JPG/PNG规则已在表单提示中体现</div></div></div></div><div><label className="text-sm font-bold text-slate-500">作品描述</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-2 h-32 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-300" /></div></div></div><aside className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60"><h2 className="text-xl font-black">关联信息</h2><Field label="技法标签" value={tags} onChange={setTags} /><button disabled={!canPublish || title.length < 2} onClick={() => { setWorks([{ id: Date.now(), title, kit, desc, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), author: user.username, authorId: user.id, authorAvatar: user.avatarUrl, likes: 0, comments: 0, color: "from-blue-700 to-indigo-400", createdAt: new Date().toISOString().slice(5, 10) }, ...works]); setNotice("作品已发布到展示区，可以继续收集点赞和评论。 "); setSection("gallery"); }} className="mt-5 w-full rounded-2xl bg-blue-600 py-4 font-bold text-white disabled:bg-slate-300">{canPublish ? "发布作品" : "登录后发布"}</button></aside></section>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="block"><span className="text-sm font-bold text-slate-500">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-300" /></label>;
}

function CreatorButton({ username, avatarUrl, userId, onOpen }: { username: string; avatarUrl?: string; userId?: string; onOpen: (member: { id?: string; username: string; avatarUrl?: string }) => void }) {
  return <button onClick={() => onOpen({ id: userId, username, avatarUrl })} className="inline-flex items-center gap-2 rounded-full bg-slate-50 py-1.5 pl-1.5 pr-3 text-left transition hover:bg-blue-50"><span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-blue-600 text-sm font-black text-white">{avatarUrl ? <img src={avatarUrl} alt={`${username}的头像`} className="h-full w-full object-cover" /> : username.slice(0, 1).toUpperCase()}</span><span><b className="block text-sm text-slate-800">@{username}</b><span className="block text-[10px] text-slate-400">查看主页</span></span></button>;
}

function ForumSection({ posts, user, openPost, setSection, onTagSearch, onOpenMember }: { posts: Post[]; user: User; openPost: (id: number) => void; setSection: (section: Section) => void; onTagSearch: (tag: string) => void; onOpenMember: (member: { id?: string; username: string; avatarUrl?: string }) => void }) {
  const [board, setBoard] = useState(boards[1]);
  const visiblePosts = posts.filter((post) => post.board === board || post.pinned);
  return <section className="grid gap-6 lg:grid-cols-[280px_1fr]"><aside className="rounded-[1.75rem] bg-white p-5 shadow-xl"><div className="mb-5"><div className="text-xs font-bold tracking-[.2em] text-blue-600">COMMUNITY BOARD</div><h1 className="mt-1 text-2xl font-black">讨论版块</h1></div>{boards.map((item) => <button key={item} onClick={() => setBoard(item)} className={`mb-2 w-full rounded-2xl px-4 py-3 text-left font-bold ${board === item ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`}>{item}<span className="float-right text-xs opacity-60">{posts.filter((post) => post.board === item).length}</span></button>)}</aside><div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] bg-white p-5 shadow-xl"><div><div className="text-xs font-bold tracking-[.2em] text-blue-600">SELECTED BOARD</div><h2 className="mt-1 text-3xl font-black">{board}</h2></div><button onClick={() => setSection(user.role === "guest" ? "login" : "forum-publish")} className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">{user.role === "guest" ? "登录后发布" : "＋ 发布新帖"}</button></div>{visiblePosts.map((post) => <article key={post.id} className="overflow-hidden rounded-[1.75rem] bg-white shadow-xl transition hover:-translate-y-1">{post.imageUrl && <button onClick={() => openPost(post.id)} className="block w-full"><img src={post.imageUrl} alt={post.title} className="max-h-80 w-full object-cover" /></button>}<div className="p-5"><div className="flex items-center justify-between gap-3"><CreatorButton username={post.author} avatarUrl={post.authorAvatar} userId={post.authorId} onOpen={onOpenMember} /><span className="text-xs text-slate-400">{post.createdAt}</span></div><button onClick={() => openPost(post.id)} className="mt-4 block w-full text-left"><div className="flex flex-wrap gap-2">{post.pinned && <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">置顶</span>}{post.featured && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">精华</span>}<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{post.board}</span></div><h2 className="mt-3 text-xl font-black">{post.title}</h2><p className="mt-2 line-clamp-2 text-slate-600">{post.content}</p></button><div className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag) => <button key={tag} onClick={() => onTagSearch(tag)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">#{tag}</button>)}</div><div className="mt-4 text-sm text-slate-400">{post.replies} 回复 · {post.likes} 赞</div></div></article>)}</div></section>;
}

function ForumPublishSection({ posts, setPosts, user, setNotice, setSection, supabaseEnabled }: { posts: Post[]; setPosts: (posts: Post[]) => void; user: User; setNotice: (notice: string) => void; setSection: (section: Section) => void; supabaseEnabled: boolean }) {
  const [title, setTitle] = useState(""); const [topic, setTopic] = useState(""); const [content, setContent] = useState(""); const [board, setBoard] = useState(boards[1]); const [tagText, setTagText] = useState(""); const [file, setFile] = useState<File | null>(null); const [uploading, setUploading] = useState(false);
  const tags = Array.from(new Set(tagText.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean))).slice(0, 8);
  const canPublish = user.role !== "guest" && title.trim().length >= 5 && topic.trim().length >= 2 && content.trim().length >= 10;
  async function publish() {
    if (!canPublish) return; if (file && !file.type.match(/^image\/(jpeg|png|webp)$/)) return setNotice("帖子图片仅支持 JPG、PNG 或 WebP。"); if (file && file.size > 10 * 1024 * 1024) return setNotice("帖子图片不能超过 10MB。");
    setUploading(true); let imageUrl: string | undefined;
    if (file && supabaseEnabled) { const supabase = createSupabaseBrowserClient(); const ext = file.name.split(".").pop() ?? "jpg"; const path = `${user.id}/${crypto.randomUUID()}.${ext}`; const result = await supabase?.storage.from("post-images").upload(path, file); if (result?.error) { setUploading(false); setNotice(result.error.message); return; } imageUrl = supabase?.storage.from("post-images").getPublicUrl(path).data.publicUrl; }
    else if (file) imageUrl = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); });
    const nextPost: Post = { id: Date.now(), board, title: title.trim(), content: `【${topic.trim()}】
${content.trim()}`, tags, author: user.username, authorId: user.id, authorAvatar: user.avatarUrl, imageUrl, replies: 0, likes: 0, createdAt: new Date().toISOString().slice(5, 10) };
    setPosts([nextPost, ...posts]); setUploading(false); setNotice("帖子和图片已发布，其他玩家可以从作者信息进入你的主页。"); setSection("forum");
  }
  return <section className="mx-auto max-w-5xl space-y-5"><button onClick={() => setSection("forum")} className="font-bold text-blue-600">← 返回讨论区</button><div className="grid gap-6 lg:grid-cols-[1fr_300px]"><div className="rounded-[2rem] bg-white p-7 shadow-xl"><div className="text-xs font-bold tracking-[.22em] text-blue-600">CREATE DISCUSSION</div><h1 className="mt-2 text-4xl font-black">发布新帖</h1><div className="mt-7 space-y-5"><Field label="帖子标题 *" value={title} onChange={setTitle} /><Field label="内容主题 *" value={topic} onChange={setTopic} /><label className="block"><span className="text-sm font-bold text-slate-500">正文内容 *</span><textarea value={content} onChange={(event) => setContent(event.target.value)} className="mt-2 h-64 w-full rounded-2xl p-4" /><span className="mt-2 block text-right text-xs text-slate-400">{content.trim().length} 字</span></label><label className="block"><span className="text-sm font-bold text-slate-500">帖子图片（可选）</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-5 text-sm" /><span className="mt-2 block text-xs text-slate-400">JPG、PNG、WebP，最大 10MB</span></label></div></div><aside className="space-y-5"><div className="rounded-[1.75rem] bg-white p-5 shadow-xl"><h2 className="text-xl font-black">选择目标版块</h2><div className="mt-4 space-y-2">{boards.map((item) => <button key={item} onClick={() => setBoard(item)} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold ${board === item ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`}>{item}</button>)}</div></div><div className="rounded-[1.75rem] bg-white p-5 shadow-xl"><h2 className="text-xl font-black">自定义标签</h2><input value={tagText} onChange={(event) => setTagText(event.target.value)} className="mt-4 w-full rounded-xl px-3 py-3" /><div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">#{tag}</span>)}</div></div><button disabled={!canPublish || uploading} onClick={() => void publish()} className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white disabled:bg-slate-300">{uploading ? "图片上传中…" : `发布到「${board}」`}</button></aside></div></section>;
}

function CommunityDetail({ type, item, comments, liked, onBack, onLike, onComment, canModerate, onDeleteComment, onTagSearch, onOpenMember }: { type: "post" | "work"; item: Post | Work; comments: CommunityComment[]; liked: boolean; onBack: () => void; onLike: () => void; onComment: (content: string) => boolean; canModerate: boolean; onDeleteComment: (id: number) => void; onTagSearch?: (tag: string) => void; onOpenMember: (member: { id?: string; username: string; avatarUrl?: string }) => void }) {
  const [content, setContent] = useState("");
  const isWork = type === "work";
  const work = isWork ? item as Work & { imageUrl?: string } : null;
  const post = !isWork ? item as Post : null;
  return <section className="mx-auto max-w-4xl space-y-5"><button onClick={onBack} className="font-bold text-blue-600">← 返回{isWork ? "作品展示" : "讨论区"}</button><article className="overflow-hidden rounded-[2rem] bg-white shadow-xl">{work?.imageUrl ? <img src={work.imageUrl} alt={work.title} className="max-h-[520px] w-full object-cover" /> : work ? <div className={`h-72 bg-gradient-to-br ${work.color}`} /> : null}{post?.imageUrl && <img src={post.imageUrl} alt={post.title} className="max-h-[520px] w-full object-cover" />}<div className="p-7"><div className="flex flex-wrap items-center justify-between gap-3"><CreatorButton username={item.author} avatarUrl={work?.authorAvatar ?? post?.authorAvatar} userId={work?.authorId ?? post?.authorId} onOpen={onOpenMember} /><span className="text-sm font-bold text-blue-600">{work ? work.kit : post?.board}</span></div><h1 className="mt-3 text-4xl font-black">{item.title}</h1>{(work || post) && <div className="mt-4 flex flex-wrap gap-2">{((work?.tags ?? post?.tags) ?? []).map((tag) => <button key={tag} onClick={() => onTagSearch?.(tag)} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">#{tag}</button>)}</div>}<p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-slate-600">{work ? work.desc : post?.content}</p>{work && <div className="mt-7"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs text-slate-400">制作时长</span><b className="mt-1 block">约 26 小时</b></div><div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs text-slate-400">总花费</span><b className="mt-1 block">约 ¥680</b></div><div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs text-slate-400">完成阶段</span><b className="mt-1 block">6 / 6</b></div></div><h2 className="mt-7 text-xl font-black">制作过程时间线</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{["板件开箱","素组修整","渗线处理","水贴定位","消光保护","成品摄影"].map((stage,index) => <div key={stage} className="relative rounded-2xl border border-slate-100 bg-slate-50 p-4"><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">{index+1}</span><b className="mt-3 block">{stage}</b><span className="mt-1 block text-xs text-green-600">✓ 已完成</span></div>)}</div><h2 className="mt-7 text-xl font-black">玩家改色方案</h2><div className="mt-4 flex flex-wrap gap-3">{[["#172D55","午夜蓝","郡士 H54"],["#F0EEE6","钛白","田宫 X-2"],["#B8A06A","香槟金","盖亚 122"]].map(([hex,name,code]) => <div key={name} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><span className="h-10 w-10 rounded-xl border" style={{background:hex}} /><span><b className="block">{name}</b><span className="text-xs text-slate-400">{code}</span></span></div>)}</div></div>}<div className="mt-6 flex items-center gap-3"><button onClick={onLike} className={`rounded-2xl px-5 py-3 font-bold ${liked ? "bg-red-600 text-white" : "bg-slate-100"}`}>{liked ? "♥ 已点赞" : "♡ 点赞"} · {item.likes}</button><span className="text-sm text-slate-400">{comments.length} 条评论</span></div></div></article><CommentComposer content={content} setContent={setContent} onSubmit={() => { if (content.trim() && onComment(content.trim())) setContent(""); }} /><CommentList comments={comments} canModerate={canModerate} onDelete={onDeleteComment} /></section>;
}

function ToolsSection({ tools, user, setTools, setNotice, openTool, onTagSearch, ownedTools, setOwnedTools }: { tools: Tool[]; user: User; setTools: (tools: Tool[]) => void; setNotice: (notice: string) => void; openTool: (id: number) => void; onTagSearch: (tag: string) => void; ownedTools: number[]; setOwnedTools: (ids: number[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState(""); const [brand, setBrand] = useState(""); const [category, setCategory] = useState(""); const [price, setPrice] = useState(""); const [tagText, setTagText] = useState("");
  function addTool() { if (!name.trim()) return; setTools([{ id: Date.now(), name, brand, category, price, rating: 0, reviews: 0, specs: [], pros: [], tags: tagText.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean) }, ...tools]); setShowAdd(false); setName(""); setTagText(""); setNotice("工具条目已添加到评测库。"); }
  return <section><div className="mb-5 flex items-center justify-between"><h1 className="text-3xl font-black">工具评测库</h1>{user.role === "admin" && <button onClick={() => setShowAdd(!showAdd)} className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white">＋ 添加工具</button>}</div>{showAdd && <div className="mb-6 grid gap-3 rounded-[1.75rem] bg-white p-5 shadow-xl md:grid-cols-4"><Field label="工具名称" value={name} onChange={setName} /><Field label="品牌" value={brand} onChange={setBrand} /><Field label="分类" value={category} onChange={setCategory} /><Field label="参考价格" value={price} onChange={setPrice} /><div className="md:col-span-4"><Field label="自定义标签（使用逗号分隔）" value={tagText} onChange={setTagText} /></div><button onClick={addTool} className="rounded-2xl bg-blue-600 py-3 font-bold text-white md:col-span-4">保存工具条目</button></div>}<div className="grid gap-5 lg:grid-cols-3">{tools.map((tool) => <article key={tool.id} className="rounded-[1.75rem] bg-white p-5 text-left shadow-xl transition hover:-translate-y-1"><button onClick={() => openTool(tool.id)} className="block w-full text-left"><div className="text-sm font-bold text-blue-600">{tool.brand} · {tool.category}</div><div className="mt-2 flex items-start justify-between gap-2"><h2 className="text-2xl font-black">{tool.name}</h2>{ownedTools.includes(tool.id) && <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">工具箱已有</span>}</div><div className="mt-4 flex items-end gap-2"><span className="text-4xl font-black text-amber-500">{tool.rating}</span><span className="pb-1 text-sm text-slate-400">/ 5 · {tool.reviews}条评价</span></div><div className="mt-4 rounded-2xl bg-slate-50 p-4"><div className="font-bold">参考价格：{tool.price}</div><div className="mt-3 flex flex-wrap gap-2">{tool.specs.map((spec) => <span key={spec} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{spec}</span>)}</div></div><div className="mt-4 text-sm text-slate-600">优点：{tool.pros.join("、") || "等待用户评价"}</div></button><div className="mt-4 flex flex-wrap gap-2">{(tool.tags ?? []).map((tag) => <button key={tag} onClick={() => onTagSearch(tag)} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">#{tag}</button>)}</div><button onClick={() => setOwnedTools(ownedTools.includes(tool.id) ? ownedTools.filter((id) => id !== tool.id) : [...ownedTools, tool.id])} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">{ownedTools.includes(tool.id) ? "从我的工具箱移除" : "加入我的工具箱"}</button></article>)}</div></section>;
}

function ToolDetail({ tool, comments, onBack, onReview, canModerate, onDeleteComment, onTagSearch, owned, onToggleOwned }: { tool: Tool; comments: CommunityComment[]; onBack: () => void; onReview: (content: string, rating: number) => boolean; canModerate: boolean; onDeleteComment: (id: number) => void; onTagSearch: (tag: string) => void; owned: boolean; onToggleOwned: () => void }) {
  const [content, setContent] = useState(""); const [rating, setRating] = useState(5);
  return <section className="mx-auto max-w-4xl space-y-5"><button onClick={onBack} className="font-bold text-blue-600">← 返回工具评测库</button><article className="rounded-[2rem] bg-white p-8 shadow-xl"><div className="text-sm font-bold text-blue-600">{tool.brand} · {tool.category}</div><h1 className="mt-3 text-4xl font-black">{tool.name}</h1><div className="mt-4 flex flex-wrap gap-2">{(tool.tags ?? []).map((tag) => <button key={tag} onClick={() => onTagSearch(tag)} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">#{tag}</button>)}</div><div className="mt-5 flex flex-wrap items-center gap-3"><button onClick={onToggleOwned} className={`rounded-xl px-4 py-2 font-bold ${owned ? "bg-green-600 text-white" : "bg-slate-100"}`}>{owned ? "✓ 我的工具箱已有" : "＋ 加入我的工具箱"}</button><span className="text-sm text-slate-400">自动对比已有与待购工具</span></div><ToolRadar tool={tool} /><div className="mt-6 flex items-center gap-4"><span className="text-6xl font-black text-amber-500">{tool.rating}</span><div><div className="text-2xl text-amber-500">★★★★★</div><div className="text-sm text-slate-400">来自 {tool.reviews} 条用户评价</div></div></div><div className="mt-6 rounded-3xl bg-slate-50 p-5"><b>参考价格：{tool.price}</b><p className="mt-3 text-slate-600">规格：{tool.specs.join("、") || "暂无"}</p><p className="mt-2 text-slate-600">优点：{tool.pros.join("、") || "等待用户补充"}</p></div></article><div className="rounded-[1.75rem] bg-white p-5 shadow-xl"><h2 className="text-xl font-black">发表评价</h2><div className="my-4 flex gap-2">{[1,2,3,4,5].map((value) => <button key={value} onClick={() => setRating(value)} className={`text-3xl ${value <= rating ? "text-amber-500" : "text-slate-300"}`}>★</button>)}</div><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="分享你的实际使用体验" className="h-28 w-full rounded-2xl border p-4" /><button onClick={() => { if (content.trim() && onReview(content.trim(), rating)) setContent(""); }} className="mt-3 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">提交 {rating} 星评价</button></div><CommentList comments={comments} canModerate={canModerate} onDelete={onDeleteComment} /></section>;
}

function ToolRadar({ tool }: { tool: Tool }) {
  const values = [tool.rating, Math.min(5, 3.4 + tool.reviews / 120), tool.tags.includes("新手工具") ? 4.8 : 3.8, tool.tags.includes("进阶工具") ? 4.9 : 4.1, Math.min(5, 3.6 + tool.pros.length * .35)];
  const points = values.map((value, index) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / values.length; const radius = value / 5 * 72; return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`; }).join(" ");
  return <div className="mt-6 grid items-center gap-4 rounded-3xl bg-slate-50 p-5 sm:grid-cols-[220px_1fr]"><svg viewBox="0 0 200 200" className="mx-auto h-48 w-48">{[.25,.5,.75,1].map((scale) => <polygon key={scale} points={[0,1,2,3,4].map((_, index) => { const angle = -Math.PI/2 + index*Math.PI*2/5; return `${100+Math.cos(angle)*72*scale},${100+Math.sin(angle)*72*scale}`; }).join(" ")} fill="none" stroke="currentColor" className="text-slate-300" />)}<polygon points={points} fill="rgba(37,99,235,.28)" stroke="#2563eb" strokeWidth="3" /></svg><div><div className="text-xs font-bold tracking-[.2em] text-blue-600">TOOL COMPARISON</div><h3 className="mt-1 text-xl font-black">五维工具评分</h3><div className="mt-4 grid grid-cols-2 gap-2 text-sm">{["性价比","耐用度","易用性","精度","手感"].map((label,index) => <div key={label} className="flex justify-between rounded-xl bg-white px-3 py-2"><span>{label}</span><b className={values[index] >= 4.5 ? "text-green-600" : values[index] < 4 ? "text-red-500" : ""}>{values[index].toFixed(1)}</b></div>)}</div></div></div>;
}

function CommentComposer({ content, setContent, onSubmit }: { content: string; setContent: (content: string) => void; onSubmit: () => void }) {
  return <div className="rounded-[1.75rem] bg-white p-5 shadow-xl"><h2 className="text-xl font-black">发表评论</h2><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="写下你的看法…" className="mt-4 h-28 w-full rounded-2xl border p-4" /><button disabled={!content.trim()} onClick={onSubmit} className="mt-3 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white disabled:bg-slate-300">发布评论</button></div>;
}

function CommentList({ comments, canModerate = false, onDelete }: { comments: CommunityComment[]; canModerate?: boolean; onDelete?: (id: number) => void }) {
  return <div className="space-y-3">{comments.length ? comments.map((comment) => <div key={comment.id} className="rounded-[1.5rem] bg-white p-5 shadow-xl"><div className="flex items-center justify-between gap-3"><b>@{comment.author}</b><div className="flex items-center gap-3"><span className="text-xs text-slate-400">{comment.createdAt}</span>{canModerate && <button onClick={() => onDelete?.(comment.id)} className="rounded-xl bg-red-600 px-3 py-1 text-xs font-bold text-white">删除评论</button>}</div></div>{comment.rating && <div className="mt-2 text-amber-500">{"★".repeat(comment.rating)}{"☆".repeat(5-comment.rating)}</div>}<p className="mt-3 text-slate-600">{comment.content}</p></div>) : <div className="rounded-2xl bg-white p-6 text-center text-slate-400">还没有评论，来发表第一条吧。</div>}</div>;
}

function AdminSection({ user, wiki, setWiki, revisions, setRevisions, works, posts, tools, comments, managedUsers, pendingCount, setNotice, onDeleteEntry, onDeleteComment, onUpdateUser, onDeleteUser }: { user: User; wiki: WikiPage[]; setWiki: (w: WikiPage[]) => void; revisions: Revision[]; setRevisions: (r: Revision[]) => void; works: Work[]; posts: Post[]; tools: Tool[]; comments: CommunityComment[]; managedUsers: ManagedUser[]; pendingCount: number; setNotice: (n: string) => void; onDeleteEntry: (type: "wiki" | "work" | "post" | "tool", id: number) => void; onDeleteComment: (id: number) => void; onUpdateUser: (id: string, role: "user" | "admin", status: "active" | "suspended") => Promise<void>; onDeleteUser: (id: string) => Promise<void> }) {
  if (user.role !== "admin" && user.role !== "editor") return <div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><h1 className="text-2xl font-black">需要编辑者或管理员权限</h1><p className="mt-2 text-slate-500">请使用已授权的管理员账号登录。</p></div>;
  const pendingRevisions = revisions.filter((revision) => revision.status === "pending");
  const pendingPages = wiki.filter((page) => page.status === "pending");
  const groups = [
    { label: "知识库", type: "wiki" as const, items: wiki.map((item) => ({ id: item.id, title: item.title })) },
    { label: "作品", type: "work" as const, items: works.map((item) => ({ id: item.id, title: item.title })) },
    { label: "帖子", type: "post" as const, items: posts.map((item) => ({ id: item.id, title: item.title })) },
    { label: "工具", type: "tool" as const, items: tools.map((item) => ({ id: item.id, title: item.name })) },
  ];
  return <section className="space-y-5">
    <div className="grid gap-4 md:grid-cols-4">{[["待审核", pendingCount], ["Wiki条目", wiki.length], ["社区评论", comments.length], ["管理身份", user.role === "admin" ? "管理员" : "编辑者"]].map(([key, value]) => <div key={key} className="rounded-3xl bg-white p-5 shadow-xl"><div className="text-sm font-bold text-slate-400">{key}</div><div className="mt-2 text-3xl font-black text-blue-600">{value}</div></div>)}</div>
    <Panel title="内容审核队列"><div className="space-y-3">{pendingPages.map((page) => <div key={page.id} className="rounded-2xl bg-amber-50 p-4"><b>{page.title}</b><div className="mt-2 text-sm text-slate-600">普通用户编辑待审核。</div><button onClick={() => { setWiki(wiki.map((item) => item.id === page.id ? { ...item, status: "published" } : item)); setNotice("条目审核已通过。") }} className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white">通过</button></div>)}{pendingRevisions.map((revision) => <div key={revision.id} className="rounded-2xl bg-slate-50 p-4"><b>版本 v{revision.revision}</b><div className="mt-1 text-sm text-slate-500">{revision.editor} · {revision.summary}</div><button onClick={() => { setRevisions(revisions.map((item) => item.id === revision.id ? { ...item, status: "approved" } : item)); setWiki(wiki.map((page) => page.id === revision.pageId ? { ...page, content: revision.content, imageUrl: revision.imageUrl ?? page.imageUrl, revision: revision.revision, status: "published", updatedAt: new Date().toISOString().slice(0, 10) } : page)); setNotice("编辑版本已通过并发布。") }} className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white">通过并发布</button></div>)}{pendingCount === 0 && <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">当前没有待审核内容。</div>}</div></Panel>
    {user.role === "admin" && <>
      <Panel title="用户管理"><div className="space-y-3">{managedUsers.map((managedUser) => <div key={managedUser.id} className="grid gap-3 rounded-2xl bg-slate-50 p-4 lg:grid-cols-[1fr_180px_180px_auto]"><div><div className="font-black">@{managedUser.username}</div><div className="mt-1 text-sm text-slate-500">{managedUser.email} · 积分 {managedUser.contribution_score}</div></div><select disabled={managedUser.id === user.id} value={managedUser.role} onChange={(event) => onUpdateUser(managedUser.id, event.target.value as "user" | "admin", managedUser.account_status)} className="rounded-xl border px-3 py-2"><option value="user">普通用户</option><option value="admin">管理员</option></select><select disabled={managedUser.id === user.id} value={managedUser.account_status} onChange={(event) => onUpdateUser(managedUser.id, managedUser.role, event.target.value as "active" | "suspended")} className="rounded-xl border px-3 py-2"><option value="active">正常</option><option value="suspended">已停用</option></select><button disabled={managedUser.id === user.id} onClick={() => onDeleteUser(managedUser.id)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300">删除账号</button></div>)}{managedUsers.length === 0 && <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-400">暂无可管理用户，请重新登录管理员账号刷新列表。</div>}</div></Panel>
      <Panel title="条目删除管理"><div className="grid gap-4 lg:grid-cols-2">{groups.map((group) => <div key={group.type} className="rounded-2xl bg-slate-50 p-4"><h3 className="mb-3 text-lg font-black">{group.label}</h3><div className="max-h-72 space-y-2 overflow-auto">{group.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"><span className="truncate font-bold">{item.title}</span><button onClick={() => onDeleteEntry(group.type, item.id)} className="shrink-0 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">删除</button></div>)}</div></div>)}</div></Panel>
      <Panel title="评论管理"><div className="max-h-[520px] space-y-3 overflow-auto">{comments.map((comment) => <div key={comment.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><b>@{comment.author} · {comment.targetType} #{comment.targetId}</b><button onClick={() => onDeleteComment(comment.id)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">删除评论</button></div><p className="mt-2 text-sm text-slate-600">{comment.content}</p></div>)}{comments.length === 0 && <div className="p-5 text-center text-slate-400">暂无评论。</div>}</div></Panel>
    </>}
  </section>;
}

function CollectionsSection({ collections, wiki, onOpen, onUpdate, onRemove }: { collections: CollectionItem[]; wiki: WikiPage[]; onOpen: (id: number) => void; onUpdate: (pageId: number, status: CollectionStatus, targetPrice?: string) => void; onRemove: (pageId: number) => void }) {
  const groups: { status: CollectionStatus; title: string; desc: string }[] = [{ status: "wishlist", title: "想买", desc: "关注价格与再贩" }, { status: "planned", title: "计划制作", desc: "已经入手，等待开工" }, { status: "completed", title: "已完成", desc: "记录完成的模型" }, { status: "abandoned", title: "已搁置", desc: "暂停或放弃的项目" }];
  const totalValue = collections.reduce((sum, item) => sum + Number((item.targetPrice ?? "").replace(/[^0-9.]/g, "") || 0), 0);
  return <section className="space-y-6"><div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-8 text-white shadow-xl"><div className="text-xs font-bold tracking-[.24em] text-blue-100">PERSONAL MODEL BACKLOG</div><h1 className="mt-3 text-4xl font-black text-white">我的模型清单</h1><p className="mt-3 max-w-2xl text-blue-100">从知识库条目加入模型，管理购买愿望、制作计划与完成记录。</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{groups.map((group) => <div key={group.status} className="rounded-2xl bg-white/10 p-4"><div className="text-xs text-blue-100">{group.title}</div><div className="mt-1 text-3xl font-black text-white">{collections.filter((item) => item.status === group.status).length}</div></div>)}<div className="rounded-2xl bg-white/10 p-4"><div className="text-xs text-blue-100">目标预算</div><div className="mt-1 text-2xl font-black text-white">¥{totalValue.toFixed(0)}</div></div></div></div><div className="grid gap-5 xl:grid-cols-2">{groups.map((group) => { const items = collections.filter((item) => item.status === group.status); return <article key={group.status} className="rounded-[1.75rem] bg-white p-5 shadow-xl"><div><h2 className="text-xl font-black">{group.title}</h2><p className="mt-1 text-sm text-slate-400">{group.desc}</p></div><div className="mt-4 space-y-3">{items.map((item) => { const page = wiki.find((entry) => entry.id === item.pageId); if (!page) return null; return <div key={item.pageId} className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl bg-slate-50 p-3"><button onClick={() => onOpen(page.id)}><img src={page.imageUrl ?? knowledgeThumbnails[page.id % knowledgeThumbnails.length]} alt={page.title} className="h-20 w-[72px] rounded-xl object-cover" /></button><div className="min-w-0"><button onClick={() => onOpen(page.id)} className="block w-full text-left"><b className="block truncate">{page.title}</b><span className="mt-1 block text-xs text-slate-400">{page.grade ?? page.category} · {page.scale ?? "比例未标注"}</span></button>{item.targetPrice && <div className="mt-2 text-xs font-bold text-green-600">目标价：{item.targetPrice}</div>}<div className="mt-3 flex gap-2"><select value={item.status} onChange={(event) => onUpdate(page.id, event.target.value as CollectionStatus, item.targetPrice)} className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-xs">{groups.map((option) => <option key={option.status} value={option.status}>{option.title}</option>)}</select><button onClick={() => onRemove(page.id)} className="rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-bold">移除</button></div></div></div>; })}{items.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-400">暂无模型，可从知识库详情页加入</div>}</div></article>; })}</div></section>;
}

function SeriesSection() {
  const series = [
    { year: "1979", title: "机动战士高达", era: "宇宙世纪 0079", lead: "RX-78-2 高达", desc: "高达系列原点。少年阿姆罗被卷入一年战争，并驾驶联邦军新型机动战士迎战吉翁。", href: "https://gundam-official.cn/series/mobile-suit-gundam" },
    { year: "1985", title: "机动战士Z高达", era: "宇宙世纪 0087", lead: "Z高达", desc: "围绕奥古、泰坦斯与阿克西斯的冲突展开，以更复杂的阵营关系延续宇宙世纪历史。", href: "https://gundam-official.cn/series/z-gundam" },
    { year: "1988", title: "机动战士高达 逆袭的夏亚", era: "宇宙世纪 0093", lead: "ν高达", desc: "阿姆罗与夏亚宿命对决的电影篇章，以阻止阿克西斯坠落地球为故事核心。", href: "https://gundam-official.cn/series/char-s-counterattack" },
    { year: "1995", title: "新机动战记高达W", era: "后殖民纪元", lead: "飞翼高达", desc: "五名少年驾驶高达降落地球，对抗掌控殖民卫星与地球圈的军事势力。", href: "https://gundam-official.cn/series/wing" },
    { year: "2002", title: "机动战士高达SEED", era: "宇宙纪元 71", lead: "强袭高达", desc: "自然人与调整者的战争席卷殖民卫星，基拉与阿斯兰在不同阵营中面对友情与立场。", href: "https://gundam-official.cn/series/seed" },
    { year: "2007", title: "机动战士高达00", era: "西历 2307", lead: "能天使高达", desc: "私设武装组织天人以高达介入全球战争，试图通过武力根绝纷争。", href: "https://gundam-official.cn/series/00" },
    { year: "2010", title: "机动战士高达UC", era: "宇宙世纪 0096", lead: "独角兽高达", desc: "少年巴纳吉与神秘少女奥黛丽被卷入拉普拉斯之盒的争夺，揭开联邦建立之初的秘密。", href: "https://gundam-official.cn/series/unicorn" },
    { year: "2015", title: "机动战士高达 铁血的奥尔芬斯", era: "灾后纪元 323", lead: "高达·巴巴托斯", desc: "火星少年组成铁华团，为争取生存与独立踏上护送古荻莉亚前往地球的旅程。", href: "https://gundam-official.cn/series/iron-blooded-orphans" },
    { year: "2022", title: "机动战士高达 水星的魔女", era: "星元 122", lead: "风灵高达", desc: "来自水星的少女斯莱塔进入阿斯提卡西亚高等专门学园，在决斗制度下展开校园与企业战争。", href: "https://gundam-official.cn/series/witch-from-mercury" },
    { year: "2025", title: "机动战士Gundam GQuuuuuuX", era: "另一种宇宙世纪", lead: "GQuuuuuuX", desc: "少女天手让叶因地下机动战士决斗进入未知世界，邂逅神秘高达与少年修司。", href: "https://gundam-official.cn/series/gquuuuuux" },
  ];
  return <section className="space-y-6"><div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-8 text-white shadow-xl"><div className="text-xs font-bold tracking-[.25em] text-blue-100">GUNDAM SERIES ARCHIVE / 1979—2025</div><h1 className="mt-3 text-4xl font-black text-white">高达系列作品</h1><p className="mt-3 max-w-3xl text-blue-100">依据高达中国官方网站的系列资料整理，从宇宙世纪原点到新世代独立世界观，快速认识十部代表作品。</p></div><div className="grid gap-5 md:grid-cols-2">{series.map((item, index) => <article key={item.title} className="overflow-hidden rounded-[1.75rem] bg-white shadow-xl"><div className="grid min-h-52 grid-cols-[96px_1fr]"><div className="flex flex-col items-center justify-between bg-slate-900 p-4 text-white"><span className="font-mono text-xs tracking-widest">NO.{String(index + 1).padStart(2, "0")}</span><strong className="-rotate-90 whitespace-nowrap text-2xl font-black">{item.year}</strong><span className="h-2 w-2 rounded-full bg-white" /></div><div className="p-6"><div className="text-xs font-bold tracking-[.18em] text-blue-600">{item.era}</div><h2 className="mt-2 text-2xl font-black">{item.title}</h2><div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">主角机体 · {item.lead}</div><p className="mt-4 text-sm leading-7 text-slate-600">{item.desc}</p><a href={item.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600">查看官网系列资料 <span aria-hidden="true">↗</span></a></div></div></article>)}</div></section>;
}

function JpyRateWidget() {
  const [rate, setRate] = useState(0.042001);
  const [jpy, setJpy] = useState(3500);
  const [source, setSource] = useState("汇率读取中");
  const [loading, setLoading] = useState(true);
  async function refreshRate() {
    setLoading(true);
    try { const response = await fetch("/api/jpy-rate", { cache: "no-store" }); const data = await response.json(); setRate(Number(data.rate) || 0.042001); setSource(data.source ?? "实时汇率网"); }
    catch { setSource("缓存参考汇率"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refreshRate(); const timer = window.setInterval(refreshRate, 5 * 60 * 1000); return () => window.clearInterval(timer); }, []);
  return <div className="rounded-[1.75rem] bg-white p-5 shadow-xl"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-black tracking-[.18em] text-blue-600">JPY → CNY LIVE RATE</div><h2 className="mt-1 text-xl font-black">日元售价换算</h2></div><button onClick={refreshRate} disabled={loading} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold">{loading ? "更新中…" : "刷新汇率"}</button></div><div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]"><label><span className="text-xs font-bold text-slate-400">日元 JPY</span><input type="number" min="0" value={jpy} onChange={(event) => setJpy(Number(event.target.value))} className="mt-2 w-full rounded-xl px-4 py-3 text-lg font-black" /></label><span className="pb-3 text-center text-xl font-black">≈</span><div><span className="text-xs font-bold text-slate-400">人民币 CNY</span><div className="mt-2 rounded-xl bg-slate-900 px-4 py-3 text-lg font-black text-white">¥ {(jpy * rate).toFixed(2)}</div></div></div><div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-400"><span>1 日元 ≈ {rate.toFixed(6)} 人民币</span><span>来源：{source} · 每 5 分钟更新</span></div></div>;
}


function ReleaseCalendarSection({ releases }: { releases: ReleaseItem[] }) {
  const [followed, setFollowed] = useState<string[]>([]);
  const months = Array.from(new Set(releases.map((item) => item.date.slice(0, 7))));
  return <section className="space-y-6"><div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-8 text-white shadow-xl"><div className="text-xs font-bold tracking-[.25em] text-blue-100">RELEASE TRACKER / 2026</div><h1 className="mt-3 text-4xl font-black text-white">新套件发售日历</h1><p className="mt-3 max-w-2xl text-blue-100">追踪情报流出、官方确认、封绘公开、发售与再贩状态，关注系列后可快速查看相关更新。</p><div className="mt-5 flex flex-wrap gap-2">{["HG","RG","MG","MGEX","PG"].map((grade) => <button key={grade} onClick={() => setFollowed((list) => list.includes(grade) ? list.filter((item) => item !== grade) : [...list, grade])} className={`rounded-full px-4 py-2 text-sm font-bold ${followed.includes(grade) ? "bg-white text-slate-900" : "bg-white/10 text-white"}`}>{followed.includes(grade) ? "✓ " : "+ "}关注 {grade}</button>)}</div></div><JpyRateWidget />{months.map((month) => <div key={month} className="rounded-[1.75rem] bg-white p-6 shadow-xl"><h2 className="text-2xl font-black">{month.replace("-", " 年 ")} 月</h2><div className="mt-5 grid gap-3">{releases.filter((item) => item.date.startsWith(month) && (!followed.length || followed.includes(item.grade))).map((item) => <div key={item.id} className="grid items-center gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[80px_1fr_auto]"><div className="text-center"><div className="text-2xl font-black text-blue-600">{item.date.slice(8)}</div><div className="text-xs text-slate-400">JUL</div></div><div><div className="text-xs font-bold text-blue-600">{item.grade}</div><h3 className="text-lg font-black">{item.name}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "发售中" ? "bg-green-50 text-green-700" : item.status === "再贩" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{item.status}</span></div>)}</div></div>)}</section>;
}

function PublicProfileSection({ member, works, posts, openWork, openPost }: { member: { id?: string; username: string; avatarUrl?: string }; works: Work[]; posts: Post[]; openWork: (id: number) => void; openPost: (id: number) => void }) {
  const memberWorks = works.filter((item) => member.id ? item.authorId === member.id : item.author === member.username);
  const memberPosts = posts.filter((item) => member.id ? item.authorId === member.id : item.author === member.username);
  return <section className="space-y-6"><div className="rounded-[2rem] bg-white p-8 shadow-xl"><div className="flex items-center gap-5"><span className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-blue-600 text-4xl font-black text-white">{member.avatarUrl ? <img src={member.avatarUrl} alt={`${member.username}的头像`} className="h-full w-full object-cover" /> : member.username.slice(0,1).toUpperCase()}</span><div><div className="text-xs font-bold tracking-[.2em] text-blue-600">PLAYER PROFILE</div><h1 className="mt-2 text-3xl font-black">@{member.username}</h1><p className="mt-2 text-slate-500">模型玩家公开主页 · {memberWorks.length} 个作品 · {memberPosts.length} 个讨论</p></div></div></div><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-[1.75rem] bg-white p-6 shadow-xl"><h2 className="text-2xl font-black">发布的作品</h2><div className="mt-4 space-y-3">{memberWorks.map((item) => <button key={item.id} onClick={() => openWork(item.id)} className="block w-full rounded-2xl bg-slate-50 p-4 text-left"><b>{item.title}</b><span className="mt-1 block text-sm text-slate-400">{item.kit}</span></button>)}{!memberWorks.length && <p className="text-sm text-slate-400">暂未发布作品</p>}</div></div><div className="rounded-[1.75rem] bg-white p-6 shadow-xl"><h2 className="text-2xl font-black">发起的讨论</h2><div className="mt-4 space-y-3">{memberPosts.map((item) => <button key={item.id} onClick={() => openPost(item.id)} className="block w-full rounded-2xl bg-slate-50 p-4 text-left"><b>{item.title}</b><span className="mt-1 block text-sm text-slate-400">{item.board} · {item.createdAt}</span></button>)}{!memberPosts.length && <p className="text-sm text-slate-400">暂未发起讨论</p>}</div></div></div></section>;
}

function ProfileSection({ user, wiki, works, posts, onChangeUsername, onChangeAvatar }: { user: User; wiki: WikiPage[]; works: Work[]; posts: Post[]; onChangeUsername: (username: string) => Promise<boolean>; onChangeAvatar: (file: File) => Promise<boolean> }) {
  const [username, setUsername] = useState(user.username);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [preview, setPreview] = useState(user.avatarUrl ?? "");
  useEffect(() => { setUsername(user.username); setPreview(user.avatarUrl ?? ""); }, [user.username, user.avatarUrl]);
  async function save() { setSaving(true); await onChangeUsername(username); setSaving(false); }
  async function uploadAvatar(file?: File) { if (!file) return; const localPreview = URL.createObjectURL(file); setPreview(localPreview); setUploadingAvatar(true); const success = await onChangeAvatar(file); setUploadingAvatar(false); URL.revokeObjectURL(localPreview); if (!success) setPreview(user.avatarUrl ?? ""); }
  const avatar = preview || user.avatarUrl;
  return <section className="space-y-6"><div className="rounded-[2rem] bg-white p-8 shadow-xl"><div className="flex flex-col gap-5 md:flex-row md:items-center"><div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-blue-600">{avatar ? <img src={avatar} alt={`${user.username}的头像`} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-4xl font-black text-white">{user.nickname[0]}</div>}</div><div className="flex-1"><h1 className="text-3xl font-black">@{user.username}</h1><p className="mt-2 text-slate-500">{roleText[user.role]} · 贡献积分 {user.score}</p><div className="mt-3 flex flex-wrap gap-2">{["初入模界", "创始贡献者", "社交新星"].map((badge) => <span key={badge} className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">{badge}</span>)}</div></div>{user.role !== "guest" && <label className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold"><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingAvatar} onChange={(event) => void uploadAvatar(event.target.files?.[0])} className="hidden" />{uploadingAvatar ? "头像上传中…" : "上传自定义头像"}<span className="mt-1 block text-xs font-normal text-slate-400">JPG、PNG、WebP，最大 5MB</span></label>}</div><div className="mt-8 grid gap-4 md:grid-cols-3">{[["参与条目", wiki.length], ["发布作品", works.filter((work) => work.author === user.username).length], ["发起讨论", posts.filter((post) => post.author === user.username).length]].map(([key, value]) => <div key={key} className="rounded-3xl bg-slate-50 p-5"><div className="text-sm font-bold text-slate-400">{key}</div><div className="mt-2 text-3xl font-black text-blue-600">{value}</div></div>)}</div></div>{user.role !== "guest" && <div className="rounded-[2rem] bg-white p-7 shadow-xl"><div className="text-xs font-bold tracking-[.25em] text-blue-600">ACCOUNT IDENTITY</div><h2 className="mt-2 text-2xl font-black">修改用户名</h2><p className="mt-2 text-sm text-slate-500">用户名全站唯一，支持 2–24 位文字、数字和下划线。</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={username} onChange={(event) => setUsername(event.target.value)} className="flex-1 rounded-2xl border px-4 py-3" /><button disabled={saving || username.trim() === user.username} onClick={save} className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white disabled:bg-slate-300">{saving ? "检查并保存…" : "保存新用户名"}</button></div></div>}</section>;
}

function CloudGallerySection({ works, setSection, openWork, onTagSearch, onOpenMember }: { works: Work[]; setSection: (section: Section) => void; openWork: (id: number) => void; onTagSearch: (tag: string) => void; onOpenMember: (member: { id?: string; username: string; avatarUrl?: string }) => void }) {
  return <section><div className="mb-5 flex items-center justify-between"><h1 className="text-3xl font-black">作品展示</h1><button onClick={() => setSection("publish")} className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white">发布作品</button></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{works.map((work) => <article key={work.id} className="overflow-hidden rounded-[1.75rem] bg-white shadow-xl transition hover:-translate-y-1"><button onClick={() => openWork(work.id)} className="block w-full text-left">{work.imageUrl ? <img src={work.imageUrl} alt={work.title} className="h-52 w-full object-cover" /> : <div className={`h-52 bg-gradient-to-br ${work.color}`} />}<div className="px-5 pt-5"><div className="text-xl font-black">{work.title}</div><div className="mt-1 text-sm text-slate-500">{work.kit}</div><p className="mt-3 line-clamp-2 text-slate-600">{work.desc}</p></div></button><div className="px-5 pt-4"><CreatorButton username={work.author} avatarUrl={work.authorAvatar} userId={work.authorId} onOpen={onOpenMember} /></div><div className="flex flex-wrap gap-2 px-5 pt-4">{work.tags.map((tag) => <button key={tag} onClick={() => onTagSearch(tag)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">#{tag}</button>)}</div><div className="px-5 pb-5 pt-4 text-sm text-slate-400">♥ {work.likes} · 评论 {work.comments} · {work.createdAt}</div></article>)}</div></section>;
}

function CloudPublishSection({ user, works, setWorks, setSection, setNotice, supabaseEnabled }: { user: User; works: Work[]; setWorks: (works: Work[]) => void; setSection: (section: Section) => void; setNotice: (notice: string) => void; supabaseEnabled: boolean }) {
  const [title, setTitle] = useState("RG 元祖2.0 全喷涂改色");
  const [kit, setKit] = useState("RG 元祖高达 Ver.2.0");
  const [desc, setDesc] = useState("使用了郡士水性漆，主色为午夜蓝 + 钛白调配。");
  const [tags, setTags] = useState("全喷涂,改色,RG");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function publish() {
    if (user.role === "guest") return setNotice("请先登录后再发布作品。");
    if (file && file.size > 10 * 1024 * 1024) return setNotice("单张图片不能超过 10MB。");
    setUploading(true);
    let imageUrl: string | undefined;
    if (file && supabaseEnabled) {
      const supabase = createSupabaseBrowserClient();
      const extension = file.name.split(".").pop() ?? "jpg";
      const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const uploadResult = await supabase?.storage.from("works").upload(filePath, file, { upsert: false });
      if (uploadResult?.error) { setUploading(false); setNotice(uploadResult.error.message); return; }
      imageUrl = supabase?.storage.from("works").getPublicUrl(filePath).data.publicUrl;
    }
    const newWork = { id: Date.now(), title, kit, desc, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), author: user.username, authorId: user.id, authorAvatar: user.avatarUrl, likes: 0, comments: 0, color: "from-blue-700 to-indigo-400", imageUrl, createdAt: new Date().toISOString().slice(5, 10) } as Work;
    setWorks([newWork, ...works]);
    setUploading(false);
    setNotice(supabaseEnabled ? "作品与图片已发布到 Supabase。" : "作品已保存在当前浏览器中。");
    setSection("gallery");
  }

  return <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
    <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60"><h1 className="text-3xl font-black">发布作品</h1><div className="mt-6 space-y-4"><Field label="作品标题 *" value={title} onChange={setTitle} /><Field label="使用套件" value={kit} onChange={setKit} /><label className="block"><span className="text-sm font-bold text-slate-500">作品图片</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-5 text-sm text-blue-700" /><span className="mt-2 block text-xs text-slate-400">JPG、PNG 或 WebP，单张不超过 10MB</span></label><label className="block"><span className="text-sm font-bold text-slate-500">作品描述</span><textarea value={desc} onChange={(event) => setDesc(event.target.value)} className="mt-2 h-32 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-300" /></label></div></div>
    <aside className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60"><h2 className="text-xl font-black">关联信息</h2><Field label="技法标签" value={tags} onChange={setTags} /><button disabled={uploading || user.role === "guest" || title.length < 2} onClick={publish} className="mt-5 w-full rounded-2xl bg-blue-600 py-4 font-bold text-white disabled:bg-slate-300">{uploading ? "上传中…" : user.role === "guest" ? "登录后发布" : "发布作品"}</button></aside>
  </section>;
}
