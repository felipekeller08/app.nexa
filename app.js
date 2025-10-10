/* ===== util ===== */
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];
const toNum=v=>v?Number(v):0;
const fmtBRL=v=>(isNaN(v)?0:+v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

// ==== usa data LOCAL (não UTC) ====
const todayISO=()=>{
  const d=new Date();
  d.setHours(0,0,0,0);
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};

const escapeHtml=s=>(s||"").replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtData=iso=>{try{const d=new Date(iso+"T00:00:00");return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});}catch{return iso;}};

/* ===== Aviso grande central ===== */
(function ensureNoticeStyles(){
  if (document.getElementById("notice-styles")) return;
  const css = `
  @keyframes nexaFadeScaleIn { from { opacity:.0; transform: translateY(8px) scale(.98);} to { opacity:1; transform: translateY(0) scale(1);} }
  @keyframes nexaFadeOut { to { opacity:0; } }
  .nexa-notice-overlay{
    position:fixed; inset:0; z-index:10000; display:grid; place-items:center;
    background: color-mix(in oklab, #000 50%, transparent);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    animation: nexaFadeScaleIn .18s ease-out both;
  }
  .nexa-notice{
    max-width:min(92vw,560px); width:100%;
    border-radius:20px; padding:28px 24px; text-align:center;
    box-shadow: 0 25px 80px -20px rgba(0,0,0,.5);
    animation: nexaFadeScaleIn .22s ease-out both;
  }
  .nexa-notice h3{ margin:0 0 8px 0; font-size: clamp(18px, 3.5vw, 22px); font-weight:800; letter-spacing:.2px; }
  .nexa-notice p{ margin:0; opacity:.95; font-size: clamp(14px, 3vw, 16px); }
  .nexa-notice .cta{
    margin-top:18px; display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:10px 18px; border-radius:12px; font-weight:700; cursor:pointer; user-select:none;
    box-shadow: 0 6px 20px -6px rgba(0,0,0,.35);
  }

  /* Tema Dark */
  :root[data-theme="dark"] .nexa-notice{ background: #0b1022; border:1px solid rgba(255,255,255,.06); color:#e7ecff; }
  :root[data-theme="dark"] .nexa-notice.success { border-color: rgba(16,185,129,.25); }
  :root[data-theme="dark"] .nexa-notice.info    { border-color: rgba(59,130,246,.25); }
  :root[data-theme="dark"] .nexa-notice.error   { border-color: rgba(239,68,68,.25); }
  :root[data-theme="dark"] .nexa-notice .cta    { background: #111a36; color:#dce7ff; }

  /* Tema Light */
  :root[data-theme="light"] .nexa-notice{ background:#ffffff; border:1px solid rgba(0,0,0,.08); color:#0b1226; }
  :root[data-theme="light"] .nexa-notice.success { border-color: rgba(16,185,129,.35); }
  :root[data-theme="light"] .nexa-notice.info    { border-color: rgba(30,64,175,.35); }
  :root[data-theme="light"] .nexa-notice.error   { border-color: rgba(185,28,28,.35); }
  :root[data-theme="light"] .nexa-notice .cta    { background: #eef2ff; color:#0b1226; }

  .nexa-notice .icon{
    display:inline-flex; width:54px; height:54px; border-radius:14px; align-items:center; justify-content:center; margin-bottom:10px;
  }
  :root[data-theme="dark"] .nexa-notice.success .icon { background: rgba(16,185,129,.12); color:#6ee7b7; }
  :root[data-theme="dark"] .nexa-notice.info    .icon { background: rgba(59,130,246,.12); color:#93c5fd; }
  :root[data-theme="dark"] .nexa-notice.error   .icon { background: rgba(239,68,68,.12); color:#fecaca; }
  :root[data-theme="light"] .nexa-notice.success .icon { background: rgba(16,185,129,.14); color:#065f46; }
  :root[data-theme="light"] .nexa-notice.info    .icon { background: rgba(30,64,175,.14); color:#1e3a8a; }
  :root[data-theme="light"] .nexa-notice.error   .icon { background: rgba(185,28,28,.14); color:#7f1d1d; }
  `;
  const style = document.createElement("style");
  style.id = "notice-styles";
  style.textContent = css;
  document.head.appendChild(style);
})();

