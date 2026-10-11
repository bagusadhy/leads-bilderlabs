(function(){
'use strict';
/* ---------- basics ---------- */
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DATA={v:1,leads:[],settings:{},meta:{}};
const LEADS=DATA.leads;
const DEF={limit:15,fu:4,ln:10,close:5,replySla:1,mockupDays:3,nudge:3,wakeDays:45,winStart:8,winEnd:11,sender:'Bagus',postal:'',dnc:'',zohoSig:true,tpl:{seq:[],replies:[]}};
const S=DATA.settings;Object.assign(S,DEF);
const POSTAL_PH='[Your business postal address]';
/* Icons: paths based on Lucide (ISC License, lucide.dev) */
const IC={
 home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 calendar:'<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
 columns:'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M15 3v18"/>',
 chart:'<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
 file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
 upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
 download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
 search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
 moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
 send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
 mail:'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 alert:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
 inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 grid:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
 chev:'<path d="m9 18 6-6-6-6"/>',
 arrow:'<path d="M5 12h14M12 5l7 7-7 7"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 x:'<path d="M18 6 6 18M6 6l12 12"/>',
 db:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
 loader:'<path d="M21 12a9 9 0 1 1-6.22-8.56"/>'
};
const ic=n=>'<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[n]||'')+'</svg>';
const initials=s=>String(s||'?').replace(/[^\p{L}\p{N} ]/gu,'').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';

/* ---------- dates ---------- */
const pad=n=>String(n).padStart(2,'0');
const ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const p=String(s).slice(0,10).split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
const today=()=>ds(new Date());
const stamp=()=>{const d=new Date();return ds(d)+' '+pad(d.getHours())+':'+pad(d.getMinutes())};
const addD=(s,n)=>{const d=pd(s||today());d.setDate(d.getDate()+n);return ds(d)};
const addBiz=(s,n)=>{const d=pd(s||today());while(n>0){d.setDate(d.getDate()+1);const w=d.getDay();if(w>0&&w<6)n--}return ds(d)};
const diff=(a,b)=>Math.round((pd(a)-pd(b))/864e5);
const fmtD=s=>pd(s).toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});
const fmtDs=s=>pd(s).toLocaleDateString('id-ID',{day:'numeric',month:'short'});
const rel=s=>{if(!s)return '';const n=diff(s,today());if(n<0)return 'Terlambat '+(-n)+' hari';if(n===0)return 'Hari ini';if(n===1)return 'Besok';return fmtD(s)+' · '+n+' hari lagi'};
const dueCls=s=>{if(!s)return '';const n=diff(s,today());return n<0?'over':n===0?'today':n<=2?'soon':'later'};
const weekStart=()=>{const d=pd(today());const w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return ds(d)};

/* ---------- time zones ---------- */
const AU_TZ={VIC:'Australia/Melbourne',NSW:'Australia/Sydney',ACT:'Australia/Sydney',TAS:'Australia/Hobart',QLD:'Australia/Brisbane',SA:'Australia/Adelaide',WA:'Australia/Perth',NT:'Australia/Darwin'};
const US_TZ={};
'CT DE DC FL GA ME MD MA MI NH NJ NY NC OH PA RI SC VT VA WV IN KY'.split(' ').forEach(s=>US_TZ[s]='America/New_York');
'AL AR IL IA LA MN MS MO OK WI TX KS NE ND SD TN'.split(' ').forEach(s=>US_TZ[s]='America/Chicago');
'CO MT NM UT WY ID'.split(' ').forEach(s=>US_TZ[s]='America/Denver');
US_TZ.AZ='America/Phoenix';'CA NV OR WA'.split(' ').forEach(s=>US_TZ[s]='America/Los_Angeles');US_TZ.AK='America/Anchorage';US_TZ.HI='Pacific/Honolulu';
const CITY_TZ={'pensacola':'America/Chicago','panama city':'America/Chicago','destin':'America/Chicago','fort walton beach':'America/Chicago','el paso':'America/Denver','knoxville':'America/New_York','chattanooga':'America/New_York','broken hill':'Australia/Broken_Hill'};
const TZ_NAME={'Australia/Melbourne':'Victoria','Australia/Sydney':'New South Wales','Australia/Brisbane':'Queensland','Australia/Adelaide':'South Australia','Australia/Perth':'Western Australia','Australia/Hobart':'Tasmania','Australia/Darwin':'Northern Territory','Australia/Broken_Hill':'Broken Hill','America/New_York':'US Eastern','America/Chicago':'US Central','America/Denver':'US Mountain','America/Phoenix':'Arizona','America/Los_Angeles':'US Pacific','America/Anchorage':'Alaska','Pacific/Honolulu':'Hawaii'};
const tzCache=new Map();
function tzOf(l){const key=l.country+'|'+(l.city||'');if(tzCache.has(key))return tzCache.get(key);
  const m=String(l.city||'').match(/^(.*?)\s+([A-Z]{2,3})$/);const city=(m?m[1]:l.city||'').toLowerCase().trim(),st=m?m[2]:'';
  const tz=CITY_TZ[city]||(l.country==='AU'?AU_TZ[st]:US_TZ[st])||(l.country==='AU'?'Australia/Sydney':'America/Chicago');tzCache.set(key,tz);return tz}
const fmtCache={};
function parts(tz,date){const f=fmtCache[tz]||(fmtCache[tz]=new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',minute:'2-digit',weekday:'short',hourCycle:'h23'}));const p={};for(const x of f.formatToParts(date||new Date()))p[x.type]=x.value;return{h:+p.hour%24,m:+p.minute,wd:p.weekday}}
function winState(tz,date){const p=parts(tz,date);const t=p.h+p.m/60;if(p.wd==='Sat'||p.wd==='Sun')return 'off';if(t>=S.winStart&&t<S.winEnd)return 'best';if(t>=S.winEnd&&t<16)return 'ok';if((t>=7&&t<S.winStart)||(t>=16&&t<18))return 'edge';return 'off'}
const WIN_LABEL={best:'waktu terbaik',ok:'jam kerja',edge:'di luar jam inti',off:'di luar jam kerja'};
const localTime=(tz,date)=>{const p=parts(tz,date);return pad(p.h)+'.'+pad(p.m)};
const myTime=d=>pad(d.getHours())+'.'+pad(d.getMinutes());
let MYTZ='';try{MYTZ=(new Intl.DateTimeFormat('id-ID',{timeZoneName:'short'}).formatToParts(new Date()).find(p=>p.type==='timeZoneName')||{}).value||''}catch(e){}
const nbCache={};
function nextBest(tz){const now=Date.now(),k=tz+'|'+Math.floor(now/6e4);if(nbCache[k])return nbCache[k];const step=15*6e4;let r=null;
  if(winState(tz)==='best'){let t=now;while(winState(tz,new Date(t))==='best'&&t-now<8*36e5)t+=step;r={now:true,end:new Date(t)}}
  else{let t=Math.ceil(now/step)*step;for(let i=0;i<4*24*8;i++,t+=step){if(winState(tz,new Date(t))==='best'){r={now:false,start:new Date(t),end:new Date(t+(S.winEnd-S.winStart)*36e5)};break}}}
  nbCache[k]=r;return r}
function winText(tz){const r=nextBest(tz);if(!r)return '';if(r.now)return 'Pas sekarang, sampai '+myTime(r.end)+' '+MYTZ;
  const sameDay=ds(r.start)===today();const day=sameDay?'hari ini':(ds(r.start)===addD(today(),1)?'besok':r.start.toLocaleDateString('id-ID',{weekday:'long'}));
  return 'Jendela berikutnya '+day+' '+myTime(r.start)+'–'+myTime(r.end)+' '+MYTZ}
const tzPill=l=>{const tz=tzOf(l),w=winState(tz);return '<span class="tz '+w+'" title="'+esc(TZ_NAME[tz]||tz)+': '+WIN_LABEL[w]+'"><i></i>'+localTime(tz)+' di sana</span>'};

/* ---------- stages & next action ---------- */
const ST={need:['Cari email','s-mute'],check:['Cek website','s-warn'],ready:['Belum dihubungi','s-blue'],e1:['Email 1 terkirim','s-teal'],e2:['Follow-up terkirim','s-teal'],e3:['Last note terkirim','s-teal'],replied:['Membalas','s-orange'],brief:['Brief masuk','s-lime'],mockup:['Mock-up terkirim','s-lime'],paused:['Ditunda','s-violet'],won:['Won','s-won'],lost:['Lost','s-red'],bounced:['Bounce','s-red']};
const STAGES=Object.keys(ST);
const pill=st=>'<span class="pill '+(ST[st]||ST.need)[1]+'">'+esc((ST[st]||[st])[0])+'</span>';
const STEP=['Email 1','Follow-up','Last note'];
const KIND={send:'k-send',reply:'k-reply',nudge:'k-reply',decide:'k-reply',mockup:'k-mockup',close:'k-close',wake:'k-wake'};
const KIND_NAME={send:'Kirim email',reply:'Balas',nudge:'Tanya mock-up',decide:'Putuskan',mockup:'Deadline mock-up',close:'Tutup sequence',wake:'Hubungi lagi'};
function na(l){const s=l.sent||{},a=l.at||{};
  switch(l.stage){
    case 'need':return{k:'research',t:'Cari email bisnis'};
    case 'check':return{k:'research',t:'Pastikan belum punya website'};
    case 'ready':return l.email?{k:'send',step:0,t:'Kirim Email 1',queue:true}:{k:'research',t:'Cari email bisnis'};
    case 'e1':return{k:'send',step:1,t:'Kirim follow-up',due:addD(s.e1,S.fu)};
    case 'e2':{const d1=addD(s.e1||s.e2,S.ln),d2=addD(s.e2,Math.max(2,S.ln-S.fu));return{k:'send',step:2,t:'Kirim last note',due:d1>d2?d1:d2}}
    case 'e3':return{k:'close',t:'Tutup: tidak membalas',due:addD(s.e3,S.close)};
    case 'replied':return{k:'reply',t:'Balas & minta brief',due:addD(a.replied,S.replySla)};
    case 'brief':return{k:'mockup',t:'Buat & kirim mock-up',due:addBiz(a.brief,S.mockupDays)};
    case 'mockup':return a.nudged?{k:'decide',t:'Putuskan: won atau lost',due:addD(a.nudged,7)}:{k:'nudge',t:'Tanya pendapat soal mock-up',due:addD(a.mockup,S.nudge)};
    case 'paused':return{k:'wake',t:'Kirim check-in',due:a.wake||today()};
  }return null}
const isDue=a=>a&&a.due&&a.due<=today();
const byDue=(x,y)=>(x.a.due||'9')<(y.a.due||'9')?-1:(x.a.due||'9')>(y.a.due||'9')?1:(y.l.score||0)-(x.l.score||0);
const byScore=(a,b)=>(b.score||0)-(a.score||0)||(b.reviews||0)-(a.reviews||0);
function dots(l){const s=l.sent||{},a=na(l);const late=['replied','brief','mockup','won','lost','bounced','paused'].includes(l.stage);
  return '<span class="dots" title="Email 1 · Follow-up · Last note">'+[0,1,2].map(i=>{const k='e'+(i+1);let c='';
    if(s[k])c='done';else if(a&&a.k==='send'&&a.step===i)c=a.due?(dueCls(a.due)==='over'?'over':dueCls(a.due)==='today'?'due':'next'):'next';else if(late)c='skip';
    return '<i class="'+c+'"></i>'}).join('')+'</span>'}
const sentCount=d=>{let n=0;for(const l of LEADS){const s=l.sent||{};for(const k in s)if(s[k]===d)n++;if(l.at&&l.at.nudged===d)n++}return n};

/* ---------- email content ---------- */
const SPAM=['free','offer','guarantee','risk-free','no obligation','limited time','act now','click here','urgent','winner','cash','cheap','discount','deal','100%','% off','earn','income','special promotion','buy now','order now','congratulations','credit','investment','lowest price','bonus','increase sales','marketing','seo','dear friend','opportunity','$','!'];
function spamHits(t){t=String(t||'').toLowerCase();return SPAM.filter(w=>/^[a-z -]+$/.test(w)?new RegExp('\\b'+w.replace(/ /g,'\\s+')+'\\b').test(t):t.includes(w))}
const first=l=>(l.contact||'').trim().split(/\s+/)[0]||'there';
function fill(t,l){const seq0=(l.seq&&l.seq[0])||{};return String(t||'').replace(/\{\{(\w+)\}\}/g,(m,k)=>{const v={first_name:first(l),business:l.business,city:String(l.city||'').replace(/\s+[A-Z]{2,3}$/,''),niche:String(l.niche||'').toLowerCase(),reviews:l.reviews||'',rating:l.rating||'',hook:l.hook||'',sender:(ME&&ME.name)||S.sender||'Bagus',subject1:seq0.subject||fill((S.tpl.seq[0]||{}).subject||'',Object.assign({},l,{seq:[{subject:'A homepage idea'}]})),mockup_date:pd(addBiz(today(),S.mockupDays)).toLocaleDateString(l.country==='AU'?'en-AU':'en-US',{weekday:'long',month:'long',day:'numeric'})}[k];return v==null?m:String(v)})}
const postal=t=>S.postal?String(t).split(POSTAL_PH).join(S.postal):String(t);
/* When Zoho adds the HTML signature (logo, name, address, opt-out line), drop the typed sign-off so it is not shown twice. */
const senderNames=()=>[S.sender,ME&&ME.name,'Bagus','{{sender}}'].filter(Boolean).map(x=>String(x).trim().toLowerCase());
function stripSig(t){const lines=String(t).split('\n'),names=senderNames();let i=-1;
  for(let k=lines.length-1;k>=0;k--){if(names.includes(lines[k].trim().toLowerCase())){i=k;break}}
  if(i<0)return String(t);
  const sigLine=x=>{const v=x.trim();return !v||names.includes(v.toLowerCase())||/^bilder labs\s*\|\s*bilderlabs\.com$/i.test(v)||v===POSTAL_PH||(S.postal&&v===S.postal)||/reply\s+["\u201c]?no["\u201d]?\s+and\s+i\s+won/i.test(v)};
  const keep=lines.slice(i).filter(x=>!sigLine(x));
  return (lines.slice(0,i).join('\n').replace(/\s+$/,'')+(keep.length?'\n\n'+keep.join('\n'):''))}
/* Templates hold the message only. The sign-off is added here: by Zoho's HTML signature, or as text by the dashboard. */
const OPT_OUT='Not useful right now? Just reply "no" and I won\'t follow up.';
function finish(t,kind){const body=stripSig(t);if(S.zohoSig)return body;
  const name=(ME&&ME.name)||S.sender||'Bagus';
  return body+'\n\n'+name+'\nBilder Labs | bilderlabs.com\n'+(S.postal||POSTAL_PH)+(kind==='reply'?'':'\n\n'+OPT_OUT)}
function cleanTemplates(){let changed=false;['seq','replies'].forEach(g=>(S.tpl[g]||[]).forEach(t=>{const b=stripSig(t.body);if(b!==t.body){t.body=b;changed=true}}));return changed}
function seqFor(l){if(l.seq&&l.seq.length)return l.seq.map(s=>({subject:s.subject,body:finish(s.body,'seq')}));return (S.tpl.seq||[]).map(s=>({subject:fill(s.subject,l),body:finish(fill(s.body,l),'seq'),generated:true}))}

/* ---------- server sync ---------- */
const UI={view:'today',country:'ALL',q:'',ltab:'todo',niche:'',sort:'next',open:null,dtab:'sum',out:null,queue:null,inboxQ:'',lview:'list',navOpen:false};
let ME=null,CURSOR='',SAVE='ok',lastSaved='',errMsg='',online=true,needRender=false;
const PEND=new Map();let leadTimer=null,setTimer=null,metaTimer=null,retryTimer=null,flushing=false,setPending=false,metaPending=false;
function rememberUI(){try{localStorage.setItem('bl-ui',JSON.stringify({view:UI.view,country:UI.country,ltab:UI.ltab,lview:UI.lview,sort:UI.sort}))}catch(e){}}
function restoreUI(){try{const s=JSON.parse(localStorage.getItem('bl-ui')||'{}');['view','country','ltab','lview','sort'].forEach(k=>{if(typeof s[k]==='string')UI[k]=s[k]})}catch(e){}}
async function api(method,url,body){let r;
  try{r=await fetch(url,{method,credentials:'same-origin',headers:{'Content-Type':'application/json','X-Requested-With':'bilder'},body:body===undefined?undefined:JSON.stringify(body)})}
  catch(e){const err=new Error('Tidak bisa terhubung ke server');err.offline=true;throw err}
  if(r.status===401){location.href='/login.html';throw new Error('Sesi berakhir')}
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok){const err=new Error((j&&j.error)||('Server error '+r.status));err.status=r.status;err.body=j;throw err}
  return j}
const normLead=l=>{l.sent=l.sent||{};l.at=l.at||{};l.seq=l.seq||[];l.log=l.log||[];return l};
function setSettings(s){Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,DEF,s||{});S.tpl=S.tpl||{};S.tpl.seq=S.tpl.seq||[];S.tpl.replies=S.tpl.replies||[]}
function setData(d){LEADS.length=0;(d.leads||[]).forEach(l=>LEADS.push(normLead(l)));setSettings(d.settings);DATA.meta=d.meta||{};tzCache.clear()}
function replaceLead(nl){const old=byId(nl.id);if(!old){LEADS.push(nl);return}Object.keys(old).forEach(k=>delete old[k]);Object.assign(old,nl)}
const leadBody=l=>{const o={};for(const k in l){if(k==='log'||k==='version'||k==='updatedAt')continue;o[k]=l[k]}return o};
const hasPending=()=>PEND.size>0||setPending||metaPending;
function queueLead(l,ev){const p=PEND.get(l.id)||{events:[]};if(ev)p.events.push(ev);PEND.set(l.id,p);SAVE='busy';renderSave();clearTimeout(leadTimer);leadTimer=setTimeout(flushAll,350)}
function saveSettings(){setPending=true;SAVE='busy';renderSave();clearTimeout(setTimer);setTimer=setTimeout(flushAll,800)}
function saveMeta(){metaPending=true;SAVE='busy';renderSave();clearTimeout(metaTimer);metaTimer=setTimeout(flushAll,200)}
async function flushAll(){if(flushing)return;flushing=true;clearTimeout(retryTimer);
  try{
    while(PEND.size){const [id,p]=PEND.entries().next().value;PEND.delete(id);const l=byId(id);if(!l)continue;
      try{const r=await api('PUT','/api/leads/'+id,{lead:leadBody(l),events:p.events,version:l.version});l.version=r.lead.version;l.updatedAt=r.lead.updatedAt}
      catch(e){
        if(e.status===409&&e.body&&e.body.lead){replaceLead(normLead(e.body.lead));render();toast((l.business||'Lead')+' baru saja diubah di perangkat lain. Data terbaru sudah dimuat, silakan ulangi.')}
        else if(e.status===400||e.status===404||e.status===413){toast('Perubahan '+(l.business||'lead')+' ditolak: '+e.message)}
        else{const cur=PEND.get(id);PEND.set(id,{events:p.events.concat(cur?cur.events:[])});throw e}}}
    if(setPending){setPending=false;try{await api('PUT','/api/settings',{settings:S})}catch(e){setPending=true;throw e}}
    if(metaPending){metaPending=false;try{await api('PUT','/api/meta',{meta:DATA.meta})}catch(e){metaPending=true;throw e}}
    SAVE='ok';online=true;errMsg='';lastSaved=myTime(new Date())}
  catch(e){SAVE='err';online=!e.offline;errMsg=e.message;retryTimer=setTimeout(flushAll,8000)}
  finally{flushing=false;renderSave();if(SAVE!=='err'&&hasPending())flushAll()}}
