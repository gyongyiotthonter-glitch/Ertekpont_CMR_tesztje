// ÉrtékPont CRM (staging) – views/mandates.js – Megbízások / ingatlanadatlap
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
// ---------- Properties ----------
async function vProperties(m){
  const p=(await sb.from('properties').select('*,mandates(id,ugylet,iranyar,statusz,kezelesi_kategoria,szerzodes_jelleg),property_photos(storage_path,borito,sorrend),property_owners(id,contact_id,contacts(id,nev))').order('letrehozva',{ascending:false})).data||[];window._props=p;
  m.innerHTML=`<h2 class="view">Ingatlanok / megbízások</h2><div class="bar"><input id="ps" placeholder="Keresés cím…"/><button class="btn-gold" onclick="propForm()">+ Új ingatlan / megbízás</button></div><div id="plist" class="grid"></div>`;
  const draw=()=>{const s=($('#ps').value||'').toLowerCase();
    $('#plist').innerHTML=p.filter(x=>!s||(x.cim||'').toLowerCase().includes(s)).map(x=>{const md=(x.mandates||[])[0]||{};const cover=coverPhoto(x);const own=(x.property_owners||[]).map(o=>o.contacts?.nev).filter(Boolean).join(', ');
      return `<div class="card"><div class="thumb" onclick="openProp('${x.id}')"><img loading="lazy" src="${cover?esc(fotoUrl(cover)):PH_IMG}" alt="" onerror="this.onerror=null;this.src=PH_IMG"></div>
        <div class="pad"><h3 onclick="openProp('${x.id}')">${esc(x.cim||'(cím nélkül)')}</h3>
        <div class="meta">${esc([x.ingatlan_tipus,x.altipus].filter(Boolean).join(' / '))} ${x.netto_alap?'· '+x.netto_alap+' m²':''}<br>
        <span class="pill ${md.ugylet==='Kiadó'?'info':'gold'}">${esc(md.ugylet||'Megbízás')}</span>${md.kezelesi_kategoria?`<span class="pill ${md.kezelesi_kategoria==='Háttér'?'warn':'ok'}">${esc(md.kezelesi_kategoria)}</span>`:''}<b style="color:var(--navy)"> ${ft(md.iranyar)}</b>${own?'<br>Tulajdonos: '+esc(own):''}</div></div></div>`;}).join('')||'<p class="muted">Nincs találat.</p>';};
  $('#ps').oninput=draw;draw();
}
function coverPhoto(x){const ps=(x.property_photos||[]).slice().sort((a,b)=>(b.borito?1:0)-(a.borito?1:0)||(a.sorrend||0)-(b.sorrend||0));return ps[0]?.storage_path||'';}
window.openProp=async id=>{const x=(await sb.from('properties').select('*,mandates(id,ugylet,iranyar,statusz,kezelesi_kategoria,szerzodes_jelleg,szerzodes_datum,lejarat),property_photos(storage_path,borito,sorrend),property_owners(id,contact_id,contacts(id,nev))').eq('id',id).single()).data;if(!x){toast('Nem található');return;}const md=(x.mandates||[])[0]||{};
  const photos=(x.property_photos||[]).slice().sort((a,b)=>(b.borito?1:0)-(a.borito?1:0)||(a.sorrend||0)-(b.sorrend||0)).map(f=>f.storage_path).filter(Boolean);window._opPhotos=photos;
  const owners=(x.property_owners||[]);
  modal(`<h3>${esc(x.cim||'Ingatlan')}</h3>
   <div class="thumb" style="border-radius:10px;margin-bottom:.6rem" onclick="${photos.length?'galleryOpen(window._opPhotos,0)':''}"><img src="${photos[0]?esc(fotoUrl(photos[0])):PH_IMG}" onerror="this.onerror=null;this.src=PH_IMG"></div>
   <div class="two"><div><label>Típus</label>${esc([x.ingatlan_tipus,x.altipus].filter(Boolean).join(' / ')||'–')}</div><div><label>Elhelyezkedés</label>${esc(x.elhelyezkedes||'–')}</div></div>
   <div class="two"><div><label>Cím</label>${esc(x.cim||propAddr(x)||'–')}${(propAddr(x)&&x.cim&&propAddr(x)!==x.cim)?` <span class="muted small">(strukturált: ${esc(propAddr(x))})</span>`:''}</div><div><label>HRSZ</label>${esc(x.hrsz||'–')}</div></div>
   <div class="three"><div><label>Alapterület</label>${x.netto_alap?x.netto_alap+' m²':'–'}</div><div><label>Telek</label>${x.telek?x.telek+' m²':'–'}</div><div><label>Lakószobák</label>${roomTotal(x)}</div></div>
   <div class="two"><div><label>Építés éve / állapot</label>${esc([x.epites_eve,x.allapot].filter(Boolean).join(' · ')||'–')}</div><div><label>Energetika</label>${esc([x.energetikai_besorolas,x.energetikai].filter(Boolean).join(' · ')||'–')}</div></div>
   <div class="two"><div><label>Ügylet</label>${esc(md.ugylet||'–')}</div><div><label>Irányár</label>${ft(md.iranyar)}</div></div>
   <div class="two"><div><label>Kezelés / jelleg</label>${esc(md.kezelesi_kategoria||'–')} / ${esc(md.szerzodes_jelleg||'–')}</div><div><label>Státusz</label>${esc(md.statusz||'–')}</div></div>
   ${x.jogi_megjegyzes?`<div><label>Jogi megjegyzés</label>${esc(x.jogi_megjegyzes)}</div>`:''}
   ${propTechSummary(x)}
   <div class="section"><h4>Tulajdonosok (${owners.length})</h4>${owners.map(o=>`<div class="small">• ${esc(o.contacts?.nev||'')} <button class="copy" onclick="rmOwner('${o.id}','${id}')">✕</button></div>`).join('')||'<span class="muted small">nincs</span>'}
     <div class="subform">${personPicker('ow',null)}<button class="btn-ghost btn-sm" onclick="addOwner('${id}',this)">+ Tulajdonos hozzáadása</button></div></div>
   <div class="section"><h4>Fotók</h4><div id="photoMgr"><span class="muted small">Betöltés…</span></div></div>
   <div class="section"><h4>Dokumentumok</h4><div id="docMgr"><span class="muted small">Betöltés…</span></div></div>
   <div class="bar"><button class="btn-ghost" onclick="propForm('${id}')">Ingatlan/megbízás szerkesztése</button><button class="btn-ghost" onclick="closeModal()">Bezár</button></div>`);
  loadPhotoMgr(id);loadDocMgr(id);
};
window.rmOwner=async(oid,pid)=>{if(!oid||oid==='undefined'){toast('Hiba: hiányzó kapcsolóazonosító');return;}if(!confirm('Tulajdonos eltávolítása erről az ingatlanról?'))return;const r=await sb.from('property_owners').delete().eq('id',oid);if(r.error){toast('Nem sikerült: '+r.error.message);return;}toast('Eltávolítva');openProp(pid);};
window.addOwner=(pid,btn)=>busy(btn,async()=>{const cid=await resolvePerson('ow');if(!cid)return toast('Válassz vagy adj meg személyt');const r=await sb.from('property_owners').insert({property_id:pid,contact_id:cid});if(r.error){toast(r.error.code==='23505'?'Ez a személy már hozzá van kapcsolva az ingatlanhoz.':'Hiba: '+r.error.message);return;}toast('Tulajdonos hozzáadva');openProp(pid);});
async function propForm(id){let x={};if(id){x=(await sb.from('properties').select('*,mandates(id,ugylet,iranyar,statusz,kezelesi_kategoria,szerzodes_jelleg,szerzodes_datum,lejarat)').eq('id',id).single()).data||{};}const md=(x.mandates||[])[0]||{};const nf=!id;window._editProp=x;window._touched={};
  modal(`<h3>${id?'Ingatlan / megbízás szerkesztése':'Új ingatlan / megbízás'}</h3>
   ${listsReady()?'':'<div class="pill danger">Hiányzó választólisták: '+((window.LISTS_MISSING||[]).join(', ')||'ismeretlen')+' – a mentés le van tiltva. Töltsd újra az oldalt.</div>'}
   <div class="section"><h4>Ingatlan – fő adatok</h4>
     ${typeSubtype('p',x.ingatlan_tipus,x.altipus)}
     <div class="two"><div><label>Település</label><input id="p_telep" value="${esc(x.telepules||'')}" onchange="onTelepulesChange('p')"/></div>
       <div><label>Városrész</label><span id="p_varoszbox">${varosreszField('p',x.telepules,x.varosresz)}</span></div></div>
     <div class="three"><div><label>Utca</label><input id="p_utca" value="${esc(x.utca||'')}" oninput="updateCimPreview('p')"/></div><div><label>Házszám</label><input id="p_hazszam" value="${esc(x.hazszam||'')}" oninput="updateCimPreview('p')"/></div><div><label>HRSZ</label><input id="p_hrsz" value="${esc(x.hrsz||'')}"/></div></div>
     <div class="two"><div><label>Elhelyezkedés</label>${selList('p_elh','elhelyezkedes',x.elhelyezkedes)}</div><div><label>Földhivatali megnevezés</label><input id="p_fold" value="${esc(x.foldhivatali_megnevezes||'')}"/></div></div>
     <label>Megjelenítési cím</label>
     <label class="chk"><input type="checkbox" id="p_cim_kezi" ${(id?x.cim_kezi:false)?'checked':''} onchange="onCimModeChange('p')"> Kézi megjelenítési cím (egyébként automatikusan a fenti mezőkből)</label>
     <input id="p_cim" value="${esc(x.cim||'')}"/><div id="p_cimauto" class="small muted"></div>
     <div class="three"><div><label>Nettó alapterület m²</label><input id="p_alap" type="number" value="${x.netto_alap??''}"/></div><div><label>Telek m²</label><input id="p_telek" type="number" value="${x.telek??''}"/></div><div><label>Építés éve</label><input id="p_ev" type="number" value="${x.epites_eve??''}"/></div></div>
     <div class="three"><div><label>Szobák összesen</label><input id="p_szobak" type="number" step="0.5" value="${x.szobak??''}"/></div>
       <div><label>Nappali</label><label class="chk" style="margin-top:.35rem"><input type="checkbox" id="p_nappali" ${x.nappali?'checked':''} onchange="updateRoomTotal('p')"> Van nappali</label></div>
       <div><label>Hálószobák (nappalin kívül, fél is)</label><input id="p_haloszoba" type="number" step="0.5" value="${x.haloszoba??''}" oninput="updateRoomTotal('p')"/></div></div>
     <div class="small muted">A „Szobák összesen” az irányadó – a régi érték megmarad. A bontás (nappali + hálószobák) kitöltésekor automatikusan frissül; üresen hagyva nem íródik felül.</div>
     <div class="two"><div><label>Műszaki állapot</label>${selList('p_allapot','muszaki_allapot',x.allapot)}</div><div><label>Jogi megjegyzés</label><input id="p_jogi" value="${esc(x.jogi_megjegyzes||'')}"/></div></div>
   </div>
   <div class="section"><h4>Részletes műszaki adatok</h4>
     <div class="three"><div><label>Épület szintjei</label>${selList('p_epszint','epulet_szintjei',x.epulet_szintjei)}</div><div><label>Lakás szintje</label>${selList('p_lakszint','lakas_szint',x.lakas_szint)}</div><div><label>Emelet száma</label><input id="p_emszam" type="number" value="${x.emelet_szam??''}"/></div></div>
     <div class="two"><div><label>Tetőtér</label>${selList('p_tetoter','tetoter',x.tetoter)}</div><div><label>Kertkapcsolat</label>${selList('p_kert','kertkapcsolat',x.kertkapcsolat)}</div></div>
     <div class="small muted">Logikai mezők: Nincs adat / Igen / Nem – a „Nincs adat" nem ír felül meglévő értéket.</div>
     <div class="three"><div><label>Önálló garázs</label>${triSel('p_garazs',x.garazs_onallo)}</div><div><label>Garázs m²</label><input id="p_garazs_m2" type="number" value="${x.garazs_m2??''}"/></div><div><label>Teremgarázs</label>${triSel('p_teremg',x.teremgarazs)}</div></div>
     <div class="three"><div><label>Gépkocsibeálló</label>${triSel('p_beallo',x.gepkocsibeallo)}</div><div><label>Lift</label>${triSel('p_lift',x.lift)}</div><div><label>Klíma</label>${triSel('p_klima',x.klima)}</div></div>
     <div class="three"><div><label>Pince</label>${triSel('p_pince',x.pince)}</div><div><label>Pince m²</label><input id="p_pince_m2" type="number" value="${x.pince_m2??''}"/></div><div><label>Szuterén</label>${triSel('p_szuteren',x.szuteren)}</div></div>
     <div class="three"><div><label>Szuterén m²</label><input id="p_szuteren_m2" type="number" value="${x.szuteren_m2??''}"/></div><div><label>Melléképület</label>${triSel('p_mellek',x.mellekepulet)}</div><div><label>Melléképület m²</label><input id="p_mellek_m2" type="number" value="${x.mellekepulet_m2??''}"/></div></div>
     <label>Fűtési módok</label><div>${multiChecks('p_futes','futesi_mod',x.futesi_modok)}</div>
     <label>Hőleadók</label><div>${multiChecks('p_holeado','holeado',x.holeadok)}</div>
     <div class="three"><div><label>Melegvíz</label>${selList('p_melegviz','melegviz',x.melegviz)}</div><div><label>Villamos felülvizsgálat</label>${selList('p_villamos','felulvizsgalat_statusz',x.villamos)}</div><div><label>Energetikai tanúsítvány</label>${selList('p_energ','felulvizsgalat_statusz',x.energetikai)}</div></div>
     <div class="two"><div><label>Energetikai besorolás</label>${selList('p_energbes','energetikai_besorolas',x.energetikai_besorolas)}</div><div></div></div>
   </div>
   <div class="section"><h4>Megbízás</h4>
     <div class="two"><div><label>Ügylet</label><select id="p_uk"><option ${md.ugylet!=='Kiadó'?'selected':''}>Eladó</option><option ${md.ugylet==='Kiadó'?'selected':''}>Kiadó</option></select></div><div><label>Kezelés</label><select id="p_kez"><option ${md.kezelesi_kategoria!=='Háttér'?'selected':''}>Nyílt</option><option ${md.kezelesi_kategoria==='Háttér'?'selected':''}>Háttér</option></select></div></div>
     <div class="two"><div><label>Szerződés jellege</label><select id="p_jel">${['Normál','Kizárólagos','Exclusiv'].map(v=>`<option ${md.szerzodes_jelleg===v?'selected':''}>${v}</option>`).join('')}</select></div><div><label>Irányár (teljes Ft)</label><input id="p_ar" type="number" value="${md.iranyar??''}"/></div></div>
     <div class="two"><div><label>Szerződés dátuma</label><input type="date" id="p_d" value="${md.szerzodes_datum||''}"/></div><div><label>Lejárat</label><input type="date" id="p_l" value="${md.lejarat||''}"/></div></div>
     <div class="two"><div><label>Státusz</label><input id="p_st" value="${esc(md.statusz||'Aktív')}"/></div><div></div></div></div>
   ${nf?`<div class="section"><h4>Tulajdonos hozzákapcsolása</h4>${personPicker('po',null)}</div>`:''}
   <div class="bar"><button class="btn-primary" id="p_btn" onclick="saveProp('${id||''}','${md.id||''}',this)">Mentés</button><button class="btn-ghost" onclick="closeModal()">Mégse</button></div>`);onCimModeChange('p');}
