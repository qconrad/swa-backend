const GeometryParser = require('./geometry-parser')
const fetch = require('node-fetch')

class AlertPolygons {
  constructor(alert, userAgent) {
    this.alert = alert
    this.userAgent = userAgent
  }

  async getPolygons() {
    if (this.alert.geometry) return new GeometryParser(this.alert.geometry).parse()
    else return this._getPolygonsFromZoneLinks();
  }

  _getPolygonsFromZoneLinks() {
    let fetchPromises = []
    let polygons = []
    for (const alertZone of this.alert.properties.affectedZones) {
      fetchPromises.push(fetch(alertZone, {headers: {'User-Agent': this.userAgent}})
        .then(res => res.json().then(zoneInfo =>
          this._parseZone(zoneInfo, polygons)
        )))
    }
    return Promise.all(fetchPromises).then(() => { return polygons })
  }

  _parseZone(zoneInfo, polygons) {
    let geometry = zoneInfo.geometry
    if (geometry.geometries) geometry = geometry.geometries[0]
    for (const polygon of new GeometryParser(geometry).parse()) polygons.push(polygon)
  }
}

module.exports = AlertPolygons