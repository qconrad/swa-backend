class PolygonListBounds {
  constructor(polygonList) {
    this.polygonList = polygonList
  }

  getBounds() {
    let top = -90.0;
    let bottom = 90.0;
    let left = 180.0;
    let right = -180.0;
    for (let p = 0; p < this.polygonList.length; p++) {
      for (let c = 0; c < this.polygonList[p].length; c++) {
        top = Math.max(top, this.polygonList[p][c][0])
        bottom = Math.min(bottom, this.polygonList[p][c][0])
        left = Math.min(left, this.polygonList[p][c][1])
        right = Math.max(right, this.polygonList[p][c][1])
      }
    }
    return [top, right, bottom, left]
  }
}

module.exports = PolygonListBounds