function showCenterNotice(message, type = "info", titleOverride) {
  const titles = { success: "Tudo certo!", info: "Aviso", error: "Ops..." };
  const icons  = { success: "✓", info: "ℹ", error: "!" };

  const overlay = document.createElement("div");
  overlay.className = "nexa-notice-overlay";
  overlay.role = "dialog";
  overlay.ariaModal = "true";

  const box = document.createElement("div");
  box.className = `nexa-notice ${type}`;

  const icon = document.createElement("div");
  icon.className = "icon";
  icon.textContent = icons[type] || "ℹ";

  const h3 = document.createElement("h3");
  h3.textContent = titleOverride || titles[type] || "Aviso";

  const p = document.createElement("p");
  p.textContent = message;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cta";
  btn.textContent = "OK";

  const close = () => {
    overlay.style.animation = "nexaFadeOut .18s ease-out forwards";
    box.style.animation = "nexaFadeOut .18s ease-out forwards";
    setTimeout(()=>overlay.remove(), 160);
  };

  btn.addEventListener("click", close);
  overlay.addEventListener("click", (e)=>{ if (e.target === overlay) close(); });
  document.addEventListener("keydown", function esc(e){ if(e.key==="Escape"){ close(); document.removeEventListener("keydown", esc); }});

  box.appendChild(icon);
  box.appendChild(h3);
  box.appendChild(p);
  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  setTimeout(close, 2400);
}

/* ===== tema ===== */
const root=document.documentElement;
(function(){const t=localStorage.getItem("nexa-theme");root.setAttribute("data-theme",t==="light"?"light":"dark");document.body.style.colorScheme=root.getAttribute("data-theme");})();
$("#btnTheme").addEventListener("click",()=>{
  const next=root.getAttribute("data-theme")==="dark"?"light":"dark";
  root.setAttribute("data-theme",next);localStorage.setItem("nexa-theme",next);document.body.style.colorScheme=next;
  $("#iconTheme").innerHTML= next==="light"
    ? '<path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM17.21 16.86l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM12 4V1h-2v3h2zm0 22v-3h-2v3h2zM4 12H1v2h3v-2zm22 0h-3v2h3v-2zM5.34 17.66l-1.8 1.79 1.41 1.41 1.79-1.8-1.4-1.4zM18.66 6.34l1.79-1.8-1.41-1.41-1.8 1.79 1.42 1.42z"/><circle cx="12" cy="12" r="5"/>'
    : '<path d="M21.64 13A9 9 0 1 1 11 2.36 7 7 0 0 0 21.64 13Z"/>';
});

/* ===== PWA (manifest mínimo) ===== */
(function(){const m={name:"Nexa",short_name:"Nexa",start_url:".",display:"standalone",background_color:"#040b1e",theme_color:"#040b1e",icons:[{src:"icon-192.png",sizes:"192x192",type:"image/png"},{src:"icon-512.png",sizes:"512x512",type:"image/png"}]};const blob=new Blob([JSON.stringify(m)],{type:"application/manifest+json"});const link=document.createElement("link");link.rel="manifest";link.href=URL.createObjectURL(blob);document.head.appendChild(link);})();