window.propForm=propForm;
window.saveProp=(id,mid,btn)=>busy(btn,async()=>{if(!listsReady())return toast('Hiányzó választólisták'+((window.LISTS_MISSING&&window.LISTS_MISSING.length)?(' ('+window.LISTS_MISSING.join(', ')+')'):'')+' – a mentés letiltva. Töltsd újra az oldalt.');
  const L=Logic,num=L.num;const val=k=>($('#'+k)?.value||'').trim()||null;const sv=k=>$('#'+k)?.value||null;const tb=k=>L.parseTriBool($('#'+k)?.value);const orig=window._editProp||{};
  const telep=val('p_telep');const varosresz=($('#p_varosresz')?.value||'').trim()||null;const utca=val('p_utca');const hazszam=val('p_hazszam');
  const parts=[telep,varosresz,[utca,hazszam].filter(Boolean).join(' ')].filter(Boolean);
  const _cimr=L.resolveCim({cim_kezi:!!($('#p_cim_kezi')&&$('#p_cim_kezi').checked),manual:val('p_cim'),parts});const cim_kezi=_cimr.cim_kezi,cim=_cimr.cim;
  const room=L.roomLogic({szobak:$('#p_szobak').value,haloszoba:$('#p_haloszoba').value,nappaliChecked:!!($('#p_nappali')&&$('#p_nappali').checked)});
  const garazs=tb('p_garazs'),pince=tb('p_pince'),szuteren=tb('p_szuteren'),mellek=tb('p_mellek');
  const prec={ingatlan_tipus:sv('p_tip'),altipus:sv('p_alt'),telepules:telep,varosresz:varosresz,utca:utca,hazszam:hazszam,hrsz:val('p_hrsz'),elhelyezkedes:sv('p_elh'),foldhivatali_megnevezes:val('p_fold'),cim:cim,cim_kezi:cim_kezi,
    netto_alap:num($('#p_alap').value),telek:num($('#p_telek').value),epites_eve:num($('#p_ev').value),nappali:room.nappali,haloszoba:room.haloszoba,szobak:room.szobak,
    allapot:sv('p_allapot'),jogi_megjegyzes:val('p_jogi'),
    epulet_szintjei:sv('p_epszint'),lakas_szint:sv('p_lakszint'),emelet_szam:num($('#p_emszam').value),tetoter:sv('p_tetoter'),kertkapcsolat:sv('p_kert'),
    garazs_onallo:garazs,garazs_m2:L.areaForBool(garazs,$('#p_garazs_m2').value),teremgarazs:tb('p_teremg'),gepkocsibeallo:tb('p_beallo'),lift:tb('p_lift'),klima:tb('p_klima'),
    pince:pince,pince_m2:L.areaForBool(pince,$('#p_pince_m2').value),szuteren:szuteren,szuteren_m2:L.areaForBool(szuteren,$('#p_szuteren_m2').value),mellekepulet:mellek,mellekepulet_m2:L.areaForBool(mellek,$('#p_mellek_m2').value),
    futesi_modok:L.mergeMulti(orig.futesi_modok,readChecks('p_futes'),isTouched('p_futes')),holeadok:L.mergeMulti(orig.holeadok,readChecks('p_holeado'),isTouched('p_holeado')),
    melegviz:sv('p_melegviz'),villamos:sv('p_villamos'),energetikai:sv('p_energ'),energetikai_besorolas:sv('p_energbes'),
    modositva:new Date().toISOString()};
  const mrec={ugylet:$('#p_uk').value,kezelesi_kategoria:$('#p_kez').value,szerzodes_jelleg:$('#p_jel').value,iranyar:num($('#p_ar').value),szerzodes_datum:$('#p_d').value||null,lejarat:$('#p_l').value||null,statusz:$('#p_st').value.trim()||'Aktív'};
  let pid=id;
  if(id){const r=await sb.from('properties').update(prec).eq('id',id);if(r.error)throw r.error;}
  else{const r=await sb.from('properties').insert(prec).select('id').single();if(r.error)throw r.error;pid=r.data.id;}
  if(mid){const r=await sb.from('mandates').update(mrec).eq('id',mid);if(r.error)throw r.error;}
  else{mrec.property_id=pid;const r=await sb.from('mandates').insert(mrec);if(r.error)throw r.error;}
  if(!id){const cid=await resolvePerson('po');if(cid)await sb.from('property_owners').insert({property_id:pid,contact_id:cid});}
  closeModal();toast('Ingatlan/megbízás mentve');route('properties');});
