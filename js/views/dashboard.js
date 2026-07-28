// ÉrtékPont CRM (staging) – views/dashboard.js
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
// ---------- Dashboard (napi munkaállomás) ----------
const isCRM=t=>!['egyeb','magan'].includes(t.targy_tabla);
function due(t){return Logic.dueTask(t,today());}
function cmpDT(a,b){const da=(a.mikorra||'')+' '+((a.idopont||'99:99')+'');const db=(b.mikorra||'')+' '+((b.idopont||'99:99')+'');return da<db?-1:da>db?1:0;}
const HU_DAYS=['H','K','Sze','Cs','P','Szo','V'];
function hunDate(d){if(!d)return '';return d.slice(5)+' '+HU_DAYS[Logic.dowMon(d)];}
function ugyFajta(t){return {lead:'Lead',property:'Megbízás',ingatlan:'Megbízás',kereses:'Keresés',search:'Keresés',kiajanlas:'Kiajánlás',egyeb:'Egyéb',magan:'Magán',altalanos:'Egyéb'}[t.targy_tabla]||'Egyéb';}
function nameOf(t){const nm=window._nameMaps||{};switch(t.targy_tabla){
  case 'lead':return (nm.leadName&&nm.leadName[t.targy_id])||'(törölt lead)';
  case 'property':case 'ingatlan':return (nm.propName&&nm.propName[t.targy_id])||'(törölt ingatlan)';
  case 'kereses':case 'search':return (nm.searchName&&nm.searchName[t.targy_id])||'(keresés)';
  case 'kiajanlas':return (nm.recoName&&nm.recoName[t.targy_id])||'(kiajánlás)';
  case 'egyeb':case 'magan':case 'altalanos':return 'Általános feladat';
  default:return t.targy_id?'(kapcsolt ügy)':'–';}}

