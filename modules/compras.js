/* ==========================================================
   Nexa • Compras — Lógica da página
   ========================================================== */

const KEY_ITEMS = 'CMP_ITEMS_V1';
const KEY_LIMIT = 'CMP_LIMIT_V1';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Estado simples em memória */
let state = {
  items: [],         // {id, nome, categoria, quantidade, preco}  (preço unitário)
  editingId: null,
  limit: null,
  filtered: null     // array filtrado por busca (se existir)
};

const $  = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// DOM refs
const form       = $('#cmp-form');
const inpNome    = $('#cmp-nome');
const inpCat     = $('#cmp-categoria');
const inpQtd     = $('#cmp-quantidade');
const inpPreco   = $('#cmp-preco');
const btnSalvar  = $('#cmp-salvar');
const btnCancelar= $('#cmp-cancelar');

const inpBusca   = $('#cmp-busca');
const btnBuscar  = $('#cmp-btn-buscar');
const btnLimpar  = $('#cmp-btn-limpar');

const ulLista    = $('#cmp-lista');

const txtTotalItens = $('#cmp-total-itens');
const txtTotalValor = $('#cmp-total-valor');

const inpLimite  = $('#cmp-limite');
const btnLimite  = $('#cmp-btn-limite');

const canvas     = $('#cmp-chart');
let chart; // Chart.js instance

/* ============== Storage helpers ============== */
function load(){
  try{
    const raw = localStorage.getItem(KEY_ITEMS);
    state.items = raw ? JSON.parse(raw) : [];
  }catch{ state.items = []; }

  try{
    const rawL = localStorage.getItem(KEY_LIMIT);
    state.limit = rawL ? Number(rawL) : null;
  }catch{ state.limit = null; }

  if(state.limit != null) inpLimite.value = String(state.limit);
}

function save(){
  localStorage.setItem(KEY_ITEMS, JSON.stringify(state.items));
}

function saveLimit(){
  if(state.limit == null) localStorage.removeItem(KEY_LIMIT);
  else localStorage.setItem(KEY_LIMIT, String(state.limit));
}

/* ============== Helpers de cálculo ============== */
const itemTotal = it => Number(it.quantidade || 0) * Number(it.preco || 0);

function getCurrentList(){
  return state.filtered ?? state.items;
}

function totals(){
  const list = getCurrentList();
  const totItens = list.length;
  const totValor = list.reduce((acc, it)=> acc + itemTotal(it), 0);
  return { totItens, totValor };
}

/* ============== UI helpers ============== */
function clearForm(){
  state.editingId = null;
  form.reset();
  btnSalvar.textContent = 'Salvar';
  btnCancelar.hidden = true;
  inpNome.focus();
}

function startEdit(id){
  const item = state.items.find(i => i.id === id);
  if(!item) return;
  state.editingId = id;
  inpNome.value  = item.nome;
  inpCat.value   = item.categoria;
  inpQtd.value   = item.quantidade;
  inpPreco.value = item.preco.toString().replace('.', ','); // preço unit.
  btnSalvar.textContent = 'Atualizar';
  btnCancelar.hidden = false;
  inpNome.focus();
}

function removeItem(id){
  state.items = state.items.filter(i => i.id !== id);
  save();
  render();
}

/* ============== Totais (header) & lista ============== */
function paintHeaderTotals(){
  const { totItens, totValor } = totals();
  txtTotalItens.textContent = `${totItens} ${totItens === 1 ? 'item' : 'itens'}`;
  txtTotalValor.textContent = `Total: ${fmt.format(totValor)}`;
}

function renderList(){
  const list = getCurrentList();
  ulLista.innerHTML = '';

  if(list.length === 0){
    const li = document.createElement('li');
    li.innerHTML = `<span style="color:#64748b">Nenhum item na lista.</span>`;
    ulLista.appendChild(li);
    return;
  }

  for(const it of list){
    const li = document.createElement('li');

    const totalItem = itemTotal(it);
    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `
      <span class="name">${escapeHtml(it.nome)}</span>
      <span class="cat">— ${escapeHtml(it.categoria)}</span>
      <span class="qty">— ${Number(it.quantidade)} un. × ${fmt.format(Number(it.preco))}</span>
      <span class="price">— Total: ${fmt.format(totalItem)}</span>
    `;

    const actions = document.createElement('div');
    actions.className = 'actions';
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn';
    btnEditar.textContent = 'Editar';
    btnEditar.onclick = ()=> startEdit(it.id);

    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn btn--muted';
    btnExcluir.style.borderColor = '#fecaca';
    btnExcluir.style.color = '#b91c1c';
    btnExcluir.textContent = 'Excluir';
    btnExcluir.onclick = ()=> removeItem(it.id);

    actions.appendChild(btnEditar);
    actions.appendChild(btnExcluir);

    li.appendChild(info);
    li.appendChild(actions);
    ulLista.appendChild(li);
  }
}

