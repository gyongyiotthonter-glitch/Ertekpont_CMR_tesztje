// ÉrtékPont CRM (staging) – views/leads.js
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
// ---------- Leads (Lead ingatlanok) ----------
function needAct(l){return l.allapot==='Aktív'&&(!l.kovetkezo_lepes||!l.kovetkezo_datum);}
async function vLeads(m){
  const l=(await sb.from('leads').select('*,contacts(nev),lead_photos(storage_path),properties(property_photos(storage_path,borito,sorrend))').order('kovetkezo_datum',{ascending:true,nullsFirst:true})).data||[];window._leads=l;
  m.innerHTML=`<h2 class="view">Lead-ek</h2><div class="bar"><button class="btn-gold" onclick="newLead()">+ Új lead ingatlan</button></div>
   <div>${l.length?l.map(x=>{const k=leadCoverKey(x);const cim=esc(x.telepules||x.ingatlan_tipus||'Lead');
     return `<div class="lcard">
       <img class="lc-img" loading="lazy" src="${k?esc(fotoUrl(k)):PH_IMG}" onclick="openLead('${x.id}')" onerror="this.onerror=null;this.src=PH_IMG">
       <div class="lc-body"><h3 onclick="openLead('${x.id}')">${cim}</h3>
         <div class="meta">${esc(x.ingatlan_tipus||'')}${x.elado_kiado?' · '+esc(x.elado_kiado):''}${x.hirdetesi_ar?' · '+ft(x.hirdetesi_ar):''}<br>
         Tulajdonos: ${esc(x.contacts?.nev||'–')}<br>
         ${x.kovetkezo_lepes?'Következő: '+esc(x.kovetkezo_lepes)+(x.kovetkezo_datum?' ('+esc(x.kovetkezo_datum)+')':''):'<span class="muted">nincs következő lépés</span>'}</div>
         <div style="margin-top:.25rem">${needAct(x)?'<span class="pill danger">Intézkedést igényel</span>':`<span class="pill info">${esc(x.allapot||'')}</span>`}</div>
       </div></div>`;}).join(''):'<p class="muted">Nincs lead.</p>'}</div>`;
}
window.newLead=()=>leadForm();
window.openLead=async id=>{const l=(window._leads||[]).find(x=>x.id===id)||(await sb.from('leads').select('*,contacts(nev)').eq('id',id).single()).data;
  const acts=(await sb.from('lead_activities').select('*').eq('lead_id',id).order('letrehozva',{ascending:false})).data||[];
  const lp=(await sb.from('lead_photos').select('storage_path').eq('lead_id',id).maybeSingle()).data;
  modal(`<h3>Lead ingatlan — ${esc(l.telepules||l.ingatlan_tipus||'')}</h3>
   ${needAct(l)?'<div class="pill danger">Intézkedést igényel: hiányzik a következő lépés/dátum</div>':''}
   <div class="section"><h4>Azonosítókép</h4>
     ${lp&&lp.storage_path?`<img class="leadphoto" src="${esc(fotoUrl(lp.storage_path))}" onclick="galleryOpen(['${esc(lp.storage_path)}'],0)" onerror="this.onerror=null;this.src=PH_IMG">`:'<div class="muted small" style="margin-bottom:.4rem">Nincs azonosítókép — a képről egy pillantással felismerhető a lead.</div>'}
     <div class="bar"><label class="btn-ghost btn-sm filelbl">${lp&&lp.storage_path?'Kép cseréje':'Kép feltöltése'}<input type="file" accept="image/*" capture="environment" onchange="leadPhotoPick('${id}',this)"></label>
       ${lp&&lp.storage_path?`<button class="btn-ghost btn-sm" onclick="leadPhotoDel('${id}')">Törlés</button>`:''}</div></div>
   <div class="two"><div><label>Típus</label>${esc(l.ingatlan_tipus||'–')}</div><div><label>Ügylet</label>${esc(l.elado_kiado||'–')}</div></div>
   <div class="two"><div><label>Hely</label>${esc(l.telepules||'–')}</div><div><label>Hirdetési ár</label>${ft(l.hirdetesi_ar)}</div></div>
   <div><label>Tulajdonos</label>${esc(l.contacts?.nev||'–')}</div>
   ${l.tulajdonosi_hirdetes_link?`<div><label>Tulajdonosi hirdetés</label><a href="${esc(l.tulajdonosi_hirdetes_link)}" target="_blank">megnyit</a></div>`:''}
   <div class="section"><h4>Kapcsolatfelvétel rögzítése</h4>
     <label>Eredmény</label><select id="r_res">${RESULTS.map(r=>`<option>${r}</option>`).join('')}</select>
     <div class="two"><div><label>Következő lépés</label><input id="r_next" value="${esc(l.kovetkezo_lepes||'')}"/></div><div><label>Dátum</label><input type="date" id="r_date" value="${l.kovetkezo_datum||''}"/></div></div>
     <label>Intézi</label><select id="r_who">${INTEZ.map(w=>`<option>${w}</option>`).join('')}</select>
     <div class="bar"><button class="btn-primary" id="r_btn" onclick="logResult('${id}',this)">Rögzítés + teendő</button>
       <button class="btn-gold" onclick="mandateDialog('${id}')">Megbízás lett belőle →</button>
       <button class="btn-ghost" onclick="leadForm('${id}')">Szerkesztés</button></div></div>
   <div class="section"><h4>Előzmények (${acts.length})</h4>${acts.map(a=>`<div class="small">• ${esc(a.letrehozva?.slice(0,10)||'')} — ${esc(a.tipus||'')}${a.eredmeny?' · '+esc(a.eredmeny):''}${a.kovetkezo_lepes?' → '+esc(a.kovetkezo_lepes):''}</div>`).join('')||'<span class="muted small">nincs</span>'}</div>
   <div class="bar"><button class="btn-ghost" onclick="closeModal()">Bezár</button></div>`);
};
window.logResult=async(id,btn)=>busy(btn,async()=>{const res=$('#r_res').value,next=$('#r_next').value.trim()||null,date=$('#r_date').value||null,who=$('#r_who').value;
  await sb.from('lead_activities').insert({lead_id:id,tipus:'Kapcsolatfelvétel',eredmeny:res,kovetkezo_lepes:next,mikorra:date,ki:ME});
  const upd={kovetkezo_lepes:next,kovetkezo_datum:date};upd.allapot=res==='Nem aktuális'?'Lezárt':res==='Később aktuális'?'Későbbre téve':'Aktív';
  await sb.from('leads').update(upd).eq('id',id);
  if(next&&date)await upsertTask('lead',id,next,date,who);
  if(res==='Megbízás lett belőle')return mandateDialog(id);
  closeModal();toast('Rögzítve'+((next&&date)?' + teendő':''));route('leads');});
