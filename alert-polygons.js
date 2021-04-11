const GeometryParser = require('./geometry-parser')
const fetch = require('node-fetch')

class AlertPolygons {
  constructor(alert, userAgent) {
    this.alert = alert
    this.userAgent = userAgent
  }

  async getPolygons() {
    return new Promise(resolve => {
      let fetchPromises = []
      if (this.alert.geometry) resolve(new GeometryParser(this.alert.geometry).parse())
      else {
        let polygons = []
        for (const alertZone of this.alert.properties.affectedZones) {
          fetchPromises.push(fetch(alertZone, {headers: {'User-Agent': this.userAgent}}).then(res => res.json().then(zoneInfo => {
            let geometry = zoneInfo.geometry
            if (geometry.geometries) geometry = geometry.geometries[0]
            for (const polygon of new GeometryParser(geometry).parse()) polygons.push(polygon)
          })))
        }
        Promise.all(fetchPromises).then(() => {
          resolve(polygons)
        })
      }
    })
  }
}

module.exports = AlertPolygons