/* ===== Firebase ===== */
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut }
  from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { collection, addDoc, doc, setDoc, getDoc, getDocs, onSnapshot, query, where, updateDoc, deleteDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
const auth=window.__nexa.auth, db=window.__nexa.db;

/* ===== navegação ===== */
const drawer=$("#drawer"), overlay=$("#overlay");
$("#btnMenu").addEventListener("click",()=>{drawer.classList.toggle("drawer--open");overlay.classList.toggle("hidden");});
overlay.addEventListener("click",()=>{drawer.classList.toggle("drawer--open");overlay.classList.toggle("hidden");});
$$(".nav-btn").forEach(b=>b.addEventListener("click",e=>{showView(e.currentTarget.dataset.nav);drawer.classList.remove("drawer--open");overlay.classList.add("hidden");}));
function showView(v){$$(".view").forEach(s=>s.classList.add("hidden"));$(`#view-${v}`).classList.remove("hidden");}

/* ===== auth modal ===== */
const authModal=$("#authModal");
$("#btnUser").addEventListener("click",()=>authModal.showModal());
$("#btnCloseModal").addEventListener("click",(e)=>{e.preventDefault();authModal.close();});
$("#btnLogin").addEventListener("click",async(e)=>{e.preventDefault();const email=$("#authEmail").value.trim(),pass=$("#authPass").value.trim();if(!email||!pass)return;await signInWithEmailAndPassword(auth,email,pass).catch(alert);});
$("#btnSignup").addEventListener("click",async(e)=>{e.preventDefault();const email=$("#authEmail").value.trim(),pass=$("#authPass").value.trim();if(!email||!pass)return;await createUserWithEmailAndPassword(auth,email,pass).catch(alert);});
$("#btnLogout").addEventListener("click",async()=>{if(auth.currentUser) await signOut(auth);});

/* ===== Intenção de autenticação (para avisos) ===== */
let __lastAuthIntent = null;
let __prevUid = null;
document.getElementById("btnLogin")?.addEventListener("click",()=>{__lastAuthIntent="login";},true);
document.getElementById("btnSignup")?.addEventListener("click",()=>{__lastAuthIntent="signup";},true);
document.getElementById("btnLogout")?.addEventListener("click",()=>{__lastAuthIntent="logout";},true);

/* ===== estado global ===== */
let USER=null;
let charts={};
let comprasCache=[];
let limiteGasto=0;

/* ===== caminhos firestore ===== */
const colStudies=()=>collection(db,`users/${USER.uid}/studies`);
const colGoals  =()=>collection(db,`users/${USER.uid}/goals`);
const colTasks  =()=>collection(db,`users/${USER.uid}/tasks`);
const colPurch  =()=>collection(db,`users/${USER.uid}/purchases`);
const colEnts   =()=>collection(db,`users/${USER.uid}/fin_entries`);
const colExits  =()=>collection(db,`users/${USER.uid}/fin_exits`);
const docMeta   =()=>doc(db,`users/${USER.uid}/meta/_root`);

/* ===== onAuth — lógica da app (sem abrir o modal automaticamente) ===== */
onAuthStateChanged(auth,(user)=>{
  USER=user||null;
  if(USER){
    authModal.close();
    bootStreams();
    showView("home");
  }else{
    Object.values(charts).forEach(c=>c?.destroy?.()); charts={};
    ["listaEstudos","estudosConcluidos","listaMetas","listaTarefas","listaCompras","homeTopEstudos","homeTopCompras","homeTarefas"]
      .forEach(id=>{const el=$("#"+id);if(el) el.innerHTML="";});
    ["kpiEntradas","kpiSaidas","kpiReserva","kpiSaldo"].forEach(k=>$("#"+k).textContent="—");
    showView("home");
  }
});

/* ===== onAuth — avisos grandes ===== */
onAuthStateChanged(auth,(user)=>{
  const currUid = user ? user.uid : null;
  const entrouAgora  = !__prevUid && currUid;
  const saiuAgora    = __prevUid && !currUid;

  if (entrouAgora) {
    if (__lastAuthIntent === "signup") {
      showCenterNotice("Conta criada com sucesso.", "success", "Bem-vindo(a) ao Nexa!");
    } else if (__lastAuthIntent === "login") {
      showCenterNotice("Entrou com sucesso.", "success", "Bem-vindo(a) de volta!");
    }
  } else if (saiuAgora && __lastAuthIntent === "logout") {
    showCenterNotice("Usuário desconectado.", "info", "Até logo!");
  }

  __prevUid = currUid;
  __lastAuthIntent = null;
});

/* ===== Estudos ===== */
$("#formEstudo").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const title=$("#estudoTitulo").value.trim(),inicio=$("#estudoInicio").value,fim=$("#estudoFim").value;
  if(!title||!inicio||!fim) return;
  await addDoc(colStudies(),{title,inicio,fim,daysStudied:0,lastCheck:"",status:"ativo",createdAt:serverTimestamp()});
  e.target.reset();
});
function estudoCard(d,done=false){
  return `<div class="item">
    <div>
      <div class="item-title">${escapeHtml(d.title)}</div>
      <div class="item-meta">${fmtData(d.inicio)} → ${fmtData(d.fim)}</div>
      ${!done?`<div class="mt-2 text-sm"><div class="mb-1">Você estudou hoje?</div>
      <div class="flex gap-2"><button class="chip" data-study-yes="${d.id}">Sim</button><button class="chip" data-study-no="${d.id}">Não</button></div></div>`:""}
      <div class="mt-2 text-sm text-muted">Dias estudados: <strong>${d.daysStudied||0}</strong></div>
    </div>
    <div class="flex items-center gap-2">${!done?`<button class="btn-mini" data-study-done="${d.id}">Concluir</button>`:""}<button class="btn-danger-mini" data-study-del="${d.id}">Excluir</button></div>
  </div>`;
}
function renderEstudos(arr){
  const ativos=arr.filter(x=>x.status==="ativo"), concl=arr.filter(x=>x.status==="concluido");
  $("#listaEstudos").innerHTML=ativos.map(x=>estudoCard(x)).join("")||empty("Sem estudos.");
  $("#estudosConcluidos").innerHTML=concl.map(x=>estudoCard(x,true)).join("")||empty("Nada concluído ainda.");
}