const isTyping=()=>{const a=document.activeElement;return !!(a&&/input|textarea|select/i.test(a.tagName)&&a.id!=='q')};
async function poll(){if(document.hidden||flushing||hasPending()||!ME)return;
  try{const r=await api('GET','/api/changes?since='+encodeURIComponent(CURSOR));CURSOR=r.cursor||CURSOR;let n=0;
    (r.leads||[]).forEach(nl=>{const old=byId(nl.id);if(old&&old.version>=nl.version)return;replaceLead(normLead(nl));n++});
    if(r.settings&&!setPending){setSettings(r.settings);cleanTemplates();n++}
    if(r.meta&&!metaPending&&JSON.stringify(r.meta)!==JSON.stringify(DATA.meta)){DATA.meta=r.meta;n++}
    if(!online){online=true;if(SAVE==='err'&&!hasPending())SAVE='ok'}
    if(n){if(isTyping()||UI.queue)needRender=true;else render()}else renderSave()}
  catch(e){if(e.offline){online=false;renderSave()}}}
document.addEventListener('focusout',()=>{if(needRender){setTimeout(()=>{if(needRender&&!isTyping()&&!UI.queue){needRender=false;render()}},60)}});
window.addEventListener('focus',poll);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll()});
window.addEventListener('beforeunload',e=>{if(hasPending()||flushing){flushAll();e.preventDefault();e.returnValue=''}});
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/plain'}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
async function logout(){try{if(hasPending())await flushAll();await api('POST','/api/logout',{})}catch(e){}location.href='/login.html'}
function renderSave(){const el=$('#save');if(!el)return;let cls,h,p,btn='';
  if(!online){cls='err';h='Offline';p='Perubahan dikirim lagi otomatis saat koneksi kembali.';btn='<button data-act="retry">Coba sekarang</button>'}
  else if(SAVE==='busy'){cls='busy';h='Menyimpan…';p='Mengirim perubahan ke database.'}
  else if(SAVE==='err'){cls='err';h='Gagal menyimpan';p=errMsg||'Coba lagi.';btn='<button data-act="retry">Simpan lagi</button>'}
  else{cls='ok';h='Tersinkron';p='Tersimpan di Cloudflare'+(lastSaved?' · '+lastSaved+' '+MYTZ:'')+'. Perubahan tim muncul otomatis.'}
  el.className='sync '+cls;el.innerHTML='<div class="sync-h">'+ic('db')+'<b>'+esc(h)+'</b><i></i></div><p>'+esc(p)+'</p>'+btn}

/* ---------- mutations ---------- */
let undoFn=null;
function change(l,fn,logText,kind){const before=JSON.stringify(l);fn(l);l.log=l.log||[];let ev=null;
  if(logText){ev={d:stamp(),t:logText,k:kind||'stage'};l.log.push(Object.assign({by:ME?ME.name:''},ev))}
  l.upd=stamp();queueLead(l,ev);
  return function(){const b=JSON.parse(before),log=l.log,v=l.version,u=l.updatedAt;Object.keys(l).forEach(k=>delete l[k]);Object.assign(l,b);l.log=log;l.version=v;l.updatedAt=u;l.upd=stamp();
    const ue={d:stamp(),t:'Dibatalkan: '+(logText||'perubahan terakhir'),k:'note'};l.log.push(Object.assign({by:ME?ME.name:''},ue));queueLead(l,ue);render();toast('Dibatalkan')}}
function at(l){return l.at||(l.at={})}
function markSent(l,step,date){const key='e'+(step+1);date=date||today();
  return change(l,x=>{x.sent=x.sent||{};x.sent[key]=date;if(['need','check','ready','e1','e2','e3','bounced'].includes(x.stage)&&STAGES.indexOf(x.stage)<STAGES.indexOf(key)||x.stage==='ready')x.stage=key},STEP[step]+' terkirim'+(date!==today()?' (tanggal '+fmtDs(date)+')':''),'send')}
const LOST_REASONS=['Tidak membalas','Tidak tertarik','Sudah punya website','Harga tidak cocok','Bisnis tutup / pindah','Lainnya'];
const OUT={
  replied:{l:'Membalas',f:l=>{at(l).replied=today();l.stage='replied'},log:'Lead membalas email'},
  brief:{l:'Brief masuk',f:l=>{const a=at(l);a.replied=a.replied||today();a.brief=today();l.stage='brief'},log:'Brief masuk'},
  mock:{l:'Mock-up terkirim',f:l=>{at(l).mockup=today();l.stage='mockup'},log:'Mock-up dikirim'},
  nudged:{l:'Sudah ditanya',f:l=>{at(l).nudged=today()},log:'Menanyakan pendapat soal mock-up',kind:'send'},
  won:{l:'Won',input:'value'},
  later:{l:'Nanti saja',input:'date'},
  noint:{l:'Tidak tertarik',f:l=>{l.prev=l.stage;l.stage='lost';l.lostReason='Tidak tertarik';l.dnc=true;at(l).lost=today()},log:'Tidak tertarik — masuk daftar jangan dihubungi'},
  lost:{l:'Lost',input:'reason'},
  bounce:{l:'Bounce',input:'email'},
  auto:{l:'Auto-reply',f:l=>{},log:'Auto-reply / sedang cuti — sequence tetap jalan',kind:'note'},
  hassite:{l:'Ternyata punya website',f:l=>{l.prev=l.stage;l.stage='lost';l.lostReason='Sudah punya website';at(l).lost=today()},log:'Ternyata sudah punya website'},
  dnc:{l:'Jangan hubungi',f:l=>{l.prev=l.stage;l.stage='lost';l.lostReason='Minta tidak dihubungi';l.dnc=true;at(l).lost=today()},log:'Masuk daftar jangan dihubungi'},
  checkin:{l:'Check-in terkirim',f:l=>{l.sent=l.sent||{};l.sent.e3=today();l.stage='e3'},log:'Check-in terkirim setelah ditunda',kind:'send'},
  close:{l:'Lost: tidak membalas',f:l=>{l.prev=l.stage;l.stage='lost';l.lostReason='Tidak membalas';at(l).lost=today()},log:'Sequence selesai tanpa balasan'},
  reopen:{l:'Buka lagi',f:l=>{l.stage=l.prev&&!['won','lost','bounced'].includes(l.prev)?l.prev:(l.email?'ready':'need');l.dnc=false;delete l.lostReason},log:'Lead dibuka lagi'},
  hasmail:{l:'Email ditemukan',input:'email'}
};
const OUT_BY={need:['hasmail','hassite','dnc'],check:['hasmail','hassite','dnc'],ready:['replied','hassite','dnc'],e1:['replied','brief','later','noint','bounce','auto'],e2:['replied','brief','later','noint','bounce','auto'],e3:['replied','brief','later','noint','bounce','close'],replied:['brief','later','noint'],brief:['mock','later','lost'],mockup:['won','nudged','later','lost'],paused:['checkin','replied','lost'],won:['reopen'],lost:['reopen'],bounced:['hasmail','reopen']};
function applyOut(l,key,val){const o=OUT[key];let undo;
  if(key==='won')undo=change(l,x=>{x.stage='won';at(x).won=today();x.wonValue=+val||750},'Won — '+(+val||750)+' USD');
  else if(key==='later')undo=change(l,x=>{x.prev=x.stage;x.stage='paused';at(x).wake=val||addD(today(),S.wakeDays)},'Ditunda sampai '+fmtD(val||addD(today(),S.wakeDays)));
  else if(key==='lost')undo=change(l,x=>{x.prev=x.stage;x.stage='lost';x.lostReason=val||'Lainnya';at(x).lost=today()},'Lost — '+(val||'Lainnya'));
  else if(key==='bounce'||key==='hasmail'){const em=String(val||'').trim();
    if(em)undo=change(l,x=>{x.email=em;x.emailConf=x.emailConf||'Medium';x.emailSource=x.emailSource||'Ditambahkan manual';if(key==='bounce'){x.sent={};x.at=Object.assign({},x.at,{bounced:today()})}x.stage='ready'},(key==='bounce'?'Bounce — email baru: ':'Email ditemukan: ')+em);
    else if(key==='bounce')undo=change(l,x=>{x.prev=x.stage;x.stage='bounced';at(x).bounced=today()},'Email bounce');
    else return toast('Isi alamat emailnya dulu')}
  else undo=change(l,o.f,o.log,o.kind);
  UI.out=null;render();toast((l.business||'Lead')+': '+(o?o.l:key),undo)}

