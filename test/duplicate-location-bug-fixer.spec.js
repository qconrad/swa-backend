const DuplicateLocationBugFixer = require('../duplicate-location-bug-fixer')

test('one location given, returned without modification', () => {
  let locations = [[40, -74]]
  let fixed = new DuplicateLocationBugFixer(locations).fix()
  expect(fixed).toEqual(locations)
})

test('five locations given, all duplicates, one location returned', () => {
  let locations = [[40, -74], [40, -74], [40, -74], [40, -74], [40, -74]]
  let fixed = new DuplicateLocationBugFixer(locations).fix()
  expect(fixed).toEqual([[40, -74]])
})

test('five locations given, different first location, first location returned', () => {
  let locations = [[41, -73], [40, -74], [40, -74], [40, -74], [40, -74]]
  let fixed = new DuplicateLocationBugFixer(locations).fix()
  expect(fixed).toEqual([[41, -73]])
});

test('five locations given, different first location, first location returned', () => {
  let locations = [[41, -73], [40, -74], [40, -74], [40, -74], [40, -74]]
  let fixed = new DuplicateLocationBugFixer(locations).fix()
  expect(fixed).toEqual([[41, -73]])
});

test('five locations given, all different, all locations returned', () => {
  let locations = [[41, -73], [42, -74], [43, -75], [44, -76], [45, -77]]
  let fixed = new DuplicateLocationBugFixer(locations).fix()
  expect(fixed).toEqual(locations)
});

test('three locations given, second two are duplicates, one location returned', () => {
  let locations = [[41, -74], [41, -73], [41, -73]]
  let fixed = new DuplicateLocationBugFixer(locations).fix()
  expect(fixed).toEqual([[41, -74]])
});

test('two locations given, not duplicates, all locations returned', () => {
  let locations = [[41, -74], [42, -73]]
  let fixed = new DuplicateLocationBugFixer(locations).fix()
  expect(fixed).toEqual(locations)
});