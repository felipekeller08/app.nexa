// Router simples (pushState) + lazy loading de módulos
const routes = {
  '/':         { view: '/views/home.html',     module: '/modules/home.js' }, // <— AQUI
  '/estudos':  { view: '/views/estudos.html',  module: '/modules/estudos.js' },
  '/tarefas':  { view: '/views/tarefas.html',  module: '/modules/tarefas.js' },
  '/compras':  { view: '/views/compras.html',  module: '/modules/compras.js' },
  '/financas': { view: '/views/financas.html', module: '/modules/financas.js' },
};
let currentModule = null;

async function load(path, replace=false){
  const route = routes[path] || routes['/'];
  const html = await fetch(route.view, { cache:'no-cache' }).then(r=>r.text());
  const app = document.getElementById('app');
  app.innerHTML = html;

  if(currentModule?.destroy){ try{ currentModule.destroy(); }catch(e){} }
  currentModule = null;

  if(route.module){
    currentModule = await import(route.module);
    if(currentModule?.init){ await currentModule.init(); }
  }

  const state = { path };
  replace ? history.replaceState(state,'',path) : history.pushState(state,'',path);
}

export function initRouter(){
  document.body.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-link]');
    if(!a) return;
    e.preventDefault();
    navigate(a.getAttribute('href'));
  });
  window.addEventListener('popstate', (e)=>{
    const target = e.state?.path || location.pathname;
    load(target, true);
  });
}

export function boot(){
  const first = routes[location.pathname] ? location.pathname : '/';
  load(first, true);
}

export function navigate(path){ load(path, false); }