/* ---------- copy & toast ---------- */
const CP=new Map();let cpN=0;
const cp=t=>{const k=++cpN;CP.set(k,t);if(CP.size>4000)CP.delete(CP.keys().next().value);return k};
function copyText(text,btn){const ok=()=>{toast('Disalin');if(btn){const o=btn.dataset.label||btn.textContent;btn.dataset.label=o;btn.classList.add('ok');btn.textContent='Disalin ✓';setTimeout(()=>{btn.classList.remove('ok');btn.textContent=o},1300)}};
  const fb=()=>{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(ta);ta.select();let s=false;try{s=document.execCommand('copy')}catch(e){}ta.remove();s?ok():toast('Tidak bisa menyalin otomatis. Blok teksnya lalu salin manual.')};
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(ok,fb);return}}catch(e){}fb()}
function toast(msg,undo){const t=$('#toast');if(!t)return;t.innerHTML='<span>'+esc(msg)+'</span>'+(undo?'<button data-act="undo">Urungkan</button>':'');undoFn=undo||null;t.hidden=false;requestAnimationFrame(()=>t.classList.add('on'));clearTimeout(t._t);t._t=setTimeout(()=>{t.classList.remove('on');setTimeout(()=>{t.hidden=true},220);undoFn=null},undo?7000:2200)}

/* ---------- shell ---------- */
function navBtn(v,icon,label,badge){return '<button data-view="'+v+'">'+ic(icon)+'<span>'+label+'</span>'+(badge?'<em class="bd" id="'+badge+'"></em>':'')+'</button>'}
const SHELL='<aside class="side" id="side">'
 +'<div class="ws"><span class="mk">b</span><div><b>Bilder Labs</b><small>Outreach CRM</small></div></div>'
 +'<label class="side-search">'+ic('search')+'<input id="q" type="search" placeholder="Cari lead, kota, email…" autocomplete="off" aria-label="Cari lead"><kbd>/</kbd></label>'
 +'<div class="nav-l">Menu utama</div><nav class="nav">'+navBtn('today','home','Hari ini','nb-today')+navBtn('leads','users','Leads','nb-leads')+navBtn('schedule','calendar','Jadwal')+navBtn('pipeline','columns','Pipeline')+navBtn('report','chart','Laporan')+'</nav>'
 +'<div class="nav-l">Pengaturan</div><nav class="nav">'+navBtn('settings','file','Template & aturan')+navBtn('io','upload','Import / export')+'</nav>'
 +'<div class="side-foot"><div class="sync" id="save"></div><div class="me" id="me"></div></div></aside>'
 +'<button class="side-scrim" data-act="menu" aria-label="Tutup menu"></button>'
 +'<main class="main"><header class="topbar"><button class="icon-btn only-m" data-act="menu" aria-label="Buka menu">'+ic('menu')+'</button>'
 +'<div class="crumb"><span>Bilder Labs</span>'+ic('chev')+'<b id="crumb"></b></div>'
 +'<div class="top-r"><div class="seg" id="country"><button data-country="ALL">Semua</button><button data-country="AU">Australia</button><button data-country="US">US</button></div>'
 +'<button class="icon-btn" data-act="theme" id="theme-btn" aria-label="Ganti tema terang atau gelap"></button>'
 +'<a class="btn s hide-m" href="https://mail.zoho.com/zm/" target="_blank" rel="noopener">'+ic('mail')+'Zoho Mail</a></div></header>'
 +'<div class="page"><div class="page-h"><div><h1 id="title"></h1><p id="subtitle"></p></div><div class="page-a" id="page-actions"></div></div><section id="view"></section></div></main>'
 +'<div class="scrim" id="scrim" hidden></div><aside class="drawer" id="drawer" role="dialog" aria-label="Detail lead" hidden></aside><div class="sendmode" id="sendmode" role="dialog" aria-label="Mode kirim" hidden></div><div class="toast" id="toast" role="status" hidden></div>';
const TITLES={today:['Hari ini',''],leads:['Leads','Semua lead dikelompokkan per status. Klik untuk detail.'],schedule:['Jadwal','Apa yang jatuh tempo 14 hari ke depan, supaya tidak ada yang terlewat.'],pipeline:['Pipeline','Seret kartu ke kolom lain untuk mengubah status. Klik kartu untuk detail.'],report:['Laporan','Hasil outreach per negara dan per niche.'],settings:['Template & aturan','Jeda follow-up, batas kirim, template email, dan daftar jangan dihubungi.'],io:['Import / export','Masukkan hasil scraping dan simpan cadangan.']};
const scope=()=>LEADS.filter(l=>UI.country==='ALL'||l.country===UI.country);
const byId=id=>LEADS.find(l=>String(l.id)===String(id));
function curTheme(){const t=document.documentElement.getAttribute('data-theme');if(t)return t;return window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
function toggleTheme(){const n=curTheme()==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);try{localStorage.setItem('bl-theme',n)}catch(e){}$('#theme-btn').innerHTML=ic(n==='dark'?'sun':'moon')}
function renderMe(){const el=$('#me');if(!el||!ME)return;el.innerHTML='<span class="av">'+esc(initials(ME.name))+'</span><div><b>'+esc(ME.name)+'</b><small>@'+esc(ME.username)+'</small></div><button class="icon-btn" data-act="logout" aria-label="Keluar" title="Keluar">'+ic('logout')+'</button>'}
function pageActions(){
  if(UI.view==='today'){const D=todayData(),n=D.fus.length+D.fresh.length;return n?'<button class="btn l" data-act="queue" data-q="all">'+ic('send')+'Mulai kirim '+n+' email</button>':''}
  if(UI.view==='leads')return '<div class="seg"><button data-act="lview" data-v="list" class="'+(UI.lview!=='card'?'on':'')+'">'+ic('list')+'List</button><button data-act="lview" data-v="card" class="'+(UI.lview==='card'?'on':'')+'">'+ic('grid')+'Kartu</button></div><button class="btn" data-view="io">'+ic('upload')+'Import CSV</button>';
  if(UI.view==='io')return '<button class="btn" data-act="export">'+ic('download')+'Export CSV</button>';
  return ''}

