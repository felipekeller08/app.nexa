export function setupMenu(){
  const body = document.body;
  const btnHamb = document.querySelector('.hamburger');
  const menu = document.getElementById('mobile-menu');
  const btnClose = menu?.querySelector('.close');
  const backdrop = document.querySelector('.backdrop');

  const open = ()=>{ body.classList.add('menu-open'); menu?.setAttribute('aria-hidden','false'); backdrop?.removeAttribute('hidden'); }
  const close= ()=>{ body.classList.remove('menu-open'); menu?.setAttribute('aria-hidden','true'); backdrop?.setAttribute('hidden',''); }

  btnHamb?.addEventListener('click', ()=> body.classList.contains('menu-open') ? close() : open());
  btnClose?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
}
