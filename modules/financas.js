/* Nexa • Finanças (fix carregamento do Chart e fallback da API de câmbio) */

(async () => {
  // ---------- Carrega Chart.js se ainda não existir (funciona em SPA/Module)
  if (!window.Chart) {
    await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js');
  }

  // ---------- Defaults do Chart (texto escuro legível)
  Chart.defaults.color = '#0f172a';
  Chart.defaults.font.family = 'Montserrat, system-ui, sans-serif';
  Chart.defaults.font.size = 12;

  const KEY = 'nexa_financas_v1';

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { wallet: 0, entries: [], exits: [] };
      const data = JSON.parse(raw);
      data.entries ??= [];
      data.exits ??= [];
      data.wallet = Number(data.wallet || 0);
      return data;
    } catch {
      return { wallet: 0, entries: [], exits: [] };
    }
  }
  function saveState() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  let state = loadState();

  const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const pad = (x) => String(x).padStart(2, '0');
  function toYMD(d) {
    if (typeof d === 'string') return d;
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  const todayYMD = toYMD(new Date());

  const $ = (s) => document.querySelector(s);

  // Inputs
  const inDate = $('#in_date');
  const inAmount = $('#in_amount');
  const outDate = $('#out_date');
  const outAmount = $('#out_amount');
  const walletInput = $('#wallet');

  const btnAddIn = $('#btnAddIn');
  const btnAddOut = $('#btnAddOut');
  const btnSaveWallet = $('#btnSaveWallet');

  const finTotalIn = $('#fin_total_in');
  const finTotalOut = $('#fin_total_out');
  const finTotalWallet = $('#fin_total_wallet');
  const finTotalAll = $('#fin_total_all');

  // Conversor
  const convValue = $('#conv_value');
  const convFrom = $('#conv_from');
  const convTo = $('#conv_to');
  const convBtn = $('#btnConvert');
  const convResult = $('#conv_result');

  // Tabs / chart
  const tabButtons = document.querySelectorAll('.tab-btn');
  const chartCanvas = document.getElementById('fin_chart');
  let chart;
  let chartMode = 'weekly';

  // valores padrão
  inDate.value = todayYMD;
  outDate.value = todayYMD;
  walletInput.value = state.wallet || '';

  // -------- Botões (entradas/saídas/carteira)
  btnAddIn.addEventListener('click', () => {
    const date = inDate.value || todayYMD;
    const amount = Number(String(inAmount.value).replace(',', '.'));
    if (!amount || amount <= 0) return;
    state.entries.push({ date, amount });
    inAmount.value = '';
    saveState(); refresh();
  });

  btnAddOut.addEventListener('click', () => {
    const date = outDate.value || todayYMD;
    const amount = Number(String(outAmount.value).replace(',', '.'));
    if (!amount || amount <= 0) return;
    state.exits.push({ date, amount });
    outAmount.value = '';
    saveState(); refresh();
  });

  btnSaveWallet.addEventListener('click', () => {
    const amount = Number(String(walletInput.value).replace(',', '.'));
    state.wallet = isNaN(amount) ? 0 : amount;
    saveState(); refresh();
  });

  // -------- Conversor com fallback (exchangerate.host -> frankfurter.app)
  async function convertCurrency(amount, from, to) {
    // 1) Tenta exchangerate.host
    try {
      const url = `https://api.exchangerate.host/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${amount}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && typeof data.result === 'number') {
        return { value: data.result };
      }
      throw new Error('Sem result');
    } catch {
      // 2) Fallback: frankfurter.app
      try {
        const url2 = `https://api.frankfurter.app/latest?amount=${amount}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
        const res2 = await fetch(url2);
        const data2 = await res2.json();
        if (data2 && data2.rates && typeof data2.rates[to] === 'number') {
          return { value: data2.rates[to] };
        }
        throw new Error('Sem result (fallback)');
      } catch (err) {
        throw err;
      }
    }
  }

  convBtn.addEventListener('click', async () => {
    const v = Number(String(convValue.value).replace(',', '.'));
    const from = convFrom.value;
    const to = convTo.value;
    if (!v || v <= 0) {
      convResult.textContent = 'Informe um valor válido.';
      return;
    }
    convBtn.disabled = true;
    convBtn.textContent = 'Convertendo...';
    try {
      const { value } = await convertCurrency(v, from, to);
      convResult.textContent = `${v} ${from} = ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${to}`;
    } catch {
      convResult.textContent = 'Não foi possível converter agora.';
    } finally {
      convBtn.disabled = false;
      convBtn.textContent = 'Converter';
    }
  });

  // -------- Tabs do gráfico
  tabButtons.forEach((b) => {
    b.addEventListener('click', () => {
      tabButtons.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      chartMode = b.dataset.mode;
      drawChart();
    });
  });

  // -------- Totais
  const sum = (arr) => arr.reduce((acc, x) => acc + Number(x.amount || 0), 0);

  function paintTotals() {
    const totalIn = sum(state.entries);
    const totalOut = sum(state.exits);
    const wallet = Number(state.wallet || 0);
    const totalAll = wallet + totalIn - totalOut;

    finTotalIn.textContent = brl(totalIn);
    finTotalOut.textContent = brl(totalOut);
    finTotalWallet.textContent = brl(wallet);
    finTotalAll.textContent = brl(totalAll);
  }

  // -------- Helpers de período
  function isSameISOWeek(dateA, dateB) {
    const dA = new Date(dateA);
    const dB = new Date(dateB);
    const onejanA = new Date(dA.getFullYear(), 0, 1);
    const weekA = Math.ceil((((dA - onejanA) / 86400000) + onejanA.getDay() + 1) / 7);
    const onejanB = new Date(dB.getFullYear(), 0, 1);
    const weekB = Math.ceil((((dB - onejanB) / 86400000) + onejanB.getDay() + 1) / 7);
    return (dA.getFullYear() === dB.getFullYear() && weekA === weekB);
  }

  function weekOfMonthRanges(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    const month = d.getMonth();
    const ranges = [];
    let start = new Date(d);
    while (start.getMonth() === month) {
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      if (end.getMonth() !== month) {
        end.setMonth(month + 1, 0);
      }
      ranges.push([new Date(start), new Date(end)]);
      start.setDate(start.getDate() + 7);
    }
    return ranges;
  }
  const formatDM = (d) => `${pad(d.getDate())}/${pad(d.getMonth()+1)}`;

  // -------- Gráfico
  function drawChart() {
    if (!chartCanvas) return;

    // garante altura do canvas (se CSS não aplicou por algum motivo)
    chartCanvas.style.height = '280px';

    if (chart) chart.destroy();

    const now = new Date();
    let labels = [];
    let dataIn = [];
    let dataOut = [];

    if (chartMode === 'weekly') {
      labels = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
      const start = new Date(now);
      const day = start.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      start.setDate(start.getDate() + diffToMonday);
      for (let i=0;i<7;i++){
        const curr = new Date(start);
        curr.setDate(start.getDate()+i);
        const ymd = toYMD(curr);
        const ins = state.entries.filter(e => isSameISOWeek(e.date, curr) && toYMD(new Date(e.date))===ymd);
        const outs = state.exits.filter(e => isSameISOWeek(e.date, curr) && toYMD(new Date(e.date))===ymd);
        dataIn.push(sum(ins));
        dataOut.push(sum(outs));
      }
    } else if (chartMode === 'monthly') {
      const ranges = weekOfMonthRanges(now);
      labels = ranges.map(([a,b]) => `${formatDM(a)}–${formatDM(b)}`);
      ranges.forEach(([a,b])=>{
        const ins = state.entries.filter(e=>{
          const d = new Date(e.date);
          return d>=a && d<=b && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
        });
        const outs = state.exits.filter(e=>{
          const d = new Date(e.date);
          return d>=a && d<=b && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
        });
        dataIn.push(sum(ins));
        dataOut.push(sum(outs));
      });
    } else { // yearly
      labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      for (let m=0;m<12;m++){
        const ins = state.entries.filter(e=>{
          const d = new Date(e.date);
          return d.getMonth()===m && d.getFullYear()===now.getFullYear();
        });
        const outs = state.exits.filter(e=>{
          const d = new Date(e.date);
          return d.getMonth()===m && d.getFullYear()===now.getFullYear();
        });
        dataIn.push(sum(ins));
        dataOut.push(sum(outs));
      }
    }

    chart = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Entradas', data: dataIn, backgroundColor: 'rgba(16,185,129,.9)', borderRadius: 6 },
          { label: 'Saídas',   data: dataOut, backgroundColor: 'rgba(239,68,68,.9)', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 8 },
        scales: {
          x: { grid: { color: '#eef1f6' }, ticks: { color: '#0f172a' } },
          y: {
            beginAtZero: true,
            grid: { color: '#eef1f6' },
            ticks: { color: '#0f172a', callback: v => brl(v) }
          }
        },
        plugins: {
          legend: { labels: { color: '#0f172a', font: { weight: '700' } } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${brl(ctx.parsed.y)}` } }
        }
      }
    });
  }

  function refresh(){ paintTotals(); drawChart(); }
  refresh();
})();
