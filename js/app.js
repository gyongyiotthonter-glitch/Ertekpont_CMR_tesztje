// ÉrtékPont CRM (staging) – app.js – boot, auth, route, közös UI
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
window.BUILD_ID="2026-07-28 03:00 – b2a-cdc9fbc";
(function(){var b=document.getElementById('buildid');if(b)b.textContent='Staging build: '+window.BUILD_ID;})();

const SUPABASE_URL='https://mbstluwcnskwwxzyotwa.supabase.co';
const SUPABASE_KEY='sb_publishable_99ouBRzc7xe5b6kr82lxIQ_Xl1kOPfE';
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const el=h=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild;};
const esc=s=>(s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const ft=n=>n==null?'–':(n>=1e6?(n/1e6).toLocaleString('hu-HU',{maximumFractionDigits:1})+' M Ft':Number(n).toLocaleString('hu-HU')+' Ft');
const today=()=>Logic.localDateISO();const nowHM=()=>Logic.localTimeHM();
window.PH_IMG='data:image/svg+xml;charset=utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="100%" height="100%" fill="#e7edf4"/><text x="50%" y="50%" fill="#9db0c4" font-family="sans-serif" font-size="15" text-anchor="middle" dy=".3em">Nincs fotó</text></svg>');
const INTEZ=['Közös','Gyöngyi','Norbi'];
const LEAD_STATES=['Új','Aktív','Későbbre téve','Lezárt'];
const RESULTS=['Nem értem el','Beszéltünk, visszahívás','Később aktuális','Találkozó egyeztetve','Nem aktuális','Megbízás lett belőle'];
let ME=null,CONTACTS=[];
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
window.cp=async t=>{try{await navigator.clipboard.writeText(t);toast('Másolva');}catch(e){toast('Nem sikerült másolni');}};
function telLine(a){return (a||[]).map(t=>`<a href="tel:${esc(t)}">${esc(t)}</a> <button class="copy" onclick="cp('${esc(t)}')" title="másolás">📋</button>`).join(' ')||'–';}
function mailLine(a){return (a||[]).map(e=>`<a href="mailto:${esc(e)}">${esc(e)}</a> <button class="copy" onclick="cp('${esc(e)}')" title="másolás">📋</button>`).join(' ')||'–';}
async function busy(btn,fn){if(btn){btn.disabled=true;var o=btn.textContent;btn.textContent='Mentés…';}try{await fn();}catch(e){toast('Hiba: '+e.message);}finally{if(btn){btn.disabled=false;btn.textContent=o;}}}

$('#loginBtn').onclick=async()=>{$('#loginErr').textContent='';const {error}=await sb.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error){$('#loginErr').textContent='Hibás e-mail vagy jelszó.';return;}boot();};
$('#password').addEventListener('keydown',e=>{if(e.key==='Enter')$('#loginBtn').click();});
$('#logoutBtn').onclick=async()=>{await sb.auth.signOut();location.reload();};
async function boot(){document.body.removeAttribute('data-app-ready');const {data:{session}}=await sb.auth.getSession();if(!session){$('#login').classList.remove('hidden');$('#app').classList.add('hidden');return;}
  ME=session.user.email;window.ME_ID=session.user.id;$('#login').classList.add('hidden');$('#app').classList.remove('hidden');$('#whoami').textContent=ME;
  await reloadContacts();const _lok=await loadLists();if(!_lok)toast('Figyelem: hiányzó választólisták: '+((window.LISTS_MISSING||[]).join(', ')||'ismeretlen')+' – az űrlapok mentése letiltva. Töltsd újra az oldalt.');buildNav();await route('dashboard');document.body.dataset.appReady='true';}
// ---- Választólista-alapú UI segédek ----
function optList(lista,sel,szulo){const vals=listVals(lista,szulo);let opts='<option value="">–</option>';
  if(sel!=null&&sel!==''&&!vals.includes(sel))opts+=`<option value="${esc(sel)}" selected>Korábbi érték: ${esc(sel)}</option>`;
  return opts+vals.map(v=>`<option ${v===sel?'selected':''}>${esc(v)}</option>`).join('');}
