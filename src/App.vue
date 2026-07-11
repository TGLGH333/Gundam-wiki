<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "./lib/supabase";

type Page = "home" | "wiki" | "gallery" | "forum" | "publish-post" | "tools" | "collections" | "calendar" | "search" | "login" | "profile" | "admin";
type User = { id: string; username: string; role: "guest" | "user" | "admin"; email?: string };
type Wiki = { id:number; title:string; category:string; summary:string; content:string; tags:string[]; grade?:string; scale?:string; release?:string; price?:string; views:number; likes:number; imageUrl?:string };
type Work = { id:number; title:string; kit:string; desc:string; tags:string[]; author:string; likes:number; comments:number; imageUrl?:string; color:string };
type Post = { id:number; board:string; title:string; content:string; tags:string[]; author:string; replies:number; likes:number; createdAt:string };
type Tool = { id:number; name:string; brand:string; category:string; price:string; rating:number; reviews:number; tags:string[]; specs:string[]; pros:string[] };
type Collection = { pageId:number; status:"wishlist"|"planned"|"completed"|"abandoned"; targetPrice?:string };

const seedWiki: Wiki[] = [
  { id:1,title:"RG 元祖高达 Ver.2.0",category:"模型图鉴",summary:"RG系列纪念套件，兼顾分件精度、可动与素组体验。",content:"## 套件概览\nRG 元祖高达 Ver.2.0 采用全新进阶关节。\n\n## 制作步骤\n1. 检查板件并分类收纳。\n2. 二段剪处理水口。\n3. 完成渗线、水贴与消光。",tags:["RG","素组友好","元祖"],grade:"RG",scale:"1/144",release:"2024",price:"3,500日元",views:24820,likes:913 },
  { id:2,title:"新手素组全流程",category:"入门指南",summary:"从开盒、剪件到贴纸与消光的完整入门路线。",content:"## 准备工具\n剪钳、笔刀、镊子与打磨棒。\n\n## 标准流程\n1. 开盒检查。\n2. 水口修整。\n3. 分部组装。\n4. 渗线与消光。",tags:["新手友好","素组","水口处理"],views:16500,likes:621 },
  { id:3,title:"渗线教程：让刻线更立体",category:"制作技法",summary:"渗线笔、水性与珐琅渗线液的适用场景。",content:"## 材料选择\n白色外甲使用浅灰，深色外甲使用深灰。\n\n## 操作步骤\n1. 点入渗线液。\n2. 等待半干。\n3. 擦除溢出部分。",tags:["渗线","进阶","新手友好"],views:12800,likes:480 },
];
const seedWorks: Work[] = [
  {id:1,title:"RG 元祖2.0 午夜蓝改色",kit:"RG 元祖高达 Ver.2.0",desc:"午夜蓝搭配钛白，轻度旧化。",tags:["全喷涂","改色","RG"],author:"老刚",likes:238,comments:42,color:"dark"},
  {id:2,title:"MGEX 强袭自由金属骨架",kit:"MGEX 强袭自由",desc:"金色骨架分色补涂与珍珠白外甲。",tags:["MGEX","金属质感"],author:"大师",likes:512,comments:88,color:"light"},
  {id:3,title:"HG 风灵高达素组记录",kit:"HG 风灵高达",desc:"零喷涂素组与水贴替换记录。",tags:["新手友好","素组"],author:"小星",likes:76,comments:15,color:"mid"},
];
const seedPosts: Post[] = [
  {id:1,board:"站务公告",title:"首批编辑者招募中",content:"欢迎有图文教程经验的玩家参与内容建设。",tags:["站务","编辑招募"],author:"管理员",replies:31,likes:128,createdAt:"07-09"},
  {id:2,board:"技法问答",title:"RG元祖肩部无缝怎么处理？",content:"全喷涂前想确认肩甲处理顺序。",tags:["RG","无缝处理"],author:"小星",replies:18,likes:36,createdAt:"07-08"},
];
const seedTools: Tool[] = [
  {id:1,name:"SPN-120 单刃剪钳",brand:"神之手",category:"剪钳",price:"¥320-420",rating:4.8,reviews:126,tags:["单刃钳","进阶工具"],specs:["单刃","精修"],pros:["白痕少","手感细腻"]},
  {id:2,name:"田宫 74035 精密剪钳",brand:"田宫",category:"剪钳",price:"¥130-180",rating:4.5,reviews:89,tags:["双刃钳","新手工具"],specs:["双刃","耐用"],pros:["维护简单","泛用性强"]},
];
const navItems: {p:Page;l:string}[] = [{p:"home",l:"首页"},{p:"wiki",l:"知识库"},{p:"gallery",l:"作品"},{p:"forum",l:"讨论"},{p:"tools",l:"工具"},{p:"collections",l:"清单"},{p:"calendar",l:"发售"}];
const boards = ["新套件讨论","技法问答","工具避雷","作品交流","涂装讨论","改造创意","站务公告","自由讨论"];
const releases = [
  {date:"07-18",grade:"RG",name:"夏亚专用扎古 Ver.2.0",status:"封绘公开"},
  {date:"08-08",grade:"MGEX",name:"命运高达",status:"官方确认"},
  {date:"08-22",grade:"HG",name:"Ξ高达 再贩",status:"再贩"},
];

