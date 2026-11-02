'use strict';
const STORE='better-daze-v6';
const $=id=>document.getElementById(id);
const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=()=>dateKey();
function monday(){const d=new Date();d.setDate(d.getDate()-(d.getDay()+6)%7);return dateKey(d)}
function dates(n=7){return Array.from({length:n},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(n-1-i));return dateKey(d)})}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults=['Wake up at 6:00','Morning push-ups','Get morning daylight','Plan the workday','Choose water over soda','Take a lunchtime walk','Eat a balanced meal','Phone away before bed'];
const fresh=()=>({version:6,schema:2,days:{},gym:{},reflections:{},notes:{},routines:defaults.map((text,i)=>({id:'habit-'+i,text})),sectionRoutines:{},settings:{theme:'auto',motion:false,musicAllowed:false,muted:true,bedtime:'22:00',waketime:'06:00',focusMinutes:50},lastSection:'today',timer:null,windEnd:null});
function object(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
function safeRead(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function notify(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(notify.timeout);notify.timeout=setTimeout(()=>$('toast').hidden=true,4000)}
// Validate before restore, and migrate the uploaded prototype and the original V3/V4 shape.
function normalize(input){
 if(!object(input)||!object(input.days))throw Error('This is not a Better Daze backup.');
 const out=fresh();
 if(input.schema===2){
  if(!Array.isArray(input.routines)||!input.routines.length||input.routines.length>100)throw Error('Invalid routines');
  out.routines=input.routines.map((r,i)=>{if(!object(r)||typeof r.id!=='string'||typeof r.text!=='string'||r.text.length>180)throw Error('Invalid routine');return {id:r.id,text:r.text}});
  if(new Set(out.routines.map(r=>r.id)).size!==out.routines.length)throw Error('Duplicate routine IDs');
  if(object(input.settings))Object.assign(out.settings,input.settings);
  out.lastSection=['today','sleep','move','work','nutrition','review'].includes(input.lastSection)?input.lastSection:'today';
  if(object(input.timer)&&['focus','break'].includes(input.timer.mode)&&Number.isFinite(input.timer.remaining)&&input.timer.remaining>=0&&input.timer.remaining<=10800){out.timer={mode:input.timer.mode,remaining:input.timer.remaining,running:!!input.timer.running,deadline:Number(input.timer.deadline)||0}}
  if(Number.isFinite(input.windEnd))out.windEnd=input.windEnd;
 }
 const prototype=input.schema!==2&&Object.values(input.days).some(d=>object(d)&&Array.isArray(d.Today));
 for(const [key,value] of Object.entries(input.days)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||!object(value))throw Error('Invalid day entry');
  let d={checks:{},water:0,push:0,priorities:[],sectionTasks:{},focusSessions:0};
  if(prototype){
   out.routines=out.routines.filter(r=>!r.id.startsWith('habit-'));
   for(const [name,tasks] of Object.entries(value)){
    if(!Array.isArray(tasks))throw Error('Invalid task list');
    d.sectionTasks[name.toLowerCase()]=tasks.map(t=>{if(!object(t)||typeof t.text!=='string')throw Error('Invalid task');return {text:t.text.slice(0,180),done:!!t.done}});
   }
   const ts=d.sectionTasks.today||[];ts.forEach((t,i)=>{const id='prototype-'+i;if(!out.routines.some(r=>r.id===id))out.routines.push({id,text:t.text});d.checks[id]=t.done});
  }else{
   if(value.checks!==undefined&&!object(value.checks))throw Error('Invalid checklist');
   for(const [k,v] of Object.entries(value.checks||{})){if(typeof v!=='boolean')throw Error('Invalid checklist value');d.checks[/^\d+$/.test(k)?'habit-'+k:k]=v}
   for(const name of ['water','push','focusSessions']){const n=value[name]??0;if(!Number.isInteger(n)||n<0||n>10000)throw Error('Invalid count');d[name]=n}
   if(value.priorities!==undefined&&!Array.isArray(value.priorities))throw Error('Invalid priorities');
   d.priorities=(value.priorities||[]).map(t=>{if(!object(t)||typeof t.text!=='string'||t.text.length>180)throw Error('Invalid priority');return {text:t.text,done:!!t.done}});
   if(value.sleepRating!==undefined){if(!Number.isInteger(value.sleepRating)||value.sleepRating<1||value.sleepRating>5)throw Error('Invalid sleep rating');d.sleepRating=value.sleepRating}
   if(value.sleep!==undefined){if(!object(value.sleep)||!validTime(value.sleep.bed)||!validTime(value.sleep.wake)||!Number.isFinite(value.sleep.hours)||value.sleep.hours<=0||value.sleep.hours>24)throw Error('Invalid sleep log');d.sleep={bed:value.sleep.bed,wake:value.sleep.wake,hours:value.sleep.hours}}
   if(object(value.sectionTasks))for(const [name,tasks] of Object.entries(value.sectionTasks)){if(!Array.isArray(tasks))throw Error('Invalid section tasks');d.sectionTasks[name]=tasks.map(t=>{if(!object(t)||typeof t.text!=='string')throw Error('Invalid task');return {text:t.text.slice(0,180),done:!!t.done}})}
  }
  out.days[key]=d;
 }
 if(!out.routines.length)out.routines=fresh().routines;
 if(object(input.gym))for(const [k,n] of Object.entries(input.gym)){if(!/^\d{4}-\d{2}-\d{2}$/.test(k)||!Number.isInteger(n)||n<0||n>1000)throw Error('Invalid gym count');out.gym[k]=n}
 if(object(input.reflections))for(const [k,v] of Object.entries(input.reflections)){if(typeof v!=='string')throw Error('Invalid reflection');out.reflections[k]=v}
 if(object(input.notes))for(const [k,values] of Object.entries(input.notes)){if(!object(values))throw Error('Invalid notes');out.notes[k]={};for(const [name,v] of Object.entries(values)){if(typeof v!=='string')throw Error('Invalid note');out.notes[k][name.toLowerCase()]=v}}
 if(prototype&&object(input.settings)){out.settings.motion=!!input.settings.motion;out.settings.muted=!!input.settings.muted;out.settings.musicAllowed=false;out.lastSection=String(input.lastSection||'today').toLowerCase()}
 if(!['auto','system','light','dark'].includes(out.settings.theme))out.settings.theme='system';
 for(const t of ['bedtime','waketime'])if(!validTime(out.settings[t]))out.settings[t]=fresh().settings[t];
 if(![15,25,45,50].includes(Number(out.settings.focusMinutes)))out.settings.focusMinutes=50;
 out.settings.focusMinutes=Number(out.settings.focusMinutes);
 out.settings.motion=!!out.settings.motion;out.settings.musicAllowed=!!out.settings.musicAllowed;out.settings.muted=!!out.settings.muted;
 return out;
}
function validTime(v){return typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v)}
let db=fresh();let startupMessage='';
let stored=null;
try{
 stored=JSON.parse(localStorage.getItem(STORE)||'null');
 if(stored){db=normalize(stored);if(stored.schema!==2)localStorage.setItem('better-daze-v6-before-upgrade',JSON.stringify(stored))}
 else {const legacy=safeRead('better-daze-v3');if(legacy){db=normalize(legacy);startupMessage='Your earlier Better Daze data has been copied into V6.'}}
}catch{startupMessage='Saved data could not be upgraded. It is preserved; export it from Settings before restoring a backup.'}
let storageBlocked=startupMessage.startsWith('Saved data');
function persist(){if(storageBlocked)return;try{localStorage.setItem(STORE,JSON.stringify(db))}catch{notify('Could not save on this browser. Please export a backup.')}}
function day(){return db.days[today()]??(db.days[today()]={checks:{},water:0,push:0,priorities:[],sectionTasks:{},focusSessions:0})}
function count(d){return Object.values(d?.checks||{}).filter(Boolean).length}
function streak(){let total=0;const keys=dates(366).reverse();if(!count(db.days[keys[0]]))keys.shift();for(const k of keys){if(!count(db.days[k]))break;total++}return total}
function celebrate(){notify('A little win. Keep your own pace.');if(reduced())return;const c=$('celebration');c.innerHTML=Array.from({length:16},(_,i)=>`<i style="--x:${(i-8)*24}px;--r:${i*43}deg;--delay:${i%4*.035}s"></i>`).join('');setTimeout(()=>c.innerHTML='',1600)}
function reduced(){return db.settings.motion||matchMedia('(prefers-reduced-motion: reduce)').matches}
function setMotion(v){db.settings.motion=v;document.body.classList.toggle('reduce-motion',v);persist()}
function chart(id,values,max,unit){
 $(id).innerHTML='<div class="data-chart" role="img" aria-label="'+esc(values.map(v=>`${v.date}: ${v.value===null?'not logged':v.value+' '+unit}`).join('; '))+'">'+values.map(v=>`<div class="data-col"><span class="chart-value">${v.value===null?'—':Math.round(v.value*10)/10}${v.value===null?'':unit}</span><div class="chart-track"><i style="height:${v.value===null?0:Math.min(100,v.value/max*100)}%"></i></div><small>${new Date(v.date+'T12:00:00').toLocaleDateString(undefined,{weekday:'narrow'})}</small></div>`).join('')+'</div>';
}
function render(){
 const d=day(),done=db.routines.filter(r=>d.checks[r.id]).length,percent=Math.round(done/db.routines.length*100);
 $('todayDate').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'});
 $('dailyCount').textContent=`${done} of ${db.routines.length} habits`;$('ringNumber').textContent=percent+'%';$('ring').style.setProperty('--progress',percent+'%');$('ring').setAttribute('role','img');$('ring').setAttribute('aria-label',`${percent}% of today's routines completed`);
 $('streak').textContent=`${streak()} day${streak()===1?'':'s'} of momentum`;
 $('dailyTasks').innerHTML=db.routines.map((r,i)=>`<label class="task ${d.checks[r.id]?'checked':''}"><input type="checkbox" ${d.checks[r.id]?'checked':''} onchange="toggleHabit(${i},this.checked)"><span class="copy"><strong>${esc(r.text)}</strong></span></label>`).join('');
 $('todayPush').textContent=`${d.push||0} / 20`;$('todayWater').textContent=d.water||0;$('nutritionWater').textContent=(d.water||0)+' glasses';
 const gym=db.gym[monday()]||0;$('todayGym').textContent=gym+' / 3';$('gymValue').textContent=gym+' / 3';$('gymProgress').style.width=Math.min(100,gym/3*100)+'%';
 const best=Math.max(0,...Object.values(db.days).map(x=>x.push||0));$('pushBest').textContent=best;$('pushProgress').style.width=Math.min(100,best/50*100)+'%';$('pushMilestone').textContent=best>=50?'50-rep milestone achieved!':'Next milestone: '+([20,25,30,40,50].find(n=>n>best)||50);if(document.activeElement!==$('pushInput'))$('pushInput').value=d.push||'';
 $('priorityList').innerHTML=(d.priorities||[]).map((p,i)=>`<div class="task ${p.done?'checked':''}"><input type="checkbox" aria-label="Complete ${esc(p.text)}" ${p.done?'checked':''} onchange="togglePriority(${i},this.checked)"><div class="copy"><strong>${esc(p.text)}</strong></div><button class="icon-btn" onclick="editPriority(${i})" aria-label="Edit ${esc(p.text)}">✎</button><button class="icon-btn" onclick="removePriority(${i})" aria-label="Remove ${esc(p.text)}">×</button></div>`).join('');
 const week=[];for(let i=0;i<7;i++){const dt=new Date(monday()+'T12:00:00');dt.setDate(dt.getDate()+i);const k=dateKey(dt);week.push({date:k,value:k>today()?null:db.days[k]?count(db.days[k]):null})}
 $('weeklyTotal').textContent=week.reduce((sum,v)=>sum+(v.value||0),0);chart('weekBars',week,Math.max(db.routines.length,...week.map(v=>v.value||0)),'');
 $('waterDrops').innerHTML=Array.from({length:8},(_,i)=>`<span class="drop ${i<(d.water||0)?'active':''}" aria-hidden="true">●</span>`).join('');
 if(document.activeElement!==$('reflection'))$('reflection').value=db.reflections[monday()]||'';
 $('sleepRating').innerHTML=[1,2,3,4,5].map(n=>`<button class="btn ${n===d.sleepRating?'gold':'light'}" aria-pressed="${n===d.sleepRating}" aria-label="Restedness ${n} out of 5" onclick="rateSleep(${n})">${n}</button>`).join('');
 $('sleepLogSummary').textContent=d.sleep?`${d.sleep.hours.toFixed(1)} hours logged · ${d.sleep.bed} → ${d.sleep.wake}`:'No sleep logged for this morning yet.';
 chart('pushChart',dates().map(k=>({date:k,value:db.days[k]?.push??null})),Math.max(50,best),'');
 chart('waterChart',dates().map(k=>({date:k,value:db.days[k]?.water??null})),Math.max(8,...dates().map(k=>db.days[k]?.water||0)),'');
 chart('focusChart',dates().map(k=>({date:k,value:db.days[k]?.focusSessions??null})),Math.max(4,...dates().map(k=>db.days[k]?.focusSessions||0)),'');
 chart('sleepChart',dates().map(k=>({date:k,value:db.days[k]?.sleep?.hours??null})),12,'h');
 if(document.activeElement!==$('bedtime'))$('bedtime').value=db.settings.bedtime;if(document.activeElement!==$('waketime'))$('waketime').value=db.settings.waketime;if(document.activeElement!==$('sleptAt'))$('sleptAt').value=d.sleep?.bed||db.settings.bedtime;if(document.activeElement!==$('wokeAt'))$('wokeAt').value=d.sleep?.wake||db.settings.waketime;
 const windowHours=sleepHours(db.settings.bedtime,db.settings.waketime);$('sleepWindowTitle').textContent=`${db.settings.bedtime} → ${db.settings.waketime}`;$('sleepWindow').textContent=windowHours.toFixed(1)+' hours available for rest';
 const sleepCard=document.querySelector('#today .grid .card.sage');sleepCard.querySelector('.value').textContent=windowHours.toFixed(1)+'h';sleepCard.querySelector('.meta').textContent=db.settings.bedtime+' – '+db.settings.waketime;
 $('windTimeline').innerHTML=[[-90,'Dim the lights'],[-60,'Finish scrolling'],[-30,'Phone away'],[-15,'Get comfortable'],[0,'Lights out']].map(([offset,label])=>`<div class="event"><b>${shiftTime(db.settings.bedtime,offset)}</b><span>${label}</span></div>`).join('')+`<div class="event"><b>${db.settings.waketime}</b><span>Wake and get daylight</span></div>`;
 $('settingsTheme').value=db.settings.theme;$('themeMode').value=db.settings.theme;$('reduceMotion').checked=db.settings.motion;$('musicPermission').checked=db.settings.musicAllowed;
 $('musicToggle').textContent=db.settings.muted?'♫ Music off':'♫ Music on';$('musicToggle').setAttribute('aria-pressed',String(!db.settings.muted));
 $('notes').value=(db.notes[today()]||{})[db.lastSection]||'';
 renderExtraTasks();renderTimer();applyTheme();persist();
}
function toggleHabit(i,v){day().checks[db.routines[i].id]=v;render();if(v)celebrate()}
function editRoutines(){const el=$('routineEditor');el.hidden=!el.hidden;if(!el.hidden)renderRoutineEditor()}
function renderRoutineEditor(){
 $('routineEditor').innerHTML='<p class="tiny">Changes apply to future days too. Completed history is kept.</p>'+db.routines.map((r,i)=>`<div class="row routine-row"><input class="field" aria-label="Routine ${i+1}" maxlength="180" value="${esc(r.text)}" onchange="renameRoutine(${i},this.value)"><button class="icon-btn" onclick="moveRoutine(${i},-1)" aria-label="Move routine up" ${i===0?'disabled':''}>↑</button><button class="icon-btn" onclick="moveRoutine(${i},1)" aria-label="Move routine down" ${i===db.routines.length-1?'disabled':''}>↓</button><button class="icon-btn" aria-label="Delete ${esc(r.text)}" onclick="deleteRoutine(${i})">×</button></div>`).join('')+'<form class="row" onsubmit="addRoutine(event)"><input class="field" id="newRoutine" placeholder="A small daily ritual" maxlength="180" required aria-label="New daily routine"><button class="btn">Add</button></form>';
}
function renameRoutine(i,v){v=v.trim();if(v){db.routines[i].text=v;render()}renderRoutineEditor()}
function moveRoutine(i,delta){const j=i+delta;if(j<0||j>=db.routines.length)return;[db.routines[i],db.routines[j]]=[db.routines[j],db.routines[i]];render();renderRoutineEditor()}
function deleteRoutine(i){if(db.routines.length===1){notify('Keep at least one daily ritual.');return}db.routines.splice(i,1);render();renderRoutineEditor()}
function addRoutine(e){e.preventDefault();const text=$('newRoutine').value.trim();if(!text)return;db.routines.push({id:'routine-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),text});render();renderRoutineEditor()}
function logPushups(){const n=Number($('pushInput').value);if(!Number.isInteger(n)||n<0||n>500){notify('Enter a whole number from 0 to 500.');return}day().push=n;if(db.routines.some(r=>r.id==='habit-1'))day().checks['habit-1']=n>0;render();if(n)celebrate()}
function gymAdd(){db.gym[monday()]=(db.gym[monday()]||0)+1;render();celebrate()}
function gymUndo(){db.gym[monday()]=Math.max(0,(db.gym[monday()]||0)-1);render()}
function waterAdd(){day().water=(day().water||0)+1;render()}
function waterUndo(){day().water=Math.max(0,(day().water||0)-1);render()}
function addPriority(){const text=$('priorityInput').value.trim();if(!text)return;if(day().priorities.length>=3){notify('Three priorities keep your day focused.');return}day().priorities.push({text,done:false});if(db.routines.some(r=>r.id==='habit-3'))day().checks['habit-3']=true;$('priorityInput').value='';render()}
function editPriority(i){const text=prompt('Edit your priority',day().priorities[i].text);if(text?.trim()){day().priorities[i].text=text.trim().slice(0,180);render()}}
function togglePriority(i,v){day().priorities[i].done=v;render();if(v)celebrate()}
function removePriority(i){day().priorities.splice(i,1);render()}
async function copyPriorities(){const text='Help me plan today’s work priorities:\n'+day().priorities.map((p,i)=>`${i+1}. ${p.text}`).join('\n');try{await navigator.clipboard.writeText(text);notify('Copied. Paste into ChatGPT.')}catch{prompt('Copy your priorities:',text)}}
function saveReflection(){db.reflections[monday()]=$('reflection').value;persist();notify('Reflection saved.')}
function saveNote(text){db.notes[today()]??={};db.notes[today()][db.lastSection]=text;persist()}
function renderExtraTasks(){document.querySelectorAll('.extra-tasks').forEach(el=>el.remove());for(const name of ['sleep','move','work','nutrition','review']){const tasks=day().sectionTasks?.[name];if(!tasks?.length)continue;const el=document.createElement('section');el.className='section extra-tasks';el.innerHTML='<h2>Your section rituals</h2>'+tasks.map((t,i)=>`<label class="task ${t.done?'checked':''}"><input type="checkbox" ${t.done?'checked':''} onchange="toggleExtra('${name}',${i},this.checked)"><span class="copy"><strong>${esc(t.text)}</strong></span></label>`).join('');$(name).append(el)}}
function toggleExtra(name,i,v){day().sectionTasks[name][i].done=v;render()}
function showPage(id){if(!['today','sleep','move','work','nutrition','review'].includes(id))return;if(id===db.lastSection){$('settings').hidden=true;window.scrollTo({top:0,behavior:reduced()?'instant':'smooth'});return}stopAllAudio();$('settings').hidden=true;db.lastSection=id;activatePage();render();window.scrollTo({top:0,behavior:reduced()?'instant':'smooth'});playIntro(id)}
function activatePage(){const id=db.lastSection;document.body.dataset.page=id;document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('.nav button').forEach((b,i)=>{const active=['today','sleep','move','work','nutrition','review'][i]===id;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});document.body.classList.toggle('reduce-motion',db.settings.motion)}
function openSettings(){$('settings').hidden=!$('settings').hidden;if(!$('settings').hidden)$('settings').scrollIntoView({behavior:reduced()?'instant':'smooth'})}
function sleepHours(bed,wake){let diff=timeMinutes(wake)-timeMinutes(bed);if(diff<=0)diff+=1440;return diff/60}
function timeMinutes(t){return Number(t.slice(0,2))*60+Number(t.slice(3))}
function shiftTime(t,offset){const n=(timeMinutes(t)+offset+1440)%1440;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function saveSleepPlan(e){e.preventDefault();const bed=$('bedtime').value,wake=$('waketime').value;if(!validTime(bed)||!validTime(wake)||bed===wake){notify('Choose different bedtime and wake-up times.');return}db.settings.bedtime=bed;db.settings.waketime=wake;render();notify('Your sleep rhythm is saved.')}
function logSleep(e){e.preventDefault();const bed=$('sleptAt').value,wake=$('wokeAt').value;if(!validTime(bed)||!validTime(wake)||bed===wake){notify('Choose different sleep and wake times.');return}day().sleep={bed,wake,hours:sleepHours(bed,wake)};render();notify('Sleep log saved for this morning.')}
function rateSleep(n){day().sleepRating=n;render()}
function startWindDown(){db.windEnd=Date.now()+Number($('windMinutes').value)*60000;persist();tick();notify('Wind-down started. Let the evening soften.')}
function cancelWindDown(){db.windEnd=null;persist();tick()}
function formatSeconds(s){s=Math.max(0,Math.ceil(s));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function getTimer(){return db.timer||(db.timer={mode:'focus',remaining:db.settings.focusMinutes*60,running:false,deadline:0})}
function renderTimer(){const t=getTimer();$('focusDuration').value=db.settings.focusMinutes;$('focusTime').textContent=(t.mode==='break'?'Break · ':'')+formatSeconds(t.running?(t.deadline-Date.now())/1000:t.remaining);$('focusToggle').textContent=t.running?'Pause':t.remaining===0?'Start focus':'Start / resume';$('focusSessions').textContent=`${day().focusSessions||0} focus sessions completed today`}
function toggleFocus(){const t=getTimer();if(t.running){t.remaining=Math.max(0,Math.ceil((t.deadline-Date.now())/1000));t.running=false}else{if(t.remaining<=0){t.mode='focus';t.remaining=db.settings.focusMinutes*60}t.deadline=Date.now()+t.remaining*1000;t.running=true}persist();renderTimer()}
function resetFocus(){db.timer={mode:'focus',remaining:db.settings.focusMinutes*60,running:false,deadline:0};persist();renderTimer()}
function setFocusDuration(n){db.settings.focusMinutes=Number(n);resetFocus()}
function startBreak(){db.timer={mode:'break',remaining:600,running:true,deadline:Date.now()+600000};persist();renderTimer()}
function tick(){
 if(db.timer?.running&&db.timer.deadline<=Date.now()){const mode=db.timer.mode;db.timer.running=false;db.timer.remaining=0;if(mode==='focus')day().focusSessions=(day().focusSessions||0)+1;persist();render();notify(mode==='focus'?'Focus complete. Take a gentle 10-minute break.':'Break complete. Ready when you are.');playChime()}
 renderTimer();
 if(db.windEnd){const remaining=(db.windEnd-Date.now())/1000;if(remaining<=0){db.windEnd=null;persist();$('windClock').textContent='Time to rest. Good night.';playChime();notify('Your wind-down is complete.')}else $('windClock').textContent=formatSeconds(remaining)+' until lights out'}else if(!$('windClock').textContent.includes('Good night'))$('windClock').textContent='';
 if(today()!==activeDate){activeDate=today();render()}
 updateSun();
}
let activeDate=today(),sunTimes=null;
function changeTheme(mode){db.settings.theme=mode;persist();$('themeMode').value=mode;$('settingsTheme').value=mode;applyTheme()}
function applyTheme(){const mode=db.settings.theme;let night=mode==='dark'||((mode==='system'||mode==='auto'&&(!sunTimes||sunTimes.date!==today()))&&matchMedia('(prefers-color-scheme: dark)').matches);if(mode==='auto'&&sunTimes&&sunTimes.date===today())night=Date.now()<sunTimes.rise||Date.now()>=sunTimes.set;document.body.classList.toggle('night',night);document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.body).getPropertyValue('--bg').trim()}
function timeText(ms){return new Date(ms).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function offsetDate(text,seconds){const sign=seconds>=0?'+':'-',n=Math.abs(seconds);return new Date(text+sign+String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')).getTime()}
const SUN_LOCATION='better-daze-daylight-location';
function daylightLocation(){try{const p=JSON.parse(localStorage.getItem(SUN_LOCATION));return p&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lon)&&Math.abs(p.lon)<=180?p:null}catch{return null}}
function calculateSun(){const p=daylightLocation();if(!p){sunTimes=null;return}const t=SunCalc.getTimes(new Date(),p.lat,p.lon);const rise=+t.sunrise,set=+t.sunset;sunTimes=t.sunrise&&t.sunset&&Number.isFinite(rise)&&Number.isFinite(set)?{date:today(),rise,set}:null;$('forgetSun').hidden=false;$('sunLocationBtn').textContent='Update approximate location';$('sunHint').textContent=sunTimes?'Automatic sunset mode is ready. Approximate location is stored only on this device; daylight times update daily.':'No sunrise or sunset at this location today. Auto appearance follows your device.'}
function updateSun(){if(!sunTimes||sunTimes.date!==today())calculateSun();if(!sunTimes){applyTheme();return}const now=Date.now(),up=now>=sunTimes.rise&&now<sunTimes.set;$('sunStatus').textContent=up?'☀ Daylight · a brighter space':'☾ After sunset · time to soften';$('sunrise').textContent=timeText(sunTimes.rise);$('sunset').textContent=timeText(sunTimes.set);const next=now<sunTimes.rise?sunTimes.rise:now<sunTimes.set?sunTimes.set:null;$('sunRemaining').textContent=next?(up?'Sunset in ':'Sunrise in ')+formatSeconds((next-now)/1000):'A quieter palette until sunrise.';applyTheme()}
function requestSun(){if(!navigator.geolocation){notify('Location unavailable. Choose Follow iPhone instead.');return}const btn=$('sunLocationBtn');btn.disabled=true;$('sunHint').textContent='Requesting approximate location…';navigator.geolocation.getCurrentPosition(p=>{try{localStorage.setItem(SUN_LOCATION,JSON.stringify({lat:+p.coords.latitude.toFixed(2),lon:+p.coords.longitude.toFixed(2)}));calculateSun();changeTheme('auto');updateSun()}catch{$('sunHint').textContent='Location could not be saved. Choose Follow iPhone instead.'}finally{btn.disabled=false}},()=>{btn.disabled=false;$('sunHint').textContent='Location unavailable. Choose Follow iPhone, or try again.'},{enableHighAccuracy:false,timeout:12000,maximumAge:600000})}
function forgetSunLocation(){localStorage.removeItem(SUN_LOCATION);sunTimes=null;$('forgetSun').hidden=true;$('sunrise').textContent=$('sunset').textContent='—';$('sunRemaining').textContent='';$('sunStatus').textContent='☀ Sunrise and sunset';$('sunLocationBtn').textContent='Enable automatic sunset mode';$('sunHint').textContent='Location forgotten. Auto appearance follows your device until you enable sunset mode again.';applyTheme()}
function exportBackup(){const bundle=storageBlocked?(localStorage.getItem(STORE)||'null'):JSON.stringify(db,null,2),url=URL.createObjectURL(new Blob([bundle],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`better-daze-v6-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function restoreBackup(input){const f=input.files[0];if(!f)return;try{if(f.size>5*1024*1024)throw Error('Backup is too large.');const candidate=normalize(JSON.parse(await f.text()));if(!confirm('Replace your V6 data with this backup? A local safety copy of your current data will be kept.'))return;localStorage.setItem('better-daze-v6-before-restore',JSON.stringify(safeRead(STORE)||db));localStorage.setItem(STORE,JSON.stringify(candidate));stopMusic();db=candidate;storageBlocked=false;activatePage();render();notify('Backup restored.')}catch(e){notify(e.message||'Backup could not be restored. Current data is unchanged.')}finally{input.value=''}}
function importLegacy(){try{const old=safeRead('better-daze-v3');if(!old)throw Error('No older local data found.');const imported=normalize(old);let n=0;for(const [k,v] of Object.entries(imported.days)){if(!db.days[k]){db.days[k]=v;n++}}for(const [k,v] of Object.entries(imported.gym))if(db.gym[k]===undefined)db.gym[k]=v;for(const [k,v] of Object.entries(imported.reflections))if(db.reflections[k]===undefined)db.reflections[k]=v;render();notify(`${n} older days copied. Existing V6 dates were preserved.`)}catch(e){notify(e.message)}}

const tracks={"today": {"title": "Vivaldi · Spring", "artist": "The Modena Chamber Orchestra", "license": "Public Domain Mark 1.0", "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/", "source": "https://commons.wikimedia.org/wiki/File:The_Modena_Chamber_Orchestra_-_Vivaldi%27s_Spring%2C_RV_269_-_I._Allegro.ogg", "url": "./audio/today.mp3", "seconds": 15, "originalUrl": "https://upload.wikimedia.org/wikipedia/commons/transcoded/1/18/The_Modena_Chamber_Orchestra_-_Vivaldi%27s_Spring%2C_RV_269_-_I._Allegro.ogg/The_Modena_Chamber_Orchestra_-_Vivaldi%27s_Spring%2C_RV_269_-_I._Allegro.ogg.mp3"}, "sleep": {"title": "Chopin · Nocturne Op. 9 No. 2", "artist": "Martha Goldstein", "license": "CC BY-SA 2.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/", "source": "https://commons.wikimedia.org/wiki/File:Frederic_Chopin_-_Nocturne_Eb_major_Opus_9,_number_2.ogg", "url": "./audio/sleep-v2.mp3", "seconds": 18, "originalUrl": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Frederic_Chopin_-_Nocturne_Eb_major_Opus_9%2C_number_2.ogg"}, "move": {"title": "Beethoven · Symphony No. 7, Allegretto", "artist": "John Michel", "license": "CC BY-SA 3.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/", "source": "https://commons.wikimedia.org/wiki/File:JOHN_MICHEL_CELLO-BEETHOVEN_SYMPHONY_7_Allegretto.ogg", "url": "./audio/move.mp3", "seconds": 13, "originalUrl": "https://upload.wikimedia.org/wikipedia/commons/transcoded/0/0c/JOHN_MICHEL_CELLO-BEETHOVEN_SYMPHONY_7_Allegretto.ogg/JOHN_MICHEL_CELLO-BEETHOVEN_SYMPHONY_7_Allegretto.ogg.mp3"}, "work": {"title": "Debussy · Clair de lune", "artist": "Laurens Goedhart", "license": "CC BY 3.0", "licenseUrl": "https://creativecommons.org/licenses/by/3.0/", "source": "https://commons.wikimedia.org/wiki/File:Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg", "url": "./audio/work.mp3", "seconds": 15, "originalUrl": "https://upload.wikimedia.org/wikipedia/commons/transcoded/b/be/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg.mp3"}, "review": {"title": "Satie · Gymnopédie No. 1", "artist": "Kevin MacLeod", "license": "CC BY 3.0", "licenseUrl": "https://creativecommons.org/licenses/by/3.0/", "source": "https://commons.wikimedia.org/wiki/File:Kevin_MacLeod_-_Erik_Satie_Gymnopedie_No_1.ogg", "url": "./audio/review.mp3", "seconds": 15, "originalUrl": "https://upload.wikimedia.org/wikipedia/commons/transcoded/6/68/Kevin_MacLeod_-_Erik_Satie_Gymnopedie_No_1.ogg/Kevin_MacLeod_-_Erik_Satie_Gymnopedie_No_1.ogg.mp3"}, "startup": {"title": "Morning skylark · nature sounds", "artist": "Lawrence Shove / © The British Library Board", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/", "source": "https://commons.wikimedia.org/wiki/File:Eurasian_Skylark_(Alauda_arvensis)_(W1CDR0001421_BD2).ogg", "url": "./audio/morning-skylark.mp3", "seconds": 12, "originalUrl": "https://upload.wikimedia.org/wikipedia/commons/9/96/Eurasian_Skylark_%28Alauda_arvensis%29_%28W1CDR0001421_BD2%29.ogg"}, "nutrition": {"title": "Bach · Prelude in C major, BWV 846", "artist": "Kimiko Ishizaka", "license": "CC0 1.0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "source": "https://commons.wikimedia.org/wiki/File:Kimiko_Ishizaka_-_Bach_-_Well-Tempered_Clavier,_Book_1_-_01_Prelude_No._1_in_C_major,_BWV_846.ogg", "url": "./audio/food.mp3", "seconds": 15, "originalUrl": "https://upload.wikimedia.org/wikipedia/commons/b/b6/Kimiko_Ishizaka_-_Bach_-_Well-Tempered_Clavier%2C_Book_1_-_01_Prelude_No._1_in_C_major%2C_BWV_846.ogg"}};
// Compact, same-origin excerpts: preload only after consent, retain decoded buffers.
let audioContext=null,musicSource=null,musicGain=null,musicToken=0,musicWatch=null,played=new Set(),chimeNodes=[];
const audioBuffers=new Map(),audioRequests=new Map();
function prepareAudioSession(){try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch{}}
function getAudioContext(){if(!audioContext||audioContext.state==='closed')audioContext=new(window.AudioContext||window.webkitAudioContext)();return audioContext}
function stopMusic(){musicToken++;clearTimeout(musicWatch);if(musicSource){try{musicSource.stop()}catch{}musicSource.disconnect();musicSource=null}if(musicGain){musicGain.disconnect();musicGain=null}$('musicStatus').classList.remove('music-playing');$('musicStatus').textContent=''}
function stopAllAudio(){stopMusic();chimeNodes.forEach(n=>{try{n.stop()}catch{}});chimeNodes=[]}
function loadExcerpt(section){
 if(audioBuffers.has(section))return Promise.resolve(audioBuffers.get(section));
 if(audioRequests.has(section))return audioRequests.get(section);
 const ctx=getAudioContext(),track=tracks[section];
 const request=fetch(track.url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer()}).then(bytes=>ctx.decodeAudioData(bytes)).then(buffer=>{audioBuffers.set(section,buffer);audioRequests.delete(section);return buffer}).catch(error=>{audioRequests.delete(section);throw error});
 audioRequests.set(section,request);return request;
}
function warmAudio(){if(!db.settings.musicAllowed)return;for(const name of Object.keys(tracks))loadExcerpt(name).catch(()=>{})}
function introTiming(track){return {fadeAt:track.seconds-3,endAt:track.seconds}}
async function playIntro(section){
 const track=tracks[section];if(!track||!db.settings.musicAllowed||db.settings.muted)return;
 stopMusic();const token=musicToken;
 try{
  prepareAudioSession();const ctx=getAudioContext();await ctx.resume();if(token!==musicToken)return;if(ctx.state!=='running'){$('musicStatus').textContent='Sound is paused by the browser. Tap Music off, then on, to enable it.';return;}
  if(!audioBuffers.has(section))$('musicStatus').textContent='Preparing '+track.title+'…';
  const buffer=await loadExcerpt(section);
  if(token!==musicToken||db.settings.muted||!db.settings.musicAllowed)return;
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.connect(gain).connect(ctx.destination);musicSource=source;musicGain=gain;
  const now=ctx.currentTime,timing=introTiming(track);gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(.7,now+.12);gain.gain.setValueAtTime(.7,now+timing.fadeAt);gain.gain.linearRampToValueAtTime(0,now+timing.endAt);
  source.start(now);source.stop(now+timing.endAt);played.add(section);
  $('musicStatus').textContent=track.title+' · '+track.seconds+'s';$('musicStatus').classList.add('music-playing');
  source.onended=()=>{if(token===musicToken)stopMusic()};
  warmAudio();
 }catch{if(token===musicToken){stopMusic();$('musicStatus').textContent='Audio is not ready yet. Tap Music or Replay to try again.'}}
}
function toggleMusic(){if(!db.settings.musicAllowed){db.settings.musicAllowed=true;db.settings.muted=false}else db.settings.muted=!db.settings.muted;if(db.settings.muted)stopAllAudio();persist();render();if(!db.settings.muted){playIntro(db.lastSection);warmAudio()}}
function setMusicPermission(v){db.settings.musicAllowed=v;db.settings.muted=!v;if(!v)stopAllAudio();persist();render();if(v){playIntro(db.lastSection);warmAudio()}}
function replayIntro(){if(!tracks[db.lastSection]){notify('No introduction is available for this section.');return}db.settings.musicAllowed=true;db.settings.muted=false;played.delete(db.lastSection);persist();render();playIntro(db.lastSection);warmAudio()}
async function playChime(){if(db.settings.muted||!db.settings.musicAllowed){$('chimeStatus').textContent='Music is muted. Enable it with the master switch to hear the chime.';return}try{stopAllAudio();prepareAudioSession();const ctx=getAudioContext();await ctx.resume();[523.25,659.25,783.99].forEach((freq,i)=>{const osc=ctx.createOscillator(),g=ctx.createGain(),time=ctx.currentTime+i*.25;osc.frequency.value=freq;g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(.08,time+.03);g.gain.exponentialRampToValueAtTime(.0001,time+1);osc.connect(g).connect(ctx.destination);osc.start(time);osc.stop(time+1.05);chimeNodes.push(osc);osc.onended=()=>{g.disconnect();chimeNodes=chimeNodes.filter(x=>x!==osc)}});$('chimeStatus').textContent='Wind-down chime playing.'}catch{$('chimeStatus').textContent='Audio unavailable. Try again after tapping Music on.'}}
$('musicCredits').innerHTML=Object.values(tracks).map(t=>`<p><a href="${esc(t.source)}" target="_blank" rel="noopener">${esc(t.title)}</a> · ${esc(t.artist)} · <a href="${t.licenseUrl}" target="_blank" rel="noopener">${t.license}</a>. Opening excerpt trimmed, silence removed, loudness adjusted and converted to mono MP3; three-second playback fade. This excerpt retains the recording’s licence.</p>`).join('')+'<p>Small excerpts are served with the app and cached for offline use after a successful visit. Playback is enabled only after you allow music. All six sections have a musical introduction.</p>';
$('legacyImport').innerHTML=safeRead('better-daze-v3')?'<p><button class="btn light" onclick="importLegacy()">Copy missing days from earlier local data</button></p>':'';
$('reflection').addEventListener('input',()=>{db.reflections[monday()]=$('reflection').value;persist()});
$('priorityInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addPriority()}});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAllAudio();else tick()});
activatePage();render();tick();setInterval(tick,1000);if(db.settings.musicAllowed)warmAudio();
if(startupMessage)setTimeout(()=>notify(startupMessage),100);
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});

// A twelve-second opening; explicit sound entry hands off to the visible section.
let launchTimer=null,launchExitTimer=null,launchContinueWithMusic=false;
function dismissLaunch(){const panel=$('launchScreen');if(panel.hidden)return;clearTimeout(launchTimer);document.querySelector('main').inert=false;document.querySelector('.nav').inert=false;const returnFocus=panel.contains(document.activeElement);panel.classList.add('launch-leaving');if(reduced()){panel.hidden=true;panel.classList.remove('launch-leaving')}else launchExitTimer=setTimeout(()=>{panel.hidden=true;panel.classList.remove('launch-leaving')},220);if(returnFocus)$('openingReplay').focus({preventScroll:true});const continueMusic=launchContinueWithMusic;launchContinueWithMusic=false;if(continueMusic&&db.settings.musicAllowed&&!db.settings.muted)playIntro(db.lastSection)}
function enterWithOpening(){launchContinueWithMusic=true;clearTimeout(launchTimer);launchTimer=setTimeout(dismissLaunch,12000);db.settings.musicAllowed=true;db.settings.muted=false;played.delete('startup');persist();render();playIntro('startup');warmAudio()}
function continueQuietly(){launchContinueWithMusic=false;stopAllAudio();dismissLaunch();db.settings.muted=true;persist();render()}
function showLaunch(){launchContinueWithMusic=false;const panel=$('launchScreen');clearTimeout(launchTimer);clearTimeout(launchExitTimer);panel.classList.remove('launch-leaving');panel.hidden=false;document.querySelector('main').inert=true;document.querySelector('.nav').inert=true;$('launchMusic').focus({preventScroll:true});launchTimer=setTimeout(dismissLaunch,12000)}
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('launchScreen').hidden)continueQuietly()});
updateSun();
showLaunch();
