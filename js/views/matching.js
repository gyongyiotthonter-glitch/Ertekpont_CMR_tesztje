// ÉrtékPont CRM (staging) – views/matching.js – Párosítás
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
// ---------- Matching ----------
async function vMatching(m){
  const mt=(await sb.from('matches').select('*,search_requirements(telepules,ingatlan_tipus,max_ar,min_szoba,contact_id,contacts(nev)),properties(cim,ingatlan_tipus,netto_alap,property_photos(storage_path,borito,sorrend))').order('pontszam',{ascending:false})).data||[];
  const groups={};mt.forEach(r=>{(groups[r.search_requirement_id]=groups[r.search_requirement_id]||[]).push(r);});
  m.innerHTML=`<h2 class="view">Párosítás</h2><div class="bar"><button class="btn-gold" id="mc_btn" onclick="recompute(this)">Párosítás újraszámolása</button><span class="muted small">${mt.length} találat</span></div>
   ${Object.values(groups).map(rows=>{const s=rows[0].search_requirements;const sid=rows[0].search_requirement_id;return `<div class="section"><h4>${esc(s?.contacts?.nev||'Kereső')} — ${esc(s?.telepules||'')} ${esc(s?.ingatlan_tipus||'')} (max ${ft(s?.max_ar)}${s?.min_szoba?', min '+s.min_szoba+' szoba':''})</h4>
     <div class="tblwrap"><table><tr><th><input type="checkbox" onclick="document.querySelectorAll('.mchk-${sid}').forEach(c=>c.checked=this.checked)"></th><th>Ingatlan</th><th>Pont</th><th>Magyarázat</th></tr>${rows.map(r=>`<tr><td><input type="checkbox" class="mchk-${sid}" value="${r.property_id}"></td><td>${miniThumb(pickCover(r.properties?.property_photos))} ${esc(r.properties?.cim||'')} <span class="muted small">${esc(r.properties?.ingatlan_tipus||'')} ${r.properties?.netto_alap?r.properties.netto_alap+' m²':''}</span></td><td><b>${r.pontszam}</b></td><td class="small">${esc(r.egyezes?.szoveg||'')} ${r.kezi_ellenorzes?'<span class="pill warn">Ár hiányzik – kézi ellenőrzés</span>':''}</td></tr>`).join('')}</table></div>
     <div class="bar"><button class="btn-gold btn-sm" onclick="buildReco('${sid}','${s?.contact_id||''}')">Kijelöltek kiajánlása →</button></div></div>`;}).join('')||'<p class="muted">Nincs találat. Futtasd az újraszámolást.</p>'}`;
}
window.recompute=btn=>busy(btn,async()=>{const {error}=await sb.rpc('fn_szamol_parositas');if(error)throw error;toast('Párosítás frissítve');route('matching');});

