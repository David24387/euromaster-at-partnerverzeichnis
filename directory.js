/* Pure directory helpers. No CRM credentials, API access, or embedded real records. */
(function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{try{const u=new URL(String(v));return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}};
const coordKey=(lat,lng,network)=>Number(lat).toFixed(6)+'|'+Number(lng).toFixed(6)+'|'+String(network||'').toUpperCase();
function merge(base,detail){
 const d=detail&&String(detail.id)===String(base.kst)?detail:{};
 return {...base,state:String(d.state||''),services:Array.isArray(d.services)?d.services.filter(x=>typeof x==='string'):[],
 openingHours:String(d.openingHours||''),locationUrl:safeUrl(d.locationUrl),website:safeUrl(d.website),
 partnerType:String(d.partnerType||''),phone:typeof d.phone==='string'?d.phone:null,email:typeof d.email==='string'?d.email:null,
 hasDetails:!!d.id};
}
function matches(c,services=[],state=''){
 return (!state||c.state===state)&&services.every(s=>c.services.includes(s));
}
function profile(c){
 const address=[c.str,[c.plz,c.ort].filter(Boolean).join(' ')].filter(Boolean).join(', ');
 const row=(label,value)=>value?`<div class="directory-field"><span>${esc(label)}</span><div>${value}</div></div>`:'';
 const phone=c.phone&&/^[+\d\s()\-./]+$/.test(c.phone)?`<a href="tel:${esc(c.phone.replace(/[^+\d]/g,''))}">${esc(c.phone)}</a>`:'';
 const email=c.email&&/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(c.email)?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:'';
 const link=(href,label)=>`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
 const route='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(address);
 return `<section class="directory-profile"><div class="location-network">${esc(({FRP:'Franchise',FRPL:'Franchise Light',EFR:'EFR',PLP:'PLP'})[c.partnerType]||c.network)}</div>`+
 row('Adresse',esc(address))+row('Telefon',phone)+row('E-Mail',email)+
 row('Öffnungszeiten',esc(c.openingHours).replace(/\n/g,'<br>'))+
 row('Dienstleistungen',c.services.map(s=>`<span class="directory-chip">${esc(s)}</span>`).join(' '))+
 `<div class="directory-links">${link(route,'Route planen')}${c.locationUrl?link(c.locationUrl,'Standortseite'):''}${c.website?link(c.website,'Website'):''}</div></section>`;
}
function listItem(c){
 return `<button type="button" class="directory-list-item" data-location-id="${esc(c.kst)}"><strong>${esc(c.firma||c.ort)}</strong><span>${esc([c.partnerType||c.network,c.plz,c.ort].filter(Boolean).join(' · '))}</span>${!c.mappable?'<small>Position fehlt oder ist nicht verwendbar</small>':''}</button>`;
}
function attach(centers,features){
 const keys=new Set(centers.map(c=>coordKey(c.lat,c.lng,c.network)));
 return features.filter(f=>{const p=f.properties||{};return keys.has(coordKey(p.lat,p.lng,p.network))});
}
const api={esc,safeUrl,coordKey,merge,matches,profile,listItem,attach};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.PartnerDirectory=api;
})(typeof globalThis!=='undefined'?globalThis:this);