/* >>> FIX: registrar o mesmo handler nos dois contêineres <<< */
["#listaEstudos","#estudosConcluidos"].forEach(sel=>{
  $(sel)?.addEventListener("click",async(e)=>{
    const yes=e.target.closest("[data-study-yes]"), no=e.target.closest("[data-study-no]");
    const fin=e.target.closest("[data-study-done]"), del=e.target.closest("[data-study-del]");
    if(yes||no){
      const id=(yes||no).dataset.studyYes || (yes||no).dataset.studyNo;
      const ref=doc(db,`users/${USER.uid}/studies/${id}`), snap=await getDoc(ref), data=snap.data()||{}, t=todayISO();
      if(data.lastCheck!==t && yes) await updateDoc(ref,{daysStudied:(data.daysStudied||0)+1,lastCheck:t});
      else await updateDoc(ref,{lastCheck:t});
    }
    if(fin) await updateDoc(doc(db,`users/${USER.uid}/studies/${fin.dataset.studyDone}`),{status:"concluido"});
    if(del) await deleteDoc(doc(db,`users/${USER.uid}/studies/${del.dataset.studyDel}`));
  });
});

/* ===== Metas ===== */
let currentMetaTab="andamento", _metasCache=[];
$$('[data-meta]').forEach(b=>b.addEventListener("click",e=>{
  currentMetaTab=e.currentTarget.dataset.meta; $$('[data-meta]').forEach(x=>x.classList.remove("chip-active")); e.currentTarget.classList.add("chip-active");
  renderMetas(_metasCache);
}));
$("#formMeta").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const title=$("#metaTitulo").value.trim(),inicio=$("#metaInicio").value,fim=$("#metaFim").value;
  if(!title||!inicio||!fim) return;
  const status=(new Date(fim)<new Date())?"nao-concluida":"andamento";
  await addDoc(colGoals(),{title,inicio,fim,status,createdAt:serverTimestamp()}); e.target.reset();
});
function metaItem(d){
  const badge=d.status==="concluida"?"bg-emerald-600/20 text-emerald-300":d.status==="nao-concluida"?"bg-alert/20 text-alert":"bg-primary/20 text-primary-200";
  const action=d.status==="andamento"?`<button class="btn-mini" data-meta-done="${d.id}">Marcar como concluída</button>`:"";
  return `<div class="item"><div><div class="item-title">${escapeHtml(d.title)}</div><div class="item-meta">${fmtData(d.inicio)} → ${fmtData(d.fim)}</div><span class="badge ${badge}">${d.status==="andamento"?"Em andamento":d.status==="concluida"?"Concluída":"Não concluída"}</span></div><div class="flex items-center gap-2">${action}<button class="btn-danger-mini" data-meta-del="${d.id}">Excluir</button></div></div>`;
}
function renderMetas(arr){ _metasCache=arr; const f=arr.filter(d=>currentMetaTab==="andamento"?d.status==="andamento":currentMetaTab==="concluida"?d.status==="concluida":d.status==="nao-concluida"); $("#listaMetas").innerHTML=f.map(metaItem).join("")||empty("Sem metas.");}
$("#listaMetas").addEventListener("click",async(e)=>{const done=e.target.closest("[data-meta-done]"),del=e.target.closest("[data-meta-del]"); if(done) await updateDoc(doc(db,`users/${USER.uid}/goals/${done.dataset.metaDone}`),{status:"concluida"}); if(del) await deleteDoc(doc(db,`users/${USER.uid}/goals/${del.dataset.metaDel}`));});