function leadForm(id){const l=id?(window._leads||[]).find(x=>x.id===id)||{}:{};const nf=!id;
  modal(`<h3>${id?'Lead ingatlan szerkesztése':'Új lead ingatlan'}</h3>
   <div class="section"><h4>Ingatlanvázlat</h4>
     <div class="two"><div><label>Eladó / kiadó</label><select id="l_uk"><option ${l.elado_kiado!=='Kiadó'?'selected':''}>Eladó</option><option ${l.elado_kiado==='Kiadó'?'selected':''}>Kiadó</option></select></div>
       <div><label>Ingatlantípus</label><input id="l_tip" value="${esc(l.ingatlan_tipus||'')}"/></div></div>
     <div class="two"><div><label>Település</label><input id="l_telep" value="${esc(l.telepules||'')}"/></div><div><label>Cím / utca, házszám</label><input id="l_cim" value="${esc(l.utca_hazszam||'')}"/></div></div>
     <div class="three"><div><label>Alapterület m²</label><input id="l_alap" type="number" value="${l.netto_alap??''}"/></div><div><label>Telek m²</label><input id="l_telek" type="number" value="${l.telek??''}"/></div><div><label>Szobaszám</label><input id="l_szoba" type="number" value="${l.szobak??''}"/></div></div>
     <div class="two"><div><label>Hirdetési ár (teljes Ft)</label><input id="l_ar" type="number" value="${l.hirdetesi_ar??''}"/></div><div><label>Leadforrás</label><select id="l_forras">${['Hideghívás','Korábbi ügyfél','Személyes kapcsolat','Másik ingatlan miatt hívott','Ügyféloldali megkeresés','Egyéb'].map(f=>`<option ${l.forras===f?'selected':''}>${f}</option>`).join('')}</select></div></div>
     <label>Tulajdonosi hirdetés link</label><input id="l_link" value="${esc(l.tulajdonosi_hirdetes_link||'')}"/>
     <label>Megjegyzés</label><textarea id="l_megj">${esc(l.megjegyzes||'')}</textarea>
     <label>Azonosítókép (opcionális — gépről vagy telefon kamerájával)</label><input type="file" id="l_foto" accept="image/*" capture="environment"/>
     <div class="two"><div><label>Következő feladat</label><input id="l_next" value="${esc(l.kovetkezo_lepes||'')}"/></div><div><label>Időpont</label><input type="date" id="l_date" value="${l.kovetkezo_datum||''}"/></div></div>
     ${!id?'<label>Feladatot intézi</label><select id="l_who">'+INTEZ.map(w=>`<option>${w}</option>`).join('')+'</select>':''}</div>
   <div class="section"><h4>Tulajdonos hozzákapcsolása</h4>${nf?personPicker('lp',l.contact_id):'<div class="small muted">A tulajdonos a kapcsolat: '+esc((CONTACTS.find(c=>c.id===l.contact_id)||{}).nev||'–')+'</div>'+personPicker('lp',l.contact_id)}</div>
   <div class="bar"><button class="btn-primary" id="l_btn" onclick="saveLead('${id||''}',this)">Mentés</button><button class="btn-ghost" onclick="closeModal()">Mégse</button></div>`);}
