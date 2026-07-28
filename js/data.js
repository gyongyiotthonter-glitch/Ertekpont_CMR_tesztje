// ÉrtékPont CRM (staging) – data.js – Supabase-lekérdezések, hibakezelés
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
async function reloadContacts(){CONTACTS=(await sb.from('contacts').select('id,nev').order('nev')).data||[];}

// ---- Közös választólisták (valasztolistak) ----
let LISTS={},LISTS_OK=false,LISTS_MISSING=[];
const REQUIRED_LISTS=['ingatlantipus','altipus','muszaki_allapot','elhelyezkedes','gyor_varosresz','tetoter','kertkapcsolat','epulet_szintjei','lakas_szint','futesi_mod','holeado','melegviz','felulvizsgalat_statusz','energetikai_besorolas'];
async function loadLists(){const r=await sb.from('valasztolistak').select('lista,ertek,sorrend,aktiv,szulo').eq('aktiv',true).order('sorrend',{ascending:true});
  if(r.error){LISTS_OK=false;window.LISTS_OK=false;LISTS_MISSING=REQUIRED_LISTS.slice();window.LISTS_MISSING=LISTS_MISSING;console.warn('valasztolistak betöltés hiba:',r.error.message);return false;}
  const m={},loaded=new Set();(r.data||[]).forEach(x=>{loaded.add(x.lista);const key=x.szulo?x.lista+'::'+x.szulo:x.lista;(m[key]=m[key]||[]).push(x.ertek);});
  LISTS=m;window.LISTS=m;
  LISTS_MISSING=REQUIRED_LISTS.filter(l=>!loaded.has(l));window.LISTS_MISSING=LISTS_MISSING;
  LISTS_OK=LISTS_MISSING.length===0;window.LISTS_OK=LISTS_OK;return LISTS_OK;}
function listsReady(){return LISTS_OK===true;}
function listVals(lista,szulo){return LISTS[szulo?lista+'::'+szulo:lista]||[];}

// ---- Felhasználói gyors jegyzet (privát) ----
async function loadJegyzet(){const r=await sb.from('felhasznaloi_jegyzet').select('szoveg').eq('user_id',window.ME_ID).maybeSingle();if(r.error){console.warn('jegyzet betöltés',r.error.message);return {ok:false,error:r.error.message,szoveg:''};}return {ok:true,szoveg:(r.data&&r.data.szoveg)||''};}
async function saveJegyzet(txt){return sb.from('felhasznaloi_jegyzet').upsert({user_id:window.ME_ID,szoveg:txt,modositva:new Date().toISOString()},{onConflict:'user_id'});}

// ---------- Tasks helper ----------
async function upsertTask(targy,tid,next,date,who){
  await sb.from('tasks').update({statusz:'Lezárt'}).eq('targy_tabla',targy).eq('targy_id',tid).eq('statusz','Aktív');
  await sb.from('tasks').insert({targy_tabla:targy,targy_id:tid,tipus:'Teendő',kovetkezo_lepes:next,mikorra:date,statusz:'Aktív',gazda:who||'Közös'});
}