// ---- Ingatlan-megjelenítő segédek (Blokk 1) ----
function propAddr(x){return [x.telepules,x.varosresz,[x.utca,x.hazszam].filter(Boolean).join(' ')].filter(Boolean).join(', ');}
function roomTotal(x){if(x.nappali!=null||x.haloszoba!=null){const t=(x.nappali?1:0)+(x.haloszoba||0);return t+(x.nappali||x.haloszoba?` (${x.nappali?'nappali + ':''}${x.haloszoba||0} háló)`:'');}return x.szobak??'–';}
function propTechSummary(x){const rows=[];const triTxt=v=>v===true?'igen':v===false?'nem':null;
  const add=(l,v)=>{if(v!=null&&v!==''&&!(Array.isArray(v)&&!v.length))rows.push(`<div class="small">• <b>${l}:</b> ${esc(Array.isArray(v)?v.join(', '):v)}</div>`);};
  add('Épület szintjei',x.epulet_szintjei);add('Lakás szintje',[x.lakas_szint,x.emelet_szam].filter(v=>v!=null&&v!=='').join(' '));add('Tetőtér',x.tetoter);add('Kertkapcsolat',x.kertkapcsolat);
  add('Önálló garázs',x.garazs_onallo===true?('igen'+(x.garazs_m2?' ('+x.garazs_m2+' m²)':'')):triTxt(x.garazs_onallo));add('Teremgarázs',triTxt(x.teremgarazs));add('Gépkocsibeálló',triTxt(x.gepkocsibeallo));
  add('Pince',x.pince===true?('igen'+(x.pince_m2?' ('+x.pince_m2+' m²)':'')):triTxt(x.pince));add('Szuterén',x.szuteren===true?('igen'+(x.szuteren_m2?' ('+x.szuteren_m2+' m²)':'')):triTxt(x.szuteren));add('Melléképület',x.mellekepulet===true?('igen'+(x.mellekepulet_m2?' ('+x.mellekepulet_m2+' m²)':'')):triTxt(x.mellekepulet));
  add('Lift',triTxt(x.lift));add('Klíma',triTxt(x.klima));add('Fűtés',x.futesi_modok);add('Hőleadók',x.holeadok);add('Melegvíz',x.melegviz);add('Villamos felülvizsgálat',x.villamos);
  return rows.length?`<div class="section"><h4>Részletes műszaki adatok</h4>${rows.join('')}</div>`:'';}