window.leadForm=leadForm;
window.saveLead=(id,btn)=>busy(btn,async()=>{const num=v=>v===''?null:Number(v);
  const contact_id=await resolvePerson('lp');
  const rec={contact_id,elado_kiado:$('#l_uk').value,forras:$('#l_forras').value,ingatlan_tipus:$('#l_tip').value.trim()||null,telepules:$('#l_telep').value.trim()||null,utca_hazszam:$('#l_cim').value.trim()||null,netto_alap:num($('#l_alap').value),telek:num($('#l_telek').value),szobak:num($('#l_szoba').value),hirdetesi_ar:num($('#l_ar').value),tulajdonosi_hirdetes_link:$('#l_link').value.trim()||null,kovetkezo_lepes:$('#l_next').value.trim()||null,kovetkezo_datum:$('#l_date').value||null,megjegyzes:$('#l_megj').value.trim()||null,allapot:'Aktív',modositva:new Date().toISOString()};
  let lid=id;
  if(id){const r=await sb.from('leads').update(rec).eq('id',id);if(r.error)throw r.error;}
  else{const r=await sb.from('leads').insert(rec).select('id').single();if(r.error)throw r.error;lid=r.data.id;}
  if(rec.kovetkezo_lepes&&rec.kovetkezo_datum)await upsertTask('lead',lid,rec.kovetkezo_lepes,rec.kovetkezo_datum,($('#l_who')?.value)||'Közös');
  const ff=$('#l_foto')&&$('#l_foto').files[0];
  if(ff&&IMG_RE.test(ff.type)){try{await saveLeadPhoto(lid,ff);}catch(e){toast('Kép mentése nem sikerült: '+e.message);}}
  closeModal();toast('Lead mentve');route('leads');});
window.mandateDialog=id=>{const l=(window._leads||[]).find(x=>x.id===id)||{};
  modal(`<h3>Leadből megbízás</h3><p class="small muted">Az ingatlan- és lead-adatok, a tulajdonos és az előzmények átkerülnek. A művelet biztonságos és nem fut le kétszer.</p>
   <div class="two"><div><label>Kezelés</label><select id="mm_kez"><option>Nyílt</option><option>Háttér</option></select></div><div><label>Szerződés jellege</label><select id="mm_jel"><option>Normál</option><option>Kizárólagos</option><option>Exclusiv</option></select></div></div>
   <div class="two"><div><label>Ügylet</label><select id="mm_uk"><option ${l.elado_kiado!=='Kiadó'?'selected':''}>Eladó</option><option ${l.elado_kiado==='Kiadó'?'selected':''}>Kiadó</option></select></div><div><label>Irányár (teljes Ft)</label><input id="mm_ar" type="number" value="${l.hirdetesi_ar??''}"/></div></div>
   <div class="two"><div><label>Szerződés dátuma</label><input type="date" id="mm_d"/></div><div><label>Lejárat</label><input type="date" id="mm_l"/></div></div>
   <div class="bar"><button class="btn-gold" id="mm_btn" onclick="doMandate('${id}',this)">Megbízás létrehozása</button><button class="btn-ghost" onclick="closeModal()">Mégse</button></div>`);};
window.doMandate=(id,btn)=>busy(btn,async()=>{const num=v=>v===''?null:Number(v);
  const {data,error}=await sb.rpc('fn_lead_to_mandate',{p_lead:id,p_kezeles:$('#mm_kez').value,p_jelleg:$('#mm_jel').value,p_ugylet:$('#mm_uk').value,p_iranyar:num($('#mm_ar').value),p_szerzodes:$('#mm_d').value||null,p_lejarat:$('#mm_l').value||null});
  if(error)throw error;let trMsg='';if(data){const tr=await transferLeadPhoto(id,data);if(tr&&tr.ok===false)trMsg=' — a lead képének átvitele nem sikerült';}closeModal();toast('Megbízás létrehozva'+trMsg);route('properties');});

