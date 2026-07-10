"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Role = "guest" | "user" | "editor" | "admin";
type Section = "home" | "wiki" | "search" | "gallery" | "publish" | "forum" | "tools" | "admin" | "profile" | "login";
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
};
type Revision = { id: number; pageId: number; revision: number; content: string; summary: string; editor: string; status: "approved" | "pending" | "rejected"; createdAt: string };
type Work = { id: number; title: string; kit: string; desc: string; tags: string[]; author: string; likes: number; comments: number; color: string; createdAt: string };
type Post = { id: number; board: string; title: string; content: string; author: string; replies: number; likes: number; pinned?: boolean; featured?: boolean; createdAt: string };
type Tool = { id: number; name: string; brand: string; category: string; price: string; rating: number; reviews: number; specs: string[]; pros: string[] };
type User = { username: string; nickname: string; role: Role; score: number };

const categories = ["入门指南", "制作技法", "模型图鉴", "工具材料", "涂装技法", "改造进阶", "场景制作", "常见问题"];
const boards = ["新套件讨论", "技法问答", "工具避雷", "作品交流", "涂装讨论", "改造创意", "站务公告", "自由讨论"];
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
  { id: 1, board: "站务公告", title: "共建邀请：首批编辑者招募中", content: "欢迎有图文教程经验的玩家参与冷启动内容建设。", author: "管理员", replies: 31, likes: 128, pinned: true, featured: true, createdAt: "07-09" },
  { id: 2, board: "技法问答", title: "RG元祖2.0肩部无缝应该怎么处理？", content: "肩甲结构比较复杂，想做全喷涂前先确认处理顺序。", author: "小星", replies: 18, likes: 36, createdAt: "07-08" },
  { id: 3, board: "工具避雷", title: "单刃钳崩口后还能修吗？", content: "剪透明件时崩了一小块，想知道是否还能继续用。", author: "老刚", replies: 22, likes: 44, featured: true, createdAt: "07-07" },
];