/* ===== Tarefas ===== */
let currentTaskTab="pendente", _taskCache=[];
$$('[data-tf]').forEach(b=>b.addEventListener("click",e=>{
  currentTaskTab=e.currentTarget.dataset.tf; $$('[data-tf]').forEach(x=>x.classList.remove("chip-active")); e.currentTarget.classList.add("chip-active"); renderTarefas(_taskCache);
}));
$("#formTarefa").addEventListener("submit",async(e)=>{
  e.preventDefault(); const title=$("#tarefaTitulo").value.trim(),desc=$("#tarefaDesc").value.trim();
  if(!title) return; await addDoc(colTasks(),{title,desc,status:"pendente",createdAt:serverTimestamp()}); e.target.reset();
});
function taskItem(d){const created=d.createdAt?.toDate?.()?d.createdAt.toDate().toLocaleDateString("pt-BR"):"-";return `<div class="item"><div><div class="item-title">${escapeHtml(d.title)}</div><div class="item-meta">Criada em ${created}</div><div class="text-sm text-muted">${escapeHtml(d.desc||"")}</div><div class="mt-2"><select class="input w-44 select-clean" data-task-status="${d.id}"><option ${d.status==="pendente"?"selected":""}>pendente</option><option ${d.status==="andamento"?"selected":""}>andamento</option><option ${d.status==="concluida"?"selected":""}>concluida</option></select></div></div><div class="flex items-center gap-2"><button class="btn-danger-mini" data-task-del="${d.id}">Excluir</button></div></div>`;}
function renderTarefas(arr){_taskCache=arr;const f=arr.filter(d=>d.status===currentTaskTab);$("#listaTarefas").innerHTML=f.map(taskItem).join("")||empty("Nada aqui.");}
$("#listaTarefas").addEventListener("change",async(e)=>{const s=e.target.closest("[data-task-status]");if(s) await updateDoc(doc(db,`users/${USER.uid}/tasks/${s.dataset.taskStatus}`),{status:s.value});});
$("#listaTarefas").addEventListener("click",async(e)=>{const del=e.target.closest("[data-task-del]");if(del) await deleteDoc(doc(db,`users/${USER.uid}/tasks/${del.dataset.taskDel}`));});

/* ===== Compras ===== */
$("#formCompra").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const item=$("#compraItem").value.trim(), categoria=$("#compraCategoria").value, qtd=toNum($("#compraQtd").value), preco=toNum($("#compraPreco").value);
  if(!item||!categoria||!qtd||!preco){alert("Preencha todos os campos.");return;}
  const total=qtd*preco;
  const ref=await addDoc(colPurch(),{item,categoria,qtd,preco,total,createdAt:serverTimestamp()});
  await addDoc(colExits(),{amount:total,date:todayISO(),createdAt:serverTimestamp(),origin:"compra",ref:ref.id});
  e.target.reset();
});
$("#btnAplicarLimite").addEventListener("click",()=>{limiteGasto=toNum($("#limiteGasto").value);buildCompraCharts(comprasCache);});
function renderCompras(arr){
  comprasCache=arr.slice().sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  $("#listaCompras").innerHTML=comprasCache.map(d=>`<div class="item"><div><div class="item-title">${escapeHtml(d.item)}</div><div class="item-meta">Categoria: ${escapeHtml(d.categoria)} • Qtd: ${d.qtd} • Total: <strong>${fmtBRL(d.total)}</strong></div></div><div class="flex items-center gap-2"><button class="btn-mini" data-compra-edit="${d.id}">Editar</button><button class="btn-danger-mini" data-compra-del="${d.id}">Excluir</button></div></div>`).join("")||empty("Sem compras registradas.");
  buildCompraCharts(comprasCache);
}
$("#listaCompras").addEventListener("click",async(e)=>{
  const del=e.target.closest("[data-compra-del]"), edit=e.target.closest("[data-compra-edit]");
  if(del){
    const id=del.dataset.compraDel;
    const q=await getDocs(query(colExits(), where("ref","==",id), where("origin","==","compra"))); q.forEach(async d=>await deleteDoc(doc(db,`users/${USER.uid}/fin_exits/${d.id}`)));
    await deleteDoc(doc(db,`users/${USER.uid}/purchases/${id}`));
  }
  if(edit){
    const id=edit.dataset.compraEdit, ref=doc(db,`users/${USER.uid}/purchases/${id}`), snap=await getDoc(ref), data=snap.data();
    const item=prompt("Item",data.item); if(!item) return;
    const categoria=prompt("Categoria",data.categoria)||data.categoria;
    const qtd=Number(prompt("Quantidade",data.qtd))||data.qtd;
    const preco=Number(prompt("Preço unitário",data.preco))||data.preco;
    const total=qtd*preco;
    await updateDoc(ref,{item,categoria,qtd,preco,total});
    const q=await getDocs(query(colExits(), where("ref","==",id), where("origin","==","compra"))); q.forEach(async d=>await updateDoc(doc(db,`users/${USER.uid}/fin_exits/${d.id}`),{amount:total}));
  }
});
function buildCompraCharts(arr){
  charts.chartLimite?.destroy?.(); charts.chartCategorias?.destroy?.();
  const gastoTotal=arr.reduce((s,i)=>s+toNum(i.total),0);
  charts.chartLimite=new Chart($("#chartLimite"),{type:"bar",data:{labels:["Gasto","Limite"],datasets:[{label:"R$",data:[gastoTotal,limiteGasto||0]}]},options:{responsive:true,plugins:{legend:{display:false}}}});
  const porCat=arr.reduce((a,i)=>{a[i.categoria]=(a[i.categoria]||0)+toNum(i.total);return a;},{}); 
  charts.chartCategorias=new Chart($("#chartCategorias"),{type:"bar",data:{labels:Object.keys(porCat),datasets:[{label:"R$",data:Object.values(porCat)}]},options:{responsive:true}});
}