function selList(id,lista,sel,szulo,extra){return `<select id="${id}" ${extra||''}>${optList(lista,sel,szulo)}</select>`;}
function multiChecks(name,lista,selArr){selArr=selArr||[];const vals=listVals(lista);
  const legacy=(selArr||[]).filter(v=>!vals.includes(v));
  const rows=legacy.map(v=>`<label class="chk"><input type="checkbox" class="${name}" value="${esc(v)}" checked onchange="markTouched('${name}')"> Korábbi érték: ${esc(v)}</label>`)
    .concat(vals.map(v=>`<label class="chk"><input type="checkbox" class="${name}" value="${esc(v)}" ${selArr.includes(v)?'checked':''} onchange="markTouched('${name}')"> ${esc(v)}</label>`));
  return rows.join('')||'<span class="muted small">nincs lista</span>';}
window.markTouched=(name)=>{window._touched=window._touched||{};window._touched[name]=true;};
function isTouched(name){return !!(window._touched&&window._touched[name]);}
function triSel(id,val){return `<select id="${id}">${Logic.triBoolOptions(val)}</select>`;}
function readChecks(name){return [...document.querySelectorAll('.'+name+':checked')].map(c=>c.value);}
function typeSubtype(pfx,tip,alt){return `<div class="two"><div><label>Fő típus</label><select id="${pfx}_tip" onchange="onTypeChange('${pfx}')">${optList('ingatlantipus',tip)}</select></div>
   <div><label>Altípus</label><select id="${pfx}_alt">${optList('altipus',alt,tip)}</select></div></div>`;}
window.onTypeChange=(pfx)=>{const t=$('#'+pfx+'_tip');const s=$('#'+pfx+'_alt');if(t&&s)s.innerHTML=optList('altipus','',t.value);};
function varosreszField(pfx,telep,varosresz){const isGyor=(telep||'').trim().toLowerCase()==='győr';
  return isGyor?`<select id="${pfx}_varosresz" onchange="updateCimPreview('${pfx}')">${optList('gyor_varosresz',varosresz)}</select>`:`<input id="${pfx}_varosresz" value="${esc(varosresz||'')}" placeholder="városrész" oninput="updateCimPreview('${pfx}')"/>`;}
window.onTelepulesChange=(pfx)=>{const t=$('#'+pfx+'_telep');const box=$('#'+pfx+'_varoszbox');if(t&&box)box.innerHTML=varosreszField(pfx,t.value,'');updateCimPreview(pfx);};
function cbox(id,label,val){return `<label class="chk"><input type="checkbox" id="${id}" ${val?'checked':''}> ${esc(label)}</label>`;}
// Szobák összesen csak akkor frissül automatikusan, ha a bontást (hálószobák) kitöltik – üresen a régi érték megmarad.
window.updateRoomTotal=(pfx)=>{const hEl=$('#'+pfx+'_haloszoba');const sEl=$('#'+pfx+'_szobak');if(!hEl||!sEl)return;const hRaw=(hEl.value||'').trim();if(hRaw==='')return;const n=$('#'+pfx+'_nappali')&&$('#'+pfx+'_nappali').checked?1:0;const h=Number(hRaw.replace(',','.'))||0;sEl.value=(n+h);};
window.updateCimPreview=(pfx)=>{const g=id=>($('#'+pfx+'_'+id)?.value||'').trim();const parts=[g('telep'),($('#'+pfx+'_varosresz')?.value||'').trim(),[g('utca'),g('hazszam')].filter(Boolean).join(' ')].filter(Boolean);const auto=parts.join(', ');const manual=$('#'+pfx+'_cim_kezi')&&$('#'+pfx+'_cim_kezi').checked;const cimEl=$('#'+pfx+'_cim');const prev=$('#'+pfx+'_cimauto');
  if(!manual){if(cimEl)cimEl.value=auto;if(prev)prev.textContent=auto?'Automatikus cím (a strukturált mezőkből frissül)':'';}
  else{if(prev)prev.textContent=auto?('Automatikus cím lenne: '+auto):'';}};
