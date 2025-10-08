// Wrapper de localStorage (namespace único)
const KEY = 'nexa_local_v1';

function readAll(){
  try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch(_){ return {}; }
}
function writeAll(db){ localStorage.setItem(KEY, JSON.stringify(db)); }

export function get(path){
  const db = readAll();
  return path.split('/').reduce((acc,k)=> acc?.[k], db);
}
export function set(path, value){
  const db = readAll();
  const parts = path.split('/');
  let cur = db;
  for(let i=0;i<parts.length-1;i++){
    const k = parts[i]; cur[k] = cur[k] || {};
    cur = cur[k];
  }
  cur[parts[parts.length-1]] = value;
  writeAll(db);
}
export function push(path, value){
  const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  const list = get(path) || {};
  list[id] = value;
  set(path, list);
  return id;
}
export function remove(path){
  const db = readAll();
  const parts = path.split('/');
  let cur = db;
  for(let i=0;i<parts.length-1;i++){
    const k = parts[i];
    if(!(k in cur)) return;
    cur = cur[k];
  }
  delete cur[parts[parts.length-1]];
  writeAll(db);
}
export function onValue(path, callback){
  // Não há eventos por aba; chamamos 1x
  callback(get(path) || {});
}