/* ===== Finanças ===== */
$("#formLancamentos").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const ent=toNum($("#finEntrada").value), sai=toNum($("#finSaida").value), res=toNum($("#finReserva").value), d=todayISO();
  if(ent>0) await addDoc(colEnts(),{amount:ent,date:d,createdAt:serverTimestamp()});
  if(sai>0) await addDoc(colExits(),{amount:sai,date:d,createdAt:serverTimestamp(),origin:"manual"});
  if(!isNaN(res)) await setDoc(docMeta(),{reserva:res},{merge:true});
  e.target.reset();
});
async function computeKpis(){
  const [eSnap,sSnap,mSnap]=await Promise.all([getDocs(colEnts()),getDocs(colExits()),getDoc(docMeta())]);
  const entradas=eSnap.docs.reduce((s,d)=>s+toNum(d.data().amount),0);
  const saidas=snapToTotal(sSnap);
  const reserva=toNum(mSnap.data()?.reserva||0);
  $("#kpiEntradas").textContent=fmtBRL(entradas);
  $("#kpiSaidas").textContent=fmtBRL(saidas);
  $("#kpiReserva").textContent=fmtBRL(reserva);
  $("#kpiSaldo").textContent=fmtBRL(entradas-saidas+reserva);
}
function snapToTotal(snap){return snap.docs.reduce((s,d)=>s+toNum(d.data().amount),0);}
const group={
  semana(arr){
    const base=new Date(); // data local
    const d=(base.getDay()+6)%7;
    const mon=new Date(base);
    mon.setHours(0,0,0,0);
    mon.setDate(base.getDate()-d);
    const L=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],map=new Array(7).fill(0);
    arr.forEach(({date,amount})=>{
      const dt=new Date(date+"T00:00:00");
      const i=Math.floor((dt-mon)/86400000);
      if(i>=0&&i<7) map[i]+=toNum(amount);
    });
    return{labels:L,data:map};
  },
  mes(arr){const b=new Date(),y=b.getFullYear(),m=b.getMonth(),L=["Sem 1","Sem 2","Sem 3","Sem 4"],map=[0,0,0,0];
    arr.forEach(({date,amount})=>{const dt=new Date(date+"T00:00:00");if(dt.getMonth()===m&&dt.getFullYear()===y){const w=Math.min(3,Math.floor((dt.getDate()-1)/7));map[w]+=toNum(amount);}});
    return{labels:L,data:map};},
  ano(arr){const L=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],map=new Array(12).fill(0);
    arr.forEach(({date,amount})=>{const dt=new Date(date+"T00:00:00");if(!isNaN(dt)) map[dt.getMonth()]+=toNum(amount);});
    return { labels: L, data: map };
  }
};
$("#finChartMode").addEventListener("change",buildFinChart);
$("#homeFinanceMode").addEventListener("change",buildHomeChart);
async function getFinData(){const [e,s]=await Promise.all([getDocs(colEnts()),getDocs(colExits())]);return{entradas:e.docs.map(d=>d.data()),saidas:s.docs.map(d=>d.data())};}
async function buildFinChart(){if(!USER)return;const m=$("#finChartMode").value;const {entradas,saidas}=await getFinData();const A=group[m](entradas),B=group[m](saidas);charts.chartFin?.destroy?.();charts.chartFin=new Chart($("#chartFin"),{type:"bar",data:{labels:A.labels,datasets:[{label:"Entradas",data:A.data},{label:"Saídas",data:B.data}]},options:{responsive:true}});}
async function buildHomeChart(){if(!USER)return;const m=$("#homeFinanceMode").value;const {entradas,saidas}=await getFinData();const A=group[m](entradas),B=group[m](saidas);charts.chartHome?.destroy?.();charts.chartHome=new Chart($("#chartHome"),{type:"bar",data:{labels:A.labels,datasets:[{label:"Entradas",data:A.data},{label:"Saídas",data:B.data}]},options:{responsive:true,plugins:{legend:{position:"bottom"}}}});}

