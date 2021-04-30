class GeometryParser {
  constructor(geometry) {
    this.geometry = geometry
    this.polygonList = []
  }

  parse() {
    if (this.geometry.type === "GeometryCollection") this._parseGeometryCollection();
    else this._parseSingleGeometry(this.geometry);
    return this.polygonList;
  }

  _parseGeometryCollection() {
    for (const geometry of this.geometry.geometries) this._parseSingleGeometry(geometry);
  }

  _parseSingleGeometry(geometry) {
    for (let p = 0; p < geometry.coordinates.length; p++) {
      let coordinates = geometry.coordinates[p]
      if (geometry.type === "MultiPolygon") coordinates = coordinates[0]
      this.polygonList.push(this._getPolygon(coordinates))
    }
  }

  _getPolygon(coordinates) {
    let polygon = []
    for (const coordinate of coordinates) polygon.push(coordinate.slice(0).reverse())
    return polygon
  }
}

module.exports = GeometryParser
