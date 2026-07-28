// ÉrtékPont CRM (staging) – views/recommendations.js – Kiajánlások
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
// ---------- Recommendations ----------
window.buildReco=async(sid,cid)=>{
  const ids=[...document.querySelectorAll('.mchk-'+sid+':checked')].map(c=>c.value);
  if(!ids.length)return toast('Jelölj ki legalább egy ingatlant');
  if(!cid){const s=(await sb.from('search_requirements').select('contact_id').eq('id',sid).single()).data;cid=s?.contact_id;}
  const props=(await sb.from('properties').select('id,cim,ingatlan_tipus,netto_alap,mandates(iranyar),property_photos(id,storage_path,borito,sorrend,lathatosag)').in('id',ids)).data||[];
  const c=(await sb.from('contacts').select('nev,emailek').eq('id',cid).single()).data;
  const byId={};props.forEach(p=>byId[p.id]=p);const ordered=ids.map(i=>byId[i]).filter(Boolean);
  const sel={};ordered.forEach(p=>{const pub=recoPub(p);sel[p.id]=pub.length?[pub[0].storage_path]:[];});
  window._reco={sid,cid,c,ordered,sel};
  const email=(c?.emailek||[])[0]||'';
  modal(`<h3>Kiajánlás összeállítása</h3>
   <label>Címzett</label><input id="rc_to" value="${esc(email)}"/>
   <label>Tárgy</label><input id="rc_subj" value="Ingatlanajánlat – ÉrtékPont"/>
   <label>Bevezető szöveg</label><textarea id="rc_intro" style="min-height:66px">Kedves ${esc(c?.nev||'Érdeklődő')}!\n\nAz alábbi ingatlanokat ajánljuk figyelmébe:</textarea>
   <div class="section"><h4>Ingatlanok és képek</h4><div class="small muted">Csak a „Webre mehet” állapotú képek választhatók; ingatlanonként legfeljebb 4. Az első a borító.</div>
     <div id="rc_props"></div></div>
   <div class="bar"><button class="btn-ghost" onclick="recoPreview()">Előnézet</button><button class="btn-ghost" onclick="recoPdf()">PDF letöltése</button>
     <button class="btn-ghost" onclick="recoMail()">E-mail (szöveg)</button>
     <button class="btn-gold" id="rc_btn" onclick="recoSave(this)">Kiajánlás rögzítése</button><button class="btn-ghost" onclick="closeModal()">Bezár</button></div>
   <div id="rc_preview"></div>`);
  renderRecoProps();
};
function recoPub(p){return (p.property_photos||[]).filter(ph=>ph.lathatosag==='nyilvanos').sort((a,b)=>(b.borito?1:0)-(a.borito?1:0)||(a.sorrend||0)-(b.sorrend||0));}
function renderRecoProps(){const box=$('#rc_props');if(!box)return;const {ordered,sel}=window._reco;
  box.innerHTML=ordered.map(p=>{const pub=recoPub(p);const chosen=sel[p.id]||[];
    return `<div class="rp-prop"><b>${esc(p.cim||'(cím)')}</b> <span class="muted small">${esc(p.ingatlan_tipus||'')}${p.netto_alap?', '+p.netto_alap+' m²':''} · ${ft((p.mandates||[])[0]?.iranyar)}</span>
      ${pub.length?`<div class="rsel-imgs">${pub.map(ph=>{const i=chosen.indexOf(ph.storage_path);return `<div class="rs-i ${i>=0?'sel':''}" onclick="recoToggle('${p.id}','${esc(ph.storage_path)}')"><img loading="lazy" src="${esc(fotoUrl(ph.storage_path))}">${i>=0?`<span class="rs-c">${i+1}</span>`:''}</div>`;}).join('')}</div>`:'<div class="pill warn">Nincs webre engedélyezett kép</div>'}</div>`;}).join('');
}
window.recoToggle=(pid,key)=>{const sel=window._reco.sel;const arr=sel[pid]||[];const i=arr.indexOf(key);
  if(i>=0)arr.splice(i,1);else{if(arr.length>=4)return toast('Legfeljebb 4 kép ingatlanonként');arr.push(key);}
  sel[pid]=arr;renderRecoProps();};
