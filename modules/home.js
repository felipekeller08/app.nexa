/* ==========================================================
   Nexa • Home — Dashboard somente-leitura (robusto)
   - Suporta múltiplas chaves e formatos de dados no localStorage
   - Evita listeners duplicados e destrói o gráfico ao sair
   ========================================================== */

// chaves “novas” que seu home esperava
const FIN_KEY_NEW   = 'FIN_DATA_V2';
const STUDY_KEY_NEW = 'STUDIES_V2';
const TASK_KEY_NEW  = 'TASKS_V1';
const BUY_KEY       = 'CMP_ITEMS_V1';

// chaves alternativas (compatibilidade)
const ALT_FIN_KEYS   = ['FIN_DATA_V1', 'FIN_MOVES_V1', 'FIN_MOVES_V2', 'FIN_STORE', 'FINANCAS'];
const ALT_STUDY_KEYS = ['STUDIES_V1', 'STD_LIST_V1', 'ESTUDOS_V1', 'ESTUDOS_V2', 'STUDY_LIST'];
const ALT_TASK_KEYS  = ['TASKS_V2', 'TASK_ITEMS_V1', 'TASK_ITEMS', 'TAREFAS_V1', 'TAREFAS_V2'];

const FMT = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' });
const $   = (sel, root=document)=> root.querySelector(sel);

// ---------- util de leitura ----------
function safeJSON(key, def){
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : def; }
  catch { return def; }
}
function lookup(keys, def){
  for(const k of keys){
    const v = safeJSON(k, null);
    if(v != null) return v;
  }
  return def;
}