const page = ref<Page>("home");
const wiki = ref<Wiki[]>(load("vue_wiki", seedWiki));
const works = ref<Work[]>(load("vue_works", seedWorks));
const posts = ref<Post[]>(load("vue_posts", seedPosts));
const tools = ref<Tool[]>(load("vue_tools", seedTools));
const collections = ref<Collection[]>(load("vue_collections", []));
const ownedTools = ref<number[]>(load("vue_owned_tools", []));
const progress = ref<Record<string,boolean>>(load("vue_progress", {}));
const user = ref<User>({id:"guest",username:"guest",role:"guest"});
const notice = ref(isSupabaseConfigured() ? "正在连接 Supabase…" : "当前使用浏览器本地数据。");
const query = ref("");
const selectedTag = ref("");
const scope = ref("all");
const selectedWikiId = ref(1);
const selectedWorkId = ref(1);
const selectedToolId = ref(1);
const filterOpen = ref(false);
const compactSteps = ref(false);
const workbench = ref(false);

const selectedWiki = computed(() => wiki.value.find(x=>x.id===selectedWikiId.value) ?? wiki.value[0]);
const selectedWork = computed(() => works.value.find(x=>x.id===selectedWorkId.value) ?? works.value[0]);
const selectedTool = computed(() => tools.value.find(x=>x.id===selectedToolId.value) ?? tools.value[0]);
const allTags = computed(() => [...new Set([...wiki.value.flatMap(x=>x.tags),...works.value.flatMap(x=>x.tags),...posts.value.flatMap(x=>x.tags),...tools.value.flatMap(x=>x.tags)])].sort());
const searchResults = computed(() => {
  const key=query.value.trim().toLowerCase(), tag=selectedTag.value.toLowerCase();
  const ok=(type:string,text:string,tags:string[]) => (scope.value==="all"||scope.value===type)&&(!key||text.toLowerCase().includes(key))&&(!tag||tags.some(x=>x.toLowerCase()===tag));
  return [
    ...wiki.value.filter(x=>ok("wiki",[x.title,x.summary,x.content,...x.tags].join(" "),x.tags)).map(x=>({type:"知识库",kind:"wiki",id:x.id,title:x.title,desc:x.summary,tags:x.tags})),
    ...works.value.filter(x=>ok("works",[x.title,x.kit,x.desc,...x.tags].join(" "),x.tags)).map(x=>({type:"作品",kind:"works",id:x.id,title:x.title,desc:x.desc,tags:x.tags})),
    ...posts.value.filter(x=>ok("forum",[x.title,x.content,x.board,...x.tags].join(" "),x.tags)).map(x=>({type:"讨论",kind:"forum",id:x.id,title:x.title,desc:x.content,tags:x.tags})),
    ...tools.value.filter(x=>ok("tools",[x.name,x.brand,x.category,...x.tags].join(" "),x.tags)).map(x=>({type:"工具",kind:"tools",id:x.id,title:x.name,desc:`${x.brand} · ${x.price}`,tags:x.tags})),
  ];
});

