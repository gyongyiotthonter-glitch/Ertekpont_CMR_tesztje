// ÉrtékPont CRM (staging) – views/tasks.js
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
// ---------- Tasks view ----------
async function vTasks(m){
  const t=(await sb.from('tasks').select('*').order('mikorra',{ascending:true,nullsFirst:false})).data||[];window._tasks=t;
  const CM=await coverMaps();window._CM=CM;
  m.innerHTML=`<h2 class="view">Feladatok</h2><div class="bar"><button class="btn-gold" onclick="taskForm()">+ Új feladat</button>
    <select id="t_n"><option value="">Mind</option><option value="crm">CRM</option><option value="egyeb">Egyéb</option><option value="magan">Magán</option></select>
    <select id="t_i"><option value="">Bárki intézi</option>${INTEZ.map(w=>`<option>${w}</option>`).join('')}</select>
    <label class="small" style="margin:0"><input type="checkbox" id="t_open" checked style="width:auto"> csak nyitott</label></div><div id="t_list"></div>`;
  const draw=()=>{const n=$('#t_n').value,i=$('#t_i').value,op=$('#t_open').checked;
    const rows=t.filter(x=>{const cat=x.targy_tabla==='magan'?'magan':x.targy_tabla==='egyeb'?'egyeb':'crm';if(n&&cat!==n)return false;if(i&&x.gazda!==i)return false;if(op&&x.statusz!=='Aktív')return false;return true;});
    $('#t_list').innerHTML=rows.length?tbl(['','Következő lépés','Mikorra','Kategória','Intézi','Állapot',''],rows.map(x=>[`<span onclick="openTask('${x.id}')" style="cursor:pointer">${thumbHover(taskCover(x,CM))}</span>`,`<span class="row-link" onclick="openTask('${x.id}')">${esc(x.kovetkezo_lepes||'(feladat)')}</span>`,esc(x.mikorra||'–'),esc(x.targy_tabla||'CRM'),esc(x.gazda||''),esc(x.statusz||''),x.statusz==='Aktív'?`<button class="btn-ghost btn-sm" onclick="event.stopPropagation();doneTask('${x.id}')">Kész</button>`:''])):'<p class="muted">Nincs a szűrőnek megfelelő feladat.</p>';};
  ['t_n','t_i','t_open'].forEach(id=>$('#'+id).onchange=draw);draw();
}
function taskReturn(){route(((document.querySelector('#nav a.active')||{}).dataset||{}).v||'tasks');}
window.doneTask=async id=>{const r=await sb.from('tasks').update({statusz:'Kész',elvegezve:new Date().toISOString()}).eq('id',id);if(r.error){toast('Hiba: '+r.error.message);return;}toast('Kész');taskReturn();};
window.openTask=async id=>{const t=(await sb.from('tasks').select('*').eq('id',id).single()).data;if(!t){toast('Feladat nem található');return;}
  const CM=window._CM||await coverMaps();const cover=taskCover(t,CM);
  let linkName='',linkOpen='';
  if(t.targy_tabla==='lead'){const l=(await sb.from('leads').select('telepules,ingatlan_tipus,contacts(nev)').eq('id',t.targy_id).maybeSingle()).data;if(l)linkName=(l.telepules||l.ingatlan_tipus||'Lead')+(l.contacts?.nev?' — '+l.contacts.nev:'');linkOpen=`<button class="btn-ghost btn-sm" onclick="closeModal();openLead('${t.targy_id}')">Kapcsolt lead megnyitása</button>`;}
  else if(t.targy_tabla==='property'||t.targy_tabla==='ingatlan'){const p=(await sb.from('properties').select('cim').eq('id',t.targy_id).maybeSingle()).data;if(p)linkName=p.cim||'Ingatlan';linkOpen=`<button class="btn-ghost btn-sm" onclick="closeModal();openProp('${t.targy_id}')">Kapcsolt ingatlan megnyitása</button>`;}
  const cat=t.targy_tabla==='magan'?'Magán':t.targy_tabla==='egyeb'?'Egyéb':'CRM';
  modal(`<h3>Feladat</h3>
   <div style="display:flex;gap:.7rem;align-items:flex-start;margin-bottom:.4rem">
     <img class="thumb-md" style="width:130px;height:88px" src="${cover?esc(fotoUrl(cover)):PH_IMG}" onclick="${cover?`galleryOpen(['${esc(cover)}'],0)`:''}" onerror="this.onerror=null;this.src=PH_IMG">
     <div style="flex:1"><div><label>Kapcsolt ügy</label>${esc(linkName||'– (általános feladat)')}</div>
       <div><label>Kategória / típus</label>${cat}${t.tipus?' · '+esc(t.tipus):''}</div>
       <div><label>Állapot</label><span class="pill ${t.statusz==='Aktív'?'info':t.statusz==='Kész'?'ok':''}">${esc(t.statusz||'')}</span></div></div></div>
   <label>Következő lépés / feladat szövege</label><input id="tk_next" value="${esc(t.kovetkezo_lepes||'')}"/>
   <div class="three"><div><label>Határidő</label><input type="date" id="tk_date" value="${t.mikorra||''}"/></div><div><label>Időpont</label><input type="time" id="tk_time" value="${(t.idopont||'').slice(0,5)}"/></div><div><label>Intézi</label><select id="tk_who">${INTEZ.map(w=>`<option ${t.gazda===w?'selected':''}>${w}</option>`).join('')}</select></div></div>
   <label>Feladattípus</label><select id="tk_tip">${['Teendő','Intézkedés','Visszahívás','Találkozó','Egyéb'].map(v=>`<option ${t.tipus===v?'selected':''}>${v}</option>`).join('')}${(t.tipus&&!['Teendő','Intézkedés','Visszahívás','Találkozó','Egyéb'].includes(t.tipus))?`<option selected>${esc(t.tipus)}</option>`:''}</select>
   <div class="bar"><button class="btn-primary" id="tk_save" onclick="saveTask('${id}',this)">Mentés</button>
     ${t.statusz==='Aktív'?`<button class="btn-gold" onclick="setTaskStatus('${id}','Kész')">Készre állítás</button>`:`<button class="btn-ghost" onclick="setTaskStatus('${id}','Aktív')">Újranyitás / átütemezés</button>`}
     ${linkOpen}<button class="btn-ghost" onclick="taskForm(null,'${t.targy_tabla||''}','${t.targy_id||''}')">Új feladat</button><button class="btn-ghost" onclick="closeModal()">Bezár</button></div>`);
};
window.saveTask=(id,btn)=>busy(btn,async()=>{const rec={kovetkezo_lepes:$('#tk_next').value.trim()||null,mikorra:$('#tk_date').value||null,idopont:$('#tk_time').value||null,tipus:$('#tk_tip').value,gazda:$('#tk_who').value};const r=await sb.from('tasks').update(rec).eq('id',id);if(r.error)throw r.error;closeModal();toast('Feladat mentve');taskReturn();});
window.setTaskStatus=async(id,st)=>{const upd={statusz:st};if(st==='Kész')upd.elvegezve=new Date().toISOString();const r=await sb.from('tasks').update(upd).eq('id',id);if(r.error){toast('Hiba: '+r.error.message);return;}closeModal();toast(st==='Kész'?'Készre állítva':'Újranyitva');taskReturn();};
window.taskForm=(id,ttabla,tid)=>{const t=id?(window._tasks||[]).find(x=>x.id===id)||{}:{};
  modal(`<h3>${id?'Feladat szerkesztése':'Új feladat'}</h3>
   <label>Feladat szövege</label><input id="nt_next" value="${esc(t.kovetkezo_lepes||'')}"/>
   <div class="three"><div><label>Határidő</label><input type="date" id="nt_date" value="${t.mikorra||''}"/></div><div><label>Időpont</label><input type="time" id="nt_time" value="${(t.idopont||'').slice(0,5)}"/></div><div><label>Intézi</label><select id="nt_who">${INTEZ.map(w=>`<option ${t.gazda===w?'selected':''}>${w}</option>`).join('')}</select></div></div>
   <div class="two"><div><label>Feladattípus</label><select id="nt_tip">${['Teendő','Intézkedés','Visszahívás','Találkozó','Egyéb'].map(v=>`<option ${t.tipus===v?'selected':''}>${v}</option>`).join('')}${(t.tipus&&!['Teendő','Intézkedés','Visszahívás','Találkozó','Egyéb'].includes(t.tipus))?`<option selected>${esc(t.tipus)}</option>`:''}</select></div><div><label>Kategória</label><select id="nt_cat">${[['crm','CRM'],['egyeb','Egyéb'],['magan','Magán']].map(([v,l])=>`<option value="${v}" ${((t.targy_tabla==='magan'?'magan':t.targy_tabla==='egyeb'?'egyeb':'crm')===v)?'selected':''}>${l}</option>`).join('')}</select></div></div>
   ${ttabla&&tid?`<div class="small muted">Kapcsolt ügyhöz kötve.</div>`:''}
   <div class="bar"><button class="btn-primary" id="nt_btn" onclick="saveNewTask('${id||''}','${ttabla||''}','${tid||''}',this)">Mentés</button><button class="btn-ghost" onclick="closeModal()">Mégse</button></div>`);};
window.saveNewTask=(id,ttabla,tid,btn)=>busy(btn,async()=>{const cat=$('#nt_cat').value;
  const rec={kovetkezo_lepes:$('#nt_next').value.trim()||null,mikorra:$('#nt_date').value||null,idopont:$('#nt_time').value||null,gazda:$('#nt_who').value,tipus:$('#nt_tip').value||'Teendő',statusz:'Aktív'};
  if(!rec.kovetkezo_lepes)throw new Error('A feladat szövege kötelező');
  if(id){const r=await sb.from('tasks').update(rec).eq('id',id);if(r.error)throw r.error;}
  else{rec.targy_tabla=(ttabla&&tid)?ttabla:(cat==='egyeb'?'egyeb':cat==='magan'?'magan':'altalanos');rec.targy_id=(ttabla&&tid)?tid:null;const r=await sb.from('tasks').insert(rec);if(r.error)throw r.error;}
  closeModal();toast('Feladat mentve');taskReturn();});