/* ===== Conversor ===== */
$("#formFx").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const from=$("#fxFrom").value,to=$("#fxTo").value,amount=toNum($("#fxAmount").value)||1;
  const url1=`https://api.frankfurter.app/latest?amount=${amount}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const url2=`https://api.exchangerate.host/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${amount}`;
  $("#fxResult").textContent="Convertendo...";
  try{
    let out;
    const r=await fetch(url1);
    if(r.ok){
      const j=await r.json();
      out=j.rates?.[to];
    }else{
      const r2=await fetch(url2);
      const j2=await r2.json();
      out=+j2.result;
    }
    $("#fxResult").innerHTML=`<span>${amount} ${from}</span><strong>≈ ${out?.toLocaleString("pt-BR")}</strong><span>${to}</span>`;
  }catch{
    $("#fxResult").textContent="Falha de conexão.";
  }
});

/* ===== Home widgets ===== */
function kpiMini(label,val){return `<div class="mini-kpi"><span>${label}</span><strong>${val}</strong></div>`;}
async function buildHomeWidgets(){
  const es=await getDocs(colStudies()); const arrEs=es.docs.map(d=>({id:d.id,...d.data()}));
  const top=arrEs.map(x=>({...x,len:(new Date(x.fim)-new Date(x.inicio))})).sort((a,b)=>b.len-a.len).slice(0,5);
  $("#homeTopEstudos").innerHTML=top.map(x=>`<div class="row"><div><div class="item-title">${escapeHtml(x.title)}</div><div class="item-meta">${fmtData(x.inicio)} → ${fmtData(x.fim)}</div></div><span class="badge">${x.daysStudied||0} dias</span></div>`).join("")||empty("Sem estudos.");
  const cp=await getDocs(colPurch()); const arrC=cp.docs.map(d=>d.data()).sort((a,b)=>b.total-a.total).slice(0,5);
  $("#homeTopCompras").innerHTML=arrC.map(x=>`<div class="row"><div><div class="item-title">${escapeHtml(x.item)}</div><div class="item-meta">${escapeHtml(x.categoria)} • Qtd: ${x.qtd}</div></div><span class="badge">${fmtBRL(x.total)}</span></div>`).join("")||empty("Sem compras.");
  const tk=await getDocs(colTasks()); const a=tk.docs.map(d=>d.data()); const p=a.filter(x=>x.status==="pendente").length, an=a.filter(x=>x.status==="andamento").length, c=a.filter(x=>x.status==="concluida").length;
  $("#homeTarefas").innerHTML=`${kpiMini("Pendentes",p)}${kpiMini("Em andamento",an)}${kpiMini("Concluídas",c)}`;
}

