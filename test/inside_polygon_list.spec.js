const InsidePolygonList = require('../inside-polygon-list.js')

test('coordinate not in polygon, returns false',  () => {
  let polygonList = [[[0,0],[0,1],[1,1],[1,0]]]
  let insideList = new InsidePolygonList(polygonList, [-1, -1])
  expect(insideList.isInside()).toBeFalsy()
});

test('coordinate in polygon, returns true',  () => {
  let polygonList = [[[0,0],[0,2],[2,2],[2,0]]]
  let insideList = new InsidePolygonList(polygonList, [1, 1])
  expect(insideList.isInside()).toBeTruthy()
});

test('coordinate in second polygon, returns true',  () => {
  let polygonList = [[[-1,-2]],[[0,0],[0,2],[2,2],[2,0]]]
  let insideList = new InsidePolygonList(polygonList, [1, 1])
  expect(insideList.isInside()).toBeTruthy()
});