function load<T>(key:string,fallback:T):T { try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; } }
function save(key:string,value:unknown){ localStorage.setItem(key,JSON.stringify(value)); }
watch(wiki,v=>save("vue_wiki",v),{deep:true}); watch(works,v=>save("vue_works",v),{deep:true}); watch(posts,v=>save("vue_posts",v),{deep:true}); watch(tools,v=>save("vue_tools",v),{deep:true}); watch(collections,v=>save("vue_collections",v),{deep:true}); watch(ownedTools,v=>save("vue_owned_tools",v),{deep:true}); watch(progress,v=>save("vue_progress",v),{deep:true});
function go(next:Page){ page.value=next; window.scrollTo({top:0,behavior:"smooth"}); }
function openWiki(id:number){ selectedWikiId.value=id; go("wiki"); }
function openWork(id:number){ selectedWorkId.value=id; go("gallery"); }
function openTool(id:number){ selectedToolId.value=id; go("tools"); }
function search(tag=""){ if(tag){selectedTag.value=tag;query.value="";} go("search"); }
function addCollection(status:Collection["status"]){ if(user.value.role==="guest") return go("login"); collections.value=[{pageId:selectedWiki.value.id,status},...collections.value.filter(x=>x.pageId!==selectedWiki.value.id)]; notice.value="已更新个人模型清单。"; }
function markdown(text:string){ return text.split("\n").map(line=>line.startsWith("## ")?`<h3>${line.slice(3)}</h3>`:/^\d+\. /.test(line)?`<li>${line.replace(/^\d+\. /,"")}</li>`:line?`<p>${line}</p>`:"").join(""); }
function steps(text:string){ const list=text.split("\n").filter(x=>/^\d+\. /.test(x)).map(x=>x.replace(/^\d+\. /,"")); return list.length?list:["准备工具","处理零件","完成组装"]; }
function onCollectionChange(event:Event){ const value=(event.target as HTMLSelectElement).value as Collection["status"]; if(value)addCollection(value); }
function printPage(){ window.print(); }
function toggleStep(index:number){ const k=`${selectedWiki.value.id}-${index}`; progress.value[k]=!progress.value[k]; }
function openResult(item:any){ if(item.kind==="wiki") openWiki(item.id); else if(item.kind==="works"){selectedWorkId.value=item.id;go("gallery");} else if(item.kind==="tools"){selectedToolId.value=item.id;go("tools");} else go("forum"); }

const loginEmail=ref(""); const loginPassword=ref(""); const authBusy=ref(false);
async function applyAuthUser(auth:{id:string;email?:string}){ const client=createSupabaseBrowserClient(); const profile=await client?.from("profiles").select("*").eq("id",auth.id).single(); const data=profile?.data as {username?:string;display_name?:string;role?:"user"|"admin"}|null; user.value={id:auth.id,username:data?.username||data?.display_name||auth.email?.split("@")[0]||"member",email:auth.email,role:data?.role==="admin"?"admin":"user"}; }
async function signIn(){ const client=createSupabaseBrowserClient(); if(!client){ user.value={id:"demo",username:loginEmail.value.split("@")[0]||"demo",role:"user"}; go("home"); return; } authBusy.value=true; const result=await client.auth.signInWithPassword({email:loginEmail.value,password:loginPassword.value}); authBusy.value=false; if(result.error){notice.value=result.error.message;return;} const auth=result.data.user; await applyAuthUser(auth); notice.value="登录成功。"; go("home"); }
async function signOut(){ await createSupabaseBrowserClient()?.auth.signOut(); user.value={id:"guest",username:"guest",role:"guest"}; go("home"); }

const postTitle=ref(""); const postTopic=ref(""); const postContent=ref(""); const postBoard=ref(boards[1]); const postTags=ref("");
async function publishPost(){ if(postTitle.value.length<5||postContent.value.length<10)return; const next={id:Date.now(),board:postBoard.value,title:postTitle.value,content:`【${postTopic.value}】\n${postContent.value}`,tags:postTags.value.split(/[,，]/).map(x=>x.trim()).filter(Boolean),author:user.value.username,replies:0,likes:0,createdAt:new Date().toISOString().slice(5,10)}; posts.value.unshift(next); const result=await createSupabaseBrowserClient()?.from("forum_posts").upsert([{id:next.id,board:next.board,title:next.title,content:next.content,tags:next.tags,author:next.author,replies:next.replies,likes:next.likes,pinned:false,featured:false,created_at:next.createdAt}]); notice.value=result?.error?"帖子已保存到本地，云端同步失败。":"帖子已发布。"; go("forum"); }

