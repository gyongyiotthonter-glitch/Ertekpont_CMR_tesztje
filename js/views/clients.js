// ÉrtékPont CRM (staging) – views/clients.js – Ügyfelek
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
// ---------- Contacts (háttér-nyilvántartás) ----------
async function vContacts(m){
  const c=(await sb.from('contacts').select('*').order('nev')).data||[];window._contacts=c;
  const [owners,searches,leads]=await Promise.all([
    sb.from('property_owners').select('contact_id,properties(cim,property_photos(storage_path,borito,sorrend))'),
    sb.from('search_requirements').select('contact_id,telepules,ingatlan_tipus,max_ar'),
    sb.from('leads').select('contact_id,telepules,ingatlan_tipus,kovetkezo_lepes,kovetkezo_datum')]);
  const roleMap={},ccover={};const push=(cid,txt)=>{if(!cid)return;(roleMap[cid]=roleMap[cid]||[]).push(txt);};
  (owners.data||[]).forEach(o=>{push(o.contact_id,(o.properties?.cim||'ingatlan')+' – tulajdonos');const k=pickCover(o.properties?.property_photos);if(k){(ccover[o.contact_id]=ccover[o.contact_id]||[]).push(k);}});
  (searches.data||[]).forEach(s=>push(s.contact_id,`${s.ingatlan_tipus||'ingatlant'} keres ${s.telepules||''}${s.max_ar?', max '+ft(s.max_ar):''}`));
  (leads.data||[]).forEach(l=>{push(l.contact_id,(l.telepules||l.ingatlan_tipus||'lead')+' – lead tulajdonosa');if(l.kovetkezo_lepes&&l.kovetkezo_datum)push(l.contact_id,`következő: ${l.kovetkezo_lepes} (${l.kovetkezo_datum})`);});
  m.innerHTML=`<h2 class="view">Kapcsolatok <span class="small muted">(háttér-nyilvántartás)</span></h2><div class="bar"><input id="cs" placeholder="Keresés név / telefon…"/><button class="btn-gold" onclick="editContact()">+ Új kapcsolat</button></div><div id="clist" class="grid"></div>`;
  const draw=()=>{const s=($('#cs').value||'').toLowerCase();
    $('#clist').innerHTML=c.filter(x=>!s||(x.nev||'').toLowerCase().includes(s)||(x.telefonok||[]).join(' ').includes(s)).map(x=>{const roles=roleMap[x.id]||[];
      return `<div class="card"><div class="pad"><h3 onclick="openContact('${x.id}')">${esc(x.nev)}</h3>
        <div class="meta">${(x.telefonok||[]).length?telLine(x.telefonok):'<span class="muted">nincs telefon</span>'}<br>
        ${roles.length?roles.map(r=>`<div>• ${esc(r)}</div>`).join(''):'<span class="muted">nincs kapcsolódó ügy</span>'}${(ccover[x.id]||[]).length?'<div style="margin-top:.3rem">'+ccover[x.id].slice(0,4).map(k=>miniThumb(k)).join(' ')+'</div>':''}</div>
        ${x.ne_keressuk?'<span class="pill warn">Ne keressük</span>':''}</div></div>`;}).join('')||'<p class="muted">Nincs találat.</p>';};
  $('#cs').oninput=draw;draw();
}
window.openContact=async id=>{const c=(window._contacts||[]).find(x=>x.id===id)||(await sb.from('contacts').select('*').eq('id',id).single()).data;
  modal(`<h3>${esc(c.nev)}</h3>
   <div><label>Típus</label>${esc(c.tipus||'Magánszemély')}</div>
   <div><label>Telefon</label>${telLine(c.telefonok)}</div><div><label>E-mail</label>${mailLine(c.emailek)}</div>
   <div><label>Cím</label>${esc(c.telepules||c.cim||'–')}</div>
   ${c.altalanos_megjegyzes?`<div><label>Megjegyzés</label>${esc(c.altalanos_megjegyzes)}</div>`:''}
   <div class="bar"><button class="btn-ghost" onclick="editContact('${id}')">Szerkesztés</button><button class="btn-ghost" onclick="closeModal()">Bezár</button></div>`);};
window.editContact=id=>{const c=id?(window._contacts||[]).find(x=>x.id===id)||{}:{};
  modal(`<h3>${id?'Kapcsolat szerkesztése':'Új kapcsolat'}</h3>
   <label>Név *</label><input id="f_nev" value="${esc(c.nev||'')}"/>
   <div class="two"><div><label>Típus</label><select id="f_tip"><option ${c.tipus!=='Cég'?'selected':''}>Magánszemély</option><option ${c.tipus==='Cég'?'selected':''}>Cég</option></select></div><div><label>Cím (opcionális)</label><input id="f_cim" value="${esc(c.telepules||'')}"/></div></div>
   <div class="two"><div><label>Telefon(ok), vesszővel</label><input id="f_tel" value="${esc((c.telefonok||[]).join(', '))}"/></div><div><label>E-mail(ek), vesszővel</label><input id="f_email" value="${esc((c.emailek||[]).join(', '))}"/></div></div>
   <label>Általános megjegyzés</label><textarea id="f_megj">${esc(c.altalanos_megjegyzes||'')}</textarea>
   <label class="small"><input type="checkbox" id="f_ne" ${c.ne_keressuk?'checked':''} style="width:auto"> Ne keressük</label>
   <div class="bar"><button class="btn-primary" id="f_btn" onclick="saveContact('${id||''}',this)">Mentés</button><button class="btn-ghost" onclick="closeModal()">Mégse</button></div>`);};
window.saveContact=(id,btn)=>busy(btn,async()=>{const arr=v=>v.split(',').map(x=>x.trim()).filter(Boolean);
  const rec={nev:$('#f_nev').value.trim(),tipus:$('#f_tip').value,telepules:$('#f_cim').value.trim()||null,telefonok:arr($('#f_tel').value),emailek:arr($('#f_email').value),altalanos_megjegyzes:$('#f_megj').value.trim()||null,ne_keressuk:$('#f_ne').checked,modositva:new Date().toISOString()};
  if(!rec.nev)throw new Error('A név kötelező');
  const r=id?await sb.from('contacts').update(rec).eq('id',id):await sb.from('contacts').insert(rec);if(r.error)throw r.error;
  await reloadContacts();closeModal();toast('Mentve');route('contacts');});