async function vDashboard(m){
  const tasks=(await sb.from('tasks').select('*').eq('statusz','Aktív').order('mikorra',{ascending:true,nullsFirst:false})).data||[];
  const leads=(await sb.from('leads').select('*,contacts(nev)')).data||[];
  const props=(await sb.from('properties').select('id,cim')).data||[];
  const searches=(await sb.from('search_requirements').select('id,telepules,ingatlan_tipus,contacts(nev)')).data||[];
  const recos=(await sb.from('recommendations').select('id,datum,contacts(nev)')).data||[];
  const CM=await coverMaps();window._CM=CM;window._dashTasks=tasks;
  const leadName={},propName={},searchName={},recoName={};
  leads.forEach(l=>leadName[l.id]=(l.telepules||l.ingatlan_tipus||'Lead')+(l.contacts?.nev?' – '+l.contacts.nev:''));
  props.forEach(p=>propName[p.id]=p.cim||'Ingatlan');
  searches.forEach(s=>searchName[s.id]=(s.contacts?.nev?s.contacts.nev+' – ':'')+([s.telepules,s.ingatlan_tipus].filter(Boolean).join(' ')||'keresés'));
  recos.forEach(r=>recoName[r.id]=(r.contacts?.nev||'Ügyfél')+' – '+((r.datum||'').slice(0,10)));
  window._nameMaps={leadName,propName,searchName,recoName};
  const links=(await sb.from('gyorslinkek').select('*').eq('aktiv',true).order('sorrend',{ascending:true})).data||[];
  const jz=await loadJegyzet();
  const tstr=today(),nHM=nowHM();
  const need=leads.filter(l=>l.allapot==='Aktív'&&(!l.kovetkezo_lepes||!l.kovetkezo_datum));
  const allMeetings=tasks.filter(t=>Logic.isMeetingUpcoming(t,tstr,nHM)).sort(cmpDT);
  const meetings=allMeetings.slice(0,8);
  const datedTasks=tasks.filter(Logic.isDated).sort(cmpDT);
  const dueCount=tasks.filter(t=>Logic.dueTask(t,tstr)).length;
  m.innerHTML=`<h2 class="view">Műszerfal</h2>
   <div class="metric"><div class="m"><b>${dueCount}</b><span>Lejárt / ma esedékes</span></div>
     <div class="m"><b>${allMeetings.length}</b><span>Közelgő találkozó</span></div>
     <div class="m"><b>${need.length}</b><span>Intézkedést igénylő lead</span></div></div>
   <div class="dashgrid">
     <div class="dashcard"><h4>Közelgő találkozók</h4>${aptList(meetings,CM)}</div>
     <div class="dashcard"><h4>Gyors jegyzet <span class="small muted">(csak te látod)</span></h4>
       ${jz.ok?'':'<div class="pill danger">A jegyzet betöltése sikertelen – a szerkesztés letiltva, hogy ne írja felül a korábbi tartalmat. Töltsd újra az oldalt.</div>'}
       <textarea id="qnote" class="qnote" ${jz.ok?'':'disabled'} placeholder="Ide írhatsz emlékeztetőt…">${esc(jz.szoveg)}</textarea><div id="qnote_st" class="small muted"></div></div>
   </div>
   <div class="dashcard" style="margin-bottom:1rem"><h4>Gyors elérések</h4>${links.map(l=>{const u=Logic.safeUrl(l.url);return u?`<a class="qlink" href="${esc(u)}" target="_blank" rel="noopener">${esc(l.cim)}</a>`:`<span class="qlink disabled" title="Még nincs beállítva">${esc(l.cim)}</span>`;}).join('')||'<span class="muted small">nincs link</span>'}</div>
   <div class="dashcard" style="margin-bottom:1rem"><h4>Határidős és közelgő teendők</h4>${taskTable(datedTasks,CM)}</div>
   <div class="dashcard" style="margin-bottom:1rem"><h4>Naptár</h4>
     <div class="calbar"><button class="btn-ghost btn-sm" onclick="calMode('week')">Hét</button><button class="btn-ghost btn-sm" onclick="calMode('day')">Nap</button>
       <button class="btn-ghost btn-sm" onclick="calNav(-1)">‹</button><button class="btn-ghost btn-sm" onclick="calToday()">Ma</button><button class="btn-ghost btn-sm" onclick="calNav(1)">›</button>
       <span id="cal_label" class="small muted"></span></div>
     <div id="calbox" class="calwrap"></div></div>
   <div class="section"><h4>Leadek, amelyek intézkedést igényelnek</h4>${need.length?tbl(['','Kapcsolat','Hely/típus','Miért'],need.map(l=>[miniThumb(CM.leadCover[l.id]),`<span class="row-link" onclick="openLead('${l.id}')">${esc(l.contacts?.nev||'–')}</span>`,esc(l.telepules||l.ingatlan_tipus||''),`<span class="pill danger">${!l.kovetkezo_lepes?'nincs következő lépés':'nincs dátum'}</span>`])):'<p class="muted">Nincs ilyen.</p>'}</div>`;
  wireNote(jz);
  window._cal={mode:'week',anchor:tstr};renderCal();
}
function aptList(list,CM){if(!list.length)return '<p class="muted small">Nincs közelgő találkozó.</p>';
  return list.map(t=>`<div class="aptrow" onclick="openTask('${t.id}')">${thumbHover(taskCover(t,CM))}<span class="t">${esc(hunDate(t.mikorra))}${t.idopont?' '+esc((t.idopont+'').slice(0,5)):''}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis">${esc(t.kovetkezo_lepes||'(feladat)')}${(nameOf(t)&&nameOf(t)!=='–')?' – '+esc(nameOf(t)):''}</span><span class="pill info small">${esc(t.gazda||'')}</span></div>`).join('');}