const seedTools: Tool[] = [
  { id: 1, name: "SPN-120 单刃剪钳", brand: "神之手", category: "剪钳/水口钳", price: "¥320-420", rating: 4.8, reviews: 126, specs: ["单刃", "适合精修", "需注意维护"], pros: ["水口白痕少", "手感细腻", "适合二段剪"] },
  { id: 2, name: "田宫 74035 精密剪钳", brand: "田宫", category: "剪钳/水口钳", price: "¥130-180", rating: 4.5, reviews: 89, specs: ["双刃", "耐用", "入门友好"], pros: ["耐用度高", "维护简单", "泛用性强"] },
  { id: 3, name: "郡士 WC01 黑色渗线液", brand: "郡士", category: "渗线工具", price: "¥28-38", rating: 4.6, reviews: 203, specs: ["水性", "黑色", "适合深色阴影"], pros: ["流动性好", "味道较轻", "易清理"] },
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
  const [selectedWikiId, setSelectedWikiId] = useState(1);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [compare, setCompare] = useState(false);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<string | null>(null);
  const supabaseEnabled = isSupabaseConfigured();
  const [user, setUser] = useState<User>({ username: "guest", nickname: "游客", role: "guest", score: 0 });
  const [notice, setNotice] = useState(supabaseEnabled ? "正在连接 Supabase…" : "尚未配置 Supabase，当前使用浏览器本地数据。");

  async function applyAuthenticatedUser(authUser: { id: string; email?: string }) {
    const supabase = createSupabaseBrowserClient();
    const profileResult = await supabase?.from("profiles").select("*").eq("id", authUser.id).single();
    const profile = profileResult?.data as { display_name?: string; role?: "user" | "admin"; contribution_score?: number } | null;
    const role: Role = profile?.role === "admin" ? "admin" : "user";
    const email = authUser.email ?? "user@example.com";
    setSupabaseUser(email);
    setUser({ username: authUser.id, nickname: profile?.display_name || email.split("@")[0], role, score: profile?.contribution_score ?? 0 });
    return role;
  }

  useEffect(() => {
    setWiki(readStore("gundam_wiki_pages", seedWiki));
    setRevisions(readStore("gundam_wiki_revisions", seedRevisions));
    setWorks(readStore("gundam_wiki_works", seedWorks));
    setPosts(readStore("gundam_wiki_posts", seedPosts));
    setUser(readStore("gundam_wiki_user", { username: "guest", nickname: "游客", role: "guest", score: 0 }));
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    Promise.all([
      supabase.from("wiki_pages").select("*").order("id"),
      supabase.from("wiki_revisions").select("*").order("revision"),
      supabase.from("works").select("*").order("id", { ascending: false }),
      supabase.from("forum_posts").select("*").order("id", { ascending: false }),
      supabase.from("tools").select("*").order("rating", { ascending: false }),
      supabase.auth.getUser(),
    ]).then(([wikiResult, revisionResult, workResult, postResult, toolResult, authResult]) => {
      if (wikiResult.data?.length) setWiki(wikiResult.data.map((item) => ({ ...item, updatedAt: item.updated_at })) as WikiPage[]);
      if (revisionResult.data?.length) setRevisions(revisionResult.data.map((item) => ({ id: item.id, pageId: item.page_id, revision: item.revision, content: item.content, summary: item.summary, editor: item.editor, status: item.status, createdAt: item.created_at })) as Revision[]);
      if (workResult.data?.length) setWorks(workResult.data.map((item) => ({ id: item.id, title: item.title, kit: item.kit, desc: item.description, tags: item.tags, author: item.author, likes: item.likes, comments: item.comments, color: item.color, imageUrl: item.image_url, createdAt: item.created_at })) as Work[]);
      if (postResult.data?.length) setPosts(postResult.data.map((item) => ({ id: item.id, board: item.board, title: item.title, content: item.content, author: item.author, replies: item.replies, likes: item.likes, pinned: item.pinned, featured: item.featured, createdAt: item.created_at })) as Post[]);
      if (toolResult.data?.length) setTools(toolResult.data as Tool[]);
      if (authResult.data.user?.email) void applyAuthenticatedUser(authResult.data.user);
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
        setUser({ username: "guest", nickname: "游客", role: "guest", score: 0 });
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => writeStore("gundam_wiki_pages", wiki), [wiki]);
  useEffect(() => writeStore("gundam_wiki_revisions", revisions), [revisions]);
  useEffect(() => writeStore("gundam_wiki_works", works), [works]);
  useEffect(() => writeStore("gundam_wiki_posts", posts), [posts]);
  useEffect(() => writeStore("gundam_wiki_user", user), [user]);

  useEffect(() => {
    if (!remoteLoaded || !supabaseUser) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const timer = window.setTimeout(async () => {
      const wikiRows = wiki.map(({ updatedAt, ...item }) => ({ ...item, updated_at: updatedAt }));
      const revisionRows = revisions.map((item) => ({ id: item.id, page_id: item.pageId, revision: item.revision, content: item.content, summary: item.summary, editor: item.editor, status: item.status, created_at: item.createdAt }));
      const workRows = works.map((item) => ({ id: item.id, title: item.title, kit: item.kit, description: item.desc, tags: item.tags, author: item.author, likes: item.likes, comments: item.comments, color: item.color, image_url: (item as Work & { imageUrl?: string }).imageUrl ?? null, created_at: item.createdAt }));
      const postRows = posts.map((item) => ({ id: item.id, board: item.board, title: item.title, content: item.content, author: item.author, replies: item.replies, likes: item.likes, pinned: Boolean(item.pinned), featured: Boolean(item.featured), created_at: item.createdAt }));
      const results = await Promise.all([supabase.from("wiki_pages").upsert(wikiRows), supabase.from("wiki_revisions").upsert(revisionRows), supabase.from("works").upsert(workRows), supabase.from("forum_posts").upsert(postRows)]);
      if (results.some((result) => result.error)) setNotice("部分云端内容同步失败，本地副本仍然安全保存。");
    }, 800);
    return () => window.clearTimeout(timer);
  }, [wiki, revisions, works, posts, remoteLoaded, supabaseUser]);

  const selectedWiki = wiki.find((item) => item.id === selectedWikiId) ?? wiki[0];
  const hotTerms = ["RG元祖2.0", "渗线", "神之手剪钳", "MGEX强袭自由", "无缝处理"];
  const pendingCount = revisions.filter((item) => item.status === "pending").length + wiki.filter((item) => item.status === "pending").length;

  const searchResults = useMemo(() => {
    const key = query.trim().toLowerCase();
    if (!key) return [];
    const wikiResults = wiki
      .filter((item) => [item.title, item.summary, item.content, item.tags.join(" ")].join(" ").toLowerCase().includes(key))
      .map((item) => ({ type: "Wiki", title: item.title, desc: item.summary, id: item.id }));
    const workResults = works
      .filter((item) => [item.title, item.kit, item.desc, item.tags.join(" ")].join(" ").toLowerCase().includes(key))
      .map((item) => ({ type: "作品", title: item.title, desc: item.desc, id: item.id }));
    const postResults = posts
      .filter((item) => [item.title, item.content, item.board].join(" ").toLowerCase().includes(key))
      .map((item) => ({ type: "论坛", title: item.title, desc: item.content, id: item.id }));
    const toolResults = tools
      .filter((item) => [item.name, item.brand, item.category, item.specs.join(" ")].join(" ").toLowerCase().includes(key))
      .map((item) => ({ type: "工具", title: item.name, desc: `${item.brand} · ${item.category} · ${item.rating}分`, id: item.id }));
    return [...wikiResults, ...workResults, ...postResults, ...toolResults];
  }, [query, wiki, works, posts, tools]);

  async function handleSupabaseAuth(action: "signin" | "signup" | "signout", email = "", password = "", portal: "user" | "admin" = "user") {
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
      const result = await supabase.auth.signUp({ email, password });
      setNotice(result.error ? result.error.message : "注册成功，请前往邮箱完成验证后登录。");
      return;
    }
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error || !result.data?.user) {
      setNotice(result.error?.message ?? "登录失败，请检查邮箱和密码。");
      return;
    }
    const role = await applyAuthenticatedUser(result.data.user);
    if (portal === "admin" && role !== "admin") {
      await supabase.auth.signOut();
      setNotice("该账号没有管理员权限，请使用普通用户入口登录。");
      return;
    }
    setNotice(role === "admin" ? "管理员登录成功。" : "用户登录成功。");
    setSection(role === "admin" && portal === "admin" ? "admin" : "home");
  }

  function login(role: Role) {
    const next: User = role === "guest" ? { username: "guest", nickname: "游客", role, score: 0 } : { username: role === "admin" ? "admin" : role === "editor" ? "demo_editor" : "xiaoxing", nickname: roleText[role], role, score: role === "admin" ? 999 : role === "editor" ? 100 : 10 };
    setUser(next);
    setNotice(`已切换为${roleText[role]}，可体验对应权限。`);
  }

  function openWiki(id: number) {
    setSelectedWikiId(id);
    setSection("wiki");
    setEditing(false);
    setCompare(false);
  }

  function submitSearch(value = query) {
    const next = value.trim();
    if (!next) return;
    setQuery(next);
    setSection("search");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-cyan-200/60 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Header section={section} setSection={setSection} user={user} login={login} pendingCount={pendingCount} supabaseEnabled={supabaseEnabled} supabaseUser={supabaseUser} onAuth={handleSupabaseAuth} />
        <div className="my-4 rounded-2xl border border-blue-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur">{notice}</div>

        {section === "login" && <LoginSection supabaseEnabled={supabaseEnabled} onAuth={handleSupabaseAuth} />}
        {section === "home" && <HomeSection wiki={wiki} works={works} posts={posts} hotTerms={hotTerms} query={query} setQuery={setQuery} submitSearch={submitSearch} openWiki={openWiki} setSection={setSection} />}
        {section === "wiki" && <WikiSection page={selectedWiki} pages={wiki} revisions={revisions.filter((item) => item.pageId === selectedWiki.id)} user={user} editing={editing} setEditing={setEditing} compare={compare} setCompare={setCompare} onSelect={openWiki} onSave={(nextContent, summary) => {
          const nextRev = selectedWiki.revision + 1;
          const needReview = user.role === "user";
          setWiki((list) => list.map((item) => item.id === selectedWiki.id ? { ...item, content: needReview ? item.content : nextContent, revision: needReview ? item.revision : nextRev, status: needReview ? "pending" : item.status, updatedAt: new Date().toISOString().slice(0, 10) } : item));
          setRevisions((list) => [...list, { id: Date.now(), pageId: selectedWiki.id, revision: nextRev, content: nextContent, summary, editor: user.nickname, status: needReview ? "pending" : "approved", createdAt: new Date().toISOString().slice(0, 10) }]);
          setEditing(false);
          setNotice(needReview ? "编辑已进入审核队列，管理员通过后会发布。" : "条目已发布新版本，版本历史已同步记录。")
        }} />}
        {section === "search" && <SearchSection query={query} setQuery={setQuery} results={searchResults} hotTerms={hotTerms} submitSearch={submitSearch} openWiki={openWiki} setSection={setSection} />}
        {section === "gallery" && <CloudGallerySection works={works} setSection={setSection} />}
        {section === "publish" && <CloudPublishSection user={user} works={works} setWorks={setWorks} setSection={setSection} setNotice={setNotice} supabaseEnabled={supabaseEnabled} />}
        {section === "forum" && <ForumSection posts={posts} setPosts={setPosts} user={user} setNotice={setNotice} />}
        {section === "tools" && <ToolsSection tools={tools} />}
        {section === "admin" && <AdminSection user={user} wiki={wiki} setWiki={setWiki} revisions={revisions} setRevisions={setRevisions} pendingCount={pendingCount} setNotice={setNotice} />}
        {section === "profile" && <ProfileSection user={user} wiki={wiki} works={works} posts={posts} />}
      </div>
    </main>
  );
}

function Header({ section, setSection, user, login, pendingCount, supabaseEnabled, supabaseUser, onAuth }: { section: Section; setSection: (s: Section) => void; user: User; login: (r: Role) => void; pendingCount: number; supabaseEnabled: boolean; supabaseUser: string | null; onAuth: (action: "signin" | "signup" | "signout", email?: string, password?: string, portal?: "user" | "admin") => Promise<void> }) {
  const nav: { key: Section; label: string }[] = [
    { key: "home", label: "首页" },
    { key: "wiki", label: "知识库" },
    { key: "gallery", label: "作品" },
    { key: "forum", label: "讨论" },
    { key: "tools", label: "工具库" },
    { key: "admin", label: "管理" },
  ];
  return (
    <header className="sticky top-4 z-20 rounded-3xl border border-white/70 bg-white/85 px-4 py-3 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button onClick={() => setSection("home")} className="flex items-center gap-3 text-left">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-600/25">G</span>
          <span>
            <span className="block text-lg font-black tracking-tight">高达模型制作Wiki</span>
            <span className="text-xs text-slate-500">协作知识库 · 作品社区 · 工具评测</span>
          </span>
        </button>
        <nav className="flex flex-wrap gap-2">
          {nav.map((item) => (
            <button key={item.key} onClick={() => setSection(item.key)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${section === item.key ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>
              {item.label}{item.key === "admin" && pendingCount > 0 ? ` ${pendingCount}` : ""}
            </button>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setSection("profile")} className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">{user.nickname} · {roleText[user.role]}</button>
          {supabaseEnabled ? (supabaseUser ? <button onClick={() => onAuth("signout")} className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-bold text-green-700">退出登录</button> : <button onClick={() => setSection("login")} className="rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white">登录 / 注册</button>) : ["guest", "user", "editor", "admin"].map((role) => <button key={role} onClick={() => login(role as Role)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-700">{roleText[role as Role]}</button>)}
        </div>
      </div>
    </header>
  );
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


function LoginSection({ supabaseEnabled, onAuth }: { supabaseEnabled: boolean; onAuth: (action: "signin" | "signup" | "signout", email?: string, password?: string, portal?: "user" | "admin") => Promise<void> }) {
  const [portal, setPortal] = useState<"user" | "admin">("user");
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    await onAuth(registering ? "signup" : "signin", email.trim(), password, portal);
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
          <Field label="邮箱地址" value={email} onChange={setEmail} />
          <label className="block"><span className="text-sm font-bold text-slate-500">密码</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" /></label>
          <button disabled={!supabaseEnabled || submitting || !email.includes("@") || password.length < 6} onClick={submit} className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white disabled:bg-slate-300">{submitting ? "处理中…" : portal === "admin" ? "验证管理员身份" : registering ? "创建账号" : "登录"}</button>
        </div>
        {portal === "user" && <button onClick={() => setRegistering(!registering)} className="mt-5 text-sm font-bold text-blue-600">{registering ? "已有账号？返回登录" : "没有账号？使用邮箱注册"}</button>}
      </div>
    </div>
  </section>;
}

function HomeSection({ wiki, works, posts, hotTerms, query, setQuery, submitSearch, openWiki, setSection }: { wiki: WikiPage[]; works: Work[]; posts: Post[]; hotTerms: string[]; query: string; setQuery: (q: string) => void; submitSearch: (value?: string) => void; openWiki: (id: number) => void; setSection: (s: Section) => void }) {
  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-8 text-white shadow-2xl shadow-blue-900/20">
          <div className="mb-12 flex flex-wrap gap-3">
            {categories.slice(0, 4).map((item) => <span key={item} className="rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur">{item}</span>)}
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">从第一只 HG 到 GBWC 级作品的中文制作知识库</h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">集中沉淀教程、套件图鉴、工具评测与社区经验，让新手少踩坑，让老玩家快速找到可复用方案。</p>
          <div className="mt-8 rounded-3xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitSearch()} placeholder="搜索任意模型、技法或工具，例如：RG元祖2.0 渗线 神之手剪钳" className="min-h-14 flex-1 rounded-2xl px-5 text-slate-900 outline-none" />
            <button onClick={() => submitSearch()} className="w-full rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white hover:bg-blue-700 sm:w-auto">开始搜索</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-blue-100">
            热门：{hotTerms.map((term) => <button key={term} onClick={() => { setQuery(term); submitSearch(term); }} className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20">{term}</button>)}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[{ label: "Wiki条目", value: "500+", text: "覆盖入门、技法、图鉴" }, { label: "贡献内容", value: "30%", text: "目标来自用户共建" }, { label: "审核时效", value: "24h", text: "普通编辑快速流转" }].map((item) => <div key={item.label} className="rounded-3xl border border-white bg-white p-6 shadow-xl shadow-slate-200/60"><div className="text-sm font-semibold text-slate-500">{item.label}</div><div className="mt-2 text-4xl font-black text-blue-600">{item.value}</div><div className="mt-2 text-sm text-slate-500">{item.text}</div></div>)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="热门条目" action="进入知识库" onAction={() => openWiki(wiki[0].id)}>
          <div className="space-y-3">
            {wiki.map((item, index) => <button key={item.id} onClick={() => openWiki(item.id)} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left hover:bg-blue-50"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 font-bold text-blue-700">{index + 1}</span><span><span className="block font-bold">{item.title}</span><span className="text-sm text-slate-500">{item.category} · {item.views.toLocaleString()}浏览</span></span></button>)}
          </div>
        </Panel>
        <Panel title="最新作品" action="发布作品" onAction={() => setSection("publish")}>
          <div className="grid gap-3">
            {works.map((work) => <div key={work.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3"><div className={`h-20 w-24 rounded-2xl bg-gradient-to-br ${work.color}`} /><div><div className="font-bold">{work.title}</div><div className="text-sm text-slate-500">{work.kit}</div><div className="mt-2 text-xs text-slate-400">♥ {work.likes} · 评论 {work.comments}</div></div></div>)}
          </div>
        </Panel>
        <Panel title="社区动态" action="去讨论" onAction={() => setSection("forum")}>
          <div className="space-y-3">
            {posts.map((post) => <div key={post.id} className="rounded-2xl border border-slate-100 p-4"><div className="text-xs font-semibold text-blue-600">{post.board}</div><div className="mt-1 font-bold">{post.title}</div><div className="mt-2 text-xs text-slate-400">{post.replies} 回复 · {post.likes} 赞</div></div>)}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return <div className="rounded-[1.75rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/50"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">{title}</h2>{action && <button onClick={onAction} className="text-sm font-bold text-blue-600 hover:text-blue-800">{action}</button>}</div>{children}</div>;
}

function WikiSection({ page, pages, revisions, user, editing, setEditing, compare, setCompare, onSelect, onSave }: { page: WikiPage; pages: WikiPage[]; revisions: Revision[]; user: User; editing: boolean; setEditing: (v: boolean) => void; compare: boolean; setCompare: (v: boolean) => void; onSelect: (id: number) => void; onSave: (content: string, summary: string) => void }) {
  const [content, setContent] = useState(page.content);
  const [summary, setSummary] = useState("补充条目内容");
  const canEdit = user.role !== "guest" && page.status !== "locked";
  useEffect(() => { setContent(page.content); }, [page.id, page.content]);
  return (
    <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200/60">
          <div className="mb-3 text-sm font-bold text-slate-400">知识库目录</div>
          {pages.map((item) => <button key={item.id} onClick={() => onSelect(item.id)} className={`mb-2 w-full rounded-2xl p-3 text-left transition ${item.id === page.id ? "bg-blue-600 text-white" : "bg-slate-50 hover:bg-blue-50"}`}><span className="block font-bold">{item.title}</span><span className="text-xs opacity-70">{item.category} · v{item.revision}</span></button>)}
        </div>
        <div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200/60">
          <div className="mb-3 text-sm font-bold text-slate-400">套件信息</div>
          {[["品牌", "万代"], ["等级", page.grade ?? "—"], ["比例", page.scale ?? "—"], ["发售", page.release ?? "—"], ["定价", page.price ?? "—"]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-slate-100 py-2 text-sm"><span className="text-slate-500">{k}</span><span className="font-semibold">{v}</span></div>)}
        </div>
      </aside>
      <article className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">{page.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{tag}</span>)}</div>
            <h1 className="text-3xl font-black">{page.title}</h1>
            <p className="mt-3 max-w-3xl text-slate-600">{page.summary}</p>
            <div className="mt-3 text-sm text-slate-400">v{page.revision} · {page.updatedAt} 更新 · {page.views.toLocaleString()}浏览 · {page.likes}赞</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCompare(!compare)} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold">版本历史</button>
            <button disabled={!canEdit} onClick={() => setEditing(!editing)} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300">{canEdit ? "编辑条目" : "访客只读"}</button>
          </div>
        </div>
        {editing ? <div className="grid gap-5 xl:grid-cols-2"><div><label className="text-sm font-bold text-slate-500">Wiki语法编辑</label><textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-2 h-[460px] w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm outline-none focus:border-blue-300" /><input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="编辑摘要，5-200字符" className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-300" /><button onClick={() => onSave(content, summary)} disabled={summary.length < 5} className="mt-3 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white disabled:bg-slate-300">保存并提交</button></div><Preview content={content} /></div> : compare ? <RevisionView revisions={revisions} /> : <Preview content={page.content} />}
      </article>
    </section>
  );
}

function Preview({ content }: { content: string }) {
  return <div className="prose-view rounded-3xl bg-slate-50 p-6" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />;
}

function RevisionView({ revisions }: { revisions: Revision[] }) {
  return <div className="space-y-3">{revisions.map((rev) => <div key={rev.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap justify-between gap-2"><b>版本 v{rev.revision}</b><span className={`rounded-full px-3 py-1 text-xs font-bold ${rev.status === "approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{rev.status === "approved" ? "已通过" : "待审核"}</span></div><div className="mt-2 text-sm text-slate-500">{rev.editor} · {rev.createdAt} · {rev.summary}</div><div className="mt-3 rounded-2xl bg-white p-3 text-sm text-slate-600">{rev.content.slice(0, 220)}...</div></div>)}</div>;
}

function SearchSection({ query, setQuery, results, hotTerms, submitSearch, openWiki, setSection }: { query: string; setQuery: (q: string) => void; results: { type: string; title: string; desc: string; id: number }[]; hotTerms: string[]; submitSearch: () => void; openWiki: (id: number) => void; setSection: (s: Section) => void }) {
  return <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60"><h1 className="text-3xl font-black">全文搜索</h1><div className="mt-5 flex gap-3"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitSearch()} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-300" /><button onClick={() => submitSearch()} className="rounded-2xl bg-blue-600 px-6 font-bold text-white">搜索</button></div><div className="mt-3 flex flex-wrap gap-2">{hotTerms.map((term) => <button key={term} onClick={() => { setQuery(term); }} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{term}</button>)}</div><div className="mt-6 space-y-3">{results.length ? results.map((item) => <button key={`${item.type}-${item.id}`} onClick={() => item.type === "Wiki" ? openWiki(item.id) : setSection(item.type === "作品" ? "gallery" : item.type === "论坛" ? "forum" : "tools")} className="w-full rounded-3xl border border-slate-100 bg-slate-50 p-5 text-left hover:border-blue-200 hover:bg-blue-50"><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">{item.type}</span><div className="mt-3 text-xl font-black">{item.title}</div><div className="mt-2 text-slate-600">{item.desc}</div></button>) : <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">未找到相关内容，试试热门条目或提交新条目需求。</div>}</div></section>;
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
  return <section className="grid gap-6 lg:grid-cols-[1fr_320px]"><div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60"><h1 className="text-3xl font-black">发布作品</h1><div className="mt-6 space-y-4"><Field label="作品标题 *" value={title} onChange={setTitle} /><Field label="使用套件" value={kit} onChange={setKit} /><div><label className="text-sm font-bold text-slate-500">图片上传 *</label><div className="mt-2 grid h-48 place-items-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50 text-center text-blue-700"><div><div className="text-4xl">＋</div><div className="font-bold">拖拽图片到此处，或点击选择</div><div className="text-sm">演示版会生成占位图，支持JPG/PNG规则已在表单提示中体现</div></div></div></div><div><label className="text-sm font-bold text-slate-500">作品描述</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-2 h-32 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-300" /></div></div></div><aside className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60"><h2 className="text-xl font-black">关联信息</h2><Field label="技法标签" value={tags} onChange={setTags} /><button disabled={!canPublish || title.length < 2} onClick={() => { setWorks([{ id: Date.now(), title, kit, desc, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), author: user.nickname, likes: 0, comments: 0, color: "from-blue-700 to-indigo-400", createdAt: new Date().toISOString().slice(5, 10) }, ...works]); setNotice("作品已发布到展示区，可以继续收集点赞和评论。 "); setSection("gallery"); }} className="mt-5 w-full rounded-2xl bg-blue-600 py-4 font-bold text-white disabled:bg-slate-300">{canPublish ? "发布作品" : "登录后发布"}</button></aside></section>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="block"><span className="text-sm font-bold text-slate-500">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-300" /></label>;
}

function ForumSection({ posts, setPosts, user, setNotice }: { posts: Post[]; setPosts: (p: Post[]) => void; user: User; setNotice: (n: string) => void }) {
  const [board, setBoard] = useState(boards[1]);
  const [title, setTitle] = useState("关于水贴软化剂的使用顺序");
  const [content, setContent] = useState("想请教大家蓝盖和绿盖软化剂是否都需要使用？");
  return <section className="grid gap-6 lg:grid-cols-[280px_1fr]"><aside className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200/60"><h2 className="mb-3 text-xl font-black">讨论版块</h2>{boards.map((b) => <button key={b} onClick={() => setBoard(b)} className={`mb-2 w-full rounded-2xl px-4 py-3 text-left font-bold ${board === b ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`}>{b}</button>)}</aside><div className="space-y-5"><div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200/60"><h1 className="text-2xl font-black">{board}</h1><div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3" /><input value={content} onChange={(e) => setContent(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3" /><button disabled={user.role === "guest" || title.length < 5} onClick={() => { setPosts([{ id: Date.now(), board, title, content, author: user.nickname, replies: 0, likes: 0, createdAt: new Date().toISOString().slice(5, 10) }, ...posts]); setNotice("帖子已发布到对应版块。") }} className="rounded-2xl bg-blue-600 px-5 font-bold text-white disabled:bg-slate-300">发帖</button></div></div>{posts.filter((p) => p.board === board || p.pinned).map((post) => <div key={post.id} className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200/60"><div className="flex flex-wrap gap-2">{post.pinned && <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">置顶</span>}{post.featured && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">精华</span>}<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{post.board}</span></div><h2 className="mt-3 text-xl font-black">{post.title}</h2><p className="mt-2 text-slate-600">{post.content}</p><div className="mt-4 text-sm text-slate-400">{post.author} · {post.replies} 回复 · {post.likes} 赞 · {post.createdAt}</div></div>)}</div></section>;
}

function ToolsSection({ tools }: { tools: Tool[] }) {
  return <section><h1 className="mb-5 text-3xl font-black">工具评测库</h1><div className="grid gap-5 lg:grid-cols-3">{tools.map((tool) => <div key={tool.id} className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200/60"><div className="text-sm font-bold text-blue-600">{tool.brand} · {tool.category}</div><h2 className="mt-2 text-2xl font-black">{tool.name}</h2><div className="mt-4 flex items-end gap-2"><span className="text-4xl font-black text-amber-500">{tool.rating}</span><span className="pb-1 text-sm text-slate-400">/ 5 · {tool.reviews}条评价</span></div><div className="mt-4 rounded-2xl bg-slate-50 p-4"><div className="font-bold">参考价格：{tool.price}</div><div className="mt-3 flex flex-wrap gap-2">{tool.specs.map((s) => <span key={s} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{s}</span>)}</div></div><div className="mt-4 text-sm text-slate-600">优点：{tool.pros.join("、")}</div></div>)}</div></section>;
}

function AdminSection({ user, wiki, setWiki, revisions, setRevisions, pendingCount, setNotice }: { user: User; wiki: WikiPage[]; setWiki: (w: WikiPage[]) => void; revisions: Revision[]; setRevisions: (r: Revision[]) => void; pendingCount: number; setNotice: (n: string) => void }) {
  if (user.role !== "admin" && user.role !== "editor") return <div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><h1 className="text-2xl font-black">需要编辑者或管理员权限</h1><p className="mt-2 text-slate-500">可在顶部切换演示账号体验审核后台。</p></div>;
  const pendingRevisions = revisions.filter((r) => r.status === "pending");
  const pendingPages = wiki.filter((p) => p.status === "pending");
  return <section className="space-y-5"><div className="grid gap-4 md:grid-cols-4">{[["待审核", pendingCount], ["Wiki条目", wiki.length], ["注册用户", 5000], ["月活目标", 10000]].map(([k, v]) => <div key={k} className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/60"><div className="text-sm font-bold text-slate-400">{k}</div><div className="mt-2 text-3xl font-black text-blue-600">{v}</div></div>)}</div><Panel title="内容审核队列"><div className="space-y-3">{pendingPages.map((p) => <div key={p.id} className="rounded-2xl bg-amber-50 p-4"><b>{p.title}</b><div className="mt-2 text-sm text-slate-600">普通用户编辑待审核。</div><button onClick={() => { setWiki(wiki.map((item) => item.id === p.id ? { ...item, status: "published" } : item)); setNotice("条目审核已通过。") }} className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white">通过</button></div>)}{pendingRevisions.map((r) => <div key={r.id} className="rounded-2xl bg-slate-50 p-4"><b>版本 v{r.revision}</b><div className="mt-1 text-sm text-slate-500">{r.editor} · {r.summary}</div><button onClick={() => { setRevisions(revisions.map((item) => item.id === r.id ? { ...item, status: "approved" } : item)); setWiki(wiki.map((p) => p.id === r.pageId ? { ...p, content: r.content, revision: r.revision, status: "published", updatedAt: new Date().toISOString().slice(0, 10) } : p)); setNotice("编辑版本已通过并发布。") }} className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white">通过并发布</button></div>)}{pendingCount === 0 && <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">当前没有待审核内容。</div>}</div></Panel></section>;
}

function ProfileSection({ user, wiki, works, posts }: { user: User; wiki: WikiPage[]; works: Work[]; posts: Post[] }) {
  return <section className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/60"><div className="flex flex-col gap-5 md:flex-row md:items-center"><div className="grid h-24 w-24 place-items-center rounded-3xl bg-blue-600 text-4xl font-black text-white">{user.nickname[0]}</div><div><h1 className="text-3xl font-black">{user.nickname}</h1><p className="mt-2 text-slate-500">{roleText[user.role]} · 贡献积分 {user.score}</p><div className="mt-3 flex flex-wrap gap-2">{["初入模界", "创始贡献者", "社交新星"].map((a) => <span key={a} className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">{a}</span>)}</div></div></div><div className="mt-8 grid gap-4 md:grid-cols-3">{[["参与条目", wiki.length], ["发布作品", works.filter((w) => w.author === user.nickname).length], ["发起讨论", posts.filter((p) => p.author === user.nickname).length]].map(([k, v]) => <div key={k} className="rounded-3xl bg-slate-50 p-5"><div className="text-sm font-bold text-slate-400">{k}</div><div className="mt-2 text-3xl font-black text-blue-600">{v}</div></div>)}</div></section>;
}

function CloudGallerySection({ works, setSection }: { works: Work[]; setSection: (section: Section) => void }) {
  return <section>
    <div className="mb-5 flex items-center justify-between"><h1 className="text-3xl font-black">作品展示</h1><button onClick={() => setSection("publish")} className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white">发布作品</button></div>
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{works.map((work) => {
      const imageUrl = (work as Work & { imageUrl?: string }).imageUrl;
      return <div key={work.id} className="overflow-hidden rounded-[1.75rem] bg-white shadow-xl shadow-slate-200/60">
        {imageUrl ? <img src={imageUrl} alt={work.title} className="h-52 w-full object-cover" /> : <div className={`h-52 bg-gradient-to-br ${work.color}`} />}
        <div className="p-5"><div className="text-xl font-black">{work.title}</div><div className="mt-1 text-sm text-slate-500">{work.kit} · by {work.author}</div><p className="mt-3 text-slate-600">{work.desc}</p><div className="mt-4 flex flex-wrap gap-2">{work.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{tag}</span>)}</div><div className="mt-4 text-sm text-slate-400">♥ {work.likes} · 评论 {work.comments} · {work.createdAt}</div></div>
      </div>;
    })}</div>
  </section>;
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
      const filePath = `${user.username}/${crypto.randomUUID()}.${extension}`;
      const uploadResult = await supabase?.storage.from("works").upload(filePath, file, { upsert: false });
      if (uploadResult?.error) { setUploading(false); setNotice(uploadResult.error.message); return; }
      imageUrl = supabase?.storage.from("works").getPublicUrl(filePath).data.publicUrl;
    }
    const newWork = { id: Date.now(), title, kit, desc, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), author: user.nickname, likes: 0, comments: 0, color: "from-blue-700 to-indigo-400", imageUrl, createdAt: new Date().toISOString().slice(5, 10) } as Work;
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
