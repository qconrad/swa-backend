const PolygonListBounds = require('../polygon-list-bounds.js')

test('list given, top is 0', () => {
  let polygonListBounds = new PolygonListBounds([[[0,0]]]);
  expect(polygonListBounds.getBounds()[0]).toBe(0)
});

test('list given, top is 1', () => {
  let polygonListBounds = new PolygonListBounds([[[1,0]]]);
  expect(polygonListBounds.getBounds()[0]).toBe(1)
});

test('list given, bottom is 0', () => {
  let polygonListBounds = new PolygonListBounds([[[0,0]]]);
  expect(polygonListBounds.getBounds()[2]).toBe(0)
});

test('list given, bottom is 1', () => {
  let polygonListBounds = new PolygonListBounds([[[1,1]]]);
  expect(polygonListBounds.getBounds()[2]).toBe(1)
});

test('list given, top is 1', () => {
  let polygonListBounds = new PolygonListBounds([[[0,0],[1,1]]]);
  expect(polygonListBounds.getBounds()[0]).toBe(1)
});

test('list given, bottom is -1', () => {
  let polygonListBounds = new PolygonListBounds([[[0,0],[-1,1]]]);
  expect(polygonListBounds.getBounds()[2]).toBe(-1)
});

test('list with two polygons given, top is 5', () => {
  let polygonListBounds = new PolygonListBounds([[[0,0],[-1,1]],[[5,0]]]);
  expect(polygonListBounds.getBounds()[0]).toBe(5)
});

test('list with two polygons given, left is -1', () => {
  let polygonListBounds = new PolygonListBounds([[[0,0],[-1,-1]],[[5,0]]]);
  expect(polygonListBounds.getBounds()[3]).toBe(-1)
});

test('list with two polygons given, right is 7', () => {
  let polygonListBounds = new PolygonListBounds([[[0,7],[-1,-1]],[[5,0]]]);
  expect(polygonListBounds.getBounds()[1]).toBe(7)
});

test('list with two polygons given, right is 10', () => {
  let polygonListBounds = new PolygonListBounds([[[0,10],[-1,-1]],[[5,0]]]);
  expect(polygonListBounds.getBounds()[1]).toBe(10)
});

test('list with two polygons given, left is -10', () => {
  let polygonListBounds = new PolygonListBounds([[[0,-10],[-1,-1]],[[5,0]]]);
  expect(polygonListBounds.getBounds()[3]).toBe(-10)
});