function taskTable(list,CM){if(!list.length)return '<p class="muted small">Nincs dátumozott teendő.</p>';
  const head=['','Ügy','Kapcsolódó','Teendő','Típus','Határidő','Idő','Intézi'];
  return `<div class="tblwrap"><table><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${list.map(t=>`<tr style="cursor:pointer" onclick="openTask('${t.id}')"><td>${thumbHover(taskCover(t,CM))}</td><td>${esc(ugyFajta(t))}</td><td>${esc(nameOf(t))}</td><td>${esc(t.kovetkezo_lepes||'(feladat)')}</td><td>${esc(t.tipus||'')}</td><td>${due(t)?'<span class="pill danger">'+esc(t.mikorra||'')+'</span>':esc(t.mikorra||'–')}</td><td>${esc((t.idopont||'').slice(0,5))}</td><td>${esc(t.gazda||'')}</td></tr>`).join('')}</table></div>`;}
function wireNote(jz){const ta=$('#qnote');if(!ta||!jz||!jz.ok)return;let timer;const save=async()=>{const st=$('#qnote_st');const r=await saveJegyzet(ta.value);if(st)st.textContent=(r&&r.error)?('mentés hiba: '+r.error.message):('mentve '+new Date().toLocaleTimeString('hu-HU'));};
  ta.oninput=()=>{clearTimeout(timer);const st=$('#qnote_st');if(st)st.textContent='mentés…';timer=setTimeout(save,700);};
  ta.onblur=()=>{clearTimeout(timer);save();};}

// ---- Naptár (heti / napi órarács) ----
const addDaysStr=(d,n)=>Logic.addDaysStr(d,n),mondayOf=d=>Logic.mondayOf(d);
window.calMode=(mode)=>{if(window._cal){window._cal.mode=mode;renderCal();}};
window.calNav=(dir)=>{if(!window._cal)return;const step=window._cal.mode==='week'?7:1;window._cal.anchor=addDaysStr(window._cal.anchor,dir*step);renderCal();};
window.calToday=()=>{if(window._cal){window._cal.anchor=today();renderCal();}};
function calChip(t){const meet=t.tipus==='Találkozó';const time=t.idopont?((t.idopont+'').slice(0,5)+' '):'';return `<span class="calchip ${meet?'meet':''}" onclick="openTask('${t.id}')" title="${esc(time+(t.kovetkezo_lepes||''))}">${esc(time)}${esc((t.kovetkezo_lepes||'feladat').slice(0,18))}</span>`;}
function renderCal(){const box=$('#calbox');if(!box)return;const {mode,anchor}=window._cal;
  const days=mode==='week'?Array.from({length:7},(_,i)=>addDaysStr(mondayOf(anchor),i)):[anchor];
  const tasks=window._dashTasks||[];const tday=today();
  const lbl=$('#cal_label');if(lbl)lbl.textContent=(mode==='week'?(days[0].slice(5)+' – '+days[6].slice(5)+' (hét)'):hunDate(anchor));
  let html='<table class="calgrid"><tr><th class="hourcol"></th>'+days.map(d=>`<th class="${d===tday?'caltoday':''}">${HU_DAYS[Logic.dowMon(d)]}<br>${d.slice(5)}</th>`).join('')+'</tr>';
  html+='<tr><td class="hourcol">–</td>'+days.map(d=>{const c=tasks.filter(t=>t.mikorra===d&&!t.idopont);return `<td class="day ${d===tday?'caltoday':''}">${c.map(calChip).join('')}</td>`;}).join('')+'</tr>';
  for(let h=7;h<=20;h++){const hh=String(h).padStart(2,'0');
    html+=`<tr><td class="hourcol">${hh}:00</td>`+days.map(d=>{const c=tasks.filter(t=>t.mikorra===d&&t.idopont&&Number((t.idopont+'').slice(0,2))===h);return `<td class="day ${d===tday?'caltoday':''}">${c.map(calChip).join('')}</td>`;}).join('')+'</tr>';}
  html+='</table>';box.innerHTML=html;}

function tbl(head,rows){return `<div class="tblwrap"><table><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;}
