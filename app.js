(async function () {
  'use strict';
  const $=id=>document.getElementById(id), L=PermitLogic, KEY='digital-permit-v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const employees=await HR.listEmployees(); let actor=(await HR.getCurrentUser()).id, records=[], p, dirty=false, searchVersion=0;
  const stamp=s=>new Date(s).toLocaleString('ru-RU');
  function message(text,error=false){$('notice').textContent=text;$('notice').className=error?'error':'';}
  try { const saved=JSON.parse(localStorage.getItem(KEY)||'[]'); if(!Array.isArray(saved)) throw Error(); records=saved; } catch { message('Не удалось прочитать сохранённые данные. Новые наряды можно создавать; проверьте доступ к хранилищу браузера.',true); }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(records));return true;}catch{message('Не удалось сохранить данные. Разрешите локальное хранилище браузера. Не закрывайте страницу.',true);return false;}}
  function saveRecord(){const i=records.findIndex(x=>x.id===p.id);if(i<0)records.push(structuredClone(p));else records[i]=structuredClone(p);const ok=persist();if(ok)dirty=false;return ok;}
  function fresh(){ const now=new Date(); return {id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),number:String(Math.max(0,...records.map(x=>Number(x.number)||0))+1).padStart(6,'0'),created:now.toISOString(),initiatorId:'e1',employeeIds:[],managerId:'m1',type:'',other:'',object:'',address:'',description:'',start:'',end:'',status:'Черновик',step:0,route:L.route('e1',HR),signatures:[],history:[{at:now.toISOString(),actor:'e1',text:'Черновик создан'}]}; }
  $('actor').innerHTML=employees.map(e=>`<option value="${e.id}">${esc(e.name)} · ${esc(e.position)}</option>`).join('');
  $('managerId').innerHTML=employees.filter(e=>['m1','m2','s1','f1'].includes(e.id)).map(e=>`<option value="${e.id}">${esc(e.name)} · ${esc(e.position)}</option>`).join('');
  $('type').innerHTML='<option value="">Выберите вид работ</option>'+L.types.map(t=>`<option>${esc(t)}</option>`).join('');
  function dateView(){const n=L.days(p.start,p.end);$('end').min=p.start||'';$('days').textContent=n===null?'Выберите период: окончание не раньше начала':`${n} рабочих дней из 5 допустимых`;$('days').className='day-count'+(n!==null&&(n<1||n>5)?' invalid':'');}
  function selected(){ $('selected').innerHTML=p.employeeIds.map(id=>{const e=HR.get(id);return `<span class="chip">${esc(e?.name||id)} · ${esc(e?.number)}<button type="button" data-remove="${esc(id)}" aria-label="Удалить ${esc(e?.name)}">×</button></span>`;}).join(''); }
  function render(){
    const canEdit=L.editable(p,actor), active=['На согласовании','На подписи'].includes(p.status), canApprove=active&&p.route[p.step]===actor;
    $('actor').value=actor;$('number').textContent='Наряд № '+p.number;$('created').textContent='от '+new Date(p.created).toLocaleDateString('ru-RU');$('status').textContent=p.status;$('status').className='badge'+(['Подписан','Завершён'].includes(p.status)?' signed':'');
    $('documents').innerHTML=records.map(r=>`<option value="${esc(r.id)}">№ ${esc(r.number)} · ${esc(r.status)}</option>`).join('')+(records.some(r=>r.id===p.id)?'':`<option value="${esc(p.id)}">№ ${esc(p.number)} · Новый</option>`);$('documents').value=p.id;
    const e=HR.get(p.initiatorId);$('initiator').innerHTML=[['ФИО',e.name],['Табельный номер',e.number],['Должность',e.position],['Подразделение',e.department],['Непосредственный руководитель',HR.get(e.managerId)?.name]].map(([k,v])=>`<div><small>${k}</small><strong>${esc(v)}</strong></div>`).join('');
    document.querySelectorAll('[data-field]').forEach(el=>el.value=p[el.dataset.field]);$('fields').disabled=!canEdit;$('other-wrap').hidden=p.type!=='Другие работы';$('results').innerHTML='';$('search').value='';selected();dateView();
    $('save').hidden=!canEdit;$('save').textContent=p.status==='Отклонён'?'Сохранить изменения':'Сохранить черновик';$('submit').hidden=!canEdit;$('approval').hidden=!canApprove;$('complete').hidden=!(p.status==='Подписан'&&actor===p.initiatorId);
    const labels=['Инициатор','Начальник подразделения','Руководитель структурного подразделения','Финальное подписание'];
    $('route').innerHTML=[p.initiatorId,...p.route].map((id,i)=>`<li data-n="${i+1}" class="${i===0||i<=p.signatures.length?'done':active&&i===p.step+1?'current':''}"><strong>${labels[i]}</strong><small>${esc(HR.get(id)?.name||'Не назначен')}</small>${active&&i===p.step+1?'<small>Ожидает решения</small>':''}</li>`).join('');
    $('access').textContent=active?`Сейчас решение принимает ${HR.get(p.route[p.step])?.name}. Выберите этого пользователя вверху страницы.`:['Подписан','Завершён'].includes(p.status)?'Документ подписан. Редактирование заблокировано.':canEdit?'Заполните обязательные поля и отправьте наряд.':'Редактирование доступно инициатору: '+e.name+'.';
    $('signatures').innerHTML=p.signatures.length?p.signatures.map(s=>`<div class="signature">✓ ${esc(HR.get(s.actor)?.name)}<small>${stamp(s.at)}<br>${esc(s.code)}</small></div>`).join(''):'<p class="hint">Подписи появятся после согласования.</p>';
    $('history').innerHTML=[...p.history].reverse().map(h=>`<li>${esc(h.text)}<small>${esc(HR.get(h.actor)?.name)} · ${stamp(h.at)}</small></li>`).join('');
  }
  document.querySelectorAll('[data-field]').forEach(el=>el.addEventListener('input',()=>{if(!L.editable(p,actor))return;p[el.dataset.field]=el.value;dirty=true;$('other-wrap').hidden=p.type!=='Другие работы';dateView();}));
  async function search(){const version=++searchVersion;if(!L.editable(p,actor))return;const found=(await HR.searchEmployees($('search').value)).filter(e=>!p.employeeIds.includes(e.id));if(version!==searchVersion)return;$('results').innerHTML=found.length?found.map(e=>`<button type="button" data-add="${e.id}">${esc(e.name)} · ${e.number}<small>${esc(e.position)} / ${esc(e.department)}</small></button>`).join(''):'<p>Сотрудники не найдены или уже добавлены.</p>';}
  $('search').addEventListener('input',search);$('search').addEventListener('focus',search);$('search').addEventListener('keydown',e=>{if(e.key==='Escape'){$('results').innerHTML='';searchVersion++;}if(e.key==='ArrowDown'){e.preventDefault();$('results').querySelector('button')?.focus();}});
  $('results').addEventListener('click',e=>{const id=e.target.closest('[data-add]')?.dataset.add;if(id&&L.editable(p,actor)&&!p.employeeIds.includes(id)){p.employeeIds.push(id);dirty=true;selected();$('search').value='';$('results').innerHTML='';searchVersion++;}});
  $('selected').addEventListener('click',e=>{const id=e.target.closest('[data-remove]')?.dataset.remove;if(id&&L.editable(p,actor)){p.employeeIds=p.employeeIds.filter(x=>x!==id);dirty=true;selected();}});
  document.addEventListener('click',e=>{if(!e.target.closest('#results')&&e.target.id!=='search'){$('results').innerHTML='';searchVersion++;}});
  $('form').addEventListener('submit',e=>e.preventDefault());
  $('save').onclick=()=>{if(!L.editable(p,actor))return;p.history.push({at:new Date().toISOString(),actor,text:'Изменения сохранены'});const ok=saveRecord();render();if(ok)message('Изменения сохранены в этом браузере.');};
  for(const [id,action] of [['submit','submit'],['approve','approve'],['reject','reject'],['complete','complete']]) $(id).onclick=()=>{try{p=L.act(p,action,actor,HR,$('comment').value);const ok=saveRecord();$('comment').value='';render();if(ok)message('Готово. Статус: '+p.status+'.');}catch(err){message(err.message,true);$('notice').scrollIntoView({behavior:'smooth',block:'center'});}};
  $('actor').onchange=()=>{actor=$('actor').value;searchVersion++;$('comment').value='';render();message('Тестовый пользователь изменён.');};
  $('documents').onchange=()=>{const id=$('documents').value;if(dirty&&!confirm('Несохранённые изменения будут потеряны. Открыть другой наряд?')){$('documents').value=p.id;return;}p=structuredClone(records.find(r=>r.id===id));dirty=false;render();message('Наряд открыт.');};
  $('new').onclick=()=>{if(dirty&&!confirm('Несохранённые изменения будут потеряны. Создать новый наряд?'))return;p=fresh();actor=p.initiatorId;dirty=true;render();message('Новый наряд создан от имени Адая Сейсенова.');};
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  p=records.length?structuredClone(records[records.length-1]):fresh();render();
})();
