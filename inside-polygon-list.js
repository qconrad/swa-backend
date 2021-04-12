const inside = require('point-in-polygon')

class InsidePolygonList {
  constructor(polygonList, coordinate) {
    this.polygonList = polygonList
    this.coordinate = coordinate
  }

  isInside() {
    for (let polygon of this.polygonList)
      if (inside(this.coordinate, polygon)) return true
    return false
  }
}

module.exports = InsidePolygonList