/* ============== Gráfico ============== */
function byCategoryTotals(){
  const acc = {};
  for(const it of state.items){
    const cat = it.categoria || 'Outros';
    acc[cat] = (acc[cat] || 0) + itemTotal(it); // total do item (qtd × preço unit.)
  }
  return acc;
}

function paintChart(){
  // quando há limite definido, alterna para gráfico “Gasto total × Limite”
  if(state.limit && state.limit > 0){
    const { totValor } = totals();
    const ds = {
      labels: ['Gasto total', 'Limite'],
      datasets: [{
        label: 'Comparativo',
        data: [totValor, state.limit],
        backgroundColor: ['#1e90ff2b','#10b9812b'],
        borderColor:    ['#1e90ff',   '#10b981'],
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: ['#1e90ff40','#10b98140']
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => fmt.format(ctx.parsed.y) } }
      },
      scales: {
        x: { ticks: { color: '#0f172a', font: { weight: 700 } }, grid: { display:false }},
        y: { beginAtZero:true, ticks: { color:'#0f172a' }, grid: { color: 'rgba(15,23,42,.06)' } }
      }
    };

    if(chart){ chart.data = ds; chart.options = options; chart.update(); }
    else{ chart = new Chart(canvas.getContext('2d'), { type:'bar', data: ds, options }); }
    return;
  }

  // Sem limite → gráfico por categoria
  const dataByCat = byCategoryTotals();
  const labels = Object.keys(dataByCat);
  const values = labels.map(l => dataByCat[l]);

  const ds = {
    labels,
    datasets: [{
      label: 'Gasto por categoria',
      data: values,
      backgroundColor: '#1e90ff2b',
      borderColor: '#1e90ff',
      borderWidth: 2,
      hoverBackgroundColor: '#1e90ff40',
      borderRadius: 6
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => fmt.format(ctx.parsed.y) } }
    },
    scales: {
      x: { ticks: { color: '#0f172a', font: { weight: 700 } }, grid: { display:false }},
      y: { beginAtZero:true, ticks: { color:'#0f172a' }, grid: { color: 'rgba(15,23,42,.06)' } }
    }
  };

  if(chart){ chart.data = ds; chart.options = options; chart.update(); }
  else{ chart = new Chart(canvas.getContext('2d'), { type:'bar', data: ds, options }); }
}

/* ============== Render principal ============== */
function render(){
  paintHeaderTotals();
  renderList();
  paintChart();
}

/* ============== Eventos ============== */
form.addEventListener('submit', e=>{
  e.preventDefault();
  const nome = (inpNome.value || '').trim();
  const categoria = inpCat.value;
  const quantidade = Number(inpQtd.value || 0);
  const preco = Number(String(inpPreco.value || '0').replace(',', '.')); // preço unit.

  if(!nome || quantidade <= 0 || preco < 0){ return; }

  if(state.editingId){
    const idx = state.items.findIndex(i => i.id === state.editingId);
    if(idx >= 0){
      state.items[idx] = { ...state.items[idx], nome, categoria, quantidade, preco };
    }
  }else{
    state.items.push({ id: cryptoId(), nome, categoria, quantidade, preco });
  }

  save();
  state.filtered = null;
  clearForm();
  render();
});

btnCancelar.addEventListener('click', clearForm);

btnBuscar.addEventListener('click', ()=>{
  const q = (inpBusca.value || '').trim().toLowerCase();
  if(!q){ state.filtered = null; render(); return; }
  state.filtered = state.items.filter(i => i.nome.toLowerCase().includes(q));
  render();
});
btnLimpar.addEventListener('click', ()=>{
  state.filtered = null; inpBusca.value = '';
  render();
});

btnLimite.addEventListener('click', ()=>{
  const val = Number(String(inpLimite.value || '0').replace(',', '.'));
  state.limit = isNaN(val) || val <= 0 ? null : val;
  saveLimit();
  paintChart();   // troca imediatamente para o comparativo quando houver limite
});

/* ============== Utils ============== */
function cryptoId(){
  // id curto, estável para localStorage
  return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);
}
function escapeHtml(s){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ============== Boot ============== */
load();
render();
