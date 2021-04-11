const GeometryParser = require('./geometry-parser')

class AlertPolygons {
  constructor(alert) {
    this.alert = alert
  }

  getPolygons() {
    return new GeometryParser(this.alert.geometry).parse()
  }
}

module.exports = AlertPolygons