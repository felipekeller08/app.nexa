/* ==========================================================
   Nexa • Tarefas — Lógica com Status (pendente/andamento/concluida)
   ========================================================== */

const STORAGE_KEY = 'TASKS_V2'; // nova versão para incluir status

let state = {
  list: [],           // {id, title, desc, status, createdAt}
  filterTitle: '',
  statusFilter: 'pendente' // aba ativa
};

// helpers
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function load() {
  // migração suave do V1 se existir
  const v2 = localStorage.getItem(STORAGE_KEY);
  if (v2) {
    try { state.list = JSON.parse(v2) || []; } catch { state.list = []; }
    return;
  }
  // tentar V1 (sem status) e migrar
  const v1 = localStorage.getItem('TASKS_V1');
  if (v1) {
    try {
      const old = JSON.parse(v1) || [];
      state.list = old.map(t => ({ ...t, status: 'pendente' })); // default
      save();
    } catch { state.list = []; }
    return;
  }
  state.list = [];
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.list));
}

function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function escapeHtml(s='') {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* -------------------- Contagens e filtros -------------------- */

function counts() {
  const c = { pendente: 0, andamento: 0, concluida: 0 };
  for (const t of state.list) { c[t.status ?? 'pendente']++; }
  return c;
}

function currentList() {
  const q = (state.filterTitle || '').trim().toLowerCase();
  return state.list.filter(t =>
    (t.status ?? 'pendente') === state.statusFilter &&
    (!q || (t.title || '').toLowerCase().includes(q))
  );
}

/* -------------------- Render -------------------- */

function paintCounts() {
  const c = counts();
  $('#count-pendente').textContent  = c.pendente;
  $('#count-andamento').textContent = c.andamento;
  $('#count-concluida').textContent = c.concluida;
}

function badgeClass(status) {
  if (status === 'andamento') return 't-badge t-badge--andamento';
  if (status === 'concluida') return 't-badge t-badge--concluida';
  return 't-badge t-badge--pendente';
}

function statusLabel(status) {
  return status === 'andamento' ? 'Em andamento'
       : status === 'concluida' ? 'Concluída'
       : 'Pendente';
}

function renderList() {
  const wrap = $('#t-list');
  wrap.innerHTML = '';

  const list = currentList();

  if (list.length === 0) {
    wrap.innerHTML = `
      <div class="t-item" style="grid-column:1 / -1; text-align:center;">
        <div style="color:#64748b; padding:18px;">Nenhuma tarefa nesse status.</div>
      </div>`;
    return;
  }

  for (const t of list) {
    const card = document.createElement('article');
    card.className = 't-item';
    card.dataset.id = t.id;

    card.innerHTML = `
      <div>
        <h3>${escapeHtml(t.title)}</h3>
      </div>

      <div class="t-actions">
        <button class="t-btn t-btn--ghost js-edit">Editar</button>
        <button class="t-btn t-btn--danger js-del">Excluir</button>
      </div>

      <span class="${badgeClass(t.status)}">${statusLabel(t.status)}</span>

      <div class="t-desc">${escapeHtml(t.desc || '')}</div>
      <div class="t-meta">Criada em ${formatDate(t.createdAt)}</div>
    `;

    wrap.appendChild(card);
  }
}

function render() {
  paintCounts();
  renderList();
}

/* -------------------- Eventos -------------------- */

function onSubmit(e) {
  e.preventDefault();
  const title  = ($('#t-title').value || '').trim();
  const desc   = ($('#t-desc').value || '').trim();
  const status = $('#t-status').value || 'pendente';

  if (!title) return;

  state.list.unshift({
    id: uid(),
    title, desc, status,
    createdAt: Date.now()
  });

  save();
  $('#t-form').reset();
  $('#t-title').focus();
  // ao criar, se a aba não for a do status criado, trocamos para mostrar
  state.statusFilter = status;
  selectTab(status);
  render();
}

function onSearch(e) {
  state.filterTitle = e.target.value;
  renderList();
}

function onListClick(e) {
  const btnEdit = e.target.closest('.js-edit');
  const btnDel  = e.target.closest('.js-del');

  if (!btnEdit && !btnDel) return;

  const card = e.target.closest('.t-item');
  const id   = card?.dataset.id;
  const idx  = state.list.findIndex(t => t.id === id);
  if (idx < 0) return;

  if (btnDel) {
    state.list.splice(idx, 1);
    save();
    render();
    return;
  }

  if (btnEdit) {
    const t = state.list[idx];
    card.innerHTML = `
      <div class="t-edit-wrap">
        <div class="t-edit-row">
          <input class="t-input" id="edit-title" type="text" value="${escapeHtml(t.title)}" />
        </div>
        <div class="t-edit-row" style="width:100%">
          <textarea class="t-input t-input--textarea" id="edit-desc" rows="3">${escapeHtml(t.desc || '')}</textarea>
        </div>
        <div class="t-edit-row">
          <select id="edit-status" class="t-input t-select">
            <option value="pendente" ${t.status==='pendente'?'selected':''}>Pendente</option>
            <option value="andamento" ${t.status==='andamento'?'selected':''}>Em andamento</option>
            <option value="concluida" ${t.status==='concluida'?'selected':''}>Concluída</option>
          </select>
        </div>
        <div class="t-edit-row">
          <button class="t-btn t-btn--primary js-save">Salvar alterações</button>
          <button class="t-btn t-btn--ghost js-cancel">Cancelar</button>
        </div>
      </div>
    `;

    card.querySelector('.js-save').addEventListener('click', () => {
      const newTitle  = (card.querySelector('#edit-title').value || '').trim();
      const newDesc   = (card.querySelector('#edit-desc').value || '').trim();
      const newStatus = card.querySelector('#edit-status').value || 'pendente';
      if (!newTitle) return;

      state.list[idx].title  = newTitle;
      state.list[idx].desc   = newDesc;
      state.list[idx].status = newStatus;

      save();
      // se mudou de status, garante que a aba siga o novo status para o usuário ver onde foi parar
      state.statusFilter = newStatus;
      selectTab(newStatus);
      render();
    });

    card.querySelector('.js-cancel').addEventListener('click', () => {
      render(); // volta à listagem normal
    });
  }
}

/* ---- tabs ---- */
function selectTab(status) {
  $$('.t-chip').forEach(btn => {
    const active = btn.dataset.status === status;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function onTabClick(e) {
  const btn = e.target.closest('.t-chip');
  if (!btn) return;
  state.statusFilter = btn.dataset.status;
  selectTab(state.statusFilter);
  renderList();
}

/* -------------------- Boot (SPA) -------------------- */

export async function init() {
  // injeta CSS desta página se ainda não estiver no DOM
  if (!document.querySelector('link[data-css="tarefas"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/tarefas.css';
    link.dataset.css = 'tarefas';
    document.head.appendChild(link);
  }

  load();
  render();

  $('#t-form')?.addEventListener('submit', onSubmit);
  $('#t-search')?.addEventListener('input', onSearch);
  $('#t-list')?.addEventListener('click', onListClick);
  document.querySelector('.t-tabs')?.addEventListener('click', onTabClick);

  // garante o estado visual inicial da aba
  selectTab(state.statusFilter);
}