onMounted(async()=>{ const client=createSupabaseBrowserClient(); if(!client)return; try { const [w,wo,p,t,u]=await Promise.all([client.from("wiki_pages").select("*").order("id"),client.from("works").select("*").order("id",{ascending:false}),client.from("forum_posts").select("*").order("id",{ascending:false}),client.from("tools").select("*").order("rating",{ascending:false}),client.auth.getUser()]); if(w.data?.length) wiki.value=w.data.map((x:any)=>({...x,imageUrl:x.image_url})); if(wo.data?.length) works.value=wo.data.map((x:any)=>({...x,desc:x.description,imageUrl:x.image_url})); if(p.data?.length) posts.value=p.data.map((x:any)=>({...x,createdAt:x.created_at,tags:x.tags??[]})); if(t.data?.length) tools.value=t.data.map((x:any)=>({...x,tags:x.tags??[]})); if(u.data.user) await applyAuthUser(u.data.user); notice.value="Supabase 云端内容已连接。"; } catch { notice.value="云端暂不可用，已使用本地副本。"; } });
</script>

<template>
  <main :class="{workbench}">
    <header v-if="!workbench">
      <div class="toolbar-top">
        <button class="brand" @click="go('home')"><b>G</b><span>GUNPLA WIKI</span></button>
        <nav><button v-for="item in navItems" :key="item.p" :class="{active:page===item.p}" @click="go(item.p)">{{item.l}}</button><button v-if="user.role==='admin'" @click="go('admin')">管理</button></nav>
        <div class="account"><button v-if="user.role==='guest'" class="black" @click="go('login')">登录</button><button v-else @click="signOut">退出</button><button class="black" @click="go('profile')">@{{user.username}}</button></div>
      </div>
      <div class="global-search"><input v-model="query" placeholder="搜索套件、作品、帖子或工具" @keyup.enter="search()"/><button @click="filterOpen=!filterOpen">筛选</button><button class="black" @click="search()">搜索</button></div>
    </header>

    <div class="notice">{{notice}}</div>

    <section v-if="page==='home'" class="stack">
      <div class="hero"><small>GUNPLA / MODEL / KNOWLEDGE</small><h1>高达模型制作知识与作品社区</h1><p>查找制作教程、套件资料与工具评价，分享作品并共同完善知识库。</p><div><button class="black" @click="openWiki(wiki[0].id)">浏览知识库</button><button @click="go('gallery')">查看作品</button></div></div>
      <div class="visual-grid"><button v-for="item in wiki.slice(0,2)" :key="item.id" class="visual-card" @click="openWiki(item.id)"><div class="cover">本周热门套件</div><h3>{{item.title}}</h3><p>{{item.category}} · {{item.views.toLocaleString()}} 浏览</p></button><button v-for="work in works.slice(0,2)" :key="work.id" class="visual-card" @click="openWork(work.id)"><div class="cover dark">最新作品</div><h3>{{work.title}}</h3><p>{{work.kit}}</p></button></div>
      <div class="three-grid"><article><h2>热门条目</h2><button v-for="item in wiki" :key="item.id" class="list-row" @click="openWiki(item.id)"><b>{{item.title}}</b><span>{{item.tags.join(' · ')}}</span></button></article><article><h2>最新作品</h2><button v-for="work in works" :key="work.id" class="list-row" @click="openWork(work.id)"><b>{{work.title}}</b><span>♥ {{work.likes}} · 评论 {{work.comments}}</span></button></article><article><h2>社区动态</h2><button v-for="post in posts" :key="post.id" class="list-row" @click="go('forum')"><b>{{post.title}}</b><span>{{post.board}} · {{post.replies}} 回复</span></button></article></div>
    </section>

    <section v-else-if="page==='wiki'" class="wiki-layout">
      <aside><div class="kit-cover">{{selectedWiki.grade??'WIKI'}}<strong>{{selectedWiki.title}}</strong></div><div class="spec-grid"><span>📐 {{selectedWiki.scale??'—'}}</span><span>🧩 {{selectedWiki.grade??'—'}}</span><span>📅 {{selectedWiki.release??'—'}}</span><span>💴 {{selectedWiki.price??'—'}}</span></div><h3>知识库目录</h3><button v-for="item in wiki" :key="item.id" class="list-row" @click="openWiki(item.id)">{{item.title}}</button><select @change="onCollectionChange"><option value="">加入我的清单</option><option value="wishlist">想买清单</option><option value="planned">想做清单</option><option value="completed">已做清单</option><option value="abandoned">弃坑清单</option></select></aside>
      <article><div class="title-row"><div><div class="tags"><button v-for="tag in selectedWiki.tags" :key="tag" @click="search(tag)">#{{tag}}</button></div><h1>{{selectedWiki.title}}</h1><p>{{selectedWiki.summary}}</p></div><div><button @click="printPage">打印</button><button class="black" @click="workbench=!workbench">{{workbench?'退出工作台':'工作台模式'}}</button></div></div><div class="tutorial"><div class="title-row"><h2>制作步骤</h2><button @click="compactSteps=!compactSteps">{{compactSteps?'图文模式':'紧凑模式'}}</button></div><div :class="['steps',{compact:compactSteps}]" ><button v-for="(step,index) in steps(selectedWiki.content)" :key="step" :class="{done:progress[`${selectedWiki.id}-${index}`]}" @click="toggleStep(index)"><b>{{progress[`${selectedWiki.id}-${index}`]?'✓':index+1}}</b><span>{{step}}</span></button></div></div><div class="prose" v-html="markdown(selectedWiki.content)"></div><div class="palette"><h2>配色方案</h2><div><span v-for="color in ['#efede5','#1f3f78','#b52d32','#d0a72e']" :key="color"><i :style="{background:color}"></i>{{color}}</span></div></div></article>
    </section>

    <section v-else-if="page==='gallery'" class="stack"><div class="page-head"><div><small>COMMUNITY WORKS</small><h1>作品展示</h1></div></div><div class="card-grid"><article v-for="work in works" :key="work.id"><div :class="['work-image',work.color]"></div><div class="card-body"><small>{{work.kit}} · {{work.author}}</small><h2>{{work.title}}</h2><p>{{work.desc}}</p><div class="tags"><button v-for="tag in work.tags" :key="tag" @click="search(tag)">#{{tag}}</button></div><div class="timeline"><span v-for="stage in ['开箱','素组','渗线','水贴','消光','成品']" :key="stage">✓ {{stage}}</span></div></div></article></div></section>

    <section v-else-if="page==='forum'" class="forum-layout"><aside><h2>讨论版块</h2><button v-for="b in boards" :key="b">{{b}}</button></aside><div class="stack"><div class="page-head"><div><small>COMMUNITY BOARD</small><h1>讨论区</h1></div><button class="black" @click="user.role==='guest'?go('login'):go('publish-post')">＋ 发布新帖</button></div><article v-for="post in posts" :key="post.id"><small>{{post.board}}</small><h2>{{post.title}}</h2><p>{{post.content}}</p><div class="tags"><button v-for="tag in post.tags" :key="tag" @click="search(tag)">#{{tag}}</button></div><footer>{{post.author}} · {{post.replies}} 回复 · {{post.likes}} 赞</footer></article></div></section>

    <section v-else-if="page==='publish-post'" class="form-layout"><article><small>CREATE DISCUSSION</small><h1>发布新帖</h1><label>帖子标题 *<input v-model="postTitle" placeholder="清晰概括讨论内容"/></label><label>内容主题 *<input v-model="postTopic" placeholder="例如：渗线液选择与使用顺序"/></label><label>正文内容 *<textarea v-model="postContent" rows="12" placeholder="详细描述背景、已有尝试和希望讨论的方向"></textarea></label></article><aside><h2>选择目标版块</h2><button v-for="b in boards" :key="b" :class="{active:postBoard===b}" @click="postBoard=b">{{b}}</button><label>自定义标签<input v-model="postTags" placeholder="RG, 渗线, 新手求助"/></label><button class="black publish" @click="publishPost">发布到「{{postBoard}}」</button></aside></section>

    <section v-else-if="page==='tools'" class="stack"><div class="page-head"><div><small>TOOL DATABASE</small><h1>工具评测库</h1></div></div><div class="card-grid"><article v-for="tool in tools" :key="tool.id" @click="selectedToolId=tool.id"><small>{{tool.brand}} · {{tool.category}}</small><h2>{{tool.name}}</h2><div class="rating">{{tool.rating}}</div><p>{{tool.price}} · {{tool.reviews}} 条评价</p><div class="tags"><button v-for="tag in tool.tags" :key="tag" @click.stop="search(tag)">#{{tag}}</button></div><button @click.stop="ownedTools.includes(tool.id)?ownedTools=ownedTools.filter(id=>id!==tool.id):ownedTools.push(tool.id)">{{ownedTools.includes(tool.id)?'✓ 我的工具箱已有':'＋ 加入我的工具箱'}}</button></article></div><article class="tool-detail"><h2>{{selectedTool.name}} 五维评分</h2><div class="score-grid"><span v-for="(v,k) in {性价比:4.4,耐用度:4.7,易用性:4.2,精度:selectedTool.rating,手感:4.6}" :key="k"><b>{{k}}</b><i><em :style="{width:`${v/5*100}%`}"></em></i>{{v}}</span></div></article></section>

    <section v-else-if="page==='collections'" class="stack"><div class="page-head"><div><small>MY BACKLOG</small><h1>我的模型清单</h1></div></div><div class="four-grid"><article v-for="group in [{s:'wishlist',n:'想买清单'},{s:'planned',n:'想做清单'},{s:'completed',n:'已做清单'},{s:'abandoned',n:'弃坑清单'}]" :key="group.s"><h2>{{group.n}}</h2><button v-for="item in collections.filter(x=>x.status===group.s)" :key="item.pageId" class="list-row" @click="openWiki(item.pageId)">{{wiki.find(x=>x.id===item.pageId)?.title}}</button><p v-if="!collections.some(x=>x.status===group.s)">暂无条目</p></article></div></section>

    <section v-else-if="page==='calendar'" class="stack"><div class="hero"><small>RELEASE TRACKER / 2026</small><h1>新套件发售日历</h1><p>追踪官方确认、封绘公开、发售与再贩状态。</p></div><article><div v-for="item in releases" :key="item.name" class="release-row"><b>{{item.date}}</b><span><small>{{item.grade}}</small><strong>{{item.name}}</strong></span><em>{{item.status}}</em></div></article></section>

    <section v-else-if="page==='search'" class="stack"><article><div class="page-head"><div><small>GLOBAL SEARCH</small><h1>全文搜索</h1></div><button @click="filterOpen=!filterOpen">筛选</button></div><div v-if="filterOpen" class="filters"><select v-model="scope"><option value="all">全部版面</option><option value="wiki">知识库</option><option value="works">作品</option><option value="forum">讨论</option><option value="tools">工具</option></select><button v-for="tag in allTags" :key="tag" :class="{active:selectedTag===tag}" @click="selectedTag=selectedTag===tag?'':tag">#{{tag}}</button></div></article><div class="search-list"><article v-for="item in searchResults" :key="`${item.kind}-${item.id}`" @click="openResult(item)"><div class="thumb">{{item.type}}</div><div><small>{{item.type}}</small><h2>{{item.title}}</h2><p>{{item.desc}}</p><div class="tags"><span v-for="tag in item.tags" :key="tag">#{{tag}}</span></div></div></article></div></section>

    <section v-else-if="page==='login'" class="login-card"><small>MEMBER ACCESS</small><h1>账号登录</h1><label>邮箱<input v-model="loginEmail" type="email"/></label><label>密码<input v-model="loginPassword" type="password"/></label><button class="black" :disabled="authBusy||!loginEmail||loginPassword.length<6" @click="signIn">{{authBusy?'登录中…':'登录'}}</button></section>

    <section v-else-if="page==='profile'" class="stack"><article><small>ACCOUNT IDENTITY</small><h1>@{{user.username}}</h1><p>{{user.role==='guest'?'访客':'注册用户'}} · 制作清单 {{collections.length}} 项 · 工具箱 {{ownedTools.length}} 件</p></article><div class="three-grid"><article><h2>参与条目</h2><strong class="metric">{{wiki.length}}</strong></article><article><h2>发布作品</h2><strong class="metric">{{works.filter(x=>x.author===user.username).length}}</strong></article><article><h2>发起讨论</h2><strong class="metric">{{posts.filter(x=>x.author===user.username).length}}</strong></article></div></section>

    <section v-else class="stack"><article><h1>管理员后台</h1><p>仅管理员可管理用户、审核编辑和删除内容。</p></article></section>
  </main>
</template>
