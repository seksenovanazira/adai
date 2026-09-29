(function (root) {
  const employees = [
    ['e1','Адай Сейсенов','1001','Инженер','Эксплуатация','m1'],
    ['e2','Анна Ким','1002','Электромонтёр','Эксплуатация','m1'],
    ['e3','Данияр Омаров','1003','Механик','Эксплуатация','m1'],
    ['e4','Мария Иванова','1004','Техник','Эксплуатация','m1'],
    ['e5','Ерлан Садыков','1005','Сварщик','Эксплуатация','m1'],
    ['e6','Алия Нурланова','1006','Инженер КИПиА','Автоматика','m2'],
    ['e7','Илья Петров','1007','Наладчик','Автоматика','m2'],
    ['e8','Мадина Асанова','1008','Техник','Автоматика','m2'],
    ['m1','Руслан Ахметов','2001','Начальник подразделения','Эксплуатация','s1'],
    ['m2','Елена Волкова','2002','Начальник подразделения','Автоматика','s1'],
    ['s1','Тимур Алиев','3001','Руководитель структурного подразделения','Производственный комплекс','f1'],
    ['f1','Сауле Муратова','4001','Технический директор','Дирекция',null]
  ].map(([id,name,number,position,department,managerId]) => ({id,name,number,position,department,managerId}));
  const HR = {
    employees,
    get: id => employees.find(e => e.id === id),
    async listEmployees() { return structuredClone(employees); },
    async getCurrentUser() { return structuredClone(employees[0]); },
    async searchEmployees(query) { const q = query.trim().toLocaleLowerCase('ru'); return structuredClone(employees.filter(e => (e.name+' '+e.number).toLocaleLowerCase('ru').includes(q))); }
  };
  root.HR = HR;
  if (typeof module !== 'undefined') module.exports = HR;
})(globalThis);
