// ÉrtékPont CRM (staging) – views/searches.js – Keresések
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
// ---------- Searches (Keresett ingatlanok) ----------
async function vSearches(m){
  const s=(await sb.from('search_requirements').select('*,contacts(nev)').order('letrehozva',{ascending:false})).data||[];
  m.innerHTML=`<h2 class="view">Keresett ingatlanok</h2><div class="bar"><button class="btn-gold" onclick="searchForm()">+ Új keresett ingatlan</button></div>
   ${tbl(['Paraméterek','Kereső','Max ár','Min. szoba','Felülvizsg.','Állapot',''],s.map(x=>[`<span class="row-link" onclick="searchForm('${x.id}')">${esc(x.telepules||'')} ${esc(x.ingatlan_tipus||'')}</span>`,esc(x.contacts?.nev||'–'),ft(x.max_ar),x.min_szoba??'–',x.kovetkezo_felulvizsgalat||'–',`<span class="pill info">${esc(x.statusz||'')}</span>`,`<button class="btn-ghost btn-sm" onclick="route('matching')">Párosítás</button>`]))}`;
}
window.searchForm=async id=>{let s={};if(id)s=(await sb.from('search_requirements').select('*').eq('id',id).single()).data||{};const pz=s.pontozott||{};const nf=!id;
  modal(`<h3>${id?'Keresett ingatlan szerkesztése':'Új keresett ingatlan'}</h3>
   <div class="section"><h4>Kötelező szűrők</h4><div class="err" id="s_err"></div>
     <div class="two"><div><label>Település / terület *</label><input id="s_telep" value="${esc(s.telepules||'')}"/></div><div><label>Ingatlantípus *</label><input id="s_tip" value="${esc(s.ingatlan_tipus||'')}"/></div></div>
     <div class="two"><div><label>Maximum ár (teljes Ft) *</label><input id="s_max" type="number" value="${s.max_ar??''}"/></div><div><label>Minimum szobaszám *</label><input id="s_szoba" type="number" value="${s.min_szoba??''}"/></div></div></div>
   <div class="section"><h4>Pontozott feltételek</h4>
     <div class="three"><div><label>Alap-tól m²</label><input id="s_atol" type="number" value="${pz.alap_tol??''}"/></div><div><label>Alap-ig m²</label><input id="s_aig" type="number" value="${pz.alap_ig??''}"/></div><div><label>Telek-tól m²</label><input id="s_ttol" type="number" value="${pz.telek_tol??''}"/></div></div>
     <div class="three"><div><label>Állapot</label><input id="s_all2" value="${esc(pz.allapot||'')}"/></div><div><label>Emelet</label><input id="s_em" value="${esc(pz.emelet||'')}"/></div><div><label>Kert/terasz/garázs</label><input id="s_extra" value="${esc(pz.extra||'')}"/></div></div></div>
   <label>Kizáró feltételek (vesszővel)</label><input id="s_kiz" value="${esc((s.kizaro_feltetelek||[]).join(', '))}"/>
   <div class="two"><div><label>Következő felülvizsgálat</label><input type="date" id="s_rev" value="${s.kovetkezo_felulvizsgalat||''}"/></div><div><label>Állapot</label><select id="s_st">${['Aktív','Lezárt'].map(v=>`<option ${s.statusz===v?'selected':''}>${v}</option>`).join('')}</select></div></div>
   <div class="section"><h4>Kereső hozzákapcsolása ${nf?'*':''}</h4>${personPicker('sp',s.contact_id)}</div>
   <div class="bar"><button class="btn-primary" id="s_btn" onclick="saveSearch('${id||''}',this)">Mentés</button><button class="btn-ghost" onclick="closeModal()">Mégse</button></div>`);};
window.saveSearch=(id,btn)=>busy(btn,async()=>{const num=v=>v===''?null:Number(v);
  const telep=$('#s_telep').value.trim(),tip=$('#s_tip').value.trim(),max=$('#s_max').value,szoba=$('#s_szoba').value;
  if(!telep||!tip||max===''||szoba===''){$('#s_err').textContent='A csillagozott kötelező mezőket töltsd ki (település, típus, max ár, min szoba).';throw new Error('Hiányzó kötelező mező');}
  const pz={};const add=(k,v)=>{if(v!==''&&v!=null)pz[k]=isNaN(v)?v:Number(v);};
  add('alap_tol',$('#s_atol').value);add('alap_ig',$('#s_aig').value);add('telek_tol',$('#s_ttol').value);add('allapot',$('#s_all2').value.trim());add('emelet',$('#s_em').value.trim());add('extra',$('#s_extra').value.trim());
  const contact_id=await resolvePerson('sp');if(!contact_id&&!id)throw new Error('A keresőt kötelező megadni');
  const rec={contact_id:contact_id||(await sb.from('search_requirements').select('contact_id').eq('id',id).single()).data?.contact_id,telepules:telep,ingatlan_tipus:tip,max_ar:num(max),min_szoba:num(szoba),pontozott:pz,kizaro_feltetelek:$('#s_kiz').value.split(',').map(x=>x.trim()).filter(Boolean),kovetkezo_felulvizsgalat:$('#s_rev').value||null,statusz:$('#s_st').value,modositva:new Date().toISOString()};
  const r=id?await sb.from('search_requirements').update(rec).eq('id',id):await sb.from('search_requirements').insert(rec);
  if(r.error)throw r.error;closeModal();toast('Keresett ingatlan mentve');route('searches');});

