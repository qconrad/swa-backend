class BoundCenter {
  constructor(bounds) {
    this.bounds = bounds
  }

  getCenter() {
    let latCenter = (this.bounds[0] + this.bounds[2]) / 2
    let lonCenter = (this.bounds[1] + this.bounds[3]) / 2
    return [latCenter, lonCenter]
  }
}

module.exports = BoundCenter
