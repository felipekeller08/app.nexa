/* ==========================================================
   Nexa • Estudos & Metas — Lógica
   - Estudos com diário (dias estudados), streak e progresso
   - Metas com filtros: andamento / concluída / não concluída
   ========================================================== */

const K_STUDIES = 'STUDIES_V2';
const K_GOALS   = 'GOALS_V1';

let S = {
  studies: [],  // {id,title,start,end,diary: ['YYYY-MM-DD',...], done:boolean, createdAt:number}
  goals:   [],  // {id,title,start,end,status:'andamento'|'concluida'|'nao', createdAt:number}
  goalsFilter: 'andamento'
};

const $  = (sel, root=document)=> root.querySelector(sel);
const $$ = (sel, root=document)=> Array.from(root.querySelectorAll(sel));

/* ---------------------- Utils ---------------------- */
const fmtDate = (dt)=> new Date(dt).toLocaleDateString('pt-BR',{dateStyle:'medium'});
const todayStr = ()=> {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
const daysBetween = (a,b)=> {
  const d1 = new Date(a); d1.setHours(0,0,0,0);
  const d2 = new Date(b); d2.setHours(0,0,0,0);
  return Math.max(1, Math.round((d2 - d1)/86400000)+1); // inclusivo
};
const clamp = (n,min,max)=> Math.max(min, Math.min(max, n));
const uid = ()=> Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const esc = s => (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

/* ---------------------- Storage ---------------------- */
function load(){
  try { S.studies = JSON.parse(localStorage.getItem(K_STUDIES) || '[]'); } catch { S.studies = []; }
  try { S.goals   = JSON.parse(localStorage.getItem(K_GOALS)   || '[]'); } catch { S.goals   = []; }
}
function saveStudies(){ localStorage.setItem(K_STUDIES, JSON.stringify(S.studies)); }
function saveGoals(){   localStorage.setItem(K_GOALS,   JSON.stringify(S.goals)); }

/* ---------------------- Estudos ---------------------- */
function addStudy({title,start,end}){
  S.studies.unshift({ id: uid(), title, start, end, diary: [], done:false, createdAt:Date.now() });
  saveStudies(); renderStudies();
}
function markToday(id, add=true){
  const st = S.studies.find(x=>x.id===id);
  if(!st) return;
  const t = todayStr();
  const has = st.diary.includes(t);
  if(add && !has) st.diary.push(t);
  if(!add && has) st.diary = st.diary.filter(d=>d!==t);
  saveStudies(); renderStudies();
}
function concludeStudy(id){
  const st = S.studies.find(x=>x.id===id);
  if(!st) return;
  st.done = true; saveStudies(); renderStudies();
}
function deleteStudy(id){
  S.studies = S.studies.filter(x=>x.id!==id);
  saveStudies(); renderStudies();
}
function studiedToday(st){ return st.diary.includes(todayStr()); }
function streak(st){
  // conta dias consecutivos até hoje
  const set = new Set(st.diary);
  let d = new Date(); d.setHours(0,0,0,0);
  let s = 0;
  while(set.has(d.toISOString().slice(0,10))){
    s++;
    d = new Date(d.getTime()-86400000);
  }
  return s;
}
function progress(st){
  const total = daysBetween(st.start, st.end);
  const studied = st.diary.length;
  const pct = clamp(Math.round((studied/total)*100), 0, 100);
  return { studied, total, pct };
}

/* ---------------------- Metas ---------------------- */
function addGoal({title,start,end}){
  S.goals.unshift({ id: uid(), title, start, end, status:'andamento', createdAt:Date.now() });
  saveGoals(); renderGoals();
}
function setGoalStatus(id, status){
  const g = S.goals.find(x=>x.id===id);
  if(!g) return;
  g.status = status;
  saveGoals(); renderGoals();
}
function deleteGoal(id){
  S.goals = S.goals.filter(x=>x.id!==id);
  saveGoals(); renderGoals();
}

/* ---------------------- Render (Estudos) ---------------------- */
function studyItem(st){
  const {studied,total,pct} = progress(st);
  const tdy = studiedToday(st);
  const _streak = streak(st);

  const wrap = document.createElement('article');
  wrap.className = 'es-item';
  wrap.dataset.id = st.id;

  wrap.innerHTML = `
    <div>
      <h3>${esc(st.title)}</h3>
      <div class="es-sub">Início: ${fmtDate(st.start)} • Fim: ${fmtDate(st.end)}</div>
    </div>

    <div class="es-actions">
      <button class="es-btn es-btn--ok js-yes"  ${tdy?'disabled':''}>Sim</button>
      <button class="es-btn es-btn--ghost js-no" ${tdy?'':'disabled'}>Não</button>
      <button class="es-btn es-btn--ghost js-done" ${st.done?'disabled':''}>Concluir</button>
      <button class="es-btn es-btn--danger js-del">Excluir</button>
    </div>

    <div class="es-bar"><span style="width:${pct}%"></span></div>

    <div class="es-diary">
      <span class="es-badge es-badge--ok">${studied} / ${total} dia(s)</span>
      <span class="es-badge es-badge--info">progresso: ${pct}%</span>
      <span class="es-badge">streak: ${_streak} 🔥</span>
      ${st.done ? '<span class="es-badge es-badge--ok">Concluído</span>' : ''}
    </div>
  `;

  // actions
  wrap.querySelector('.js-yes')?.addEventListener('click', ()=> markToday(st.id, true));
  wrap.querySelector('.js-no') ?.addEventListener('click', ()=> markToday(st.id, false));
  wrap.querySelector('.js-done')?.addEventListener('click', ()=> concludeStudy(st.id));
  wrap.querySelector('.js-del') ?.addEventListener('click', ()=> deleteStudy(st.id));

  return wrap;
}

function renderStudies(){
  const list = $('#es-list');
  list.innerHTML = '';
  if(S.studies.length===0){
    list.innerHTML = `<div class="es-item" style="grid-column:1/-1;text-align:center;color:#64748b">
      Nenhum estudo cadastrado ainda.</div>`;
    return;
  }
  S.studies.forEach(st => list.appendChild(studyItem(st)));
}

/* ---------------------- Render (Metas) ---------------------- */
function countsGoals(){
  return {
    andamento: S.goals.filter(g=>g.status==='andamento').length,
    concluida: S.goals.filter(g=>g.status==='concluida').length,
    nao:       S.goals.filter(g=>g.status==='nao').length
  };
}
function goalItem(g){
  const wrap = document.createElement('article');
  wrap.className = 'es-item';
  wrap.dataset.id = g.id;

  const badge =
    g.status==='concluida' ? '<span class="es-badge es-badge--ok">Concluída</span>' :
    g.status==='nao'       ? '<span class="es-badge es-badge--danger">Não concluída</span>' :
                             '<span class="es-badge es-badge--info">Em andamento</span>';

  wrap.innerHTML = `
    <div>
      <h3>${esc(g.title)}</h3>
      <div class="es-sub">Início: ${fmtDate(g.start)} • Fim: ${fmtDate(g.end)}</div>
    </div>

    <div class="es-actions">
      <button class="es-btn es-btn--ghost js-and">Em andamento</button>
      <button class="es-btn es-btn--ok js-con">Concluir</button>
      <button class="es-btn es-btn--danger js-nao">Não concl.</button>
      <button class="es-btn es-btn--ghost js-del">Excluir</button>
    </div>

    <div class="es-diary">
      ${badge}
      <span class="es-badge">Criada em ${new Date(g.createdAt).toLocaleString('pt-BR')}</span>
    </div>
  `;

  wrap.querySelector('.js-and')?.addEventListener('click', ()=> setGoalStatus(g.id,'andamento'));
  wrap.querySelector('.js-con')?.addEventListener('click', ()=> setGoalStatus(g.id,'concluida'));
  wrap.querySelector('.js-nao')?.addEventListener('click', ()=> setGoalStatus(g.id,'nao'));
  wrap.querySelector('.js-del')?.addEventListener('click', ()=> deleteGoal(g.id));

  return wrap;
}
function renderGoals(){
  const list = $('#meta-list');
  const c = countsGoals();
  $('#m-count-and').textContent = c.andamento;
  $('#m-count-con').textContent = c.concluida;
  $('#m-count-nao').textContent = c.nao;

  const filtered = S.goals.filter(g=>g.status===S.goalsFilter);
  list.innerHTML = '';
  if(filtered.length===0){
    list.innerHTML = `<div class="es-item" style="grid-column:1/-1;text-align:center;color:#64748b">
      Nenhuma meta neste filtro.</div>`;
    return;
  }
  filtered.forEach(g => list.appendChild(goalItem(g)));
}

function selectGoalsTab(filter){
  S.goalsFilter = filter;
  $$('.es-chip').forEach(b=>{
    const act = b.dataset.filter === filter;
    b.classList.toggle('active', act);
    b.setAttribute('aria-selected', act ? 'true' : 'false');
  });
  renderGoals();
}

/* ---------------------- Eventos / Boot ---------------------- */
function bindForms(){
  // Estudos
  $('#es-form')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const title = ($('#es-title').value || '').trim();
    const start = $('#es-start').value;
    const end   = $('#es-end').value;
    if(!title || !start || !end) return;
    addStudy({title,start,end});
    e.target.reset();
    $('#es-title').focus();
  });

  // Metas
  $('#meta-form')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const title = ($('#meta-title').value || '').trim();
    const start = $('#meta-start').value;
    const end   = $('#meta-end').value;
    if(!title || !start || !end) return;
    addGoal({title,start,end});
    e.target.reset();
    $('#meta-title').focus();
  });

  // Tabs metas
  $('.es-tabs')?.addEventListener('click', (e)=>{
    const btn = e.target.closest('.es-chip');
    if(!btn) return;
    selectGoalsTab(btn.dataset.filter);
  });
}

export async function init(){
  // injeta CSS da página (escopado)
  if(!document.querySelector('link[data-css="estudos"]')){
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/estudos.css';
    link.dataset.css = 'estudos';
    document.head.appendChild(link);
  }

  load();
  bindForms();
  renderStudies();
  selectGoalsTab(S.goalsFilter); // também renderiza metas
}