window.onCimModeChange=(pfx)=>{const manual=$('#'+pfx+'_cim_kezi')&&$('#'+pfx+'_cim_kezi').checked;const cimEl=$('#'+pfx+'_cim');if(cimEl)cimEl.readOnly=!manual;updateCimPreview(pfx);};
const VIEWS=[['dashboard','Műszerfal'],['tasks','Feladatok'],['leads','Lead-ek'],['properties','Megbízások'],['searches','Keresések'],['matching','Párosítás'],['recos','Kiajánlások'],['contacts','Ügyfelek']];
function buildNav(){$('#nav').innerHTML=VIEWS.map(([k,l])=>`<a data-v="${k}">${l}</a>`).join('');document.querySelectorAll('#nav a').forEach(a=>a.onclick=()=>route(a.dataset.v));}
function setActive(v){document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.v===v));}
async function route(v){setActive(v);const m=$('#main');m.innerHTML='<p class="muted">Betöltés…</p>';try{await ({dashboard:vDashboard,leads:vLeads,properties:vProperties,searches:vSearches,matching:vMatching,recos:vRecos,tasks:vTasks,contacts:vContacts}[v])(m);}catch(e){m.innerHTML='<p class="err">Hiba: '+esc(e.message)+'</p>';}}
function contactOptions(sel){return '<option value="">– válassz meglévőt –</option>'+CONTACTS.map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.nev)}</option>`).join('');}
function personPicker(pfx,sel){return `<select id="${pfx}_sel">${contactOptions(sel)}</select>
  <div class="small muted" style="margin:.1rem 0 .2rem">— vagy új személy (ha nincs a listában):</div>
  <div class="two"><input id="${pfx}_nev" placeholder="Új személy neve"/><input id="${pfx}_tel" placeholder="telefon"/></div>`;}
async function resolvePerson(pfx){const nev=($('#'+pfx+'_nev')?.value||'').trim();if(nev){const tel=($('#'+pfx+'_tel')?.value||'').trim();const r=await sb.from('contacts').insert({nev,telefonok:tel?[tel]:[]}).select('id').single();if(r.error)throw r.error;await reloadContacts();return r.data.id;}return $('#'+pfx+'_sel')?.value||null;}


function modal(html){closeModal();const bg=el(`<div class="modal-bg" id="modalBg"><div class="modal">${html}</div></div>`);bg.onclick=e=>{if(e.target===bg)closeModal();};document.body.appendChild(bg);}
window.closeModal=()=>{const b=$('#modalBg');if(b)b.remove();};


// ---- Beépített hibajelentés (QA) ----
window._acts=[];window._errs=[];window._bugRec='';
addEventListener('error',e=>{try{window._errs.push({t:new Date().toISOString(),msg:e.message,hol:(e.filename||'')+':'+(e.lineno||'')});}catch(_){}});
addEventListener('unhandledrejection',e=>{try{window._errs.push({t:new Date().toISOString(),msg:'promise: '+((e.reason&&e.reason.message)||e.reason)});}catch(_){}});
(function(){const _f=window.fetch;window.fetch=function(){return _f.apply(this,arguments).then(r=>{try{if(r&&!r.ok)window._errs.push({t:new Date().toISOString(),msg:'HTTP '+r.status+' '+String(arguments[0]).slice(0,140)});}catch(_){}return r;});};})();
(function(){const _t=toast;toast=function(m){try{window._acts.push({t:new Date().toISOString(),a:m});}catch(_){}return _t(m);};})();
window.bugReport=function(){window._bugRec=(document.querySelector('#modalBg h3')||{}).textContent||'';modal('<h3>Hiba jelzése</h3><p class="small muted">Írj egy rövid mondatot; a technikai hátteret automatikusan rögzítem.</p><textarea id="bug_note" placeholder="Mi a gond?"></textarea><div class="bar"><button class="btn-primary" onclick="submitBug()">Elküld</button><button class="btn-ghost" onclick="exportBugs()">Összes exportálása (JSON)</button><button class="btn-ghost" onclick="closeModal()">Mégse</button></div>');};
window.submitBug=function(){const note=(document.getElementById('bug_note')||{}).value||'';const rep={ts:new Date().toISOString(),user:ME,nezet:(document.querySelector('#nav a.active')||{}).textContent||'',rekord:window._bugRec,megjegyzes:note,elozo_muveletek:(window._acts||[]).slice(-8),js_es_supabase_hibak:(window._errs||[]).slice(-10),viewport:{w:window.innerWidth,h:window.innerHeight},ua:navigator.userAgent};const arr=JSON.parse(localStorage.getItem('qa_bugs')||'[]');arr.push(rep);localStorage.setItem('qa_bugs',JSON.stringify(arr));closeModal();toast('Hiba jelentve ('+arr.length+'). Köszönöm!');};
window.exportBugs=function(){const data=localStorage.getItem('qa_bugs')||'[]';const b=new Blob([data],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='ertekpont-hibajelentesek.json';a.click();};