// parse numérico tolerante
function num(v){
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return Number(v||0);
  let s = v.replace(/[^\d.,\-+]/g, '').trim();
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

function rangeOf(type){
  const d = new Date(); d.setHours(0,0,0,0);
  if(type==='week'){
    const day = d.getDay();
    const diff = (day===0?6:day-1);
    const start = new Date(d); start.setDate(d.getDate()-diff);
    const end   = new Date(start); end.setDate(start.getDate()+6);
    end.setHours(23,59,59,999);
    return { start, end, labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'] };
  }
  if(type==='month'){
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end   = new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999);
    const labels = [];
    let cur = new Date(start);
    while(cur <= end){
      const s = new Date(cur);
      const e = new Date(cur); e.setDate(e.getDate()+6);
      if(e > end) e.setTime(end.getTime());
      labels.push(`${String(s.getDate()).padStart(2,'0')}-${String(e.getDate()).padStart(2,'0')}`);
      cur.setDate(cur.getDate()+7);
    }
    return { start, end, labels };
  }
  const start = new Date(d.getFullYear(),0,1);
  const end   = new Date(d.getFullYear(),11,31,23,59,59,999);
  return { start, end, labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'] };
}

function inRange(dt, start, end){
  if(!dt) return false;
  const t = (typeof dt==='string')? new Date(dt) : dt;
  return t >= start && t <= end;
}

/* =========================
   FINANÇAS — normalização
   (AQUI estão as únicas mudanças relevantes)
   ========================= */

/* Parser de data TOLERANTE só para Finanças */
function parseDateFlexibleFin(s){
  if (!s) return null;
  if (s instanceof Date) return s;
  if (typeof s === 'number') return new Date(s);
  if (typeof s !== 'string') return new Date(s);

  // ISO: 2025-10-07
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00`);
  // BR: 07/10/2025
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/').map(Number);
    return new Date(yyyy, mm-1, dd);
  }
  // timestamp ou string parseável
  const ts = Number(s);
  if (!Number.isNaN(ts) && ts > 0) return new Date(ts);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function getFinData(){
  // 1) novo
  let fin = safeJSON(FIN_KEY_NEW, null);
  if(fin && (Array.isArray(fin.entries) || Array.isArray(fin.exits))){
    return {
      entries: (fin.entries||[]).map(e=>({ date:e.date, value:num(e.value) })),
      exits:   (fin.exits  ||[]).map(e=>({ date:e.date, value:num(e.value) })),
    };
  }

  // 2) alternativas
  fin = lookup(ALT_FIN_KEYS, null);
  if(!fin) return { entries:[], exits:[] };

  if(Array.isArray(fin)){
    const entries = [], exits = [];
    fin.forEach(m=>{
      const t = (m.type||'').toLowerCase();
      const val = num(m.value);
      if(t==='in' || t==='entrada') entries.push({ date: m.date, value: val });
      else exits.push({ date: m.date, value: val });
    });
    return { entries, exits };
  }

  if(fin.entries || fin.exits){
    return {
      entries: (fin.entries||[]).map(e=>({ date:e.date, value:num(e.value) })),
      exits:   (fin.exits  ||[]).map(e=>({ date:e.date, value:num(e.value) })),
    };
  }

  return { entries:[], exits:[] };
}

let finChart = null;
let _tabsBound = false;
let _onTabClick = null;

function buildFinChart(ctx, labels, inData, outData){
  if(finChart){ finChart.destroy(); finChart = null; }
  finChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label:'Entradas', data:inData, backgroundColor:'#10b98155', borderColor:'#10b981', borderWidth:2, borderRadius:6 },
        { label:'Saídas',   data:outData, backgroundColor:'#ef444455', borderColor:'#ef4444', borderWidth:2, borderRadius:6 }
      ]
    },
    options:{
      responsive:false,           // mantém sua configuração que evitou reflow
      maintainAspectRatio:false,
      animation:false,
      plugins:{ legend:{ position:'top' } },
      scales:{
        x:{ ticks:{ color:'#0f172a', font:{ weight:700 } }, grid:{ display:false } },
        y:{ beginAtZero:true, ticks:{ color:'#0f172a' }, grid:{ color:'rgba(15,23,42,.06)' } }
      }
    }
  });
}

function refreshFin(rangeType){
  const canvas = $('#finChart'); if(!canvas) return;
  const ctx = canvas.getContext('2d');

  const { start, end, labels } = rangeOf(rangeType);
  const fin = getFinData();

  const inSeries  = new Array(labels.length).fill(0);
  const outSeries = new Array(labels.length).fill(0);

  const bucketIndex = (date)=>{
    const d = parseDateFlexibleFin(date);
    if(!d) return -1;
    if(rangeType==='week'){ const day=d.getDay(); return (day===0?6:day-1); }
    if(rangeType==='month'){ return Math.floor((d.getDate()-1)/7); }
    return d.getMonth();
  };

  (fin.entries||[]).forEach(e=>{
    const dOk = parseDateFlexibleFin(e.date);
    if(dOk && dOk >= start && dOk <= end){
      const i = bucketIndex(e.date);
      if(i>=0 && inSeries[i] != null) inSeries[i] += num(e.value);
    }
  });

  (fin.exits||[]).forEach(e=>{
    const dOk = parseDateFlexibleFin(e.date);
    if(dOk && dOk >= start && dOk <= end){
      const i = bucketIndex(e.date);
      if(i>=0 && outSeries[i] != null) outSeries[i] += num(e.value);
    }
  });

  buildFinChart(ctx, labels, inSeries, outSeries);
}

/* =========================
   ESTUDOS — normalização
   ========================= */
function normalizeStudyTitle(obj){
  return obj.title || obj.titulo || obj.nome || obj.name || '—';
}
function normalizeStudyDiary(obj){
  return obj.diary || obj.diario || obj.log || obj.history || [];
}
function getStudies(){
  let s = safeJSON(STUDY_KEY_NEW, null);
  if(!s) s = lookup(ALT_STUDY_KEYS, []);
  if(!Array.isArray(s)) return [];
  return s.map(o => ({ title: normalizeStudyTitle(o), diary: normalizeStudyDiary(o) }));
}
function refreshStudy(rangeType){
  const ul = $('#studyList'); if(!ul) return;
  const { start, end } = rangeOf(rangeType);
  const studies = getStudies();

  const map = new Map(); // title -> dias no período
  studies.forEach(st=>{
    (st.diary||[]).forEach(d=>{
      if(inRange(d, start, end)){
        map.set(st.title, (map.get(st.title)||0)+1);
      }
    });
  });

  ul.innerHTML = '';
  if(map.size===0){
    ul.innerHTML = `<li><span class="meta">Sem dados no período.</span></li>`;
    return;
  }
  [...map.entries()]
    .sort((a,b)=> b[1]-a[1])
    .slice(0,8)
    .forEach(([title,count])=>{
      const li = document.createElement('li');
      li.innerHTML = `<span class="label">${title}</span><span class="meta">${count} dia(s)</span>`;
      ul.appendChild(li);
    });
}

/* =========================
   COMPRAS — top 5
   ========================= */
function refreshBuy(){
  const ul = $('#buyList'); if(!ul) return;
  const items = safeJSON(BUY_KEY, []);
  const rows = items.map(it=>{
    const total = num(it.quantidade) * num(it.preco);
    return { nome: it.nome || '—', total };
  }).sort((a,b)=> b.total - a.total).slice(0,5);

  ul.innerHTML = '';
  if(rows.length===0){
    ul.innerHTML = `<li><span class="meta">Sem compras cadastradas.</span></li>`;
    return;
  }
  rows.forEach(r=>{
    const li = document.createElement('li');
    li.innerHTML = `<span class="label">${r.nome}</span><span class="meta">${FMT.format(r.total)}</span>`;
    ul.appendChild(li);
  });
}

/* =========================
   TAREFAS — normalização
   ========================= */
function normalizeTaskStatus(s){
  s = (s||'').toString().toLowerCase();
  if(['done','concluida','concluída','finalizada','feita'].includes(s)) return 'done';
  return 'open';
}
function getTasks(){
  let t = safeJSON(TASK_KEY_NEW, null);
  if(!t) t = lookup(ALT_TASK_KEYS, []);
  if(!Array.isArray(t)) return [];
  return t.map(x=>({
    status: normalizeTaskStatus(x.status),
    createdAt: x.createdAt || x.criadaEm || x.data || null,
    doneAt:    x.doneAt    || x.concluidaEm || null
  }));
}
function refreshTask(rangeType){
  const doneEl = $('#taskDone');
  const openEl = $('#taskOpen');
  if(!doneEl || !openEl) return;

  const { start, end } = rangeOf(rangeType);
  const tasks = getTasks();

  let done=0, open=0;
  tasks.forEach(t=>{
    const cAt = t.createdAt ? new Date(t.createdAt) : new Date();
    const dAt = t.doneAt    ? new Date(t.doneAt)    : null;
    const inPeriod = inRange(cAt, start, end) || inRange(dAt, start, end);
    if(!inPeriod) return;
    if(t.status==='done') done++; else open++;
  });

  doneEl.textContent = String(done);
  openEl.textContent = String(open);
}

/* =========================
   Tabs (Semanal/Mensal/Anual) — sem duplicar listener
   ========================= */
function bindTabsOnce(){
  if(_tabsBound) return;
  _onTabClick = (e)=>{
    const btn = e.target.closest('.tab');
    if(!btn) return;
    const wrap = btn.parentElement;
    wrap.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b===btn));
    const scope = wrap.dataset.scope;
    const range = btn.dataset.range;
    if(scope==='fin')   refreshFin(range);
    if(scope==='study') refreshStudy(range);
    if(scope==='task')  refreshTask(range);
  };
  document.addEventListener('click', _onTabClick);
  _tabsBound = true;
}

/* =========================
   INIT / DESTROY
   ========================= */
export function init(){
  bindTabsOnce();
  refreshFin('week');
  refreshStudy('week');
  refreshBuy();
  refreshTask('week');

  document.querySelectorAll('[data-range="week"].tab')
    .forEach(b=>b.classList.add('active'));
}

export function destroy(){
  if(_tabsBound && _onTabClick){
    document.removeEventListener('click', _onTabClick);
  }
  _tabsBound = false;
  _onTabClick = null;

  if(finChart){
    try { finChart.destroy(); } catch(e){}
    finChart = null;
  }
}
