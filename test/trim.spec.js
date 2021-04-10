const ListTrim = require('../list-trim.js')

test('list given, not trimmed',  () => {
  let listTrim = new ListTrim([0, 1, 2, 3], 4, 0)
  expect(listTrim.getTrimmed().length).toBe(4)
});

test('list given, trimmed to 0',  () => {
  let listTrim = new ListTrim([0, 1, 2, 3], 3, 0)
  expect(listTrim.getTrimmed().length).toBe(0)
});

test('list given, different maxSize, trimmed to 0',  () => {
  let listTrim = new ListTrim([0, 1, 2, 3], 2, 0)
  expect(listTrim.getTrimmed().length).toBe(0)
});

test('list given, different maxSize, trimmed to 1',  () => {
  let listTrim = new ListTrim([0, 1, 2, 3], 2, 1)
  expect(listTrim.getTrimmed().length).toBe(1)
});
