// ÉrtékPont CRM (staging) – js/logic.js – tiszta segédfüggvények (böngésző + Node közös)
// Ezeket használja a valódi alkalmazás ÉS a tesztek is, így a teszt nem térhet el a kódtól.
(function(root){
  const num=v=>{if(v===''||v==null)return null;const x=Number(String(v).replace(',','.'));return isNaN(x)?null:x;};
  const parseTriBool=v=>{if(v===''||v==null)return null;if(v===true||v==='true'||v==='Igen')return true;if(v===false||v==='false'||v==='Nem')return false;return null;};
  const triBoolOptions=val=>{const cur=parseTriBool(val);const opts=[['','Nincs adat'],['true','Igen'],['false','Nem']];
    return opts.map(([v,l])=>{const sel=(cur===null&&v==='')||(cur===true&&v==='true')||(cur===false&&v==='false');return '<option value="'+v+'"'+(sel?' selected':'')+'>'+l+'</option>';}).join('');};
  const areaForBool=(boolVal,m2)=>boolVal===true?num(m2):null; // Igen->terület, Nem/Nincs adat->null (nincs hamis állítás)
  const roomLogic=f=>{const haloszoba=num(f.haloszoba);const nappali=(haloszoba==null&&!f.nappaliChecked)?null:!!f.nappaliChecked;const szobak=num(f.szobak);return {szobak,haloszoba,nappali};};
  const computeCim=({mode,manual,parts})=>{const auto=(parts||[]).filter(Boolean).join(', ');const man=(manual||'').trim()||null;return mode==='kezi'?(man||auto||null):(auto||null);};
  // Többértékű lista: érintetlen (touched=false) esetén a régi érték marad (null is!), érintve a kijelölt tömb (üres is lehet)
  const mergeMulti=(original,selected,touched)=>touched?(selected||[]):(original==null?null:original);
  const resolveCim=({cim_kezi,manual,parts})=>{const man=(manual||"").trim();const kezi=!!cim_kezi&&man!=="";return {cim_kezi:kezi,cim:computeCim({mode:kezi?"kezi":"auto",manual:man,parts})};};
  const addDaysStr=(d,n)=>{const p=d.split("-").map(Number);const dt=new Date(Date.UTC(p[0],p[1]-1,p[2]));dt.setUTCDate(dt.getUTCDate()+n);return dt.toISOString().slice(0,10);};
  const mondayOf=d=>{const p=d.split("-").map(Number);const dt=new Date(Date.UTC(p[0],p[1]-1,p[2]));const wd=(dt.getUTCDay()+6)%7;dt.setUTCDate(dt.getUTCDate()-wd);return dt.toISOString().slice(0,10);};
  const dowMon=d=>{const p=d.split("-").map(Number);return (new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay()+6)%7;};
  const localDateISO=d=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Budapest"}).format(d||new Date());
  const localTimeHM=d=>new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Budapest",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(d||new Date());
  const isDated=t=>!!(t&&t.mikorra);
  const dueTask=(t,todayStr)=>!!(t&&t.mikorra&&t.mikorra<=todayStr);
  const isMeetingUpcoming=(t,todayStr,nowHM)=>{if(!t||t.tipus!=="Találkozó"||!t.mikorra)return false;if(t.mikorra>todayStr)return true;if(t.mikorra<todayStr)return false;const tm=t.idopont?String(t.idopont).slice(0,5):null;return tm==null?true:tm>=nowHM;};
  const safeUrl=u=>{u=(u||"").trim();if(!u||u==="#")return null;if(/^https?:\/\//i.test(u))return u;if(u[0]==="/"&&u[1]!=="/")return u;return null;};
  const noteState=ok=>({disabled:!ok,autosave:!!ok});
  const L={num,parseTriBool,triBoolOptions,areaForBool,roomLogic,computeCim,mergeMulti,resolveCim,addDaysStr,mondayOf,dowMon,localDateISO,localTimeHM,isDated,dueTask,isMeetingUpcoming,safeUrl,noteState};
  if(typeof module!=='undefined'&&module.exports){module.exports=L;}
  root.Logic=L;
})(typeof window!=='undefined'?window:globalThis);