/* ---------- views ---------- */
function render(){
  $$('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.view===UI.view));
  $$('#country button').forEach(b=>b.classList.toggle('on',b.dataset.country===UI.country));
  const t=TITLES[UI.view]||TITLES.today;$('#title').textContent=t[0];$('#crumb').textContent=t[0];
  $('#subtitle').textContent=UI.view==='today'?new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+' · '+myTime(new Date())+' '+MYTZ:t[1];
  if($('#q').value!==UI.q)$('#q').value=UI.q;
  $('#page-actions').innerHTML=pageActions();
  $('#theme-btn').innerHTML=ic(curTheme()==='dark'?'sun':'moon');
  $('#side').classList.toggle('open',!!UI.navOpen);
  const v=$('#view');
  v.innerHTML=({today:vToday,leads:vLeads,schedule:vSchedule,pipeline:vPipeline,report:vReport,settings:vSettings,io:vIO}[UI.view]||vToday)();
  if(UI.view==='today')renderInbox();
  if(UI.view==='settings')checkTpl();
  badges();renderDrawer();renderSend();renderSave();renderMe();rememberUI()}
function badges(){const L=scope();let due=0,todo=0;for(const l of L){const a=na(l);if(isDue(a)){due++;todo++}else if(a&&a.k==='reply')todo++}
  const b=$('#nb-today');b.textContent=due||'';b.hidden=!due;b.classList.toggle('hot',due>0);
  const c=$('#nb-leads');c.textContent=L.length;}
function rowLead(l,a,acts,extra){return '<div class="row"><div class="who" data-open="'+l.id+'"><b>'+esc(l.business)+'</b><small><span class="cc '+l.country+'">'+l.country+'</span>'+esc(l.city)+(a&&a.due?' · <span class="due '+dueCls(a.due)+'">'+esc(rel(a.due))+'</span>':'')+(extra||'')+'</small></div><div class="acts">'+(acts||'')+'</div></div>'}
function list(items,fn,max){max=max||8;return '<div class="rows">'+items.slice(0,max).map(fn).join('')+(items.length>max?'<div class="more">+ '+(items.length-max)+' lagi · <button class="link" data-view="leads" data-ltab="todo">lihat semua</button></div>':'')+'</div>'}
function step(n,cls,title,cnt,hint,body){return '<li class="step '+cls+'"><div class="step-n">'+(cls==='done'?'✓':n)+'</div><div><div class="step-h"><h3>'+title+'</h3>'+(cnt!=null?'<span class="cnt">'+cnt+'</span>':'')+'</div>'+(hint?'<p class="hint">'+hint+'</p>':'')+(body?'<div class="body">'+body+'</div>':'')+'</div></li>'}

function todayData(){const t=today(),L=scope();const act=L.map(l=>({l,a:na(l)})).filter(x=>x.a);
  const inSeq=L.filter(l=>['e1','e2','e3','mockup','paused'].includes(l.stage));
  const replies=act.filter(x=>x.a.k==='reply'||(['nudge','decide'].includes(x.a.k)&&isDue(x.a))).sort(byDue);
  const fus=act.filter(x=>x.a.k==='send'&&x.a.step>0&&isDue(x.a)).sort(byDue);
  const sentToday=sentCount(t),remaining=Math.max(0,S.limit-sentToday),slots=Math.max(0,remaining-fus.length);
  const rank={best:0,ok:1,edge:2,off:3};
  const readyAll=L.filter(l=>l.stage==='ready'&&l.email&&!l.dnc);
  const fresh=readyAll.slice().sort((a,b)=>rank[winState(tzOf(a))]-rank[winState(tzOf(b))]||byScore(a,b)).slice(0,slots);
  const mock=act.filter(x=>x.a.k==='mockup').sort(byDue);
  const closes=act.filter(x=>x.a.k==='close'&&isDue(x.a)).sort(byDue);
  const wakes=act.filter(x=>x.a.k==='wake'&&isDue(x.a)).sort(byDue);
  const over=act.filter(x=>x.a.due&&x.a.due<t).length,dueToday=act.filter(x=>x.a.due===t).length;
  return{t,L,act,inSeq,replies,fus,sentToday,remaining,slots,fresh,readyAll,mock,closes,wakes,over,dueToday}}

function vToday(){const D=todayData();const checked=DATA.meta.inboxChecked===D.t;
  const nReply=D.replies.filter(x=>x.a.k==='reply').length,nQ=D.fus.length+D.fresh.length;
  const kpi=(icon,tone,title,num,sub,foot,attrs)=>'<div class="kpi '+tone+'"><div class="kpi-t"><span class="kpi-i">'+ic(icon)+'</span><div><b>'+title+'</b><small>'+sub+'</small></div></div><div class="kpi-n num">'+num+'</div><button class="kpi-f" '+attrs+'>'+foot+ic('arrow')+'</button></div>';
  const stats='<div class="kpis"><div class="kpi feat"><div class="kpi-t"><span class="kpi-i">'+ic('send')+'</span><div><b>Terkirim hari ini</b><small>Kuota harian '+S.limit+' email</small></div></div><div class="kpi-n num">'+D.sentToday+'<span>/ '+S.limit+'</span></div><div class="bar"><i style="width:'+Math.min(100,D.sentToday/S.limit*100)+'%"></i></div><button class="kpi-f" data-act="queue" data-q="all"'+(nQ?'':' disabled')+'>'+(nQ?'Mulai kirim '+nQ+' email':'Antrean hari ini kosong')+ic('arrow')+'</button></div>'
   +kpi('alert',D.over?'red':'','Terlambat',D.over,D.over?'Kerjakan duluan':'Tidak ada yang telat','Lihat yang perlu tindakan','data-view="leads" data-ltab="todo"')
   +kpi('clock','','Jatuh tempo hari ini',D.dueToday,'Follow-up, balasan, mock-up','Lihat jadwal','data-view="schedule"')
   +kpi('inbox','','Menunggu balasanmu',nReply,'Balas maksimal '+S.replySla+' hari','Lihat respons','data-view="leads" data-ltab="resp"')+'</div>';
  const steps=[];
  // 1 inbox
  steps.push(step(1,checked?'done':(D.inSeq.length?'act':''),'Cek inbox Zoho dulu',D.inSeq.length+' menunggu balasan',
   checked?'Sudah dicek hari ini. Kalau ada balasan baru, cari namanya di bawah dan catat.':'Buka hello@bilderlabs.com. Ada yang membalas, bounce, atau auto-reply? Catat di sini supaya follow-up mereka berhenti dan tidak terkirim dobel.',
   '<div class="inline-search"><input id="inbox-q" type="search" placeholder="Ketik nama bisnis atau email pengirim balasan" value="'+esc(UI.inboxQ)+'" autocomplete="off">'+(checked?'<button class="btn s g" data-act="inbox-undo">Batalkan tanda</button>':'<button class="btn s p" data-act="inbox-ok">Inbox sudah dicek</button>')+'</div><div id="inbox-res"></div>'));
  // 2 replies
  steps.push(step(2,D.replies.length?(D.replies.some(x=>dueCls(x.a.due)==='over')?'alert':'act'):'done','Balas yang sudah merespons',D.replies.length||null,
   D.replies.length?'Balas dalam '+S.replySla+' hari. Template ada di tab <b>Balasan</b> pada detail lead.':'Belum ada balasan yang perlu dijawab.',
   D.replies.length?list(D.replies,x=>rowLead(x.l,x.a,'<span class="sub">'+esc(x.a.t)+'</span><button class="btn s p" data-open="'+x.l.id+'" data-dtab="reply">Buka</button>')):''));
  // 3 follow-ups
  const fuOver=D.fus.some(x=>dueCls(x.a.due)==='over');
  steps.push(step(3,D.fus.length?(fuOver?'alert':'act'):'done','Kirim follow-up & last note',D.fus.length||null,
   D.fus.length?'Jatuh tempo hari ini atau sudah lewat. Balas di thread Email 1 (folder Terkirim di Zoho) supaya jadi satu percakapan.':'Tidak ada yang jatuh tempo. Follow-up muncul '+S.fu+' hari setelah Email 1, last note di hari ke-'+S.ln+'.',
   D.fus.length?((checked?'':'<div class="note">Cek inbox dulu (langkah 1) supaya tidak mengirim follow-up ke orang yang sudah membalas.</div>')
     +list(D.fus,x=>rowLead(x.l,x.a,'<span class="sub">'+STEP[x.a.step]+'</span>'+tzPill(x.l)),10)
     +'<div class="bar-actions"><button class="btn l" data-act="queue" data-q="fu">Mulai kirim '+D.fus.length+' email</button></div>'):''));
  // 4 new email 1
  let b4='';
  if(!D.readyAll.length)b4='<div class="note info">Tidak ada lead yang siap dikirimi Email 1. Cari email untuk lead di tab <button class="link" data-view="leads" data-ltab="need">Cari email</button>, atau import hasil scraping baru.</div>';
  else if(!D.slots)b4='<div class="note good">Kuota hari ini sudah terpakai ('+D.sentToday+'/'+S.limit+(D.fus.length?', termasuk '+D.fus.length+' follow-up':'')+'). Lanjut besok supaya reputasi email tetap aman.</div>';
  else{const groups={};D.fresh.forEach(l=>{const tz=tzOf(l);(groups[tz]=groups[tz]||[]).push(l)});
    b4='<p class="sub">Diurutkan: yang sedang jam kerja di sana dulu, lalu skor tertinggi. Sisa '+D.readyAll.length+' lead siap kirim.</p>'
     +Object.keys(groups).map(tz=>{const w=winState(tz);return '<div class="region"><div class="region-h"><div><b>'+esc(TZ_NAME[tz]||tz)+'</b> <span class="tz '+w+'"><i></i>'+localTime(tz)+' di sana · '+WIN_LABEL[w]+'</span><div class="sub">'+esc(winText(tz))+'</div></div><button class="btn s" data-act="queue" data-q="tz:'+esc(tz)+'">Kirim grup ini ('+groups[tz].length+')</button></div>'
       +groups[tz].map(l=>'<div class="row"><div class="who" data-open="'+l.id+'"><b>'+esc(l.business)+'</b><small><span class="cc '+l.country+'">'+l.country+'</span>'+esc(l.city)+' · '+esc(l.niche)+' · skor '+(l.score||'–')+'</small></div><div class="acts"><button class="btn s" data-act="queue" data-q="one:'+l.id+'">Kirim</button></div></div>').join('')+'</div>'}).join('')
     +'<div class="bar-actions"><button class="btn l" data-act="queue" data-q="new">Mulai kirim '+D.fresh.length+' Email 1</button>'+(D.fus.length?'<button class="btn" data-act="queue" data-q="all">Kirim semua ('+(D.fus.length+D.fresh.length)+')</button>':'')+'</div>'}
  steps.push(step(4,D.slots&&D.readyAll.length?'act':'done','Kirim Email 1 baru',D.slots&&D.readyAll.length?D.fresh.length+' dari sisa kuota':null,
   'Kuota harian '+S.limit+' email (atur di <button class="link" data-view="settings">Template & aturan</button>). Follow-up dihitung duluan.',b4));
  // 5 mockups
  steps.push(step(5,D.mock.length?(D.mock.some(x=>dueCls(x.a.due)==='over')?'alert':'act'):'done','Kerjakan mock-up',D.mock.length||null,
   D.mock.length?'Janji di email: mock-up dikirim dalam '+S.mockupDays+' hari kerja setelah brief masuk.':'Belum ada brief masuk.',
   D.mock.length?list(D.mock,x=>rowLead(x.l,x.a,'<span class="sub">deadline '+fmtD(x.a.due)+'</span><button class="btn s" data-act="out" data-o="mock" data-id="'+x.l.id+'">Mock-up terkirim</button>')):''));
  // 6 close
  steps.push(step(6,D.closes.length?'act':'done','Tutup sequence yang selesai',D.closes.length||null,
   D.closes.length?'Last note sudah lewat '+S.close+' hari tanpa balasan. Tandai lost supaya daftar tetap bersih.':'Belum ada sequence yang selesai.',
   D.closes.length?list(D.closes,x=>rowLead(x.l,x.a,'<button class="btn s" data-act="out" data-o="close" data-id="'+x.l.id+'">Lost: tidak membalas</button>'))+'<div class="bar-actions"><button class="btn" data-act="close-all">Tutup semua ('+D.closes.length+')</button></div>':''));
  // 7 wakes
  steps.push(step(7,D.wakes.length?'act':'done','Hubungi lagi yang ditunda',D.wakes.length||null,
   D.wakes.length?'Mereka pernah bilang "nanti saja". Kirim check-in singkat (template ada di tab Balasan).':'Tidak ada lead tertunda yang jatuh tempo.',
   D.wakes.length?list(D.wakes,x=>rowLead(x.l,x.a,'<button class="btn s p" data-open="'+x.l.id+'" data-dtab="reply">Buka</button>')):''));
  return stats+'<div class="grid-today"><ol class="steps">'+steps.join('')+'</ol><div class="rail">'+railTimes(D)+railWeek()+railStats()+railResearch()+'</div></div>'}

function renderInbox(){const box=$('#inbox-res');if(!box)return;const q=UI.inboxQ.trim().toLowerCase();
  if(!q){box.innerHTML='';return}
  const hits=scope().filter(l=>[l.business,l.email,l.contact,l.city].join(' ').toLowerCase().includes(q)).slice(0,6);
  box.innerHTML=hits.length?'<div class="rows">'+hits.map(l=>{const opts=['replied','brief','bounce','auto'].filter(k=>(OUT_BY[l.stage]||[]).includes(k));
    return rowLead(l,null,pill(l.stage)+(opts.length?opts.map(k=>OUT[k].input?'<button class="btn s" data-open="'+l.id+'" data-out="'+k+'">'+OUT[k].l+'…</button>':'<button class="btn s" data-act="out" data-o="'+k+'" data-id="'+l.id+'">'+OUT[k].l+'</button>').join(''):'')+'<button class="btn s g" data-open="'+l.id+'">Detail</button>')}).join('')+'</div>':'<p class="sub">Tidak ada lead yang cocok dengan "'+esc(UI.inboxQ)+'".</p>'}

function railTimes(D){const tzs={};D.L.forEach(l=>{if(['ready','e1','e2','e3'].includes(l.stage)&&l.email){const tz=tzOf(l);tzs[tz]=(tzs[tz]||0)+1}});
  const keys=Object.keys(tzs).sort((a,b)=>{const r={best:0,ok:1,edge:2,off:3};return r[winState(a)]-r[winState(b)]||tzs[b]-tzs[a]});
  return '<div class="card pad"><h3 class="h3">Jam kirim</h3><p class="sub">Email paling sering dibaca pukul '+pad(S.winStart)+'.00–'+pad(S.winEnd)+'.00 waktu mereka, hari kerja.</p><div class="tzlist">'
   +(keys.length?keys.map(tz=>{const w=winState(tz);return '<div class="tzrow"><b>'+esc(TZ_NAME[tz]||tz)+' <span class="faint">· '+tzs[tz]+' lead</span></b><span class="t">'+localTime(tz)+'</span><small class="'+(w==='best'?'best':'')+'">'+esc(winText(tz))+'</small></div>'}).join(''):'<p class="sub">Belum ada lead aktif.</p>')+'</div></div>'}
function agendaItems(days){const t=today(),end=addD(t,days),items=[];
  for(const l of scope()){const a=na(l);if(a&&a.due&&a.due<=end)items.push({l,a,d:a.due<t?'over':a.due})}return items}
function railWeek(){const items=agendaItems(6);const map={};items.forEach(x=>{const d=x.d==='over'?today():x.d;(map[d]=map[d]||[]).push(x)});
  let max=1;for(let i=0;i<7;i++){const d=addD(today(),i);max=Math.max(max,(map[d]||[]).length)}
  let h='';for(let i=0;i<7;i++){const d=addD(today(),i),xs=map[d]||[];const kinds={};xs.forEach(x=>{const k=KIND[x.a.k]||'k-close';kinds[k]=(kinds[k]||0)+1});
    h+='<div class="wk" data-view="schedule"><span>'+(i===0?'Hari ini':i===1?'Besok':fmtD(d).replace(',',''))+'</span><span class="wb">'+Object.keys(kinds).map(k=>'<i class="'+k+'" style="width:'+(kinds[k]/max*100)+'%"></i>').join('')+'</span><b class="num">'+(xs.length||'')+'</b></div>'}
  return '<div class="card pad"><h3 class="h3">7 hari ke depan</h3><p class="sub">Termasuk yang terlambat (masuk ke hari ini).</p><div class="week">'+h+'</div><div class="legend"><span><i class="k-send"></i>Kirim</span><span><i class="k-reply"></i>Balas</span><span><i class="k-mockup"></i>Mock-up</span><span><i class="k-close"></i>Tutup</span><span><i class="k-wake"></i>Check-in</span></div></div>'}
function railStats(){const w=weekStart(),L=scope();let sent=0,rep=0,brief=0,won=0;
  for(const l of L){const s=l.sent||{},a=l.at||{};for(const k in s)if(s[k]>=w)sent++;if(a.replied>=w)rep++;if(a.brief>=w)brief++;if(a.won>=w)won++}
  return '<div class="card pad"><h3 class="h3">Minggu ini</h3><p class="sub">Sejak Senin, '+fmtDs(w)+'.</p><div class="mini"><div><span>Email terkirim</span><b class="num">'+sent+'</b></div><div><span>Balasan</span><b class="num">'+rep+'</b></div><div><span>Brief masuk</span><b class="num">'+brief+'</b></div><div><span>Won</span><b class="num">'+won+'</b></div></div></div>'}
function railResearch(){const L=scope();const need=L.filter(l=>l.stage==='need'||(l.stage==='ready'&&!l.email)).length,chk=L.filter(l=>l.stage==='check').length;
  return '<div class="card pad"><h3 class="h3">Tugas riset</h3><p class="sub">'+need+' lead belum punya email, '+chk+' perlu dicek websitenya. Kerjakan bertahap dengan Claude lalu import.</p><div class="bar-actions" style="margin-top:10px"><button class="btn s" data-view="leads" data-ltab="need">Lihat daftar</button></div></div>'}

/* leads */
const LTABS=[['todo','Perlu tindakan'],['ready','Belum dihubungi'],['need','Cari email'],['seq','Dalam sequence'],['resp','Respons'],['paused','Ditunda'],['won','Won'],['closed','Lost & bounce'],['all','Semua']];
function inTab(l,tab){const a=na(l);switch(tab){case 'todo':return isDue(a)||(a&&a.k==='reply');case 'ready':return l.stage==='ready'&&!!l.email;case 'need':return l.stage==='need'||l.stage==='check'||(l.stage==='ready'&&!l.email);case 'seq':return ['e1','e2','e3'].includes(l.stage);case 'resp':return ['replied','brief','mockup'].includes(l.stage);case 'paused':return l.stage==='paused';case 'won':return l.stage==='won';case 'closed':return l.stage==='lost'||l.stage==='bounced';default:return true}}
function leadsFiltered(){const q=UI.q.trim().toLowerCase();let r=scope().filter(l=>inTab(l,UI.ltab));
  if(q)r=r.filter(l=>[l.business,l.city,l.email,l.niche,l.phone,l.contact].join(' ').toLowerCase().includes(q));
  if(UI.niche)r=r.filter(l=>l.niche===UI.niche);
  const s=UI.sort;r.sort((a,b)=>{if(s==='name')return a.business.localeCompare(b.business);if(s==='score')return byScore(a,b);if(s==='upd')return String(b.upd||'').localeCompare(String(a.upd||''));const x=na(a),y=na(b);const dx=x&&x.due||(x&&x.queue?'8':'9'),dy=y&&y.due||(y&&y.queue?'8':'9');return dx<dy?-1:dx>dy?1:byScore(a,b)});return r}
function progress(l){const m={need:[0,'Belum ada email'],check:[0,'Cek website'],ready:[0,'Belum dihubungi'],e1:[1,'Email 1 dari 3'],e2:[2,'Email 2 dari 3'],e3:[3,'Email 3 dari 3'],replied:[4,'Sudah membalas'],brief:[5,'Brief masuk'],mockup:[6,'Mock-up terkirim'],won:[7,'Won'],paused:[4,'Ditunda'],lost:[7,'Ditutup'],bounced:[1,'Bounce']};const x=m[l.stage]||[0,''];return{n:x[0],label:x[1],pct:Math.round(x[0]/7*100)}}
function nextShort(l){const a=na(l);if(!a)return '<span class="due">'+ic('calendar')+'Selesai</span>';if(!a.due)return '<span class="due">'+ic('calendar')+(a.queue?'Antre kuota':'Belum dijadwalkan')+'</span>';const n=diff(a.due,today());return '<span class="due '+dueCls(a.due)+'">'+ic('calendar')+(n<0?'Telat '+(-n)+' hari':n===0?'Hari ini':n===1?'Besok':fmtDs(a.due))+'</span>'}
function leadCard(l){const a=na(l),p=progress(l),tone=l.stage==='won'?'won':(l.stage==='lost'||l.stage==='bounced')?'lost':'';
  return '<article class="lc" data-open="'+l.id+'"><div class="lc-h"><b>'+esc(l.business)+'</b><span class="cc '+l.country+'">'+l.country+'</span></div>'
   +'<div class="lc-p">'+pill(l.stage)+'<span>'+esc(a?a.t:(l.lostReason||l.wonValue&&l.wonValue+' USD'||''))+'</span></div>'
   +'<div class="prog '+tone+'"><i style="width:'+Math.max(p.pct,4)+'%"></i></div>'
   +'<div class="lc-m"><div><small>Kontak</small>'+(l.contact?'<span class="who2"><span class="av sm">'+esc(initials(l.contact))+'</span>'+esc(l.contact)+'</span>':'<span class="faint" style="font-size:13px">Belum ada nama</span>')+'</div><div><small>Aksi berikutnya</small>'+nextShort(l)+'</div></div>'
   +'<div class="tags">'+(l.score?'<span class="tag'+(l.score>=8?' t-hot':'')+'">Skor '+l.score+'</span>':'')+'<span class="tag t-niche">'+esc(l.niche)+'</span>'+(['e1','e2','e3'].includes(l.stage)?'<span class="tag">'+ic('mail')+esc(p.label)+'</span>':'')+'</div></article>'}
function vLeads(){const L=scope();const counts={};LTABS.forEach(t=>counts[t[0]]=L.filter(l=>inTab(l,t[0])).length);
  const niches=[...new Set(L.map(l=>l.niche).filter(Boolean))].sort();const r=leadsFiltered();
  const h='<div class="utabs">'+LTABS.map(t=>'<button class="utab'+(UI.ltab===t[0]?' on':'')+(t[0]==='todo'&&counts.todo?' red':'')+'" data-ltab="'+t[0]+'">'+t[1]+'<em>'+counts[t[0]]+'</em></button>').join('')+'</div>'
   +'<div class="toolbar"><select id="f-niche" aria-label="Niche"><option value="">Semua niche</option>'+niches.map(n=>'<option'+(n===UI.niche?' selected':'')+'>'+esc(n)+'</option>').join('')+'</select><select id="f-sort" aria-label="Urutkan">'+[['next','Urut: aksi berikutnya'],['score','Urut: skor'],['name','Urut: nama'],['upd','Urut: terakhir diubah']].map(o=>'<option value="'+o[0]+'"'+(UI.sort===o[0]?' selected':'')+'>'+o[1]+'</option>').join('')+'</select>'+(UI.q?'<span class="tag">Cari: '+esc(UI.q)+'</span>':'')+'<span class="count">'+r.length+' lead</span></div>';
  if(!r.length)return h+'<div class="card empty"><b>'+(UI.ltab==='todo'?'Semua beres':'Kosong')+'</b>'+(UI.ltab==='todo'?'Tidak ada lead yang jatuh tempo atau menunggu balasanmu.':'Tidak ada lead di kelompok ini'+(UI.q?' yang cocok dengan pencarian':'')+'.')+'</div>';
  if(UI.lview==='card'){const max=150;return h+'<div class="lcards">'+r.slice(0,max).map(leadCard).join('')+'</div>'+(r.length>max?'<p class="sub" style="margin-top:12px">Menampilkan '+max+' dari '+r.length+' lead. Pakai filter atau pencarian.</p>':'')}
  return h+'<div class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Bisnis</th><th>Status</th><th>Sequence</th><th>Aksi berikutnya</th><th>Waktu di sana</th><th>Skor</th><th>Email</th></tr></thead><tbody>'
   +r.map(l=>{const a=na(l);return '<tr data-open="'+l.id+'"><td><div class="biz"><span class="av">'+esc(initials(l.business))+'</span><div><b>'+esc(l.business)+'</b><small><span class="cc '+l.country+'">'+l.country+'</span> '+esc(l.city)+' · '+esc(l.niche)+'</small></div></div></td><td>'+pill(l.stage)+'</td><td>'+dots(l)+'</td><td class="na">'+(a?'<b>'+esc(a.t)+'</b>'+(a.due?'<span class="due '+dueCls(a.due)+'">'+esc(rel(a.due))+'</span>':a.queue?'<span class="due">Antre kuota harian</span>':''):'<span class="faint">Selesai'+(l.lostReason?' · '+esc(l.lostReason):l.wonValue?' · '+l.wonValue+' USD':'')+'</span>')+'</td><td>'+tzPill(l)+'</td><td class="num">'+(l.score||'–')+'</td><td class="em">'+(l.email?esc(l.email):'<span class="faint">—</span>')+'</td></tr>'}).join('')+'</tbody></table></div></div>'}
function vSchedule(){const items=agendaItems(13);const over=items.filter(x=>x.d==='over').sort((a,b)=>byDue(a,b));const map={};items.filter(x=>x.d!=='over').forEach(x=>{(map[x.d]=map[x.d]||[]).push(x)});
  const chip=x=>'<span class="chip" data-open="'+x.l.id+'"><i class="'+(KIND[x.a.k]||'k-close')+'"></i><span><b>'+esc(x.a.k==='send'?STEP[x.a.step]:KIND_NAME[x.a.k])+'</b> · '+esc(x.l.business)+'</span></span>';
  let h='<div class="legend" style="margin:0 0 12px"><span><i class="k-send"></i>Follow-up / last note</span><span><i class="k-reply"></i>Balas / tanya mock-up</span><span><i class="k-mockup"></i>Deadline mock-up</span><span><i class="k-close"></i>Tutup sequence</span><span><i class="k-wake"></i>Check-in</span></div><div class="agenda">';
  if(over.length)h+='<div class="card day over"><h4>Terlambat<small>'+over.length+' item</small></h4><div class="chips">'+over.map(chip).join('')+'</div></div>';
  for(let i=0;i<14;i++){const d=addD(today(),i),xs=(map[d]||[]).sort(byDue);const sends=xs.filter(x=>x.a.k==='send').length;const wd=pd(d).getDay();const slots=Math.max(0,S.limit-sends);
    h+='<div class="card day'+(i===0?' today':'')+'"><h4>'+(i===0?'Hari ini':i===1?'Besok':fmtD(d))+'<small>'+(i<2?fmtD(d)+' · ':'')+(wd===0||wd===6?'akhir pekan · ':'')+(sends?sends+' follow-up, ':'')+slots+' slot Email 1</small></h4><div class="chips">'+(xs.length?xs.map(chip).join(''):'<span class="sub">Tidak ada jadwal. Pakai slot untuk Email 1 baru.</span>')+'</div></div>'}
  return h+'</div>'}

/* pipeline */
function vPipeline(){const cols=['ready','e1','e2','e3','replied','brief','mockup','paused','won','lost'];const L=scope();
  return '<div class="board">'+cols.map(c=>{const xs=L.filter(l=>c==='ready'?(l.stage==='ready'&&l.email):c==='lost'?(l.stage==='lost'||l.stage==='bounced'):l.stage===c).sort((a,b)=>{const x=na(a),y=na(b),dx=x&&x.due||'9',dy=y&&y.due||'9';return dx<dy?-1:dx>dy?1:byScore(a,b)});const show=xs.slice(0,30);
    return '<div class="col" data-col="'+c+'"><h4>'+(c==='lost'?'Lost & bounce':ST[c][0])+'<b>'+xs.length+'</b></h4>'+show.map(l=>{const a=na(l);return '<div class="kc" draggable="true" data-open="'+l.id+'"><b>'+esc(l.business)+'</b><small><span>'+esc(l.city)+' · '+l.country+'</span>'+(a&&a.due?'<span class="due '+dueCls(a.due)+'">'+esc(diff(a.due,today())<0?'telat':a.due===today()?'hari ini':fmtDs(a.due))+'</span>':'')+'</small></div>'}).join('')+(xs.length>show.length?'<div class="more">+ '+(xs.length-show.length)+' lagi</div>':'')+(xs.length?'':'<p class="sub" style="padding:4px">Kosong</p>')+'</div>'}).join('')+'</div>'}

/* Drag a pipeline card to another column. Dates are filled in the same way as the "Catat hasil" buttons. */
const LATE=['replied','brief','mockup','paused','won','lost','bounced'];
function moveTo(l,st){if(!l)return;const cur=l.stage==='bounced'?'lost':l.stage;if(cur===st)return;
  const ask={paused:'later',won:'won',lost:'lost'};
  if(ask[st]){openLead(l.id,'sum',ask[st]);toast('Lengkapi dulu: '+OUT[ask[st]].l);return}
  let undo;
  if(st==='ready'||/^e[123]$/.test(st)){const step=st==='ready'?-1:+st[1]-1;
    undo=change(l,x=>{x.sent=x.sent||{};for(let i=0;i<3;i++){const k='e'+(i+1);if(i<=step){if(!x.sent[k])x.sent[k]=today()}else delete x.sent[k]}
      if(LATE.includes(x.stage)){const a=at(x);['replied','brief','mockup','nudged','won','lost','wake'].forEach(k=>delete a[k]);delete x.lostReason;delete x.wonValue}
      x.stage=st},st==='ready'?'Dikembalikan ke Belum dihubungi (Pipeline)':STEP[step]+' terkirim (Pipeline)',st==='ready'?'stage':'send')}
  else{const o=OUT[{replied:'replied',brief:'brief',mockup:'mock'}[st]];if(!o)return;undo=change(l,o.f,o.log+' (Pipeline)',o.kind)}
  render();toast(l.business+' → '+ST[st][0],undo)}

/* report */
function funnel(L){const c=L.filter(l=>l.sent&&l.sent.e1).length,r=L.filter(l=>l.at&&l.at.replied).length,b=L.filter(l=>l.at&&l.at.brief).length,m=L.filter(l=>l.at&&l.at.mockup).length,w=L.filter(l=>l.stage==='won').length;return[['Dihubungi',c],['Membalas',r],['Brief masuk',b],['Mock-up',m],['Won',w]]}
function vReport(){const L=scope(),t=today();
  const fun=['AU','US'].filter(c=>UI.country==='ALL'||UI.country===c).map(c=>{const f=funnel(L.filter(l=>l.country===c));const top=Math.max(1,...f.map(x=>x[1]));
    return '<div class="card pad"><h3 class="h3">'+(c==='AU'?'Australia':'United States')+'</h3><p class="sub">'+L.filter(l=>l.country===c).length+' lead total</p><div class="funnel">'+f.map((x,i)=>'<div class="fr"><span>'+x[0]+'</span><div class="fb"><i style="width:'+(x[1]/top*100)+'%;background:var(--'+(c==='AU'?'au':'us')+');opacity:'+(1-i*.12)+'"></i></div><span class="num"><b>'+x[1]+'</b> <em>'+(i&&f[0][1]?Math.round(x[1]/f[0][1]*100)+'%':'')+'</em></span></div>').join('')+'</div></div>'}).join('');
  const days=[];for(let i=13;i>=0;i--){const d=addD(t,-i);let n=0;for(const l of L){const s=l.sent||{};for(const k in s)if(s[k]===d)n++}days.push([d,n])}
  const mx=Math.max(4,...days.map(x=>x[1])),W=560,H=150,bw=W/14;const ticks=[0,Math.round(mx/2),mx];
  const svg='<svg class="chart" viewBox="0 0 '+(W+30)+' '+(H+28)+'" role="img" aria-label="Email terkirim per hari, 14 hari terakhir">'+ticks.map(v=>{const y=H-v/mx*H+4;return '<line class="gl" x1="28" x2="'+(W+28)+'" y1="'+y+'" y2="'+y+'"/><text x="22" y="'+(y+4)+'" text-anchor="end">'+v+'</text>'}).join('')
   +days.map((x,i)=>{const h=x[1]/mx*H;return '<rect x="'+(30+i*bw+4)+'" y="'+(H-h+4)+'" width="'+(bw-8)+'" height="'+Math.max(h,0)+'" rx="3" style="fill:'+(x[0]===t?'var(--bar-hi)':'var(--bar)')+'"><title>'+fmtD(x[0])+': '+x[1]+' email</title></rect>'+(i%2===0||i===13?'<text x="'+(30+i*bw+bw/2)+'" y="'+(H+22)+'" text-anchor="middle">'+(x[0]===t?'Hari ini':fmtDs(x[0]))+'</text>':'')}).join('')+'</svg>';
  const nmap={};L.forEach(l=>{if(!(l.sent&&l.sent.e1))return;const n=l.niche||'Lainnya';nmap[n]=nmap[n]||[0,0];nmap[n][0]++;if(l.at&&l.at.replied)nmap[n][1]++});
  const nrows=Object.entries(nmap).sort((a,b)=>b[1][0]-a[1][0]).slice(0,10);
  const lr={};L.filter(l=>l.stage==='lost').forEach(l=>{const k=l.lostReason||'Lainnya';lr[k]=(lr[k]||0)+1});
  const wonV=L.filter(l=>l.stage==='won').reduce((s,l)=>s+(+l.wonValue||0),0);
  return '<div class="rep">'+fun+'</div><div class="rep" style="margin-top:12px"><div class="card pad"><h3 class="h3">Email terkirim, 14 hari terakhir</h3><p class="sub">Email 1, follow-up, dan last note.</p>'+svg+'</div>'
   +'<div class="card pad"><h3 class="h3">Balasan per niche</h3><p class="sub">Niche mana yang paling responsif.</p>'+(nrows.length?'<div class="kv">'+nrows.map(x=>'<span>'+esc(x[0])+'</span><b class="num">'+x[1][1]+' / '+x[1][0]+' <span class="faint">('+Math.round(x[1][1]/x[1][0]*100)+'%)</span></b>').join('')+'</div>':'<p class="sub" style="margin-top:10px">Muncul setelah Email 1 pertama terkirim.</p>')+'</div>'
   +'<div class="card pad"><h3 class="h3">Alasan lost</h3>'+(Object.keys(lr).length?'<div class="kv">'+Object.entries(lr).sort((a,b)=>b[1]-a[1]).map(x=>'<span>'+esc(x[0])+'</span><b class="num">'+x[1]+'</b>').join('')+'</div>':'<p class="sub" style="margin-top:6px">Belum ada lead yang ditutup.</p>')+'</div>'
   +'<div class="card pad"><h3 class="h3">Nilai project won</h3><p class="sub">Dari harga founding rate yang dicatat saat won.</p><div class="kv"><span>Total</span><b class="num">'+wonV.toLocaleString('en-US')+' USD</b><span>Jumlah project</span><b class="num">'+L.filter(l=>l.stage==='won').length+'</b></div></div></div>'}

/* settings */
const TPL_VARS=['first_name','business','city','niche','reviews','rating','hook','sender','subject1','mockup_date'];
function vSettings(){const sq=S.tpl.seq||[],rp=S.tpl.replies||[];const sel=UI.tplSel||'seq:0';const cur=tplGet(sel)||{subject:'',body:''};
  return '<div class="two"><div class="card pad form"><h3 class="h3">Template email</h3><p class="sub">Email 1, follow-up, dan last note di sini dipakai untuk lead yang belum punya email personal (misalnya hasil import). Template balasan muncul di tab Balasan setiap lead.</p>'
   +'<div class="fld"><label for="tpl-sel">Template</label><select id="tpl-sel">'+sq.map((t,i)=>'<option value="seq:'+i+'"'+(sel==='seq:'+i?' selected':'')+'>Sequence · '+STEP[i]+'</option>').join('')+rp.map((t,i)=>'<option value="rep:'+i+'"'+(sel==='rep:'+i?' selected':'')+'>Balasan · '+esc(t.name)+'</option>').join('')+'</select></div>'
   +'<div class="fld"><label for="tpl-subj">Subjek</label><input id="tpl-subj" value="'+esc(cur.subject)+'"></div><div class="fld"><label for="tpl-body">Isi</label><textarea id="tpl-body" style="min-height:320px" spellcheck="false">'+esc(cur.body)+'</textarea><small>Variabel: '+TPL_VARS.map(v=>'<code>{{'+v+'}}</code>').join(' ')+'</small><small>Tulis sampai kalimat penutup saja. Signature ditambahkan otomatis '+(S.zohoSig?'oleh Zoho (logo, nama, alamat, kalimat &quot;reply no&quot;)':'oleh dashboard (nama, Bilder Labs, alamat pos, dan kalimat &quot;reply no&quot; untuk email outreach)')+'.</small></div><p class="flag" id="tpl-flag"></p></div>'
   +'<div class="form"><div class="card pad form"><h3 class="h3">Aturan jadwal</h3><div class="f2">'
   +num('limit','Batas kirim per hari',S.limit,'email')+num('fu','Follow-up setelah',S.fu,'hari dari Email 1')+num('ln','Last note di hari ke-',S.ln,'dari Email 1')+num('close','Tutup sequence setelah',S.close,'hari dari last note')+num('replySla','Balas lead dalam',S.replySla,'hari')+num('mockupDays','Mock-up dikirim dalam',S.mockupDays,'hari kerja')+num('nudge','Tanya pendapat mock-up setelah',S.nudge,'hari')+num('wakeDays','"Nanti saja" ditunda',S.wakeDays,'hari')+num('winStart','Jam kirim terbaik mulai',S.winStart,'waktu mereka')+num('winEnd','Sampai jam',S.winEnd,'waktu mereka')
   +'</div></div><div class="card pad form"><h3 class="h3">Tanda tangan</h3><div class="fld"><label for="set-zohoSig">Signature di email</label><select id="set-zohoSig"><option value="1"'+(S.zohoSig?' selected':'')+'>Signature HTML dari Zoho</option><option value="0"'+(S.zohoSig?'':' selected')+'>Teks dari dashboard</option></select><small>'+(S.zohoSig?'Email yang disalin berhenti sebelum nama. Signature Zoho (logo, nama, alamat pos, kalimat &quot;reply no&quot;) yang menutup setiap email.':'Nama, Bilder Labs, dan alamat pos ditulis sebagai teks di akhir email.')+'</small></div><div class="fld"><label for="set-sender">Nama pengirim</label><input id="set-sender" data-set="sender" value="'+esc(S.sender)+'"></div><div class="fld"><label for="set-postal">Alamat pos bisnis</label><input id="set-postal" data-set="postal" value="'+esc(S.postal)+'" placeholder="Wajib untuk email ke US (CAN-SPAM)"><small>Menggantikan '+esc(POSTAL_PH)+' di semua email saat disalin.</small></div></div>'
   +'<div class="card pad form"><h3 class="h3">Jangan dihubungi</h3><div class="fld"><label for="set-dnc">Email atau domain, satu per baris</label><textarea id="set-dnc" data-set="dnc" placeholder="owner@contoh.com&#10;contoh.com.au">'+esc(S.dnc)+'</textarea><small>Lead yang menjawab "tidak tertarik" otomatis masuk daftar ini. Import CSV melewati alamat di sini.</small></div></div>'
   +'<div class="card pad"><h3 class="h3">Kata yang ditandai</h3><p class="code muted" style="margin-top:6px">'+SPAM.map(esc).join(' · ')+'</p></div></div></div>'}
const num=(k,l,v,u)=>'<div class="fld"><label for="set-'+k+'">'+l+'</label><input id="set-'+k+'" type="number" min="1" data-set="'+k+'" value="'+v+'"><small>'+u+'</small></div>';
function tplGet(sel){const p=sel.split(':');return (p[0]==='seq'?S.tpl.seq:S.tpl.replies)[+p[1]]}
function checkTpl(){const f=$('#tpl-flag');if(!f)return;const h=spamHits($('#tpl-subj').value+' '+$('#tpl-body').value);f.className='flag'+(h.length?'':' ok');f.textContent=h.length?'Kata yang perlu dicek: '+h.join(', '):'Tidak ada kata pemicu spam.'}

/* import / export */
const CSV_COLS=['business','country','city','niche','phone','email','email_confidence','email_source','contact_name','rating','reviews','score','website_check','personal_hook','facebook','maps_url','subject_1','email_1','subject_2','email_2','subject_3','email_3','stage','notes'];
let PENDING=null;
function vIO(){return '<div class="two"><div class="card pad"><h3 class="h3">Import leads dari CSV</h3><p class="sub" style="margin:4px 0 12px">Hasil scraping dari Claude disimpan sebagai CSV lalu dimasukkan di sini. Kolom dicocokkan otomatis. Duplikat (email, telepon, atau nama + kota sama) dan alamat di daftar jangan dihubungi dilewati.</p>'
  +'<label class="drop" id="drop" for="file"><input type="file" id="file" accept=".csv,text/csv" hidden><b>Taruh file CSV di sini</b><span class="sub">atau klik untuk memilih file</span></label><div id="mapping"></div></div>'
  +'<div class="form"><div class="card pad"><h3 class="h3">Format CSV</h3><p class="sub" style="margin:4px 0 8px">Minta Claude memakai kolom ini. Yang wajib hanya <b>business</b> dan <b>country</b> (AU atau US).</p><p class="code">'+CSV_COLS.join(', ')+'</p><div class="bar-actions" style="margin-top:10px"><button class="btn s" data-act="csv-template">'+ic('download')+'Template CSV kosong</button></div></div>'
  +'<div class="card pad"><h3 class="h3">Export & cadangan</h3><p class="sub" style="margin:4px 0 10px">CSV berisi lead di negara yang dipilih, lengkap dengan status dan tanggal kirim. JSON berisi semua data, termasuk riwayat dan pengaturan.</p><div class="bar-actions"><button class="btn p" data-act="export">'+ic('download')+'Export CSV</button><a class="btn" href="/api/export.json">'+ic('db')+'Cadangan JSON</a></div></div>'
  +'<div class="card pad"><h3 class="h3">Import otomatis (opsional)</h3><p class="sub" style="margin-top:4px">Untuk n8n atau skrip: isi <span class="mono">API_TOKEN</span> di .env, lalu kirim <span class="mono">POST /api/leads/import</span> dengan header <span class="mono">Authorization: Bearer &lt;token&gt;</span>. Maksimal 25 lead per permintaan. Contohnya ada di README.</p></div></div></div>'}
function parseCSV(t){const rows=[];let row=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else if(c==='"')q=true;else if(c===','){row.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f=''}else f+=c}if(f||row.length){row.push(f);rows.push(row)}return rows.filter(r=>r.some(x=>String(x).trim()))}
const toCSV=rows=>rows.map(r=>r.map(v=>{v=String(v==null?'':v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(',')).join('\n');
function guess(h){h=String(h).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');const al={name:'business',business_name:'business',company:'business',category:'niche',type:'niche',google_rating:'rating',email_address:'email',send_to:'email',confidence:'email_confidence',website:'website_check',hook:'personal_hook',google_maps:'maps_url',maps:'maps_url',status:'stage',greeting_name:'contact_name',contact:'contact_name'};return CSV_COLS.includes(h)?h:(al[h]||'')}
function dncSet(){const s=new Set();String(S.dnc||'').split(/\s+/).map(x=>x.trim().toLowerCase()).filter(Boolean).forEach(x=>s.add(x));LEADS.forEach(l=>{if(l.dnc&&l.email)s.add(l.email.toLowerCase())});return s}
function isBlocked(email,set){if(!email)return false;email=email.toLowerCase();return set.has(email)||set.has(email.split('@')[1]||'')}
function readFile(f){const r=new FileReader();r.onload=()=>{const rows=parseCSV(String(r.result||''));if(rows.length<2)return toast('File itu tidak berisi baris data');PENDING={rows,map:rows[0].map(guess)};renderMapping()};r.readAsText(f)}
function rowVal(row,map,k){const i=map.indexOf(k);return i>-1?String(row[i]||'').trim():''}
function dupOf(row,map){const em=rowVal(row,map,'email').toLowerCase(),ph=rowVal(row,map,'phone').replace(/\D/g,''),bc=(rowVal(row,map,'business')+'|'+rowVal(row,map,'city')).toLowerCase();return LEADS.find(l=>(em&&l.email&&l.email.toLowerCase()===em)||(ph.length>5&&l.phone&&String(l.phone).replace(/\D/g,'')===ph)||((l.business+'|'+l.city).toLowerCase()===bc))}
function renderMapping(){const box=$('#mapping');if(!box||!PENDING)return;const h=PENDING.rows[0],data=PENDING.rows.slice(1),map=PENDING.map,dn=dncSet();
  const dups=data.filter(r=>dupOf(r,map)).length,blocked=data.filter(r=>!dupOf(r,map)&&isBlocked(rowVal(r,map,'email'),dn)).length,noname=data.filter(r=>!rowVal(r,map,'business')).length;
  const ok=data.length-dups-blocked-noname;
  box.innerHTML='<table class="maptbl"><thead><tr><th>Kolom CSV</th><th>Masuk ke</th><th>Contoh</th></tr></thead><tbody>'+h.map((c,i)=>'<tr><td>'+esc(c)+'</td><td><select data-map="'+i+'" aria-label="Kolom tujuan untuk '+esc(c)+'"><option value="">— abaikan —</option>'+CSV_COLS.map(k=>'<option'+(map[i]===k?' selected':'')+'>'+k+'</option>').join('')+'</select></td><td class="faint">'+esc(String((data[0]||[])[i]||'').slice(0,40))+'</td></tr>').join('')+'</tbody></table>'
   +'<p style="margin-top:12px;font-size:13px"><b>'+data.length+'</b> baris · '+dups+' duplikat · '+blocked+' di daftar jangan dihubungi'+(noname?' · '+noname+' tanpa nama bisnis':'')+'</p><div class="bar-actions" style="margin-top:10px"><button class="btn l" data-act="do-import"'+(ok?'':' disabled')+'>Import '+ok+' lead</button><button class="btn g" data-act="cancel-import">Batal</button></div>'}
async function doImport(){if(!PENDING)return;const data=PENDING.rows.slice(1),map=PENDING.map,dn=dncSet();const out=[];
  data.forEach(r=>{const g=k=>rowVal(r,map,k);if(!g('business')||dupOf(r,map)||isBlocked(g('email'),dn))return;
    const cc=(g('country')||'US').toUpperCase().slice(0,2)==='AU'?'AU':'US';const niche=g('niche');
    const l={business:g('business'),country:cc,city:g('city'),niche:niche?niche[0].toUpperCase()+niche.slice(1):'Lainnya',phone:g('phone'),email:g('email'),emailConf:g('email_confidence')||(g('email')?'Medium':''),emailSource:g('email_source'),contact:g('contact_name'),rating:+g('rating')||null,reviews:+g('reviews')||0,score:+g('score')||null,websiteCheck:g('website_check'),hook:g('personal_hook'),facebook:g('facebook'),maps:g('maps_url'),seq:[],sent:{},at:{added:today()},upd:stamp(),log:[{d:stamp(),t:'Diimpor dari CSV',k:'add'}]};
    if(g('email_1'))l.seq=[[g('subject_1'),g('email_1')],[g('subject_2'),g('email_2')],[g('subject_3'),g('email_3')]].filter(x=>x[1]).map(x=>({subject:x[0],body:x[1]}));
    const stIn=g('stage').toLowerCase();l.stage=STAGES.includes(stIn)?stIn:(l.email?'ready':'need');if(g('notes'))l.log.push({d:stamp(),t:'Catatan: '+g('notes'),k:'note'});
    out.push(l)});
  if(!out.length)return toast('Tidak ada lead baru untuk diimpor');
  const btn=$('[data-act="do-import"]');if(btn){btn.disabled=true;btn.textContent='Mengimpor…'}
  try{const created=[],sk={};for(let i=0;i<out.length;i+=25){const r=await api('POST','/api/leads/import',{leads:out.slice(i,i+25)});(r.created||[]).forEach(l=>{LEADS.push(normLead(l));created.push(l)});for(const k in (r.skipped||{}))sk[k]=(sk[k]||0)+r.skipped[k];if(btn)btn.textContent='Mengimpor… '+Math.min(i+25,out.length)+'/'+out.length}
    PENDING=null;render();toast(created.length+' lead diimpor');
    const box=$('#mapping');if(box)box.innerHTML='<p class="note good" style="margin-top:12px">'+created.length+' lead baru masuk'+(sk.duplicate?', '+sk.duplicate+' duplikat dilewati':'')+(sk.doNotContact?', '+sk.doNotContact+' ada di daftar jangan dihubungi':'')+'. <button class="link" data-view="leads" data-ltab="ready">Lihat yang siap kirim</button></p>'}
  catch(e){toast('Import gagal: '+e.message);if(btn){btn.disabled=false;btn.textContent='Coba import lagi'}}}
function saveFile(name,text){dl(name,text,'text/csv');toast('File diunduh: '+name)}
function exportCSV(){const L=scope();const head=['id','business','country','city','niche','phone','email','email_confidence','email_source','contact_name','rating','reviews','score','status','next_action','due','sent_1','sent_2','sent_3','replied','brief','mockup','won','won_value','lost_reason','do_not_contact','maps_url','website_check','personal_hook','subject_1','email_1','subject_2','email_2','subject_3','email_3','history'];
  const rows=[head].concat(L.map(l=>{const a=na(l),s=l.sent||{},t=l.at||{},q=l.seq||[];return[l.id,l.business,l.country,l.city,l.niche,l.phone,l.email,l.emailConf,l.emailSource,l.contact,l.rating,l.reviews,l.score,(ST[l.stage]||[l.stage])[0],a?a.t:'',a&&a.due||'',s.e1||'',s.e2||'',s.e3||'',t.replied||'',t.brief||'',t.mockup||'',t.won||'',l.wonValue||'',l.lostReason||'',l.dnc?'yes':'',l.maps,l.websiteCheck,l.hook,(q[0]||{}).subject,(q[0]||{}).body,(q[1]||{}).subject,(q[1]||{}).body,(q[2]||{}).subject,(q[2]||{}).body,(l.log||[]).map(e=>e.d+' '+e.t).join(' | ')]}));
  saveFile('bilder-leads-'+UI.country.toLowerCase()+'-'+today()+'.csv',toCSV(rows))}

/* ---------- drawer ---------- */
function openLead(id,tab,out){UI.open=id;UI.dtab=tab||'sum';UI.out=out||null;renderDrawer();rememberUI()}
function closeLead(){UI.open=null;UI.out=null;renderDrawer();rememberUI()}
function journey(l){const s=l.sent||{},a=l.at||{},cur=na(l);const late=!!(a.replied||a.brief||a.mockup||l.stage==='won');
  const nodes=[['Email 1',s.e1,cur&&cur.k==='send'&&cur.step===0],['Follow-up',s.e2,cur&&cur.k==='send'&&cur.step===1],['Last note',s.e3,cur&&cur.k==='send'&&cur.step===2],['Balasan',a.replied,cur&&cur.k==='reply'],['Brief',a.brief,cur&&cur.k==='mockup'],['Mock-up',a.mockup,cur&&(cur.k==='nudge'||cur.k==='decide')],['Won',a.won,false]];
  return '<div class="journey">'+nodes.map((n,i)=>{let c=n[1]?'done':n[2]?'cur':(i<3&&late?'skip':'');if(i===6&&n[1])c='done won';return '<div class="jn '+c+'"><i></i>'+n[0]+'<small>'+(n[1]?fmtDs(n[1]):i<3&&late&&!n[1]?'dilewati':'')+'</small></div>'}).join('')+'</div>'}
function outForm(l){const k=UI.out;if(!k)return '';const o=OUT[k];let inp='';
  if(o.input==='value')inp='<label class="sub" for="out-v">Nilai project (USD)</label><input id="out-v" type="number" min="0" value="750" style="width:110px">';
  else if(o.input==='date')inp='<label class="sub" for="out-v">Hubungi lagi tanggal</label><input id="out-v" type="date" value="'+addD(today(),S.wakeDays)+'">';
  else if(o.input==='reason')inp='<label class="sub" for="out-v">Alasan</label><select id="out-v">'+LOST_REASONS.map(r=>'<option>'+r+'</option>').join('')+'</select>';
  else if(o.input==='email')inp='<label class="sub" for="out-v">'+(k==='bounce'?'Email pengganti (kosongkan kalau belum ada)':'Email bisnis')+'</label><input id="out-v" type="email" placeholder="nama@bisnis.com" style="min-width:220px">';
  return '<div class="outform">'+inp+'<button class="btn s p" data-act="out-save">Simpan</button><button class="btn s g" data-act="out-cancel">Batal</button></div>'}
function primaryBtn(l,a){if(!a)return '';
  if(a.k==='send'&&l.email)return '<button class="btn s l" data-act="queue" data-q="one:'+l.id+'">'+esc(a.t)+'</button>';
  if(a.k==='reply'||a.k==='wake'||a.k==='nudge')return '<button class="btn s l" data-dtab="reply">Lihat template balasan</button>';
  if(a.k==='mockup')return '<button class="btn s l" data-act="out" data-o="mock" data-id="'+l.id+'">Mock-up terkirim</button>';
  if(a.k==='close')return '<button class="btn s l" data-act="out" data-o="close" data-id="'+l.id+'">Tutup: lost</button>';
  if(a.k==='decide')return '<button class="btn s l" data-out="won">Won</button>';
  if(a.k==='research')return '<button class="btn s l" data-out="hasmail">Tambah email</button>';return ''}
function renderDrawer(){const dr=$('#drawer'),sc=$('#scrim');const l=UI.open!=null?byId(UI.open):null;
  if(!l){dr.hidden=true;sc.hidden=true;if(!UI.queue)document.body.classList.remove('lock');return}
  dr.hidden=false;sc.hidden=false;document.body.classList.add('lock');const a=na(l);const opts=OUT_BY[l.stage]||[];
  let h='<div class="dh"><div class="dh-top"><div style="min-width:0"><h2>'+esc(l.business)+'</h2><div class="meta"><span class="cc '+l.country+'">'+l.country+'</span>'+esc(l.city)+' · '+esc(l.niche)+(l.rating?' · '+l.rating+'★ ('+(l.reviews||0)+')':'')+(l.score?' · skor '+l.score+'/10':'')+' · '+tzPill(l)+'</div></div><button class="x" data-act="close" aria-label="Tutup">×</button></div>'
   +'<div class="nextbox '+(a&&a.due?dueCls(a.due):'')+'"><div><span class="lbl">'+pill(l.stage)+'</span><b>'+(a?esc(a.t):'Selesai'+(l.lostReason?' · '+esc(l.lostReason):l.wonValue?' · '+l.wonValue+' USD':''))+'</b>'+(a&&a.due?' <span class="due '+dueCls(a.due)+'">· '+esc(rel(a.due))+'</span>':'')+'</div>'+primaryBtn(l,a)+'</div>'
   +journey(l)
   +(opts.length?'<div class="outs"><span>Catat hasil:</span>'+opts.map(k=>OUT[k].input?'<button class="btn s'+(UI.out===k?' p':'')+'" data-out="'+k+'">'+OUT[k].l+'…</button>':'<button class="btn s" data-act="out" data-o="'+k+'" data-id="'+l.id+'">'+OUT[k].l+'</button>').join('')+'</div>':'')+outForm(l)
   +'<div class="dtabs">'+[['sum','Ringkasan'],['seq','Email sequence'],['reply','Balasan'],['log','Riwayat & catatan']].map(t=>'<button data-dtab="'+t[0]+'" class="'+(UI.dtab===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div></div><div class="db">';
  if(UI.dtab==='seq')h+=dSeq(l);else if(UI.dtab==='reply')h+=dReply(l);else if(UI.dtab==='log')h+=dLog(l);else h+=dSum(l);
  dr.innerHTML=h+'</div>';const f=$('#out-v');if(f&&UI.out)f.focus()}
function dSum(l){const F=[['Email',l.email?'<span class="mono">'+esc(l.email)+'</span> <button class="btn s" data-copyi="'+cp(l.email)+'">Salin</button>':'<span class="faint">Belum ada</span>'],['Tingkat keyakinan email',esc(l.emailConf||'—')],['Nama kontak',esc(l.contact||'—')],['Telepon',l.phone?esc(l.phone)+' <button class="btn s" data-copyi="'+cp(l.phone)+'">Salin</button>':'—'],['Sumber email',esc(l.emailSource||'—'),1],['Cek website',esc(l.websiteCheck||'—'),1],['Personal hook',esc(l.hook||'—'),1]];
  if(l.facts)F.push(['Fakta untuk email',esc(l.facts),1]);
  const links=[l.maps?'<a class="btn s" href="'+esc(l.maps)+'" target="_blank" rel="noopener">Google Maps ↗</a>':'',l.facebook?'<a class="btn s" href="'+esc(l.facebook)+'" target="_blank" rel="noopener">Facebook ↗</a>':''].join('');
  return '<div class="fields">'+F.map(f=>'<div class="fx'+(f[2]?' full':'')+'"><span>'+f[0]+'</span><p>'+f[1]+'</p></div>').join('')+'</div>'+(links?'<div class="bar-actions" style="margin-top:12px">'+links+'</div>':'')
   +'<div class="card pad form" style="margin-top:14px"><h3 class="h3">Edit kontak</h3><div class="f2"><div class="fld"><label for="ed-email">Email</label><input id="ed-email" type="email" value="'+esc(l.email||'')+'"></div><div class="fld"><label for="ed-contact">Nama kontak</label><input id="ed-contact" value="'+esc(l.contact||'')+'"></div><div class="fld"><label for="ed-phone">Telepon</label><input id="ed-phone" value="'+esc(l.phone||'')+'"></div></div>'
   +'<div class="f2"><div class="fld"><label for="ed-stage">Ubah status manual</label><select id="ed-stage">'+STAGES.map(s=>'<option value="'+s+'"'+(s===l.stage?' selected':'')+'>'+ST[s][0]+'</option>').join('')+'</select><small>Pakai "Catat hasil" di atas kalau bisa, supaya tanggalnya ikut tercatat.</small></div></div><div class="bar-actions"><button class="btn s p" data-act="save-contact">Simpan</button></div></div>'}
function dSeq(l){const seq=seqFor(l),s=l.sent||{},a=na(l);let h=seq[0]&&seq[0].generated?'<div class="note info" style="margin-bottom:12px">Lead ini belum punya email personal, jadi isinya dari template default. Tambahkan satu kalimat personal sebelum kirim.</div>':'';
  if(!S.zohoSig&&!S.postal&&l.country==='US')h+='<div class="note" style="margin-bottom:12px">Alamat pos belum diisi. Email ke US wajib mencantumkannya. Isi di <button class="link" data-view="settings">Template & aturan</button>.</div>';
  return h+seq.map((m,i)=>{const k='e'+(i+1),sent=s[k];const isNext=a&&a.k==='send'&&a.step===i;const hits=spamHits(m.subject+' '+m.body);
    const when=sent?'<span class="due" style="color:var(--teal)">Terkirim '+fmtD(sent)+'</span>':isNext&&a.due?'<span class="due '+dueCls(a.due)+'">'+esc(rel(a.due))+'</span>':isNext?'<span class="due">Berikutnya</span>':i===0?'':'<span class="due">Hari ke-'+(i===1?S.fu:S.ln)+' setelah Email 1</span>';
    return '<div class="mail"><div class="mail-h"><div><b>'+STEP[i]+'</b> '+when+'</div><span class="flag'+(hits.length?'':' ok')+'">'+(hits.length?'Cek kata: '+esc(hits.join(', ')):'Aman dari kata spam')+'</span></div>'
     +'<div class="mail-s"><span>'+esc(m.subject)+'</span><button class="btn s" data-copyi="'+cp(m.subject)+'">Salin subjek</button></div><div class="mail-b">'+esc(m.body)+'</div>'
     +'<div class="mail-f"><button class="btn s l" data-copyi="'+cp(m.body)+'">Salin email</button>'+(l.email?'<button class="btn s" data-copyi="'+cp(l.email)+'">Salin alamat</button>':'')
     +(sent?'<label class="sub" for="sd-'+k+'" style="margin-left:auto">Tanggal kirim</label><input type="date" id="sd-'+k+'" data-sentdate="'+k+'" value="'+sent+'" max="'+today()+'">'
       :(isNext&&l.email?'<span style="margin-left:auto;display:flex;gap:6px;align-items:center"><input type="date" id="sd-new-'+k+'" value="'+today()+'" max="'+today()+'" aria-label="Tanggal kirim"><button class="btn s p" data-act="mark-sent" data-step="'+i+'">Tandai terkirim</button></span>':''))+'</div></div>'}).join('')}
function dReply(l){const rp=S.tpl.replies||[];return '<p class="sub" style="margin-bottom:12px">Template untuk tahap setelah mereka membalas. Kirim sebagai balasan di thread yang sama. Ubah templatenya di Template & aturan.</p>'+rp.map(t=>{const subj=fill(t.subject,l),body=finish(fill(t.body,l),'reply');return '<div class="mail"><div class="mail-h"><b>'+esc(t.name)+'</b><span class="sub">'+esc(t.when||'')+'</span></div><div class="mail-s"><span>'+esc(subj)+'</span><button class="btn s" data-copyi="'+cp(subj)+'">Salin subjek</button></div><div class="mail-b">'+esc(body)+'</div><div class="mail-f"><button class="btn s l" data-copyi="'+cp(body)+'">Salin email</button></div></div>'}).join('')}
function dLog(l){return '<label class="sub" for="note-in">Catatan baru</label><textarea class="notein" id="note-in" placeholder="Misalnya: owner minta dihubungi setelah jam 4 sore"></textarea><div class="bar-actions" style="margin-top:8px"><button class="btn s p" data-act="add-note">Tambah catatan</button></div><div class="log">'+(l.log||[]).slice().reverse().map(e=>'<div class="ev"><i class="'+esc(e.k||'')+'"></i><div>'+esc(e.t)+'<small>'+esc(e.d)+(e.by?' · '+esc(e.by):'')+'</small></div></div>').join('')+'</div>'}
/* ---------- send mode ---------- */
function buildQueue(kind){const D=todayData();let items=[];
  if(kind==='fu')items=D.fus.map(x=>({id:x.l.id,step:x.a.step}));
  else if(kind==='new')items=D.fresh.map(l=>({id:l.id,step:0}));
  else if(kind==='all')items=D.fus.map(x=>({id:x.l.id,step:x.a.step})).concat(D.fresh.map(l=>({id:l.id,step:0})));
  else if(kind.indexOf('tz:')===0){const tz=kind.slice(3);items=D.fresh.filter(l=>tzOf(l)===tz).map(l=>({id:l.id,step:0}))}
  else if(kind.indexOf('one:')===0){const l=byId(kind.slice(4)),a=l&&na(l);if(a&&a.k==='send')items=[{id:l.id,step:a.step}]}
  return items}
function startQueue(kind){const items=buildQueue(kind);if(!items.length)return toast('Tidak ada email di antrean');UI.queue={items,i:0,sent:0,skipped:0};UI.open=null;render()}
function renderSend(){const box=$('#sendmode');const q=UI.queue;if(!q){box.hidden=true;box.innerHTML='';if(UI.open==null)document.body.classList.remove('lock');return}
  box.hidden=false;document.body.classList.add('lock');
  while(q.i<q.items.length){const it=q.items[q.i],l=byId(it.id),a=l&&na(l);if(l&&a&&a.k==='send'&&a.step===it.step&&l.email)break;q.i++}
  const n=q.items.length;
  const top='<div class="sm-top"><h3>Mode kirim</h3><span class="sub num">'+Math.min(q.i+1,n)+' dari '+n+'</span><div class="sm-prog"><i style="width:'+(q.i/n*100)+'%"></i></div><a class="btn s" href="https://mail.zoho.com/zm/" target="_blank" rel="noopener">Buka Zoho Mail ↗</a><button class="btn s g" data-act="q-exit">Selesai dulu</button></div>';
  if(q.i>=n){box.innerHTML=top+'<div class="sm-body"><div class="sm-done"><b class="num">'+q.sent+'</b><h2 class="h3" style="font-size:18px">email ditandai terkirim</h2><p class="muted">'+(q.skipped?q.skipped+' dilewati dan tetap ada di daftar. ':'')+'Hari ini total '+sentCount(today())+' dari '+S.limit+' email.</p><button class="btn p" data-act="q-exit">Kembali ke Hari ini</button></div></div>';return}
  const it=q.items[q.i],l=byId(it.id),m=seqFor(l)[it.step]||{subject:'',body:''};const hits=spamHits(m.subject+' '+m.body);const checked=DATA.meta.inboxChecked===today();const tz=tzOf(l),w=winState(tz);
  const warn=[];if(it.step>0&&!checked)warn.push('<div class="note">Pastikan '+esc(l.email)+' belum membalas di inbox Zoho sebelum kirim follow-up.</div>');
  if(it.step>0)warn.push('<div class="note info">Kirim sebagai balasan di thread Email 1 (folder Terkirim) supaya jadi satu percakapan.</div>');
  if(m.body.indexOf(POSTAL_PH)>-1)warn.push('<div class="note">Alamat pos belum diisi'+(l.country==='US'?' (wajib untuk US)':'')+'. Isi di Template & aturan, atau ganti manual sebelum kirim.</div>');
  if(m.generated)warn.push('<div class="note info">Email ini dari template default. Tambahkan satu kalimat personal.</div>');
  box.innerHTML=top+'<div class="sm-body"><div class="sm-grid"><div class="card pad sm-lead"><span class="sm-step">'+STEP[it.step]+'</span><h2>'+esc(l.business)+'</h2><div class="kv"><span>Lokasi</span><b>'+esc(l.city)+' · '+l.country+'</b><span>Di sana</span><b><span class="tz '+w+'"><i></i>'+localTime(tz)+' · '+WIN_LABEL[w]+'</span></b><span>Kontak</span><b>'+esc(l.contact||'—')+'</b><span>Niche</span><b>'+esc(l.niche)+'</b>'+(it.step>0&&l.sent&&l.sent.e1?'<span>Email 1</span><b>'+fmtD(l.sent.e1)+'</b>':'')+'</div>'+(l.hook?'<p class="sub" style="margin-top:12px">'+esc(l.hook)+'</p>':'')+'<div class="bar-actions" style="margin-top:12px"><button class="btn s g" data-open="'+l.id+'">Detail lead</button></div></div>'
   +'<div style="display:grid;gap:10px;min-width:0">'+warn.join('')+'<div class="card sm-mail"><div class="sm-field"><span>Kepada</span><div class="v mono">'+esc(l.email)+'</div><button class="btn s" data-copyi="'+cp(l.email)+'">Salin <span class="kbd">1</span></button></div><div class="sm-field"><span>Subjek</span><div class="v">'+esc(m.subject)+'</div><button class="btn s" data-copyi="'+cp(m.subject)+'">Salin <span class="kbd">2</span></button></div>'
   +'<div class="sm-field" style="border-bottom:0"><span>Isi</span><div class="v '+(hits.length?'flag':'flag ok')+'" style="font-weight:500">'+(hits.length?'Cek kata: '+esc(hits.join(', ')):'Aman dari kata spam')+'</div><button class="btn s l" data-copyi="'+cp(m.body)+'">Salin email <span class="kbd">3</span></button></div><div class="mail-b" style="border-top:1px solid var(--line-2)">'+esc(m.body)+'</div></div></div></div></div>'
   +'<div class="sm-foot"><button class="btn" data-act="q-replied">Ternyata sudah membalas</button><button class="btn" data-act="q-skip">Lewati</button><button class="btn p" data-act="q-sent">Terkirim, lanjut → <span class="kbd" style="background:none;color:inherit;border-color:rgba(255,255,255,.4)">Enter</span></button></div>'}
function qCurrent(){const q=UI.queue;return q&&q.i<q.items.length?{q,it:q.items[q.i],l:byId(q.items[q.i].id)}:null}

/* ---------- events ---------- */
function mount(){const app=$('#app');app.innerHTML=SHELL;
  app.addEventListener('click',onClick);
  app.addEventListener('input',onInput);
  app.addEventListener('change',onChange);
  document.addEventListener('keydown',onKey);
  app.addEventListener('dragstart',e=>{const k=e.target.closest&&e.target.closest('.kc');if(!k)return;e.dataTransfer.setData('text/plain',k.dataset.open);e.dataTransfer.effectAllowed='move';k.classList.add('dragging')});
  app.addEventListener('dragend',e=>{const k=e.target.closest&&e.target.closest('.kc');if(k)k.classList.remove('dragging');$$('.col.over').forEach(c=>c.classList.remove('over'))});
  app.addEventListener('dragover',e=>{const board=e.target.closest&&e.target.closest('.board');if(board){const r=board.getBoundingClientRect(),edge=80;if(e.clientX>r.right-edge)board.scrollLeft+=18;else if(e.clientX<r.left+edge)board.scrollLeft-=18}const col=e.target.closest&&e.target.closest('.col[data-col]');if(col){e.preventDefault();e.dataTransfer.dropEffect='move';$$('.col.over').forEach(c=>{if(c!==col)c.classList.remove('over')});col.classList.add('over');return}const d=e.target.closest&&e.target.closest('#drop');if(d){e.preventDefault();d.classList.add('over')}});
  app.addEventListener('dragleave',e=>{const d=e.target.closest&&e.target.closest('#drop');if(d)d.classList.remove('over')});
  app.addEventListener('drop',e=>{const col=e.target.closest&&e.target.closest('.col[data-col]');if(col){e.preventDefault();col.classList.remove('over');moveTo(byId(e.dataTransfer.getData('text/plain')),col.dataset.col);return}const d=e.target.closest&&e.target.closest('#drop');if(d){e.preventDefault();d.classList.remove('over');const f=e.dataTransfer.files[0];if(f)readFile(f)}})}
function onClick(e){const t=e.target.closest('button,[data-open],[data-view],[data-ltab],a,label');if(!t)return;const ds_=t.dataset;
  if(ds_.copyi){const v=CP.get(+ds_.copyi);if(v!=null)copyText(v,t);return}
  if(ds_.view&&!ds_.open){UI.navOpen=false;UI.view=ds_.view;if(ds_.ltab)UI.ltab=ds_.ltab;UI.queue=null;UI.open=null;render();window.scrollTo(0,0);return}
  if(ds_.ltab&&!ds_.open){UI.ltab=ds_.ltab;render();return}
  if(ds_.country){UI.country=ds_.country;render();return}
  if(ds_.dtab&&!ds_.open&&t.closest('#drawer')){UI.dtab=ds_.dtab;renderDrawer();return}
  if(ds_.out&&!ds_.act){if(ds_.open){openLead(ds_.open,'sum',ds_.out);return}UI.out=UI.out===ds_.out?null:ds_.out;renderDrawer();return}
  if(ds_.open&&!ds_.act){openLead(ds_.open,ds_.dtab||'sum',ds_.out||null);return}
  const act=ds_.act;if(!act)return;
  const l=ds_.id?byId(ds_.id):(UI.open!=null?byId(UI.open):null);
  switch(act){
    case 'close':closeLead();break;
    case 'undo':if(undoFn){const f=undoFn;undoFn=null;f();if(UI.queue&&UI.queue._back){Object.assign(UI.queue,UI.queue._back);UI.queue._back=null}render()}break;
    case 'retry':flushAll();poll();break;
    case 'dl-data':api('GET','/api/export.json').then(d=>dl('bilder-leads-backup-'+today()+'.json',JSON.stringify(d,null,1),'application/json')).catch(e=>toast(e.message));break;
    case 'theme':toggleTheme();break;
    case 'menu':UI.navOpen=!UI.navOpen;$('#side').classList.toggle('open',UI.navOpen);break;
    case 'logout':logout();break;
    case 'lview':UI.lview=ds_.v==='card'?'card':'list';render();break;
    case 'reload':location.reload();break;
    case 'out':if(l)applyOut(l,ds_.o);break;
    case 'out-save':if(l&&UI.out){const v=$('#out-v');applyOut(l,UI.out,v?v.value:'')}break;
    case 'out-cancel':UI.out=null;renderDrawer();break;
    case 'inbox-ok':DATA.meta.inboxChecked=today();saveMeta();render();toast('Inbox ditandai sudah dicek');break;
    case 'inbox-undo':DATA.meta.inboxChecked='';saveMeta();render();break;
    case 'close-all':{const D=todayData();D.closes.forEach(x=>change(x.l,OUT.close.f,OUT.close.log));render();toast(D.closes.length+' lead ditutup');break}
    case 'queue':startQueue(ds_.q);break;
    case 'q-exit':UI.queue=null;render();break;
    case 'q-skip':{const c=qCurrent();if(c){c.q._back=null;c.q.i++;c.q.skipped++;renderSend()}break}
    case 'q-sent':{const c=qCurrent();if(c){c.q._back={i:c.q.i,sent:c.q.sent};const u=markSent(c.l,c.it.step);c.q.i++;c.q.sent++;render();toast(STEP[c.it.step]+' ke '+c.l.business+' tercatat',u)}break}
    case 'q-replied':{const c=qCurrent();if(c){c.q._back={i:c.q.i,sent:c.q.sent};const u=change(c.l,OUT.replied.f,OUT.replied.log);c.q.i++;render();toast(c.l.business+' dipindah ke Membalas',u)}break}
    case 'mark-sent':if(l){const st=+ds_.step,inp=$('#sd-new-e'+(st+1));const u=markSent(l,st,inp&&inp.value||today());render();toast(STEP[st]+' tercatat terkirim',u)}break;
    case 'add-note':if(l){const v=$('#note-in').value.trim();if(!v)return toast('Tulis catatannya dulu');change(l,()=>{},'Catatan: '+v,'note');renderDrawer()}break;
    case 'save-contact':if(l){const em=$('#ed-email').value.trim(),ct=$('#ed-contact').value.trim(),ph=$('#ed-phone').value.trim(),st=$('#ed-stage').value;const ch=[];
      if(em!==(l.email||''))ch.push('email');if(ct!==(l.contact||''))ch.push('nama kontak');if(ph!==(l.phone||''))ch.push('telepon');if(st!==l.stage)ch.push('status → '+ST[st][0]);
      if(!ch.length)return toast('Tidak ada perubahan');
      const u=change(l,x=>{x.email=em;x.contact=ct;x.phone=ph;if(em&&!x.emailConf)x.emailConf='Medium';if(st!==x.stage){x.stage=st;if(st==='ready'&&!em)x.stage='need'}else if(x.stage==='need'&&em)x.stage='ready'},'Diubah: '+ch.join(', '));render();toast('Tersimpan',u)}break;
    case 'csv-template':saveFile('bilder-leads-template.csv',CSV_COLS.join(',')+'\n');break;
    case 'export':exportCSV();break;
    case 'do-import':doImport();break;
    case 'cancel-import':PENDING=null;$('#mapping').innerHTML='';break;
  }}
function onInput(e){const t=e.target;
  if(t.id==='q'){UI.q=t.value;if(UI.view!=='leads'&&UI.q){UI.view='leads';UI.ltab='all';render();const q=$('#q');q.focus();q.setSelectionRange(q.value.length,q.value.length)}else if(UI.view==='leads'){const pos=t.selectionStart;$('#view').innerHTML=vLeads();t.setSelectionRange(pos,pos)}return}
  if(t.id==='inbox-q'){UI.inboxQ=t.value;renderInbox();return}
  if(t.id==='tpl-subj'||t.id==='tpl-body'){const cur=tplGet(UI.tplSel||'seq:0');if(cur){cur.subject=$('#tpl-subj').value;cur.body=$('#tpl-body').value;saveSettings()}checkTpl();return}
  if(t.id==='set-zohoSig'){S.zohoSig=t.value==='1';saveSettings();render();return}
  if(t.dataset.set&&t.type!=='number'){S[t.dataset.set]=t.value;saveSettings();return}}
function onChange(e){const t=e.target;
  if(t.id==='f-niche'){UI.niche=t.value;render();return}
  if(t.id==='f-sort'){UI.sort=t.value;render();return}
  if(t.id==='tpl-sel'){UI.tplSel=t.value;render();return}
  if(t.dataset.set&&t.type==='number'){const v=Math.max(1,Math.round(+t.value||1));S[t.dataset.set]=v;saveSettings();toast('Aturan disimpan');return}
  if(t.dataset.sentdate){const l=byId(UI.open);if(l&&t.value){const k=t.dataset.sentdate;change(l,x=>{x.sent[k]=t.value},'Tanggal '+STEP[+k.slice(1)-1]+' diubah ke '+fmtDs(t.value),'note');render()}return}
  if(t.dataset.map!=null&&PENDING){PENDING.map[+t.dataset.map]=t.value;renderMapping();return}
  if(t.id==='file'&&t.files&&t.files[0]){readFile(t.files[0]);t.value=''}}
function onKey(e){if(e.key==='/'&&!/input|textarea|select/i.test(e.target.tagName||'')&&!UI.queue&&UI.open==null){e.preventDefault();$('#q').focus();return}
  if(e.key==='Escape'){if(UI.out){UI.out=null;renderDrawer();return}if(UI.open!=null){closeLead();return}}
  if(!UI.queue||UI.open!=null)return;const tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select')return;
  const c=qCurrent();if(!c)return;const m=seqFor(c.l)[c.it.step]||{};
  if(e.key==='1'){copyText(c.l.email,$('#sendmode [data-copyi]'))}
  else if(e.key==='2'){copyText(m.subject,$$('#sendmode [data-copyi]')[1])}
  else if(e.key==='3'){copyText(m.body,$$('#sendmode [data-copyi]')[2])}
  else if(e.key==='Enter'&&!(e.target.closest&&e.target.closest('button'))){e.preventDefault();$('#sendmode [data-act="q-sent"]').click()}}

/* ---------- boot ---------- */
async function start(){restoreUI();mount();$('#view').innerHTML='<div class="loading">'+ic('loader')+'Memuat data…</div>';$('#theme-btn').innerHTML=ic(curTheme()==='dark'?'sun':'moon');renderSave();
  try{const d=await api('GET','/api/bootstrap');ME=d.user;CURSOR=d.cursor||'';setData(d);if(cleanTemplates())saveSettings();render()}
  catch(e){$('#view').innerHTML='<div class="card empty"><b>Tidak bisa memuat data</b>'+esc(e.message)+'<div class="bar-actions" style="justify-content:center;margin-top:12px"><button class="btn" data-act="reload">Coba lagi</button></div></div>';return}
  setInterval(poll,20000);
  setInterval(()=>{if(UI.view==='today'&&UI.open==null&&!UI.queue&&!isTyping())render()},60000)}
start();
})();
