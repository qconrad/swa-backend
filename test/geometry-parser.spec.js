const GeometryParser = require('../geometry-parser')

test('geometry given, one polygon returned', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-80.109999999999999,26.969999999999999],[-80.179999999999993,27.109999999999999],[-80.219999999999999,27.149999999999999],[-80.370000000000005,27.469999999999999],[-79.600000000000009,27.469999999999999],[-79.390000000000015,26.98],[-80.109999999999999,26.969999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed.length).toBe(1)
});

test('geometry given, first polygon has seven coordinates', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-80.109999999999999,26.969999999999999],[-80.179999999999993,27.109999999999999],[-80.219999999999999,27.149999999999999],[-80.370000000000005,27.469999999999999],[-79.600000000000009,27.469999999999999],[-79.390000000000015,26.98],[-80.109999999999999,26.969999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[0].length).toBe(7)
});

test('geometry given, first polygon coordinate has correct latitude', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-80.109999999999999,26.969999999999999],[-80.179999999999993,27.109999999999999],[-80.219999999999999,27.149999999999999],[-80.370000000000005,27.469999999999999],[-79.600000000000009,27.469999999999999],[-79.390000000000015,26.98],[-80.109999999999999,26.969999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[0][0][0]).toBe(26.969999999999999)
});

test('geometry given, first polygon coordinate has correct longitude', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-80.109999999999999,27.969999999999999],[-80.179999999999993,27.109999999999999],[-80.219999999999999,27.149999999999999],[-80.370000000000005,27.469999999999999],[-79.600000000000009,27.469999999999999],[-79.390000000000015,26.98],[-80.109999999999999,26.969999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[0][0][1]).toBe(-80.109999999999999)
});

test('geometry given, first polygon coordinate has different correct latitude', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-80.109999999999999,27.969999999999999],[-80.179999999999993,27.109999999999999],[-80.219999999999999,27.149999999999999],[-80.370000000000005,27.469999999999999],[-79.600000000000009,27.469999999999999],[-79.390000000000015,26.98],[-80.109999999999999,26.969999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[0][0][0]).toBe(27.969999999999999)
});

test('geometry given, first polygon coordinate has different correct longitude', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-79.109999999999999,27.969999999999999],[-80.179999999999993,27.109999999999999],[-80.219999999999999,27.149999999999999],[-80.370000000000005,27.469999999999999],[-79.600000000000009,27.469999999999999],[-79.390000000000015,26.98],[-80.109999999999999,26.969999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[0][0][1]).toBe(-79.109999999999999)
});

test('geometry given, first polygon second coordinate has correct latitude', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-79.109999999999999,27.969999999999999],[-80.179999999999993,27.109999999999999],[-80.219999999999999,27.149999999999999],[-80.370000000000005,27.469999999999999],[-79.600000000000009,27.469999999999999],[-79.390000000000015,26.98],[-80.109999999999999,26.969999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[0][1][0]).toBe(27.109999999999999)
});

test('geometry given, first polygon second coordinate has correct longitude', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-79.109999999999999,27.969999999999999],[-80.179999999999993,27.109999999999999],[-80.219999999999999,27.149999999999999],[-80.370000000000005,27.469999999999999],[-79.600000000000009,27.469999999999999],[-79.390000000000015,26.98],[-80.109999999999999,26.969999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[0][1][1]).toBe(-80.179999999999993)
});

test('geometry given, returns two polygons', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-79.109999999999999,27.969999999999999],[-80.179999999999993,27.109999999999999]],[[-79.109999999999999,27.969999999999999],[-80.179999999999993,27.109999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed.length).toBe(2)
});

test('geometry given, second polygon first coordinate latitude correct', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-79.109999999999999,27.969999999999999],[-80.179999999999993,27.109999999999999]],[[-60.109999999999999,20.969999999999999],[-80.179999999999993,27.109999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[1][0][0]).toBe(20.969999999999999)
});

test('geometry given, second polygon first coordinate longitude correct', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-79.109999999999999,27.969999999999999],[-80.179999999999993,27.109999999999999]],[[-60.109999999999999,20.969999999999999],[-80.179999999999993,27.109999999999999]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[1][0][1]).toBe(-60.109999999999999)
});

test('geometry given, second polygon count correct', () => {
  let geometry = {
    "type":"Polygon",
    "coordinates":[[[-79.109999999999999,27.969999999999999],[-80.179999999999993,27.109999999999999]],[[-60.109999999999999,20.969999999999999],[-80.179999999999993,27.109999999999999],[-80, 21]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[1].length).toBe(3)
});

test('geometry parsed', () => {
  let geometry = {
    "type":"MultiPolygon",
    "coordinates": [[[[30.0, 20.0], [45.0, 40.0], [10.0, 40.0], [30.0, 20.0]]], [[[15.0, 5.0], [40.0, 10.0], [10.0, 20.0], [5.0, 10.0], [15.0, 5.0]]]]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[0].length).toBe(4)
});

test('geometry collection given, first polygon coordinate count correct', () => {
  let geometry = {
    "type": "GeometryCollection",
    "geometries": [
      {
        "type": "Polygon",
        "coordinates": [
          [[40.0, 40.0], [20.0, 45.0], [45.0, 30.0], [40.0, 40.0]]
        ]
      },
      {
        "type": "Polygon",
        "coordinates": [
          [[40.0, 40.0], [20.0, 45.0], [45.0, 30.0], [40.0, 40.0], [40.0, 40.0]]
        ]
      }
    ]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[0].length).toBe(4)
});

test('geometry collection given, second polygon coordinate count correct', () => {
  let geometry = {
    "type": "GeometryCollection",
    "geometries": [
      {
        "type": "Polygon",
        "coordinates": [
          [[40.0, 40.0], [20.0, 45.0], [45.0, 30.0], [40.0, 40.0]]
        ]
      },
      {
        "type": "Polygon",
        "coordinates": [
          [[40.0, 40.0], [20.0, 45.0], [45.0, 30.0], [40.0, 40.0], [40.0, 40.0]]
        ]
      }
    ]
  }
  let parsed = new GeometryParser(geometry).parse()
  expect(parsed[1].length).toBe(5)
});
