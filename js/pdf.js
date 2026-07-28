// ÉrtékPont CRM (staging) – pdf.js – ajánlati PDF
// Staging build: 2026-07-28 03:00 – b2a-cdc9fbc
async function keyToDataUrl(key){try{const r=await sb.storage.from(FOTO_BUCKET).download(key);if(r.error||!r.data)return null;
  return await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>res(null);fr.readAsDataURL(r.data);});}catch(e){return null;}}
window.recoPdf=async()=>{if(!(window.jspdf&&window.jspdf.jsPDF)){toast('PDF motor nem töltött be');return;}toast('PDF készítése…');
  const {ordered,sel}=window._reco;const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210,M=14;let y=18;
  doc.setFontSize(16);doc.setTextColor(31,59,87);doc.text('ÉrtékPont Ingatlan – Ajánlat',M,y);y+=8;
  doc.setFontSize(10);doc.setTextColor(60,60,60);
  ($('#rc_intro').value||'').split('\n').forEach(ln=>{doc.text(ln||' ',M,y);y+=5;});y+=2;
  for(const p of ordered){if(y>250){doc.addPage();y=18;}
    doc.setFontSize(12);doc.setTextColor(31,59,87);doc.text(String(p.cim||'(cím)'),M,y);y+=5;
    doc.setFontSize(10);doc.setTextColor(60,60,60);doc.text(`${p.ingatlan_tipus||''}${p.netto_alap?', '+p.netto_alap+' m²':''}  –  ${ft((p.mandates||[])[0]?.iranyar)}`,M,y);y+=4;
    const keys=sel[p.id]||[];let x=M;const iw=58,ih=42;
    for(const k of keys){const du=await keyToDataUrl(k);if(!du)continue;if(x+iw>W-M){x=M;y+=ih+3;}if(y+ih>285){doc.addPage();y=18;x=M;}
      const fmt=/^data:image\/png/i.test(du)?'PNG':'JPEG';try{doc.addImage(du,fmt,x,y,iw,ih);}catch(_){}x+=iw+3;}
    y+=ih+8;}
  doc.save('ertekpont-ajanlat.pdf');toast('PDF letöltve');};
