(function (root) {
  const types = ['Техническое обслуживание','Ремонт оборудования','Электромонтажные работы','Огневые работы','Работы на высоте','Другие работы'];
  function date(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null; const d = new Date(s+'T00:00:00Z'); return Number.isFinite(+d) && d.toISOString().slice(0,10) === s ? d : null; }
  function days(start,end) {
    const a = date(start), b = date(end); if (!a || !b || b < a) return null;
    const n = Math.round((b-a)/86400000)+1; let count = Math.floor(n/7)*5;
    for (let i=0;i<n%7;i++) { const day=(a.getUTCDay()+i)%7; if(day!==0 && day!==6) count++; }
    return count;
  }
  function route(initiatorId,hr) { const ids=[]; let e=hr.get(initiatorId); for(let i=0;i<3;i++) { e=hr.get(e?.managerId); if(!e || ids.includes(e.id)) return []; ids.push(e.id); } return ids; }
  function validate(p,hr) {
    const errors=[];
    if(!p.employeeIds.length) errors.push('Добавьте хотя бы одного исполнителя.');
    if(new Set(p.employeeIds).size!==p.employeeIds.length || p.employeeIds.some(id=>!hr.get(id))) errors.push('Проверьте состав исполнителей.');
    if(!types.includes(p.type)) errors.push('Выберите вид работ.');
    if(p.type==='Другие работы' && !p.other.trim()) errors.push('Уточните вид других работ.');
    for(const [key,label] of [['object','Объект'],['address','Адрес'],['description','Описание работ']]) if(!p[key].trim()) errors.push('Заполните поле «'+label+'».');
    const n=days(p.start,p.end);
    if(n===null) errors.push('Укажите корректные даты: окончание не раньше начала.');
    else if(n<1 || n>5) errors.push('Продолжительность должна составлять от 1 до 5 рабочих дней.');
    if(!hr.get(p.managerId)?.position.includes('Начальник') && !['s1','f1'].includes(p.managerId)) errors.push('Выберите ответственного руководителя.');
    if(route(p.initiatorId,hr).length!==3) errors.push('В HR не настроен полный маршрут согласования.');
    return errors;
  }
  function editable(p,actor) { return p.initiatorId===actor && ['Черновик','Отклонён'].includes(p.status); }
  function act(p,action,actor,hr,comment='') {
    const next=structuredClone(p), now=new Date().toISOString(); let event;
    if(action==='submit') {
      if(!editable(p,actor)) throw Error('Отправить наряд может только инициатор из черновика или после отклонения.');
      const errors=validate(p,hr); if(errors.length) throw Error(errors.join('\n'));
      next.route=route(p.initiatorId,hr); next.step=0; next.status='На согласовании'; next.signatures=[]; event='Наряд отправлен на согласование';
    } else if(action==='approve' || action==='reject') {
      if(!['На согласовании','На подписи'].includes(p.status) || p.route[p.step]!==actor) throw Error('Действие доступно только текущему согласующему.');
      if(action==='reject') { if(!comment.trim()) throw Error('Укажите причину отклонения.'); next.status='Отклонён'; event='Наряд отклонён: '+comment.trim(); }
      else { next.signatures.push({actor,at:now,code:'DEMO-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase()}); next.step++; next.status=next.step===3?'Подписан':next.step===2?'На подписи':'На согласовании'; event=next.step===3?'Финальная демонстрационная подпись поставлена':'Этап согласован, демонстрационная подпись поставлена'; }
    } else if(action==='complete') {
      if(p.status!=='Подписан' || actor!==p.initiatorId) throw Error('Завершить подписанный наряд может инициатор.');
      next.status='Завершён'; event='Работы завершены';
    } else throw Error('Неизвестное действие');
    next.history.push({at:now,actor,text:event}); return next;
  }
  root.PermitLogic={types,days,route,validate,editable,act};
  if(typeof module!=='undefined') module.exports=root.PermitLogic;
})(globalThis);
