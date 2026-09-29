const assert=require('node:assert/strict');
const H=require('./hr.js'), L=require('./logic.js');
let checks=0;function test(name,fn){fn();checks++;console.log('OK',name);}
const draft=()=>({initiatorId:'e1',employeeIds:['e2'],managerId:'m1',type:L.types[0],other:'',object:'Станция',address:'Корпус 1',description:'Осмотр',start:'2026-09-25',end:'2026-10-01',status:'Черновик',step:0,route:[],signatures:[],history:[]});
test('HR: 12 сотрудников и действительные связи',()=>{assert.equal(H.employees.length,12);H.employees.forEach(e=>assert(!e.managerId||H.get(e.managerId)));});
test('Пять рабочих дней включительно через выходные',()=>assert.equal(L.days('2026-09-25','2026-10-01'),5));
test('Шесть рабочих дней запрещены',()=>{let p=draft();p.end='2026-10-02';assert(L.validate(p,H).length);});
test('Обратный период и несуществующие даты',()=>{assert.equal(L.days('2026-09-29','2026-09-28'),null);assert.equal(L.days('2026-02-30','2026-03-03'),null);});
test('Выходные и один рабочий день',()=>{assert.equal(L.days('2026-09-26','2026-09-27'),0);assert.equal(L.days('2026-09-28','2026-09-28'),1);let p=draft();p.start='2026-09-26';p.end='2026-09-27';assert(L.validate(p,H).length);});
test('Другие работы требуют уточнения',()=>{let p=draft();p.type='Другие работы';assert(L.validate(p,H).length);p.other='Проверка';assert.equal(L.validate(p,H).length,0);});
test('Дубли и пустые обязательные поля запрещены',()=>{let p=draft();p.employeeIds=['e2','e2'];assert(L.validate(p,H).length);p.employeeIds=[];p.address='';assert(L.validate(p,H).length>=2);});
test('Полный маршрут, роли, подписи и блокировка',()=>{let p=L.act(draft(),'submit','e1',H);assert.deepEqual(p.route,['m1','s1','f1']);assert.throws(()=>L.act(p,'approve','e2',H));p=L.act(p,'approve','m1',H);assert.equal(p.status,'На согласовании');p=L.act(p,'approve','s1',H);assert.equal(p.status,'На подписи');p=L.act(p,'approve','f1',H);assert.equal(p.status,'Подписан');assert.equal(p.signatures.length,3);assert(!L.editable(p,'e1'));assert.throws(()=>L.act(p,'submit','e1',H));assert.throws(()=>L.act(p,'approve','f1',H));p=L.act(p,'complete','e1',H);assert.equal(p.status,'Завершён');assert(!L.editable(p,'e1'));});
test('Комментарий отклонения и повторное согласование',()=>{let p=L.act(draft(),'submit','e1',H);assert.throws(()=>L.act(p,'reject','m1',H,'  '));p=L.act(p,'reject','m1',H,'Уточнить объект');assert.equal(p.status,'Отклонён');assert(L.editable(p,'e1'));p=L.act(p,'submit','e1',H);assert.equal(p.step,0);assert.equal(p.signatures.length,0);assert(p.history.some(h=>h.text.includes('Уточнить объект')));});
test('Исходный документ не меняется при переходе',()=>{const p=draft();L.act(p,'submit','e1',H);assert.equal(p.status,'Черновик');});
console.log(`${checks} tests passed`);
