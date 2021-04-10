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

test('list given, bottom is 5', () => {
  let polygonListBounds = new PolygonListBounds([[[5,1]]]);
  expect(polygonListBounds.getBounds()[2]).toBe(5)
});

test('list given, top is 4', () => {
  let polygonListBounds = new PolygonListBounds([[[4,0],[1,3]]]);
  expect(polygonListBounds.getBounds()[0]).toBe(4)
});

test('list given, bottom is -2', () => {
  let polygonListBounds = new PolygonListBounds([[[0,0],[-2,-1]]]);
  expect(polygonListBounds.getBounds()[2]).toBe(-2)
});

test('list with two polygons given, top is 5', () => {
  let polygonListBounds = new PolygonListBounds([[[0,5],[-1,1]],[[5,0]]]);
  expect(polygonListBounds.getBounds()[0]).toBe(5)
});

test('list with two polygons given, left is -1', () => {
  let polygonListBounds = new PolygonListBounds([[[0,0],[-1,-1]],[[5,0]]]);
  expect(polygonListBounds.getBounds()[3]).toBe(-1)
});

test('list with two polygons given, right is 9', () => {
  let polygonListBounds = new PolygonListBounds([[[8,9],[-1,-1]],[[5,0]]]);
  expect(polygonListBounds.getBounds()[1]).toBe(9)
});

test('list with two polygons given, right is 11', () => {
  let polygonListBounds = new PolygonListBounds([[[11,10],[-1,-1]],[[5,0]]]);
  expect(polygonListBounds.getBounds()[1]).toBe(10)
});

test('list with two polygons given, left is -11', () => {
  let polygonListBounds = new PolygonListBounds([[[-11,-10],[-1,-1]],[[5,0]]]);
  expect(polygonListBounds.getBounds()[3]).toBe(-10)
});
