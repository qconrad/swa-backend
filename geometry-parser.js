class GeometryParser {
  constructor(geometry) {
    this.geometry = geometry
  }

  parse() {
    let polygonList = []
    for (let p = 0; p < this.geometry.coordinates.length; p++) {
      let polygon = []
      for (let c = 0; c < this.geometry.coordinates[p].length; c++) {
        polygon.push(this.geometry.coordinates[p][c].reverse())
      }
      polygonList.push(polygon)
    }
    return polygonList
  }
}

module.exports = GeometryParser