window.recoPreview=()=>{const {ordered,sel}=window._reco;const intro=$('#rc_intro').value;
  $('#rc_preview').innerHTML=`<div class="section"><h4>Előnézet (amit az érdeklődő lát)</h4><div class="rprev"><div style="white-space:pre-wrap">${esc(intro)}</div>
    ${ordered.map(p=>{const keys=sel[p.id]||[];return `<div class="rp-prop"><div><b>${esc(p.cim||'(cím)')}</b> — ${esc(p.ingatlan_tipus||'')}${p.netto_alap?', '+p.netto_alap+' m²':''} — <b>${ft((p.mandates||[])[0]?.iranyar)}</b></div>
      ${keys.length?`<div class="rp-imgs">${keys.map(k=>`<img src="${esc(fotoUrl(k))}">`).join('')}</div>`:'<div class="muted small">nincs kép kiválasztva</div>'}</div>`;}).join('')}
    <div style="margin-top:.5rem">Üdvözlettel,<br>ÉrtékPont Ingatlan</div></div></div>`;
  $('#rc_preview').scrollIntoView({behavior:'smooth'});};
window.recoMail=()=>{const {ordered}=window._reco;const to=$('#rc_to').value;const subj=encodeURIComponent($('#rc_subj').value);
  const lines=ordered.map(p=>`• ${p.cim||'(cím)'} – ${p.ingatlan_tipus||''}${p.netto_alap?', '+p.netto_alap+' m²':''} – ${ft((p.mandates||[])[0]?.iranyar)}`).join('\n');
  const body=encodeURIComponent($('#rc_intro').value+'\n\n'+lines+'\n\nÜdvözlettel,\nÉrtékPont Ingatlan\n\n(A képes ajánlatot PDF-ben mellékeljük.)');
  window.location.href=`mailto:${to}?subject=${subj}&body=${body}`;};
window.recoSave=(btn)=>busy(btn,async()=>{const {sid,cid,ordered,sel}=window._reco;
  const rec=await sb.from('recommendations').insert({contact_id:cid,search_requirement_id:sid,csatorna:'email',targy:$('#rc_subj').value||null,szoveg:$('#rc_intro').value||null}).select('id').single();
  if(rec.error)throw rec.error;
  const items=ordered.map(p=>({recommendation_id:rec.data.id,property_id:p.id,ar:(p.mandates||[])[0]?.iranyar??null,cim:p.cim||null,foto_ids:sel[p.id]||[],foto_snapshot:sel[p.id]||[]}));
  const ir=await sb.from('recommendation_items').insert(items);if(ir.error)throw ir.error;
  closeModal();toast('Kiajánlás rögzítve ('+ordered.length+' ingatlan)');route('recos');});
