const BoundCener = require('../bound-center.js')

test('bound given, lon correct', () => {
  let boundCenter = new BoundCener([0, 0, 0, 0]);
  expect(boundCenter.getCenter()[0]).toBe(0)
});

test('bound given, lon correct', () => {
  let boundCenter = new BoundCener([0, 5, 0, 5]);
  expect(boundCenter.getCenter()[1]).toBe(5)
});

test('bound given, lon correct', () => {
  let boundCenter = new BoundCener([0, 0, 0, 10]);
  expect(boundCenter.getCenter()[1]).toBe(5)
});

test('bound given, lat correct', () => {
  let boundCenter = new BoundCener([1, 0, 1, 0]);
  expect(boundCenter.getCenter()[0]).toBe(1)
});

test('bound given, lat correct', () => {
  let boundCenter = new BoundCener([2, 0, 2, 0]);
  expect(boundCenter.getCenter()[0]).toBe(2)
});

test('bound given, lat correct', () => {
  let boundCenter = new BoundCener([0, 0, 10, 0]);
  expect(boundCenter.getCenter()[0]).toBe(5)
});