/* ===== Streams ===== */
let unsubStudies=null,unsubGoals=null,unsubTasks=null,unsubPurch=null,unsubEnts=null,unsubExits=null,unsubMeta=null;
function bootStreams(){
  unsubStudies?.();unsubGoals?.();unsubTasks?.();unsubPurch?.();unsubEnts?.();unsubExits?.();unsubMeta?.();
  unsubStudies=onSnapshot(colStudies(),snap=>{const arr=snap.docs.map(d=>({id:d.id,...d.data()}));renderEstudos(arr);buildHomeWidgets();});
  unsubGoals=onSnapshot(colGoals(),async snap=>{const now=new Date();const arr=await Promise.all(snap.docs.map(async d=>{const x={id:d.id,...d.data()};if(x.status==="andamento"&&new Date(x.fim)<now){await updateDoc(doc(db,`users/${USER.uid}/goals/${x.id}`),{status:"nao-concluida"});x.status="nao-concluida";}return x;}));renderMetas(arr);buildHomeWidgets();});
  unsubTasks=onSnapshot(colTasks(),snap=>{const arr=snap.docs.map(d=>({id:d.id,...d.data()}));renderTarefas(arr);buildHomeWidgets();});
  unsubPurch=onSnapshot(colPurch(),snap=>{const arr=snap.docs.map(d=>({id:d.id,...d.data()}));renderCompras(arr);buildHomeWidgets();});
  unsubEnts=onSnapshot(colEnts(),()=>{computeKpis();buildFinChart();buildHomeChart();});
  unsubExits=onSnapshot(colExits(),()=>{computeKpis();buildFinChart();buildHomeChart();});
  unsubMeta=onSnapshot(docMeta(),()=>{computeKpis();});
  computeKpis();buildFinChart();buildHomeChart();
}

/* ===== util ===== */
function empty(t="Nada por aqui."){return `<div class="empty">${t}</div>`;}

/* ===== PWA: registrar SW ===== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(console.error);
}

/* ===== PWA: botão de instalar ===== */
let deferredPrompt;
const btnInstall=document.createElement("button");
btnInstall.id="btnInstall";
btnInstall.className="btn-outline";
btnInstall.textContent="Instalar";
btnInstall.style.marginLeft="8px";
document.querySelector(".appbar__inner > div:last-child")?.prepend(btnInstall);
btnInstall.style.display="none";

window.addEventListener("beforeinstallprompt",(e)=>{
  e.preventDefault();
  deferredPrompt=e;
  btnInstall.style.display="inline-flex";
});
btnInstall.addEventListener("click",async()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt=null;
  btnInstall.style.display="none";
});
window.addEventListener("appinstalled",()=>{ btnInstall.style.display="none"; });

/* ===== Ações (AlphaVantage) ===== */
const API_KEY = "CFZNTHL0VN6US8O7";
async function buscarAcao(symbol) {
  const resultadoDiv = document.getElementById("acaoResultado");
  resultadoDiv.textContent = "Buscando...";
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro na requisição");
    const data = await res.json();
    if (!data["Global Quote"] || !data["Global Quote"]["05. price"]) {
      resultadoDiv.textContent = "Ação não encontrada ou inválida.";
      return;
    }
    const preco = parseFloat(data["Global Quote"]["05. price"]).toFixed(2);
    const variacao = parseFloat(data["Global Quote"]["10. change percent"]).toFixed(2);
    resultadoDiv.innerHTML = `
      <strong>${symbol.toUpperCase()}</strong>: US$ ${preco}
      <span style="color:${variacao >= 0 ? '#10b981' : '#ef4444'}">
        (${variacao}%)
      </span>
    `;
  } catch (err) {
    console.error(err);
    resultadoDiv.textContent = "Erro ao buscar a ação.";
  }
}
document.getElementById("btnBuscarAcao").addEventListener("click", () => {
  const symbol = document.getElementById("acaoSymbol").value.trim();
  if (!symbol) return alert("Digite o ticker da ação.");
  buscarAcao(symbol);
});

/* ===== ENTER helpers extras ===== */
$("#acaoSymbol")?.addEventListener("keydown",(e)=>{
  if(e.key==="Enter"){
    e.preventDefault();
    document.getElementById("btnBuscarAcao")?.click();
  }
});
$("#limiteGasto")?.addEventListener("keydown",(e)=>{
  if(e.key==="Enter"){
    e.preventDefault();
    $("#btnAplicarLimite")?.click();
  }
});
$("#authPass")?.addEventListener("keydown",(e)=>{
  if(e.key==="Enter"){
    e.preventDefault();
    $("#btnLogin")?.click();
  }
});
