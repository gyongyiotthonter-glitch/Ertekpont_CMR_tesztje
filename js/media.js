// ÉrtékPont CRM (staging) – media.js – fotó, dokumentum, signed URL, galéria
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
// ===================== Fotó- és dokumentumkezelés =====================
const FOTO_BUCKET='Fotok', DOC_BUCKET='dokumentumok';
let FOTOK_PRIVATE=false; // a Fotok bucket priváttá tétele (utolsó lépés) itt vált true-ra
const _signedCache={};
function fotoUrl(key){if(!key)return '';if(/^https?:/i.test(key))return key;
  return `${SUPABASE_URL}/storage/v1/object/public/${FOTO_BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;}
async function fotoUrlAsync(key){if(!key)return '';if(/^https?:/i.test(key))return key;if(!FOTOK_PRIVATE)return fotoUrl(key);
  if(_signedCache[key]&&_signedCache[key].exp>Date.now())return _signedCache[key].url;
  const r=await sb.storage.from(FOTO_BUCKET).createSignedUrl(key,3600);if(r.error)return '';
  _signedCache[key]={url:r.data.signedUrl,exp:Date.now()+3300*1000};return r.data.signedUrl;}
function miniThumb(key){return `<img class="mini" loading="lazy" src="${key?esc(fotoUrl(key)):PH_IMG}" onerror="this.onerror=null;this.src=PH_IMG">`;}
function imgMd(key){return `<img class="thumb-md" loading="lazy" src="${key?esc(fotoUrl(key)):PH_IMG}" onerror="this.onerror=null;this.src=PH_IMG">`;}
function thumbHover(key){const u=key?esc(fotoUrl(key)):PH_IMG;return `<span class="thumbz"><img class="s" loading="lazy" src="${u}" onerror="this.onerror=null;this.src=PH_IMG">${key?`<img class="big" loading="lazy" src="${esc(fotoUrl(key))}">`:""}</span>`;}
function humanSize(b){if(b==null||b==='')return '';b=Number(b);if(b<1024)return b+' B';if(b<1048576)return Math.round(b/1024)+' KB';return (b/1048576).toFixed(1)+' MB';}
function pickCover(pc){if(!pc||!pc.length)return '';const c=pc.find(x=>x.borito)||pc.slice().sort((a,b)=>(a.sorrend||0)-(b.sorrend||0))[0];return (c&&c.storage_path)||'';}
function leadCoverKey(x){const rel=x&&x.lead_photos;const lp=Array.isArray(rel)?rel[0]:rel;if(lp&&lp.storage_path)return lp.storage_path;const pr=Array.isArray(x&&x.properties)?x.properties[0]:(x&&x.properties);return pickCover(pr&&pr.property_photos);}
function taskCover(x,CM){if(x.targy_tabla==='lead')return CM.leadCover[x.targy_id]||'';if(x.targy_tabla==='property'||x.targy_tabla==='ingatlan')return CM.propCover[x.targy_id]||'';return '';}
async function coverMaps(){const [pp,lp,ld]=await Promise.all([
    sb.from('property_photos').select('property_id,storage_path,borito,sorrend'),
    sb.from('lead_photos').select('lead_id,storage_path'),
    sb.from('leads').select('id,property_id')]);
  const best={};(pp.data||[]).forEach(p=>{const c=best[p.property_id];if(!c){best[p.property_id]=p;return;}
    if(p.borito&&!c.borito){best[p.property_id]=p;return;}
    if(!!p.borito===!!c.borito&&(p.sorrend||0)<(c.sorrend||0))best[p.property_id]=p;});
  const propCover={};Object.keys(best).forEach(k=>propCover[k]=best[k].storage_path);
  const leadPhoto={};(lp.data||[]).forEach(p=>{if(!leadPhoto[p.lead_id])leadPhoto[p.lead_id]=p.storage_path;});
  const leadCover={};(ld.data||[]).forEach(l=>{const pc=l.property_id?propCover[l.property_id]:'';leadCover[l.id]=pc||leadPhoto[l.id]||'';});
  Object.keys(leadPhoto).forEach(id=>{if(!leadCover[id])leadCover[id]=leadPhoto[id];});
  return {propCover,leadCover};}
const IMG_RE=/^image\//;
async function uploadFile(bucket,file,prefix){const ext=((file.name.split('.').pop()||'dat').toLowerCase().replace(/[^a-z0-9]/g,''))||'dat';
  const key=`${prefix}/${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`;
  const up=await sb.storage.from(bucket).upload(key,file,{cacheControl:'3600',upsert:false});if(up.error)throw up.error;return key;}
async function removeFile(bucket,key){try{const r=await sb.storage.from(bucket).remove([key]);if(r.error){console.warn('Storage törlés sikertelen',bucket,key,r.error.message);return r.error;}return null;}catch(e){console.warn('Storage törlés kivétel',bucket,key,e);return e;}}

// ---- Ingatlanfotók kezelője ----
async function loadPhotoMgr(pid){const box=$('#photoMgr');if(!box)return;
  const q=await sb.from('property_photos').select('*').eq('property_id',pid).order('sorrend',{ascending:true}).order('letrehozva',{ascending:true});
  if(q.error){box.innerHTML='<span class="err small">Fotók betöltése sikertelen: '+esc(q.error.message)+'</span>';return;}
  const ph=q.data||[];window._pmPhotos=ph;window._pmPid=pid;
  box.innerHTML=`<div class="up"><label class="btn-gold btn-sm filelbl">📷 Fotó készítése<input type="file" accept="image/*" capture="environment" onchange="pmUpload('${pid}',this.files)"></label>
     <label class="btn-gold btn-sm filelbl">🖼 Képek kiválasztása<input type="file" accept="image/*" multiple onchange="pmUpload('${pid}',this.files)"></label>
     <span class="small muted">több kép egyszerre is</span></div><div id="pmProg" class="small"></div>
   ${ph.length?`<div class="bulkbar small"><label><input type="checkbox" onchange="document.querySelectorAll('.pmck').forEach(c=>c.checked=this.checked)" style="width:auto"> mind</label>
     <button class="btn-ghost btn-sm" onclick="pmBulk('${pid}','belso')">Kijelöltek → Belső</button>
     <button class="btn-ghost btn-sm" onclick="pmBulk('${pid}','nyilvanos')">Kijelöltek → Webre mehet</button></div>
   <div class="pmgrid">${ph.map((p,i)=>pmCard(p,i,ph.length)).join('')}</div>`:'<div class="muted small">Még nincs fotó.</div>'}`;}
function pmCard(p,i,n){const web=p.lathatosag==='nyilvanos';return `<div class="pmc">
  <input type="checkbox" class="pmck" value="${p.id}">
  <img loading="lazy" src="${esc(fotoUrl(p.storage_path))}" onclick="galleryOpen((window._pmPhotos||[]).map(x=>x.storage_path),${i})" onerror="this.onerror=null;this.src=PH_IMG">
  ${p.borito?'<span class="cov">Borító</span>':''}
  <div class="pmc-b">
    <button class="btn-ghost btn-sm" title="feljebb" onclick="pmMove('${p.id}',-1)" ${i===0?'disabled':''}>▲</button>
    <button class="btn-ghost btn-sm" title="lejjebb" onclick="pmMove('${p.id}',1)" ${i===n-1?'disabled':''}>▼</button>
    ${p.borito?'':`<button class="btn-ghost btn-sm" onclick="pmCover('${p.id}')">Borító</button>`}
    <button class="btn-ghost btn-sm" onclick="pmVis('${p.id}','${web?'belso':'nyilvanos'}')">${web?'Webre ✓':'Belső'}</button>
    <button class="btn-ghost btn-sm" title="törlés" onclick="pmDel('${p.id}')">🗑</button>
  </div></div>`;}
window.pmUpload=async(pid,files)=>{files=[...files];if(!files.length)return;const prog=$('#pmProg');
  const start=(window._pmPhotos||[]).length;const hadCover=(window._pmPhotos||[]).some(p=>p.borito);let ok=0,fail=0;
  for(let i=0;i<files.length;i++){const f=files[i];if(prog)prog.textContent=`Feltöltés ${i+1}/${files.length}…`;
    if(!IMG_RE.test(f.type)){fail++;continue;}
    let key;try{key=await uploadFile(FOTO_BUCKET,f,'properties/'+pid);}catch(e){fail++;continue;}
    const ins=await sb.from('property_photos').insert({property_id:pid,storage_path:key,sorrend:start+i,lathatosag:'belso',borito:false});
    if(ins.error){await removeFile(FOTO_BUCKET,key);fail++;}else ok++;}
  if(ok&&!hadCover){const first=(await sb.from('property_photos').select('id').eq('property_id',pid).order('sorrend').limit(1)).data;if(first&&first[0])await sb.from('property_photos').update({borito:true}).eq('id',first[0].id);}
  if(prog)prog.textContent='';toast(ok?`Feltöltve: ${ok}${fail?', hiba: '+fail:''}`:`Nem sikerült (${fail} hiba)`);await loadPhotoMgr(pid);};
window.pmMove=async(id,dir)=>{const ph=(window._pmPhotos||[]).slice();const idx=ph.findIndex(p=>p.id===id);const j=idx+dir;if(idx<0||j<0||j>=ph.length)return;
  const tmp=ph[idx];ph[idx]=ph[j];ph[j]=tmp;
  for(let k=0;k<ph.length;k++){if(ph[k].sorrend!==k){const r=await sb.from('property_photos').update({sorrend:k}).eq('id',ph[k].id);if(r.error){toast('Sorrend módosítása sikertelen');break;}}}
  await loadPhotoMgr(window._pmPid);};
window.pmCover=async(id)=>{const {error}=await sb.rpc('fn_set_cover',{p_photo:id});if(error){toast('Hiba: '+error.message);return;}toast('Borító beállítva');await loadPhotoMgr(window._pmPid);};
window.pmVis=async(id,to)=>{const r=await sb.from('property_photos').update({lathatosag:to}).eq('id',id);if(r.error){toast('Hiba: '+r.error.message);return;}await loadPhotoMgr(window._pmPid);};
window.pmBulk=async(pid,to)=>{const ids=[...document.querySelectorAll('.pmck:checked')].map(c=>c.value);if(!ids.length)return toast('Előbb jelölj ki képeket');
  const r=await sb.from('property_photos').update({lathatosag:to}).in('id',ids);if(r.error){toast('Hiba: '+r.error.message);return;}toast(ids.length+' kép frissítve');await loadPhotoMgr(pid);};
window.pmDel=async(id)=>{if(!confirm('Biztosan törlöd ezt a fotót?'))return;const ph=(window._pmPhotos||[]).find(p=>p.id===id);
  const r=await sb.from('property_photos').delete().eq('id',id);if(r.error){toast('Törlés sikertelen: '+r.error.message);return;}
  let rmErr=null;if(ph)rmErr=await removeFile(FOTO_BUCKET,ph.storage_path);
  if(ph&&ph.borito){const nx=(await sb.from('property_photos').select('id').eq('property_id',window._pmPid).order('sorrend').limit(1)).data;if(nx&&nx[0])await sb.from('property_photos').update({borito:true}).eq('id',nx[0].id);}
  toast(rmErr?'Rekord törölve, a fájl törlése nem sikerült (naplózva).':'Törölve');await loadPhotoMgr(window._pmPid);};

// ---- Galéria / nagyítás ----
window.galleryOpen=(keys,idx)=>{keys=(keys||[]).filter(Boolean);if(!keys.length)return;let i=idx||0;
  const bg=el('<div class="lightbox"><button class="lb-x">✕</button><button class="lb-nav lb-prev">‹</button><img><button class="lb-nav lb-next">›</button></div>');
  const img=bg.querySelector('img');const show=()=>{img.src=fotoUrl(keys[i]);};show();
  const close=()=>{bg.remove();document.removeEventListener('keydown',kd);};
  bg.querySelector('.lb-prev').onclick=e=>{e.stopPropagation();i=(i-1+keys.length)%keys.length;show();};
  bg.querySelector('.lb-next').onclick=e=>{e.stopPropagation();i=(i+1)%keys.length;show();};
  bg.querySelector('.lb-x').onclick=e=>{e.stopPropagation();close();};
  const kd=e=>{if(e.key==='Escape')close();else if(e.key==='ArrowLeft')bg.querySelector('.lb-prev').click();else if(e.key==='ArrowRight')bg.querySelector('.lb-next').click();};
  bg.onclick=e=>{if(e.target===bg)close();};document.addEventListener('keydown',kd);document.body.appendChild(bg);
  if(keys.length<2){bg.querySelector('.lb-prev').style.display='none';bg.querySelector('.lb-next').style.display='none';}};
window.lightbox=src=>galleryOpen([src],0);

// ---- Lead azonosítókép ----
async function saveLeadPhoto(leadId,file){const old=(await sb.from('lead_photos').select('storage_path').eq('lead_id',leadId).maybeSingle()).data;
  const key=await uploadFile(FOTO_BUCKET,file,'leads/'+leadId);
  const up=await sb.from('lead_photos').upsert({lead_id:leadId,storage_path:key,lathatosag:'belso'},{onConflict:'lead_id'});
  if(up.error){await removeFile(FOTO_BUCKET,key);throw up.error;}
  if(old&&old.storage_path&&old.storage_path!==key)await removeFile(FOTO_BUCKET,old.storage_path);
  return key;}
window.leadPhotoPick=async(leadId,input)=>{const f=input.files[0];if(!f)return;if(!IMG_RE.test(f.type))return toast('Csak képfájl tölthető fel');
  try{await saveLeadPhoto(leadId,f);toast('Azonosítókép mentve');openLead(leadId);}catch(e){toast('Hiba: '+e.message);}};
window.leadPhotoDel=async(leadId)=>{if(!confirm('Azonosítókép törlése?'))return;const old=(await sb.from('lead_photos').select('storage_path').eq('lead_id',leadId).maybeSingle()).data;
  const r=await sb.from('lead_photos').delete().eq('lead_id',leadId);if(r.error){toast('Hiba: '+r.error.message);return;}
  if(old&&old.storage_path)await removeFile(FOTO_BUCKET,old.storage_path);toast('Törölve');openLead(leadId);};
async function transferLeadPhoto(leadId,propId){try{const lp=(await sb.from('lead_photos').select('storage_path,lathatosag').eq('lead_id',leadId).maybeSingle()).data;
  if(!lp||!lp.storage_path)return {ok:true,skipped:true};
  const ex=(await sb.from('property_photos').select('id,borito').eq('property_id',propId)).data||[];
  const hasCover=ex.some(p=>p.borito);const ext=(lp.storage_path.split('.').pop()||'jpg');const newKey='properties/'+propId+'/'+Date.now()+'_lead.'+ext;
  const cp=await sb.storage.from(FOTO_BUCKET).copy(lp.storage_path,newKey);
  if(cp.error){console.warn('lead-foto másolás hiba',cp.error);return {ok:false,error:cp.error.message};}
  const ins=await sb.from('property_photos').insert({property_id:propId,storage_path:newKey,lathatosag:lp.lathatosag||'belso',borito:!hasCover,sorrend:ex.length});
  if(ins.error){await removeFile(FOTO_BUCKET,newKey);return {ok:false,error:ins.error.message};}
  return {ok:true};
 }catch(e){console.warn('lead-foto átvitel',e);return {ok:false,error:e.message};}}

// ---- Dokumentumkezelő ----
const DOC_TYPES=['Tulajdoni lap','Térképmásolat','Megbízási szerződés','Alaprajz','Energetikai tanúsítvány','Villamos biztonsági felülvizsgálat','Hirdetési adatlap / tájékoztató','Építési dokumentum','Egyéb'];
const DOC_PUBLIC_OK=['Alaprajz','Hirdetési adatlap / tájékoztató'];
async function loadDocMgr(pid){const box=$('#docMgr');if(!box)return;
  const q=await sb.from('property_documents').select('*').eq('property_id',pid).order('letrehozva',{ascending:false});
  if(q.error){box.innerHTML='<span class="err small">Dokumentumok betöltése sikertelen: '+esc(q.error.message)+'</span>';return;}
  const d=q.data||[];window._dmPid=pid;
  box.innerHTML=`<div class="up"><select id="dmType" style="max-width:240px;width:auto;margin:0 .3rem 0 0">${DOC_TYPES.map(t=>`<option>${t}</option>`).join('')}</select>
     <label class="btn-gold btn-sm filelbl">+ Dokumentum<input type="file" onchange="dmUpload('${pid}',this.files[0])"></label><span id="dmProg" class="small"></span></div>
   ${d.length?`<div class="tblwrap"><table><tr><th>Típus</th><th>Fájl</th><th>Feltöltve</th><th>Méret</th><th>Láthatóság</th><th></th></tr>
     ${d.map(x=>{const pubOk=DOC_PUBLIC_OK.includes(x.tipus);const web=x.lathatosag==='nyilvanos';return `<tr>
       <td>${esc(x.tipus||'')}</td><td class="small">${esc(x.eredeti_fajlnev||'')}</td><td class="small">${esc((x.letrehozva||'').slice(0,10))}</td><td class="small">${humanSize(x.meret)}</td>
       <td>${pubOk?`<button class="btn-ghost btn-sm" onclick="dmVis('${x.id}','${web?'belso':'nyilvanos'}')">${web?'Nyilvános ✓':'Belső'}</button>`:'<span class="pill" title="Ez a dokumentumtípus védett, nem tehető nyilvánossá">Belső (védett)</span>'}</td>
       <td><button class="btn-ghost btn-sm" onclick="dmOpen('${esc(x.storage_path)}')">Megnyit</button> <button class="btn-ghost btn-sm" onclick="dmDel('${x.id}')">🗑</button></td></tr>`;}).join('')}</table></div>`:'<div class="muted small">Még nincs dokumentum.</div>'}`;}
window.dmUpload=async(pid,file)=>{if(!file)return;const tipus=$('#dmType').value;const prog=$('#dmProg');if(prog)prog.textContent='Feltöltés…';
  let key;try{key=await uploadFile(DOC_BUCKET,file,'properties/'+pid);}catch(e){if(prog)prog.textContent='';return toast('Feltöltés sikertelen: '+e.message);}
  const ins=await sb.from('property_documents').insert({property_id:pid,tipus,storage_path:key,eredeti_fajlnev:file.name,meret:file.size,lathatosag:'belso'});
  if(ins.error){await removeFile(DOC_BUCKET,key);if(prog)prog.textContent='';return toast('Mentés sikertelen: '+ins.error.message);}
  if(prog)prog.textContent='';toast('Dokumentum feltöltve');await loadDocMgr(pid);};
window.dmVis=async(id,to)=>{const r=await sb.from('property_documents').update({lathatosag:to}).eq('id',id);
  if(r.error){toast('Nem engedélyezett: ez a típus nem tehető nyilvánossá.');return;}await loadDocMgr(window._dmPid);};
window.dmOpen=async(key)=>{const r=await sb.storage.from(DOC_BUCKET).createSignedUrl(key,3600);if(r.error){toast('Nem sikerült megnyitni: '+r.error.message);return;}window.open(r.data.signedUrl,'_blank');};
window.dmDel=async(id)=>{if(!confirm('Dokumentum törlése?'))return;const doc=(await sb.from('property_documents').select('storage_path').eq('id',id).single()).data;
  const r=await sb.from('property_documents').delete().eq('id',id);if(r.error){toast('Törlés sikertelen: '+r.error.message);return;}
  let rmErr=null;if(doc&&doc.storage_path)rmErr=await removeFile(DOC_BUCKET,doc.storage_path);toast(rmErr?'Rekord törölve, a fájl törlése nem sikerült (naplózva).':'Törölve');await loadDocMgr(window._dmPid);};

