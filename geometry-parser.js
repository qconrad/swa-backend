class GeometryParser {
  constructor(geometry) {
    this.geometry = geometry
  }

  parse() {
    let polygonList = []
    for (let p = 0; p < this.geometry.coordinates.length; p++) {
      let coordinates = this.geometry.coordinates[p]
      if (this.geometry.type === "MultiPolygon") coordinates = coordinates[0]
      polygonList.push(this._getPolygon(coordinates))
    }
    return polygonList
  }

  _getPolygon(coordinates) {
    let polygon = []
    for (const coordinate of coordinates) polygon.push(coordinate.slice(0).reverse())
    return polygon
  }
}

module.exports = GeometryParser
