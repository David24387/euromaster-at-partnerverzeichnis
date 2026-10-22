'use strict';
const D=PartnerDirectory,$=id=>document.getElementById(id);
let map,rows=[],markers=[];
const services=()=>Array.from($('serviceFilter').selectedOptions,o=>o.value);
const networkEnabled=n=>({FRANCHISE:$('franchiseToggle').checked,EFR:$('efrToggle').checked,PLP:$('plpToggle').checked})[n]===true;
function parse(csv,details){
 const byId=new Map(details.partners.map(p=>[String(p.id),p])),h=csv[0]||[];
 return csv.slice(1).filter(a=>a.some(Boolean)).map(a=>{
  const r=Object.fromEntries(h.map((key,i)=>[key,String(a[i]||'').trim()]));
  const lat=Number(r['Lat./Breitengard']),lng=Number(r['Long./Längengrad']);
  return D.merge({kst:r.KST,network:String(r.Netzwerk||'').toUpperCase(),netz:r.Netzkennung,firma:r.Gesellschaft,str:r.Strasse,plz:r.PLZ,ort:r.Ort,lat,lng,mappable:!!r['Lat./Breitengard']&&!!r['Long./Längengrad']&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=46.2&&lat<=49.1&&lng>=9.4&&lng<=17.3},byId.get(r.KST));
 }).filter(c=>byId.has(c.kst)&&['FRANCHISE','EFR','PLP'].includes(c.network));
}
function setMobileFilters(open){$('filterPanel').classList.toggle('is-open',open);$('mobileFilterToggle').setAttribute('aria-expanded',String(open));$('mobileFilterToggle').textContent=open?'Schließen':'Filter öffnen'}
function show(c){
 if(c.mappable){
  setMobileFilters(false);
  const mobile=window.matchMedia('(max-width:600px)').matches;
  const width=Math.min(320,window.innerWidth-64);
  L.popup({className:'location-popup',maxWidth:width,minWidth:Math.min(260,width),
   autoPanPaddingTopLeft:[16,48],autoPanPaddingBottomRight:mobile?[16,88]:[Math.min(430,window.innerWidth*0.35),24],
   keepInView:true})
   .setLatLng([c.lat,c.lng]).setContent('<div class="location-card"><h2>'+D.esc(c.firma||c.ort)+'</h2>'+D.profile(c)+'</div>').openOn(map);
 }else $('directoryDetail').innerHTML='<div class="location-card"><h2>'+D.esc(c.firma||c.ort)+'</h2><p>Keine Kartenposition vorhanden.</p>'+D.profile(c)+'</div>';
}
function filter(){
 const q=$('search').value.trim().toLocaleLowerCase('de-AT');
 const matches=c=>networkEnabled(c.network)&&D.matches(c,services(),$('stateFilter').value)&&(!q||[c.firma,c.ort,c.plz,c.str,c.netz].join(' ').toLocaleLowerCase('de-AT').includes(q));
 const visible=rows.filter(matches);
 markers.forEach(({m,c})=>{if(matches(c)&&$('centersToggle').checked){if(!map.hasLayer(m))m.addTo(map)}else if(map.hasLayer(m))map.removeLayer(m)});
 $('counter').textContent=visible.length+'/'+rows.length;$('listCount').textContent=visible.length+' Standorte';
 $('directoryList').innerHTML=visible.map(D.listItem).join('')||'<p>Keine passenden Standorte.</p>';$('directoryDetail').innerHTML='';
 const n=services().length;$('serviceCount').textContent=n?n+' gewählt':'Alle';
}
function serviceChoices(){$('serviceChoices').innerHTML=Array.from($('serviceFilter').options,o=>'<label class="service-option"><input type="checkbox" data-service="'+D.esc(o.value)+'" '+(o.selected?'checked':'')+'><span>'+D.esc(o.text)+'</span></label>').join('')}
async function loadAustriaBorder(){
 try{
  const response=await fetch('./austria-border.geojson');if(!response.ok)throw Error('Grenze fehlt');
  const geo=await response.json();
  map.createPane('countryBorder');map.getPane('countryBorder').style.zIndex=350;map.getPane('countryBorder').style.pointerEvents='none';
  const border=L.geoJSON(geo,{pane:'countryBorder',interactive:false,style:{color:'#164194',weight:3,opacity:1,fill:false,lineCap:'round',lineJoin:'round'}}).addTo(map);
  const mobile=window.matchMedia('(max-width:600px)').matches;
  map.fitBounds(border.getBounds(),{paddingTopLeft:[24,44],paddingBottomRight:mobile?[24,100]:[420,24],maxZoom:8});
 }catch(e){$('directoryNotice').textContent='Die Landesgrenze konnte nicht geladen werden.'}
}
async function loadStateBorders(){
 try{
  const response=await fetch('./austria-state-borders.geojson',{cache:'no-store'});if(!response.ok)throw Error('Bundeslandgrenzen fehlen');
  const geo=await response.json();
  map.createPane('stateBorders');map.getPane('stateBorders').style.zIndex=340;map.getPane('stateBorders').style.pointerEvents='none';
  L.geoJSON(geo,{pane:'stateBorders',interactive:false,style:{color:'#164194',weight:2,opacity:1,fill:false,lineCap:'round',lineJoin:'round'}}).addTo(map);
 }catch(e){console.warn('Bundeslandgrenzen konnten nicht geladen werden.')}
}
async function init(){
 map=L.map('map').setView([47.6,14.2],7);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map);
 loadAustriaBorder();
 loadStateBorders();
 try{
  // Pin CSV and profiles to the same commit so updates cannot mix snapshots.
  const repo='https://api.github.com/repos/David24387/euromaster-at-partnerverzeichnis';
  const response=await fetch(repo+'/git/ref/heads/main',{cache:'no-store'});if(!response.ok)throw Error('Version fehlt');
  const ref=await response.json(),base='https://raw.githubusercontent.com/David24387/euromaster-at-partnerverzeichnis/'+ref.object.sha+'/';
  const [csv,details]=await Promise.all(['daten.csv','standorte.json'].map(async(name,i)=>{const r=await fetch(base+name);if(!r.ok)throw Error('Standortdaten fehlen');return i?r.json():r.text()}));
  if(details.schemaVersion!==1||details.audience!=='public'||details.selection!=='public-and-active'||!Array.isArray(details.partners))throw Error('Ungültiger Export');
  rows=parse(Papa.parse(csv,{skipEmptyLines:true}).data,details);
  for(const [id,values] of [['stateFilter',rows.map(c=>c.state)],['serviceFilter',rows.flatMap(c=>c.services)]]){[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de')).forEach(v=>$(id).add(new Option(v,v)))}
  serviceChoices();rows.filter(c=>c.mappable).forEach(c=>{const m=L.circleMarker([c.lat,c.lng],{radius:7,fillColor:{FRANCHISE:'#164194',EFR:'#f97316',PLP:'#16a34a'}[c.network],color:'#fff',weight:2,fillOpacity:.95});m.bindTooltip(D.esc(c.firma+' · '+c.ort));m.on('click',()=>show(c));markers.push({m,c})});
  filter();$('status').textContent='Euromaster Partner in Österreich';$('directoryNotice').textContent='Öffentlich freigegebene, aktive Partner. Angaben aus HubSpot.';
 }catch(e){$('status').textContent='Standortdaten konnten nicht geladen werden. Bitte erneut versuchen.';$('counter').textContent='Nicht verfügbar'}
}
$('search').addEventListener('input',filter);
for(const id of ['stateFilter','centersToggle','franchiseToggle','efrToggle','plpToggle'])$(id).addEventListener('change',filter);
$('serviceChoices').addEventListener('change',e=>{if(!e.target.matches('input[data-service]'))return;const o=Array.from($('serviceFilter').options).find(o=>o.value===e.target.dataset.service);if(o){o.selected=e.target.checked;filter()}});
$('clearDirectory').addEventListener('click',()=>{$('search').value='';$('stateFilter').value='';for(const o of $('serviceFilter').options)o.selected=false;for(const id of ['centersToggle','franchiseToggle','efrToggle','plpToggle'])$(id).checked=true;serviceChoices();filter()});
$('directoryList').addEventListener('click',e=>{const b=e.target.closest('[data-location-id]');if(b){const c=rows.find(c=>c.kst===b.dataset.locationId);if(c)show(c)}});
$('mobileFilterToggle').addEventListener('click',()=>setMobileFilters($('mobileFilterToggle').getAttribute('aria-expanded')!=='true'));
$('filterPanel').addEventListener('keydown',e=>{if(e.key==='Escape'){setMobileFilters(false);$('mobileFilterToggle').focus()}});
init();