async function vRecos(m){
  const r=(await sb.from('recommendations').select('*,contacts(nev),recommendation_items(property_id,cim,ar,foto_snapshot,reakcio,properties(cim,property_photos(storage_path,borito,sorrend)))').order('datum',{ascending:false})).data||[];window._recos=r;
  m.innerHTML=`<h2 class="view">Kiajánlások</h2><div class="bar muted small">Új kiajánlást a Párosítás fülön indíthatsz (több ingatlan is kijelölhető).</div>
   ${r.length?r.map(x=>{const items=x.recommendation_items||[];const covers=items.map(it=>{const snap=it.foto_snapshot;return (Array.isArray(snap)&&snap.length)?snap[0]:pickCover(it.properties?.property_photos);}).filter(Boolean).slice(0,6);
     return `<div class="recocard" onclick="openReco('${x.id}')">
       <div class="recostrip">${covers.length?covers.map(k=>`<img loading="lazy" src="${esc(fotoUrl(k))}" onerror="this.onerror=null;this.src=PH_IMG">`).join(''):miniThumb('')}</div>
       <div style="flex:1"><b>${esc(x.contacts?.nev||'Ügyfél')}</b> <span class="muted small">${esc((x.datum||'').slice(0,10))} · ${esc(x.csatorna||'')}</span><br>
         <span class="small">${items.length} ingatlan${x.reakcio?' · reakció: '+esc(x.reakcio):''}${x.kovetkezo_lepes?' · utánkövetés: '+esc(x.kovetkezo_lepes):''}</span></div>
     </div>`;}).join(''):'<p class="muted">Még nincs kiajánlás.</p>'}`;
}
window.openReco=async id=>{const x=(await sb.from('recommendations').select('*,contacts(id,nev,emailek,telefonok),recommendation_items(id,property_id,cim,ar,foto_snapshot,reakcio,properties(cim,ingatlan_tipus,netto_alap,property_photos(storage_path,borito,sorrend)))').eq('id',id).single()).data;
  if(!x){toast('Nem található');return;}const items=x.recommendation_items||[];const c=x.contacts;
  modal(`<h3>Kiajánlás — ${esc(c?.nev||'')}</h3>
   <div class="two"><div><label>Kiküldve</label>${esc((x.datum||'').slice(0,16).replace('T',' '))}</div><div><label>Csatorna</label>${esc(x.csatorna||'')}</div></div>
   <div><label>Elérhetőség</label>${mailLine(c?.emailek)} ${telLine(c?.telefonok)}</div>
   ${x.szoveg?`<div><label>Bevezető (kiküldött)</label><span style="white-space:pre-wrap">${esc(x.szoveg)}</span></div>`:''}
   <div class="section"><h4>Ajánlott ingatlanok (${items.length})</h4>
     ${items.map(it=>{const snap=it.foto_snapshot;const keys=(Array.isArray(snap)&&snap.length)?snap:[pickCover(it.properties?.property_photos)].filter(Boolean);
       return `<div class="rp-prop"><div><b>${esc(it.cim||it.properties?.cim||'(cím)')}</b> <span class="muted small">${esc(it.properties?.ingatlan_tipus||'')} · ${ft(it.ar)}</span>
         ${it.property_id?`<button class="btn-ghost btn-sm" onclick="closeModal();openProp('${it.property_id}')">Ingatlan</button>`:''}</div>
         ${keys.length?`<div class="rp-imgs">${keys.map(k=>`<img src="${esc(fotoUrl(k))}" onclick="galleryOpen(['${esc(k)}'],0)">`).join('')}</div>`:'<div class="muted small">nincs mentett kép (a jelenlegi borító sem elérhető)</div>'}</div>`;}).join('')}</div>
   <div class="section"><h4>Reakció és utánkövetés</h4>
     <label>Ügyfél reakciója</label><input id="rr_reak" value="${esc(x.reakcio||'')}"/>
     <div class="two"><div><label>Következő teendő</label><input id="rr_next" value="${esc(x.kovetkezo_lepes||'')}"/></div><div><label>Határidő</label><input type="date" id="rr_date" value="${x.kovetkezo_datum||''}"/></div></div>
     <div class="bar"><button class="btn-primary" onclick="recoReaction('${id}',this)">Reakció mentése</button>
       <button class="btn-ghost" onclick="recoFollowup('${id}','${items[0]?.property_id||''}',this)">Utánkövetési feladat</button></div></div>
   <div class="bar">${c?.id?`<button class="btn-ghost" onclick="closeModal();openContact('${c.id}')">Ügyfél megnyitása</button>`:''}<button class="btn-ghost" onclick="closeModal()">Bezár</button></div>`);
};
window.recoReaction=(id,btn)=>busy(btn,async()=>{const r=await sb.from('recommendations').update({reakcio:$('#rr_reak').value.trim()||null,kovetkezo_lepes:$('#rr_next').value.trim()||null,kovetkezo_datum:$('#rr_date').value||null}).eq('id',id);if(r.error)throw r.error;toast('Reakció mentve');route('recos');});
window.recoFollowup=(id,pid,btn)=>busy(btn,async()=>{const next=$('#rr_next').value.trim();const date=$('#rr_date').value||null;if(!next)return toast('Adj meg következő teendőt');
  const rec={kovetkezo_lepes:next,mikorra:date,statusz:'Aktív',tipus:'Utánkövetés',gazda:'Közös'};
  if(pid){rec.targy_tabla='property';rec.targy_id=pid;}else{rec.targy_tabla='altalanos';}
  const r=await sb.from('tasks').insert(rec);if(r.error)throw r.error;
  await sb.from('recommendations').update({kovetkezo_lepes:next,kovetkezo_datum:date}).eq('id',id);
  toast('Utánkövetési feladat létrehozva');});

